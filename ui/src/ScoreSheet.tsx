import { Cell, Column, ColumnHeaderCell, EditableCell2, RenderMode, Table2 } from '@blueprintjs/table'
import { ReactElement, useCallback, useMemo } from 'react';
import styles from './ScoreSheet.module.css';
import { ToggleCell } from './ToggleCell';
import { LineupLine, Period, ScoreLine, TeamType, useGameContext } from './GameStateContext';

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

    const scores = useMemo(() => gameState.scores[period][teamType].lines, [gameState, teamType, period]);
    const lineups = useMemo(() => gameState.lineups[period][teamType].lines, [gameState, period, teamType]);
    
    const calculatePeriodTotal = useCallback((period: Period) =>
        gameState.scores[period][teamType].lines.reduce((p, j) => p + j.trips.reduce((p, t) => p + getTripValue(t), 0), 0),
        [gameState, teamType]);

    const previousPeriodTotal = useMemo(() => period == Period.TWO ? calculatePeriodTotal(Period.ONE) : 0, [calculatePeriodTotal, period]);

    const calculateJamTotal = useCallback((row: number) =>
        scores.length > row && scores[row]?.trips.reduce((p, c) => p + getTripValue(c), 0) || 0,
        [scores]);
    
    const calculateGameTotal = useCallback((row: number) =>
        Array.from({ length: row + 1 }).map((_, r) => calculateJamTotal(r)).reduce((p, c) => p + c, previousPeriodTotal),
        [scores]);

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

    const createScoreLineIfMissing = (rowIndex: number) => {
        if(!scores[rowIndex]) {
            scores[rowIndex] = DEFAULT_SCORE_LINE();
        }
    }

    const createLineupLineIfMissing = (rowIndex: number) => {
        if(!lineups[rowIndex]) {
            lineups[rowIndex] = DEFAULT_LINEUP_LINE();
        }
    }

    const updateGameState = () => {
        setGameState({ 
            ...gameState, 
            scores: { ...gameState.scores, [period]: { ...gameState.scores[period], [teamType]: scores }},
            lineups: { ...gameState.lineups, [period]: { ...gameState.lineups[period], [teamType]: lineups }},
        });
    }

    const handleChange = <T,>(setter: (scoreLine: ScoreLine, lineupLine: LineupLine, value: T) => void) => (rowIndex: number) => (value: T) => {
        createScoreLineIfMissing(rowIndex);
        createLineupLineIfMissing(rowIndex);
        setter(scores[rowIndex], lineups[rowIndex], value);
        updateGameState();
    }

    const renderJamNumberCell = (color: string) => (rowIndex: number) => (
        <EditableCell2 
            style={{ backgroundColor: color }} 
            value={scores[rowIndex]?.jam} 
            onConfirm={handleChange<string>((l, _, v) => l.jam = v)(rowIndex)}
        />
    );

    const renderJammerNumberCell = (color: string) => (rowIndex: number) => (
        <EditableCell2
            style={{ backgroundColor: color }}
            value={scores[rowIndex]?.jammer}
            onConfirm={value =>
                handleChange<string>((s, l, v) => {
                    s.jammer = v;
                    l.skaters.jammer.number = v;
                })(rowIndex)(value)}
        />
    );

    const renderLostCell = (color: string) => (rowIndex: number) => (
        <ToggleCell
            style={{ backgroundColor: color }}
            value={scores[rowIndex]?.lost}
            onConfirm={handleChange<boolean>((l, _, v) => l.lost = v)(rowIndex)}
        />
    );

    const renderLeadCell = (color: string) => (rowIndex: number) => (
        <ToggleCell
            style={{ backgroundColor: color }}
            value={scores[rowIndex]?.lead}
            onConfirm={handleChange<boolean>((l, _, v) => l.lead = v)(rowIndex)}
        />
    );

    const renderCallCell = (color: string) => (rowIndex: number) => (
        <ToggleCell
            style={{ backgroundColor: color }}
            value={scores[rowIndex]?.call}
            onConfirm={handleChange<boolean>((l, _, v) => l.call = v)(rowIndex)}
        />
    );

    const renderInjuryCell = (color: string) => (rowIndex: number) => (
        <ToggleCell
            style={{ backgroundColor: color }}
            value={scores[rowIndex]?.injury}
            onConfirm={handleChange<boolean>((l, _, v) => l.injury = v)(rowIndex)}
        />
    );

    const renderNoInitialCell = (color: string) => (rowIndex: number) => (
        <ToggleCell
            style={{ backgroundColor: color }}
            value={scores[rowIndex]?.noInitial}
            onConfirm={handleChange<boolean>((l, _, v) => l.noInitial = v)(rowIndex)}
        />
    );

    const renderTripCell = (trip: number) => (color: string) => (rowIndex: number) => (
        <EditableCell2
            style={{ backgroundColor: color }}
            value={scores[rowIndex]?.trips[trip]}
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
  
    return (
        <div className={styles.scoreTable}>
            <Table2 
                numRows={39} 
                enableRowResizing={false} 
                enableColumnResizing={false}
                enableRowHeader={false} 
                enableColumnHeader={true}
                enableFocusedCell={true}
                enableGhostCells={false}
                columnWidths={[40, 100, 20, 20, 20, 20, 20, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60]}
                renderMode={RenderMode.NONE}
            >
                <Column columnHeaderCellRenderer={renderHorizontalHeader("Jam")} cellRenderer={renderAlternatingColorCell(renderJamNumberCell, LightGreen, DarkGreen)} />
                <Column columnHeaderCellRenderer={renderHorizontalHeader("Jammer's number")} cellRenderer={renderAlternatingColorCell(renderJammerNumberCell, White, LightGreen)} />
                <Column columnHeaderCellRenderer={renderVerticalHeader("Lost")} cellRenderer={renderAlternatingColorCell(renderLostCell, LightGreen, DarkGreen)} />
                <Column columnHeaderCellRenderer={renderVerticalHeader("Lead")} cellRenderer={renderAlternatingColorCell(renderLeadCell, LightGreen, DarkGreen)} />
                <Column columnHeaderCellRenderer={renderVerticalHeader("Call")} cellRenderer={renderAlternatingColorCell(renderCallCell, LightGreen, DarkGreen)} />
                <Column columnHeaderCellRenderer={renderVerticalHeader("Inj.")} cellRenderer={renderAlternatingColorCell(renderInjuryCell, LightGreen, DarkGreen)} />
                <Column columnHeaderCellRenderer={renderVerticalHeader("NI")} cellRenderer={renderAlternatingColorCell(renderNoInitialCell, LightGreen, DarkGreen)} />
                <Column columnHeaderCellRenderer={renderHorizontalHeader("Trip 2")} cellRenderer={renderAlternatingColorCell(renderTripCell(2), White, LightGreen)} />
                <Column columnHeaderCellRenderer={renderHorizontalHeader("Trip 3")} cellRenderer={renderAlternatingColorCell(renderTripCell(3), White, LightGreen)} />
                <Column columnHeaderCellRenderer={renderHorizontalHeader("Trip 4")} cellRenderer={renderAlternatingColorCell(renderTripCell(4), White, LightGreen)} />
                <Column columnHeaderCellRenderer={renderHorizontalHeader("Trip 5")} cellRenderer={renderAlternatingColorCell(renderTripCell(5), White, LightGreen)} />
                <Column columnHeaderCellRenderer={renderHorizontalHeader("Trip 6")} cellRenderer={renderAlternatingColorCell(renderTripCell(6), White, LightGreen)} />
                <Column columnHeaderCellRenderer={renderHorizontalHeader("Trip 7")} cellRenderer={renderAlternatingColorCell(renderTripCell(7), White, LightGreen)} />
                <Column columnHeaderCellRenderer={renderHorizontalHeader("Trip 8")} cellRenderer={renderAlternatingColorCell(renderTripCell(8), White, LightGreen)} />
                <Column columnHeaderCellRenderer={renderHorizontalHeader("Trip 9")} cellRenderer={renderAlternatingColorCell(renderTripCell(9), White, LightGreen)} />
                <Column columnHeaderCellRenderer={renderHorizontalHeader("Trip 10")} cellRenderer={renderAlternatingColorCell(renderTripCell(10), White, LightGreen)} />
                <Column columnHeaderCellRenderer={renderHorizontalHeader("Jam Total")} cellRenderer={renderAlternatingColorCell(renderJamTotalCell, LightGreen, DarkGreen)} />
                <Column columnHeaderCellRenderer={renderHorizontalHeader("Game Total")} cellRenderer={renderConstantColorCell(renderGameTotalCell, DarkGreen)} />
            </Table2>
        </div>
    )
  }