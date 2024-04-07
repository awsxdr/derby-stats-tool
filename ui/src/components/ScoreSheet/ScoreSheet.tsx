import { ReactElement, useCallback, useMemo, useState } from 'react';
import { Cell, Column, ColumnHeaderCell, EditableCell2 } from '@blueprintjs/table'

import { StatsTable, ToggleCell } from '@components';
import { LineupLine, Period, ScoreLine, TeamType, useGameContext, useValidation } from '@contexts';

import styles from './ScoreSheet.module.css';

type ContentRendererFn = (rowIndex: number) => ReactElement;
type CellRendererFn = (color: string) => ContentRendererFn;

const White = "#ffffff";
const Black = "#000000";
const DarkGreen = "#d3ecb5";
const LightGreen = "#e9f5da";

interface ScoreSheetProps {
    teamType: TeamType,
    period: Period,
}

const getTripValue = (trip: string) =>
    parseInt(trip) || 0;

export const ScoreSheet = ({ teamType, period }: ScoreSheetProps) => {
    const { gameState, setGameState } = useGameContext();
    const [ cellRenderCount, setCellRenderCount ] = useState(0);

    const scores = useMemo(() => gameState.scores[period][teamType].lines, [gameState, teamType, period]);
    const oppositionTeamType = useMemo(() => teamType === TeamType.HOME ? TeamType.AWAY : TeamType.HOME, [teamType]);
    const oppositionScores = useMemo(() => gameState.scores[period][oppositionTeamType].lines, [gameState, oppositionTeamType, period]);
    const lineups = useMemo(() => gameState.lineups[period][teamType].lines, [gameState, period, teamType]);

    const { validators } = useValidation();
    const { validity } = useMemo(() => validators[teamType][period].scoreValidity, [validators[teamType][period].scoreValidity]);
    
    const calculatePeriodTotal = useCallback((period: Period) =>
        gameState.scores[period][teamType].lines.reduce((p, j) => p + j.trips.reduce((p, t) => p + getTripValue(t), 0), 0),
        [gameState, teamType]);

    const previousPeriodTotal = useMemo(() => period == Period.TWO ? calculatePeriodTotal(Period.ONE) : 0, [calculatePeriodTotal, period]);

    const calculateJamTotal = useCallback((row: number) =>
        scores.length > row && scores[row]?.trips.reduce((p, c) => p + getTripValue(c), 0) || 0,
        [scores]);
    
    const calculateGameTotal = useCallback((row: number) =>
        Array.from({ length: row + 1 }).map((_, r) => calculateJamTotal(r)).reduce((p, c) => p + c, previousPeriodTotal),
        [calculateJamTotal, previousPeriodTotal]);

    const renderAlternatingColorCell = (cellRenderer: CellRendererFn, lightColor: string, darkColor: string) =>
        (rowIndex: number) => cellRenderer(rowIndex % 2 == 0 ? lightColor : darkColor)(rowIndex);
  
    const renderConstantColorCell = (cellRenderer: CellRendererFn, color: string) =>
        cellRenderer(color);

    const DEFAULT_SCORE_LINE: () => ScoreLine = () => ({
        jam: '',
        jammer: '', 
        lost: false, 
        lead: false, 
        call: false, 
        injury: false, 
        noInitial: false, 
        trips: [],
        jamTotal: '0',
        gameTotal: '0'
    });

    const DEFAULT_LINEUP_LINE: () => LineupLine = () => ({
        jamNumber: '',
        noPivot: false,
        skaters: {
            jammer: { number: '', events: ['', '', ''] },
            pivot: { number: '', events: ['', '', ''] },
            blocker1: { number: '', events: ['', '', ''] },
            blocker2: { number: '', events: ['', '', ''] },
            blocker3: { number: '', events: ['', '', ''] },
        }
    });

    const rerenderTable = useCallback(() => {
        setCellRenderCount(c => c + 1);
    }, [setCellRenderCount]);

    const createScoreLineIfMissing = useCallback((rowIndex: number) => {
        if(!scores[rowIndex]) {
            scores[rowIndex] = DEFAULT_SCORE_LINE();
        }
        if(!oppositionScores[rowIndex]) {
            oppositionScores[rowIndex] = DEFAULT_SCORE_LINE();
        }
    }, [scores, oppositionScores]);

    const createLineupLineIfMissing = useCallback((rowIndex: number) => {
        if(!lineups[rowIndex]) {
            lineups[rowIndex] = DEFAULT_LINEUP_LINE();
        }
    }, [lineups]);

    const updateGameState = useCallback(() => {
        setGameState({ 
            ...gameState, 
            scores: { 
                ...gameState.scores, 
                [period]: { 
                    ...gameState.scores[period], 
                    [teamType]: { 
                        ...gameState.scores[period][teamType], 
                        lines: scores,
                    },
                    [oppositionTeamType]: {
                        ...gameState.scores[period][oppositionTeamType],
                        lines: oppositionScores,
                    },
                }
            },
            lineups: { 
                ...gameState.lineups, 
                [period]: { 
                    ...gameState.lineups[period], 
                    [teamType]: { 
                        ...gameState.scores[period][teamType], 
                        lines: lineups 
                    }
                }
            },
        });
    }, [gameState, setGameState, lineups, period, scores, oppositionScores, oppositionTeamType, teamType]);

    const handleChange = useCallback(<T,>(setter: (scoreLine: ScoreLine, lineupLine: LineupLine, value: T) => void) => (rowIndex: number) => (value: T) => {
        createScoreLineIfMissing(rowIndex);
        createLineupLineIfMissing(rowIndex);
        setter(scores[rowIndex], lineups[rowIndex], value);
        updateGameState();
        rerenderTable();
    }, [createScoreLineIfMissing, createLineupLineIfMissing, scores, lineups, updateGameState, rerenderTable]);

    const handleJamNumberChange = useCallback((rowIndex: number) => 
        handleChange<string>((s, l, v) => { 
            s.jam = v;
            if (oppositionScores[rowIndex].jam.trim() === '') {
                const oppositionValue =
                    v.trim().toLowerCase() === 'sp' ? (v + '*')
                    : v.trim().toLowerCase() === 'sp*' ? v.substring(0, 2)
                    : v;
                oppositionScores[rowIndex].jam = oppositionValue;
            }

            if (v.trim().toLowerCase() === 'sp') {
                l.noPivot = true;
            }
        })(rowIndex),
        [handleChange, oppositionScores]);

    const handleJammerNumberChange = useCallback((rowIndex: number) =>
        handleChange<string>((s, l, v) => {
            s.jammer = v;
            l.skaters.jammer.number = v;
            if (scores[rowIndex].jam.toLowerCase() === 'sp*' && v.trim() !== '') {
                scores[rowIndex].jam = scores[rowIndex].jam.substring(0, 2);
            }
        })(rowIndex),
        [handleChange, scores]);

    const renderJamNumberCell = (color: string) => (rowIndex: number) => (
        <EditableCell2 
            style={{ backgroundColor: color }} 
            value={scores[rowIndex]?.jam}
            tooltip={validity.lines[rowIndex]?.jam.message}
            className={styles[`validity-${validity.lines[rowIndex]?.jam.validity}`]}
            onConfirm={handleJamNumberChange(rowIndex)}
        />
    );

    const renderJammerNumberCell = (color: string) => (rowIndex: number) => (
        <EditableCell2
            style={{ backgroundColor: color }}
            value={scores[rowIndex]?.jammer}
            tooltip={validity.lines[rowIndex]?.jammer.message}
            className={styles[`validity-${validity.lines[rowIndex]?.jammer.validity}`]}
            onConfirm={handleJammerNumberChange(rowIndex)}
        />
    );

    const renderLostCell = (color: string) => (rowIndex: number) => (
        <ToggleCell
            style={{ backgroundColor: color }}
            value={scores[rowIndex]?.lost}
            tooltip={validity.lines[rowIndex]?.lost.message}
            className={styles[`validity-${validity.lines[rowIndex]?.lost.validity}`]}
            onConfirm={handleChange<boolean>((l, _, v) => l.lost = v)(rowIndex)}
        />
    );

    const renderLeadCell = (color: string) => (rowIndex: number) => (
        <ToggleCell
            style={{ backgroundColor: color }}
            value={scores[rowIndex]?.lead}
            tooltip={validity.lines[rowIndex]?.lead.message}
            className={styles[`validity-${validity.lines[rowIndex]?.lead.validity}`]}
            onConfirm={handleChange<boolean>((l, _, v) => l.lead = v)(rowIndex)}
        />
    );

    const renderCallCell = (color: string) => (rowIndex: number) => (
        <ToggleCell
            style={{ backgroundColor: color }}
            value={scores[rowIndex]?.call}
            tooltip={validity.lines[rowIndex]?.call.message}
            className={styles[`validity-${validity.lines[rowIndex]?.call.validity}`]}
            onConfirm={handleChange<boolean>((l, _, v) => l.call = v)(rowIndex)}
        />
    );

    const renderInjuryCell = (color: string) => (rowIndex: number) => (
        <ToggleCell
            style={{ backgroundColor: color }}
            value={scores[rowIndex]?.injury}
            tooltip={validity.lines[rowIndex]?.injury.message}
            className={styles[`validity-${validity.lines[rowIndex]?.injury.validity}`]}
            onConfirm={handleChange<boolean>((l, _, v) => l.injury = v)(rowIndex)}
        />
    );

    const renderNoInitialCell = (color: string) => (rowIndex: number) => (
        <ToggleCell
            style={{ backgroundColor: color }}
            value={scores[rowIndex]?.noInitial}
            tooltip={validity.lines[rowIndex]?.noInitial.message}
            className={styles[`validity-${validity.lines[rowIndex]?.noInitial.validity}`]}
            onConfirm={handleChange<boolean>((l, _, v) => l.noInitial = v)(rowIndex)}
        />
    );

    const renderTripCell = (trip: number) => (color: string) => (rowIndex: number) => (
        <EditableCell2
            style={{ backgroundColor: color }}
            value={scores[rowIndex]?.trips[trip]}
            tooltip={validity.lines[rowIndex]?.trips[trip]?.message}
            className={styles[`validity-${validity.lines[rowIndex]?.trips[trip]?.validity}`]}
            onConfirm={handleChange<string>((l, _, v) => l.trips[trip] = v)(rowIndex)}
        />
    );

    const renderJamTotalCell = (color: string) => (rowIndex: number) => (
        <Cell style={{ backgroundColor: color }}>
            { scores[rowIndex]?.jam && calculateJamTotal(rowIndex) }
        </Cell>
    );

    const renderGameTotalCell = (color: string) => (rowIndex: number) => (
        <Cell style={{ backgroundColor: color }}>
            { scores[rowIndex]?.jam && calculateGameTotal(rowIndex) }
        </Cell>
    );
  
    const renderHorizontalHeader = (name: string) => () => (
        <ColumnHeaderCell style={{ backgroundColor: Black, color: White }}>
            <span style={{ fontSize: '8pt' }}>{ name }</span>
        </ColumnHeaderCell>
    );
  
    const renderVerticalHeader = (name: string) => () => (
        <ColumnHeaderCell style={{ backgroundColor: Black, color: White }} className='verticalHeader'>
            <span style={{ fontSize: '8pt' }}>{ name }</span>
        </ColumnHeaderCell>
    )

    const getCellData = useCallback((row: number, column: number) => {
        if (row >= scores.length) return '';

        if(column === 0) {
            return scores[row].jam;
        } else if (column === 1) {
            return scores[row].jammer;
        } else if (column === 2) {
            return scores[row].lost ? 'X' : '';
        } else if (column === 3) {
            return scores[row].lead ? 'X' : '';
        } else if (column === 4) {
            return scores[row].call ? 'X' : ''; 
        } else if (column === 5) { 
            return scores[row].injury ? 'X' : '';
        } else if (column === 6) { 
            return scores[row].noInitial ? 'X' : '';
        } else if (column >= 7 && column <= 15) {
            if (scores[row].trips.length <= (column - 7)) return '';
            return scores[row].trips[column - 7];
        } else if (column === 16) {
            return scores[row]?.jam ? calculateJamTotal(row).toString() : '';
        } else if (column === 17) {
            return scores[row]?.jam ? calculateGameTotal(row).toString() : '';
        } else {
            return '';
        }
    }, [scores, calculateJamTotal, calculateGameTotal]);

    const setCellData = useCallback((row: number, column: number, value: string) => {
        createScoreLineIfMissing(row);
        createLineupLineIfMissing(row);

        if(column === 0) {
            scores[row].jam = value;
            if (lineups[row]) {
                lineups[row].jamNumber = value;
            }
        } else if (column === 1) { 
            scores[row].jammer = value;
            lineups[row].skaters.jammer.number = value;
        } else if (column === 2) {
            scores[row].lost = value.trim() === 'X' || value.trim() === '/' || value.trim() === 'x';
        } else if (column === 3) {
            scores[row].lead = value.trim() === 'X' || value.trim() === '/' || value.trim() === 'x';
        } else if (column === 4) { 
            scores[row].call = value.trim() === 'X' || value.trim() === '/' || value.trim() === 'x';
        } else if (column === 5) { 
            scores[row].injury = value.trim() === 'X' || value.trim() === '/' || value.trim() === 'x';
        } else if (column === 6) {
            scores[row].noInitial = value.trim() === 'X' || value.trim() === '/' || value.trim() === 'x';
        } else if (column >= 7 && column <= 15) {
            scores[row].trips[column - 7] = value;
        }
    }, [lineups, scores, createLineupLineIfMissing, createScoreLineIfMissing]);

    const deleteCellData = useCallback((row: number, column: number) => {
        if (row >= scores.length || !scores[row]) return;

        if(column === 0) {
            scores[row].jam = '';
            lineups[row].jamNumber = '';
        } else if (column === 1) {
            scores[row].jammer = '';
            lineups[row].skaters.jammer.number = '';
        } else if (column === 2) {
            scores[row].lost = false;
        } else if (column === 3) {
            scores[row].lead = false;
        } else if (column === 4) {
            scores[row].call = false;
        } else if (column === 5) {
            scores[row].injury = false;
        } else if (column === 6) {
            scores[row].noInitial = false;
        } else if (column >= 7 && column <= 15) {
            if (scores[row].trips.length <= (column - 7)) return;
            scores[row].trips[column - 7] = '';
        }
    }, [scores, lineups]);

    return (
        <div className={styles.scoreTable}>
            <StatsTable
                rowCount={39}
                columnWidths={[40, 100, 20, 20, 20, 20, 20, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60]}
                cellRendererDependencies={[cellRenderCount, validity]}
                getCellData={getCellData}
                setCellData={setCellData}
                deleteCellData={deleteCellData}
                onBatchOperationCompleted={updateGameState}
            >
                <Column columnHeaderCellRenderer={renderHorizontalHeader("Jam")} cellRenderer={renderAlternatingColorCell(renderJamNumberCell, LightGreen, DarkGreen)} />
                <Column columnHeaderCellRenderer={renderHorizontalHeader("Jammer's number")} cellRenderer={renderAlternatingColorCell(renderJammerNumberCell, White, LightGreen)} />
                <Column columnHeaderCellRenderer={renderVerticalHeader("Lost")} cellRenderer={renderAlternatingColorCell(renderLostCell, LightGreen, DarkGreen)} />
                <Column columnHeaderCellRenderer={renderVerticalHeader("Lead")} cellRenderer={renderAlternatingColorCell(renderLeadCell, LightGreen, DarkGreen)} />
                <Column columnHeaderCellRenderer={renderVerticalHeader("Call")} cellRenderer={renderAlternatingColorCell(renderCallCell, LightGreen, DarkGreen)} />
                <Column columnHeaderCellRenderer={renderVerticalHeader("Inj.")} cellRenderer={renderAlternatingColorCell(renderInjuryCell, LightGreen, DarkGreen)} />
                <Column columnHeaderCellRenderer={renderVerticalHeader("NI")} cellRenderer={renderAlternatingColorCell(renderNoInitialCell, LightGreen, DarkGreen)} />
                <Column columnHeaderCellRenderer={renderHorizontalHeader("Trip 2")} cellRenderer={renderAlternatingColorCell(renderTripCell(0), White, LightGreen)} />
                <Column columnHeaderCellRenderer={renderHorizontalHeader("Trip 3")} cellRenderer={renderAlternatingColorCell(renderTripCell(1), White, LightGreen)} />
                <Column columnHeaderCellRenderer={renderHorizontalHeader("Trip 4")} cellRenderer={renderAlternatingColorCell(renderTripCell(2), White, LightGreen)} />
                <Column columnHeaderCellRenderer={renderHorizontalHeader("Trip 5")} cellRenderer={renderAlternatingColorCell(renderTripCell(3), White, LightGreen)} />
                <Column columnHeaderCellRenderer={renderHorizontalHeader("Trip 6")} cellRenderer={renderAlternatingColorCell(renderTripCell(4), White, LightGreen)} />
                <Column columnHeaderCellRenderer={renderHorizontalHeader("Trip 7")} cellRenderer={renderAlternatingColorCell(renderTripCell(5), White, LightGreen)} />
                <Column columnHeaderCellRenderer={renderHorizontalHeader("Trip 8")} cellRenderer={renderAlternatingColorCell(renderTripCell(6), White, LightGreen)} />
                <Column columnHeaderCellRenderer={renderHorizontalHeader("Trip 9")} cellRenderer={renderAlternatingColorCell(renderTripCell(7), White, LightGreen)} />
                <Column columnHeaderCellRenderer={renderHorizontalHeader("Trip 10")} cellRenderer={renderAlternatingColorCell(renderTripCell(8), White, LightGreen)} />
                <Column columnHeaderCellRenderer={renderHorizontalHeader("Jam Total")} cellRenderer={renderAlternatingColorCell(renderJamTotalCell, LightGreen, DarkGreen)} />
                <Column columnHeaderCellRenderer={renderHorizontalHeader("Game Total")} cellRenderer={renderConstantColorCell(renderGameTotalCell, DarkGreen)} />
            </StatsTable>
        </div>
    )
  }