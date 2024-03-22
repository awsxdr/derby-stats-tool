import { Cell, Column, ColumnHeaderCell, EditableCell2, RenderMode, Table2 } from '@blueprintjs/table'
import { useMemo } from 'react';
import styles from './RosterSheet.module.css';
import { TeamType, useGameContext } from './GameStateContext';

const LightPink = "#ffe8ff";
const White = "#ffffff";
const Black = "#000000";

interface RosterSheetProps {
    teamType: TeamType,
}

export const RosterSheet = ({ teamType }: RosterSheetProps) => {
    const { gameState, setGameState } = useGameContext();

    const roster = useMemo(() => gameState.rosters[teamType], [gameState, teamType]);

    const handleSkaterNumberConfirm = (rowIndex: number) => (value: string) => {
        if(!roster[rowIndex]) {
            roster[rowIndex] = { number: value, name: '' };
        } else {
            roster[rowIndex].number = value;
        }

        setGameState({ ...gameState, rosters: { ...gameState.rosters, [teamType]: roster }})
    }

    const handleSkaterNameConfirm = (rowIndex: number) => (value: string) => {
        if(!roster[rowIndex]) {
            roster[rowIndex] = { number: '', name: value };
        } else {
            roster[rowIndex].name = value;
        }

        setGameState({ ...gameState, rosters: { ...gameState.rosters, [teamType]: roster }})
    }

    const renderSkaterNumberCell = (color: string) => (rowIndex: number) => (
        <EditableCell2 
            style={{ backgroundColor: color }}
            value={(roster && roster[rowIndex]?.number) ?? ''}
            onConfirm={handleSkaterNumberConfirm(rowIndex)}
        />
    );

    const renderSkaterNameCell = (color: string) => (rowIndex: number) => (
        <EditableCell2 
            style={{ backgroundColor: color, textAlign: 'left' }}
            value={(roster && roster[rowIndex]?.name) ?? ''}
            onConfirm={handleSkaterNameConfirm(rowIndex)}
        />
    );
  
    const renderPlayerNumberCell = (color: string) =>
        (rowIndex: number) => (
            <Cell style={{ backgroundColor: color }}>
                {rowIndex + 1}
            </Cell>
        );
  
    const renderHeader = (name: string) => () => (
      <ColumnHeaderCell style={{ backgroundColor: Black, color: White }}>
        <span style={{ fontSize: '8pt' }}>{ name }</span>
      </ColumnHeaderCell>
    );
  
    return (
      <div className={styles.rosterTable}>
        <Table2 
          numRows={20} 
          enableRowResizing={false} 
          enableColumnResizing={false}
          enableRowHeader={false} 
          enableColumnHeader={true}
          enableFocusedCell={true}
          enableGhostCells={false}
          columnWidths={[100, 100, 600]}
          renderMode={RenderMode.BATCH_ON_UPDATE}
        >
          <Column columnHeaderCellRenderer={renderHeader("# of players")} cellRenderer={renderPlayerNumberCell(LightPink)} />
          <Column columnHeaderCellRenderer={renderHeader("Skater #")} cellRenderer={renderSkaterNumberCell(White)} />
          <Column columnHeaderCellRenderer={renderHeader("Skater Name")} cellRenderer={renderSkaterNameCell(White)} />
        </Table2>
      </div>
    )
  }