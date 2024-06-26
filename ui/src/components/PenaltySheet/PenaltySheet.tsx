import { ReactElement, useCallback, useMemo, useState } from 'react';
import { Cell, Column, ColumnHeaderCell, EditableCell2, Table2 } from '@blueprintjs/table'

import { Penalty, PenaltyLine, Period, TeamType, useGameContext, useValidation } from '@contexts';
import { StatsTable } from '@components';
import { range } from '@/helperMethods';
import { OK } from '@validators';
import * as Colors from '@/Colors';

import styles from './PenaltySheet.module.scss';

type ContentRendererFn = (rowIndex: number) => ReactElement;
type CellRendererFn = (color: string) => ContentRendererFn;

interface PenaltySheetProps {
    teamType: TeamType,
    period: Period,
}

export const PenaltySheet = ({ teamType, period }: PenaltySheetProps) => {

    const { gameState, setGameState } = useGameContext();
    const [ cellRenderCount, setCellRenderCount ] = useState(0);

    const roster = useMemo(() => gameState.rosters[teamType], [gameState, teamType]);
    const penalties = useMemo(() => gameState.penalties[period][teamType].lines, [gameState, teamType, period]);
    const previousPeriodPenaltyCounts = useMemo(() => 
        range(0, 20).map(i =>
            period === Period.TWO && gameState.penalties[Period.ONE][teamType].lines.length >= i && gameState.penalties[Period.ONE][teamType].lines[i]
            ? gameState.penalties[Period.ONE][teamType].lines[i].filter(c => c && c.code.trim().length > 0).length
            : 0),
        [period, gameState, teamType]);

    const DEFAULT_PENALTY: () => Penalty = () => ({ code: '', jam: '' });
    const DEFAULT_PENALTY_LINE: () => PenaltyLine = useCallback(() => Array.from({ length: 10 }, DEFAULT_PENALTY), []);

    const { validators } = useValidation();
    const { validity } = useMemo(() => validators[teamType][period].penaltyValidity, [validators, period, teamType]);

    const createPenaltyLineIfMissing = useCallback((rowIndex: number) => {
        if(!penalties[rowIndex]) {
            penalties[rowIndex] = DEFAULT_PENALTY_LINE();
        }
    }, [DEFAULT_PENALTY_LINE, penalties]);

    const updateGameState = () => {
        setGameState({ 
            ...gameState, 
            penalties: { 
                ...gameState.penalties, 
                [period]: { 
                    ...gameState.penalties[period], 
                    [teamType]: {
                        ...gameState.penalties[period][teamType],
                        lines: penalties,
                    }
                }
            }
        });
    }

    const rerenderTable = useCallback(() => {
        setCellRenderCount(c => c + 1);
    }, [setCellRenderCount]);

    const handleChange = <T,>(row: number, column: number, setter: (line: Penalty, value: T) => void) => (value: T) => {
        createPenaltyLineIfMissing(row);
        setter(penalties[row][column], value);
        updateGameState();
        rerenderTable();
    }

    const getValidity = useCallback((row: number, column: number) =>
        (validity.lines[row] && validity.lines[row][column]) ?? OK, [validity]);

    const renderPenaltyCodeCell = (column: number, row: number, color: string) => (
        <EditableCell2
            style={{ backgroundColor: color }}
            value={penalties[row] && penalties[row][column]?.code}
            tooltip={getValidity(row, column)?.code?.message}
            className={styles[`validity-${getValidity(row, column)?.code?.validity}`]}
            onConfirm={handleChange<string>(row, column, (l, v) => l.code = v)}
        />
    );

    const renderJamNumberCell = (column: number, row: number, color: string) => (
        <EditableCell2
            style={{ backgroundColor: color }}
            value={penalties[row] && penalties[row][column]?.jam}
            tooltip={getValidity(row, column)?.jam?.message}
            className={styles[`validity-${getValidity(row, column)?.jam?.validity}`]}
            onConfirm={handleChange<string>(row, column, (l, v) => l.jam = v)}
        />
    );

    const renderPenaltyCell = (column: number) => (color: string) => (row: number) => {
        const calculatedColor = column >= previousPeriodPenaltyCounts[Math.floor(row / 2)] ? color : Colors.Gray;

        return row % 2 == 0 
            ? renderPenaltyCodeCell(column, Math.floor(row / 2), calculatedColor)
            : renderJamNumberCell(column, Math.floor(row / 2), calculatedColor);
    }

    const renderSkaterNumberCell = (color: string) => (rowIndex: number) => (
        <Cell className={styles.playerNumberCell} style={{ backgroundColor: color }}>
            {(roster && roster.skaters && roster.skaters[rowIndex]?.number) ?? ''}
        </Cell>
    );

    const getRowTotal = useCallback((row: number) => {
        const rowTotal = (penalties[row] && penalties[row].slice(0, 9).filter(p => p.code.trim().length > 0).length) ?? 0;

        return rowTotal > 0 ? rowTotal.toString() : '';
    }, [penalties]);

    const renderTotalsCell = useCallback((color: string) => (rowIndex: number) => (
        <Cell className={styles.playerNumberCell} style={{ backgroundColor: color }}>
            {getRowTotal(rowIndex)}
        </Cell>
    ), [getRowTotal]);
    
    const renderAlternatingColorCell = useCallback((frequency: number, cellRenderer: CellRendererFn, lightColor: string, darkColor: string) =>
        (rowIndex: number) => cellRenderer(Math.floor(rowIndex / frequency) % 2 == 0 ? lightColor : darkColor)(rowIndex)
        , []);
  
    const renderHeader = (name: string) => () => (
      <ColumnHeaderCell style={{ backgroundColor: Colors.Black, color: Colors.White }}>
        <span style={{ fontSize: '8pt' }}>{ name }</span>
      </ColumnHeaderCell>
    );

    const getCellData = useCallback((row: number, column: number) => {
        const penaltyRow = Math.floor(row / 2);
        if (penaltyRow >= penalties.length) return '';

        if(!penalties[penaltyRow] || column >= penalties[penaltyRow].length) return '';

        return row % 2 === 0 ? penalties[penaltyRow][column].code : penalties[penaltyRow][column].jam;
    }, [penalties]);

    const setCellData = useCallback((row: number, column: number, value: string) => {
        const penaltyRow = Math.floor(row / 2);
        createPenaltyLineIfMissing(penaltyRow);

        if(row % 2 === 0) {
            penalties[penaltyRow][column].code = value;
        } else {
            penalties[penaltyRow][column].jam = value;
        }
    }, [penalties, createPenaltyLineIfMissing]);

    const deleteCellData = useCallback((row: number, column: number) => {
        const penaltyRow = Math.floor(row / 2);
        if (penaltyRow >= penalties.length || !penalties[penaltyRow]) return;

        if (row % 2 === 0) {
            penalties[penaltyRow][column].code = '';
        } else {
            penalties[penaltyRow][column].jam = '';
        }
    }, [penalties]);

    return (
      <div className={styles.penaltyTable}>
        <Table2
            numRows={20}
            enableRowResizing={false} 
            enableColumnResizing={false}
            enableRowHeader={false} 
            enableColumnHeader={true}
            enableFocusedCell={false}
            enableGhostCells={false}
            defaultRowHeight={40}
            columnWidths={[60]}
            selectedRegions={[]}
            className={styles.penaltySideTable}
          >
            <Column columnHeaderCellRenderer={renderHeader("#")} cellRenderer={renderAlternatingColorCell(1, renderSkaterNumberCell, Colors.LightPink, Colors.DarkPink)} />
        </Table2>
        <StatsTable
          rowCount={40} 
          columnWidths={[40, 40, 40, 40, 40, 40, 40, 40, 40, 40]}
          getCellData={getCellData}
          setCellData={setCellData}
          deleteCellData={deleteCellData}
          onBatchOperationCompleted={updateGameState}
          cellRendererDependencies={[validity, cellRenderCount]}
        >
          <Column columnHeaderCellRenderer={renderHeader("1")} cellRenderer={renderAlternatingColorCell(2, renderPenaltyCell(0), Colors.White, Colors.LightPink)} />
          <Column columnHeaderCellRenderer={renderHeader("2")} cellRenderer={renderAlternatingColorCell(2, renderPenaltyCell(1), Colors.White, Colors.LightPink)} />
          <Column columnHeaderCellRenderer={renderHeader("3")} cellRenderer={renderAlternatingColorCell(2, renderPenaltyCell(2), Colors.White, Colors.LightPink)} />
          <Column columnHeaderCellRenderer={renderHeader("4")} cellRenderer={renderAlternatingColorCell(2, renderPenaltyCell(3), Colors.White, Colors.LightPink)} />
          <Column columnHeaderCellRenderer={renderHeader("5")} cellRenderer={renderAlternatingColorCell(2, renderPenaltyCell(4), Colors.White, Colors.LightPink)} />
          <Column columnHeaderCellRenderer={renderHeader("6")} cellRenderer={renderAlternatingColorCell(2, renderPenaltyCell(5), Colors.White, Colors.LightPink)} />
          <Column columnHeaderCellRenderer={renderHeader("7")} cellRenderer={renderAlternatingColorCell(2, renderPenaltyCell(6), Colors.LightPink, Colors.DarkPink)} />
          <Column columnHeaderCellRenderer={renderHeader("8")} cellRenderer={renderAlternatingColorCell(2, renderPenaltyCell(7), Colors.LightPink, Colors.DarkPink)} />
          <Column columnHeaderCellRenderer={renderHeader("9")} cellRenderer={renderAlternatingColorCell(2, renderPenaltyCell(8), Colors.LightPink, Colors.DarkPink)} />
          <Column columnHeaderCellRenderer={renderHeader("FO/EXP")} cellRenderer={renderPenaltyCell(9)(Colors.DarkPink)} />
        </StatsTable>
        <Table2
            numRows={20}
            enableRowResizing={false} 
            enableColumnResizing={false}
            enableRowHeader={false} 
            enableColumnHeader={true}
            enableFocusedCell={false}
            enableGhostCells={false}
            defaultRowHeight={40}
            columnWidths={[60]}
            selectedRegions={[]}
            cellRendererDependencies={[gameState]}
            className={styles.penaltySideTable}
          >
            <Column columnHeaderCellRenderer={renderHeader("Total")} cellRenderer={renderAlternatingColorCell(1, renderTotalsCell, Colors.White, Colors.LightPink)} />
        </Table2>
      </div>
    )
  }