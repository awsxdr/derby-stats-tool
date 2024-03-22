import { Column, ColumnHeaderCell, EditableCell2, RenderMode, Table2 } from '@blueprintjs/table'
import { ReactElement, useMemo } from 'react';
import styles from './ScoreSheet.module.css';
import { ToggleCell } from './ToggleCell';
import { Period, ScoreLine, TeamType, useGameContext } from './GameStateContext';

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

export const ScoreSheet = ({ teamType, period }: ScoreSheetProps) => {
    const { gameState, setGameState } = useGameContext();

    const scores = useMemo(() => gameState.scores[period][teamType], [gameState, teamType, period]);

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

    const createScoreLineIfMissing = (rowIndex: number) => {
        if(!scores[rowIndex]) {
            scores[rowIndex] = DEFAULT_SCORE_LINE();
        }
    }

    const updateScores = () => {
        setGameState({ ...gameState, scores: { ...gameState.scores, [period]: { ...gameState.scores[period], [teamType]: scores }}});
    }

    const handleChange = <T,>(setter: (line: ScoreLine, value: T) => void) => (rowIndex: number) => (value: T) => {
        createScoreLineIfMissing(rowIndex);
        setter(scores[rowIndex], value);
        updateScores();
    }

    const renderJamNumberCell = (color: string) => (rowIndex: number) => (
        <EditableCell2 
            style={{ backgroundColor: color }} 
            value={scores[rowIndex]?.jam} 
            onConfirm={handleChange<string>((l, v) => l.jam = v)(rowIndex)}
        />
    );

    const renderJammerNumberCell = (color: string) => (rowIndex: number) => (
        <EditableCell2
            style={{ backgroundColor: color }}
            value={scores[rowIndex]?.jammer}
            onConfirm={handleChange<string>((l, v) => l.jammer = v)(rowIndex)}
        />
    );

    const renderLostCell = (color: string) => (rowIndex: number) => (
        <ToggleCell
            style={{ backgroundColor: color }}
            value={scores[rowIndex]?.lost}
            onConfirm={handleChange<boolean>((l, v) => l.lost = v)(rowIndex)}
        />
    );

    const renderLeadCell = (color: string) => (rowIndex: number) => (
        <ToggleCell
            style={{ backgroundColor: color }}
            value={scores[rowIndex]?.lead}
            onConfirm={handleChange<boolean>((l, v) => l.lead = v)(rowIndex)}
        />
    );

    const renderCallCell = (color: string) => (rowIndex: number) => (
        <ToggleCell
            style={{ backgroundColor: color }}
            value={scores[rowIndex]?.call}
            onConfirm={handleChange<boolean>((l, v) => l.call = v)(rowIndex)}
        />
    );

    const renderInjuryCell = (color: string) => (rowIndex: number) => (
        <ToggleCell
            style={{ backgroundColor: color }}
            value={scores[rowIndex]?.injury}
            onConfirm={handleChange<boolean>((l, v) => l.injury = v)(rowIndex)}
        />
    );

    const renderNoInitialCell = (color: string) => (rowIndex: number) => (
        <ToggleCell
            style={{ backgroundColor: color }}
            value={scores[rowIndex]?.noInitial}
            onConfirm={handleChange<boolean>((l, v) => l.noInitial = v)(rowIndex)}
        />
    );

    const renderTripCell = (trip: number) => (color: string) => (rowIndex: number) => (
        <EditableCell2
            style={{ backgroundColor: color }}
            value={scores[rowIndex]?.trips[trip]}
            onConfirm={handleChange<string>((l, v) => l.trips[trip] = v)(rowIndex)}
        />
    );

    const renderJamTotalCell = (color: string) => (rowIndex: number) => (
        <EditableCell2
            style={{ backgroundColor: color }}
            value={scores[rowIndex]?.jamTotal}
            onConfirm={handleChange<string>((l, v) => l.jamTotal = v)(rowIndex)}
        />
    );

    const renderGameTotalCell = (color: string) => (rowIndex: number) => (
        <EditableCell2
            style={{ backgroundColor: color }}
            value={scores[rowIndex]?.gameTotal}
            onConfirm={handleChange<string>((l, v) => l.gameTotal = v)(rowIndex)}
        />
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
          renderMode={RenderMode.BATCH_ON_UPDATE}
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