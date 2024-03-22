import { Cell, Column, ColumnHeaderCell, EditableCell2, Table2 } from '@blueprintjs/table'
import { ReactElement, useCallback, useMemo } from 'react';
import styles from './PenaltySheet.module.css';
import { Penalty, PenaltyLine, Period, TeamType, useGameContext } from './GameStateContext';

type ContentRendererFn = (rowIndex: number) => ReactElement;
type CellRendererFn = (color: string) => ContentRendererFn;

const DarkPink = "#ffd0ff";
const LightPink = "#ffe8ff";
const White = "#ffffff";
const Black = "#000000";

interface PenaltySheetProps {
    teamType: TeamType,
    period: Period,
}

export const PenaltySheet = ({ teamType, period }: PenaltySheetProps) => {

    const { gameState, setGameState } = useGameContext();

    const roster = useMemo(() => gameState.rosters[teamType], [gameState, teamType]);
    const penalties = useMemo(() => gameState.penalties[period][teamType], [gameState, teamType, period]);

    const DEFAULT_PENALTY_LINE: () => PenaltyLine = () => Array.from({ length: 10 }, () => ({ code: '', jam: ''}));

    const createPenaltyLineIfMissing = (rowIndex: number) => {
        if(!penalties[rowIndex]) {
            penalties[rowIndex] = DEFAULT_PENALTY_LINE();
        }
    }

    const updatePenalties = () => {
        setGameState({ ...gameState, penalties: { ...gameState.penalties, [period]: { ...gameState.penalties[period], [teamType]: penalties }}});
    }

    const handleChange = <T,>(row: number, column: number, setter: (line: Penalty, value: T) => void) => (value: T) => {
        createPenaltyLineIfMissing(row);
        setter(penalties[row][column], value);
        updatePenalties();
    }

    const renderPenaltyCodeCell = (column: number, row: number, color: string) => (
        <EditableCell2
            style={{ backgroundColor: color }}
            value={penalties[row] && penalties[row][column]?.code}
            onConfirm={handleChange<string>(row, column, (l, v) => l.code = v)}
        />
    );

    const renderJamNumberCell = (column: number, row: number, color: string) => (
        <EditableCell2
            style={{ backgroundColor: color }}
            value={penalties[row] && penalties[row][column]?.jam}
            onConfirm={handleChange<string>(row, column, (l, v) => l.jam = v)}
        />
    );

    const renderPenaltyCell = (column: number) => (color: string) => (row: number) => (
        row % 2 == 0 
            ? renderPenaltyCodeCell(column, Math.floor(row / 2), color)
            : renderJamNumberCell(column, Math.floor(row / 2), color)
        );

    const renderSkaterNumberCell = (color: string) => (rowIndex: number) => (
        <Cell className={styles.playerNumberCell} style={{ backgroundColor: color }}>
            {(roster && roster[rowIndex]?.number) ?? ''}
        </Cell>
    );

    const getRowTotal = useCallback((row: number) => {
        const rowTotal = (penalties[row] && penalties[row].filter(p => p.code.trim().length > 0).length) ?? 0;

        console.log(`Row ${row} total: ${rowTotal}`);

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
      <ColumnHeaderCell style={{ backgroundColor: Black, color: White }}>
        <span style={{ fontSize: '8pt' }}>{ name }</span>
      </ColumnHeaderCell>
    );

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
          >
            <Column columnHeaderCellRenderer={renderHeader("#")} cellRenderer={renderAlternatingColorCell(1, renderSkaterNumberCell, LightPink, DarkPink)} />
        </Table2>
        <Table2 
          numRows={40} 
          enableRowResizing={false} 
          enableColumnResizing={false}
          enableRowHeader={false} 
          enableColumnHeader={true}
          enableFocusedCell={true}
          enableGhostCells={false}
          columnWidths={[40, 40, 40, 40, 40, 40, 40, 40, 40, 40]}
        >
          <Column columnHeaderCellRenderer={renderHeader("1")} cellRenderer={renderAlternatingColorCell(2, renderPenaltyCell(0), White, LightPink)} />
          <Column columnHeaderCellRenderer={renderHeader("2")} cellRenderer={renderAlternatingColorCell(2, renderPenaltyCell(1), White, LightPink)} />
          <Column columnHeaderCellRenderer={renderHeader("3")} cellRenderer={renderAlternatingColorCell(2, renderPenaltyCell(2), White, LightPink)} />
          <Column columnHeaderCellRenderer={renderHeader("4")} cellRenderer={renderAlternatingColorCell(2, renderPenaltyCell(3), White, LightPink)} />
          <Column columnHeaderCellRenderer={renderHeader("5")} cellRenderer={renderAlternatingColorCell(2, renderPenaltyCell(4), White, LightPink)} />
          <Column columnHeaderCellRenderer={renderHeader("6")} cellRenderer={renderAlternatingColorCell(2, renderPenaltyCell(5), White, LightPink)} />
          <Column columnHeaderCellRenderer={renderHeader("7")} cellRenderer={renderAlternatingColorCell(2, renderPenaltyCell(6), White, LightPink)} />
          <Column columnHeaderCellRenderer={renderHeader("8")} cellRenderer={renderAlternatingColorCell(2, renderPenaltyCell(7), White, LightPink)} />
          <Column columnHeaderCellRenderer={renderHeader("9")} cellRenderer={renderAlternatingColorCell(2, renderPenaltyCell(8), White, LightPink)} />
          <Column columnHeaderCellRenderer={renderHeader("FO/EXP")} cellRenderer={renderPenaltyCell(9)(DarkPink)} />
        </Table2>
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
          >
            <Column columnHeaderCellRenderer={renderHeader("Total")} cellRenderer={renderAlternatingColorCell(1, renderTotalsCell, White, LightPink)} />
        </Table2>
      </div>
    )
  }