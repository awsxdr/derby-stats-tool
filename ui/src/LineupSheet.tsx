import { Cell, Column, ColumnHeaderCell, EditableCell2, RenderMode, Table2 } from '@blueprintjs/table'
import { ReactElement, useMemo } from 'react';
import styles from './LineupSheet.module.css';
import { LineupLine, Period, SkaterType, TeamType, useGameContext } from './GameStateContext';
import { ToggleCell } from './ToggleCell';

type ContentRendererFn = (rowIndex: number) => ReactElement;
type CellRendererFn = (color: string) => ContentRendererFn;

const DarkBlue = "#b5daff";
const MediumBlue = "#cee7ff"
const LightBlue = "#e6f2ff";
const White = "#ffffff";
const Black = "#000000";

interface LineupSheetProps {
    teamType: TeamType,
    period: Period,
}

export const LineupSheet = ({ teamType, period }: LineupSheetProps) => {
    const { gameState, setGameState } = useGameContext();

    const lineups = useMemo(() => gameState.lineups[period][teamType].lines, [gameState, period, teamType]);
    const scores = useMemo(() => gameState.scores[period][teamType].lines, [gameState, period, teamType]);

    const renderAlternatingColorCell = (cellRenderer: CellRendererFn, lightColor: string, darkColor: string) =>
        (rowIndex: number) => cellRenderer(rowIndex % 2 == 0 ? lightColor : darkColor)(rowIndex);
  
    const renderConstantColorCell = (cellRenderer: CellRendererFn, color: string) =>
        cellRenderer(color);

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

    const createLineupLineIfMissing = (rowIndex: number) => {
        if(!lineups[rowIndex]) {
            lineups[rowIndex] = DEFAULT_LINEUP_LINE();
        }
    }

    const updateLineups = () => {
        setGameState({ 
            ...gameState, 
            lineups: { 
                ...gameState.lineups, 
                [period]: { 
                    ...gameState.lineups[period], 
                    [teamType]: {
                        ...gameState.lineups[period][teamType],
                        lines: lineups 
                    }
                }
            }
        });
    }

    const handleChange = <T,>(setter: (line: LineupLine, value: T)=> void) => (rowIndex: number) => (value: T) => {
        createLineupLineIfMissing(rowIndex);
        setter(lineups[rowIndex], value);
        updateLineups();
    }

    const renderJamNumberCell = (color: string) => (rowIndex: number) => (
        <Cell style={{ backgroundColor: color }}>
            { scores[rowIndex]?.jam }
        </Cell>
    );

    const renderNoPivotCell = (color: string) => (rowIndex: number) => (
        <ToggleCell
            style={{ backgroundColor: color }}
            value={lineups[rowIndex]?.noPivot}
            onConfirm={handleChange<boolean>((l, v) => l.noPivot = v)(rowIndex)}
        />
    );

    const renderReadOnlySkaterNumberCell = (skaterType: SkaterType) => (color: string) => (rowIndex: number) => (
        <Cell style={{ backgroundColor: color }}>
            {lineups[rowIndex]?.skaters[skaterType].number}
        </Cell>
    );

    const renderSkaterNumberCell = (skaterType: SkaterType) => (color: string) => (rowIndex: number) => (
        <EditableCell2
            style={{ backgroundColor: color }}
            value={lineups[rowIndex]?.skaters[skaterType].number}
            onConfirm={handleChange<string>((l, v) => l.skaters[skaterType].number = v)(rowIndex)}
        />
    );

    const renderSkaterEventCell = (skaterType: SkaterType, eventNumber: number) => (color: string) => (rowIndex: number) => (
        <EditableCell2
            style={{ backgroundColor: color }}
            className={styles.lineupEvent}
            value={lineups[rowIndex]?.skaters[skaterType].events[eventNumber]}
            onConfirm={handleChange<string>((l, v) => l.skaters[skaterType].events[eventNumber] = v.substring(0, 1))(rowIndex)}
        />
    );
  
    const renderHeader = (name: string) => () => (
      <ColumnHeaderCell style={{ backgroundColor: Black, color: White }}>
        <span style={{ fontSize: '8pt' }}>{ name }</span>
      </ColumnHeaderCell>
    );

    return (
      <div className={styles.lineupTable}>
        <Table2 
          numRows={40} 
          enableRowResizing={false} 
          enableColumnResizing={false}
          enableRowHeader={false} 
          enableColumnHeader={true}
          enableFocusedCell={true}
          enableGhostCells={false}
          columnWidths={[50, 50, 100, 20, 20, 20, 100, 20, 20, 20, 100, 20, 20, 20, 100, 20, 20, 20, 100, 20, 20, 20]}
          renderMode={RenderMode.BATCH_ON_UPDATE}
        >
          <Column columnHeaderCellRenderer={renderHeader("Jam")} cellRenderer={renderAlternatingColorCell(renderJamNumberCell, LightBlue, MediumBlue)} />
          <Column columnHeaderCellRenderer={renderHeader("No Pivot")} cellRenderer={renderAlternatingColorCell(renderNoPivotCell, LightBlue, MediumBlue)} />
          <Column columnHeaderCellRenderer={renderHeader("Jammer")} cellRenderer={renderAlternatingColorCell(renderReadOnlySkaterNumberCell(SkaterType.Jammer), White, LightBlue)} />
          <Column columnHeaderCellRenderer={renderHeader("")} cellRenderer={renderConstantColorCell(renderSkaterEventCell(SkaterType.Jammer, 0), DarkBlue)} />
          <Column columnHeaderCellRenderer={renderHeader("")} cellRenderer={renderConstantColorCell(renderSkaterEventCell(SkaterType.Jammer, 1), DarkBlue)} />
          <Column columnHeaderCellRenderer={renderHeader("")} cellRenderer={renderConstantColorCell(renderSkaterEventCell(SkaterType.Jammer, 2), DarkBlue)} />
          <Column columnHeaderCellRenderer={renderHeader("Pivot")} cellRenderer={renderAlternatingColorCell(renderSkaterNumberCell(SkaterType.Pivot), White, LightBlue)} />
          <Column columnHeaderCellRenderer={renderHeader("")} cellRenderer={renderConstantColorCell(renderSkaterEventCell(SkaterType.Pivot, 0), DarkBlue)} />
          <Column columnHeaderCellRenderer={renderHeader("")} cellRenderer={renderConstantColorCell(renderSkaterEventCell(SkaterType.Pivot, 1), DarkBlue)} />
          <Column columnHeaderCellRenderer={renderHeader("")} cellRenderer={renderConstantColorCell(renderSkaterEventCell(SkaterType.Pivot, 2), DarkBlue)} />
          <Column columnHeaderCellRenderer={renderHeader("Blocker")} cellRenderer={renderAlternatingColorCell(renderSkaterNumberCell(SkaterType.Blocker1), White, LightBlue)} />
          <Column columnHeaderCellRenderer={renderHeader("")} cellRenderer={renderConstantColorCell(renderSkaterEventCell(SkaterType.Blocker1, 0), DarkBlue)} />
          <Column columnHeaderCellRenderer={renderHeader("")} cellRenderer={renderConstantColorCell(renderSkaterEventCell(SkaterType.Blocker1, 1), DarkBlue)} />
          <Column columnHeaderCellRenderer={renderHeader("")} cellRenderer={renderConstantColorCell(renderSkaterEventCell(SkaterType.Blocker1, 2), DarkBlue)} />
          <Column columnHeaderCellRenderer={renderHeader("Blocker")} cellRenderer={renderAlternatingColorCell(renderSkaterNumberCell(SkaterType.Blocker2), White, LightBlue)} />
          <Column columnHeaderCellRenderer={renderHeader("")} cellRenderer={renderConstantColorCell(renderSkaterEventCell(SkaterType.Blocker2, 0), DarkBlue)} />
          <Column columnHeaderCellRenderer={renderHeader("")} cellRenderer={renderConstantColorCell(renderSkaterEventCell(SkaterType.Blocker2, 1), DarkBlue)} />
          <Column columnHeaderCellRenderer={renderHeader("")} cellRenderer={renderConstantColorCell(renderSkaterEventCell(SkaterType.Blocker2, 2), DarkBlue)} />
          <Column columnHeaderCellRenderer={renderHeader("Blocker")} cellRenderer={renderAlternatingColorCell(renderSkaterNumberCell(SkaterType.Blocker3), White, LightBlue)} />
          <Column columnHeaderCellRenderer={renderHeader("")} cellRenderer={renderConstantColorCell(renderSkaterEventCell(SkaterType.Blocker3, 0), DarkBlue)} />
          <Column columnHeaderCellRenderer={renderHeader("")} cellRenderer={renderConstantColorCell(renderSkaterEventCell(SkaterType.Blocker3, 1), DarkBlue)} />
          <Column columnHeaderCellRenderer={renderHeader("")} cellRenderer={renderConstantColorCell(renderSkaterEventCell(SkaterType.Blocker3, 2), DarkBlue)} />
        </Table2>
      </div>
    )
  }