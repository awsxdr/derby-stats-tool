import { useCallback, useMemo } from 'react';
import { Cell, Column, ColumnHeaderCell, EditableCell2 } from '@blueprintjs/table'
import { FormGroup, InputGroup } from '@blueprintjs/core';

import { StatsTable } from '@components';
import { TeamType, useGameContext } from '@contexts';

import styles from './RosterSheet.module.css';

const LightPink = "#ffe8ff";
const White = "#ffffff";
const Black = "#000000";

interface RosterSheetProps {
    teamType: TeamType,
}

export const RosterSheet = ({ teamType }: RosterSheetProps) => {
    const { gameState, setGameState } = useGameContext();

    const roster = useMemo(() => gameState.rosters[teamType], [gameState, teamType]);

    const createSkaterIfNeeded = useCallback((rowIndex: number) => {
        if(!roster.skaters[rowIndex]) {
            roster.skaters[rowIndex] = { number: '', name: '' };
        }
    }, [roster]);

    const handleSkaterNumberConfirm = (rowIndex: number) => (value: string) => {
        createSkaterIfNeeded(rowIndex);
        roster.skaters[rowIndex].number = value;
        setGameState({ ...gameState, rosters: { ...gameState.rosters, [teamType]: roster }})
    }

    const handleSkaterNameConfirm = (rowIndex: number) => (value: string) => {
        createSkaterIfNeeded(rowIndex);
        roster.skaters[rowIndex].name = value;
        setGameState({ ...gameState, rosters: { ...gameState.rosters, [teamType]: roster }})
    }

    const setColor = (color: string) => {
        roster.color = color;
        setGameState({ ...gameState, rosters: { ...gameState.rosters, [teamType]: roster }});
    }

    const setCaptainSkateName = (name: string) => {
        roster.captainSkateName = name;
        setGameState({ ...gameState, rosters: { ...gameState.rosters, [teamType]: roster }});
    }

    const setCaptainLegalName = (name: string) => {
        roster.captainLegalName = name;
        setGameState({ ...gameState, rosters: { ...gameState.rosters, [teamType]: roster }});
    }

    const setLeague = (league: string) => {
        roster.league = league;
        setGameState({ ...gameState, rosters: { ...gameState.rosters, [teamType]: roster }});
    }

    const setTeam = (team: string) => {
        roster.team = team;
        setGameState({ ...gameState, rosters: { ...gameState.rosters, [teamType]: roster }});
    }

    const renderSkaterNumberCell = (color: string) => (rowIndex: number) => (
        <EditableCell2 
            style={{ backgroundColor: color }}
            value={(roster && roster.skaters && roster.skaters[rowIndex]?.number) ?? ''}
            onConfirm={handleSkaterNumberConfirm(rowIndex)}
        />
    );

    const renderSkaterNameCell = (color: string) => (rowIndex: number) => (
        <EditableCell2 
            style={{ backgroundColor: color, textAlign: 'left' }}
            value={(roster && roster.skaters && roster.skaters[rowIndex]?.name) ?? ''}
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

    const getCellData = useCallback((row: number, column: number) => {
        switch (column) {
            case 1:
                return roster.skaters.length > row ? roster.skaters[row].number : '';

            case 2:
                return roster.skaters.length > row ? roster.skaters[row].name : '';
            
            default:
                return '';
        }
    }, [roster]);

    const setCellData = useCallback((row: number, column: number, value: string) => {
        createSkaterIfNeeded(row);

        switch(column) {
            case 1:
                roster.skaters[row].number = value;
                break;

            case 2:
                roster.skaters[row].name = value;
                break;

            default:
                break;
        }
    }, [createSkaterIfNeeded, roster]);

    const deleteCellData = useCallback((row: number, column: number) => {
        if(!roster.skaters[row]) return;
        switch(column) {
            case 1:
                roster.skaters[row].number = '';
                break;

            case 2:
                roster.skaters[row].name = '';
                break;

            default:
                break;
            }
    }, [roster]);

    const handleBatchOperationCompleted = useCallback(() => {
        setGameState({ ...gameState, rosters: { ...gameState.rosters, [teamType]: roster }});
    }, [gameState, roster, setGameState]);

    return (
        <div>
            <div className={styles.teamDetailsContainer}>
                <FormGroup label="League name" labelFor='league-input'>
                    <InputGroup id='league-input' fill value={roster.league} onValueChange={setLeague} />
                </FormGroup>
                <FormGroup label="Team name" labelFor='team-input'>
                    <InputGroup id='league-input' fill value={roster.team} onValueChange={setTeam} />
                </FormGroup>
                <FormGroup label="Color" labelFor='color-input'>
                    <InputGroup id='league-input' fill value={roster.color} onValueChange={setColor} />
                </FormGroup>
                <FormGroup label="Captain skate name" labelFor='captain-skate-name'>
                    <InputGroup id='league-input' fill value={roster.captainSkateName} onValueChange={setCaptainSkateName} />
                </FormGroup>
                <FormGroup label="Captain legal name" labelFor='captain-skate-name'>
                    <InputGroup id='league-input' fill value={roster.captainLegalName} onValueChange={setCaptainLegalName} />
                </FormGroup>
            </div>
            <div className={styles.rosterTable}>
                <StatsTable
                    rowCount={20}
                    columnWidths={[100, 100, 600]}
                    getCellData={getCellData}
                    setCellData={setCellData}
                    deleteCellData={deleteCellData}
                    onBatchOperationCompleted={handleBatchOperationCompleted}
                >
                    <Column columnHeaderCellRenderer={renderHeader("# of players")} cellRenderer={renderPlayerNumberCell(LightPink)} />
                    <Column columnHeaderCellRenderer={renderHeader("Skater #")} cellRenderer={renderSkaterNumberCell(White)} />
                    <Column columnHeaderCellRenderer={renderHeader("Skater Name")} cellRenderer={renderSkaterNameCell(White)} />
                </StatsTable>
            </div>
        </div>
    )
}