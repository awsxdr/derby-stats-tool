import { Cell, Column, ColumnHeaderCell, EditableCell2, Region, RenderMode, Table2 } from '@blueprintjs/table'
import { useCallback, useMemo, useState } from 'react';
import styles from './RosterSheet.module.css';
import { TeamType, useGameContext } from './GameStateContext';
import { FormGroup, HotkeyConfig, HotkeysTarget2, InputGroup } from '@blueprintjs/core';
import { range } from './rangeMethods';

const LightPink = "#ffe8ff";
const White = "#ffffff";
const Black = "#000000";

interface RosterSheetProps {
    teamType: TeamType,
}

export const RosterSheet = ({ teamType }: RosterSheetProps) => {
    const { gameState, setGameState } = useGameContext();
    const [ selectedRange, setSelectedRange ] = useState<Region[]>([]);
    const [ cellRenderCount, setCellRenderCount ] = useState(0);

    const roster = useMemo(() => gameState.rosters[teamType], [gameState, teamType]);

    const rerenderTable = useCallback(() => setCellRenderCount(c => c + 1), [setCellRenderCount]);

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
    }, []);

    const handlePaste = useCallback(async () => {
        if(selectedRange.length !== 1) return;

        const clipboardText = await navigator.clipboard.readText();

        if(!clipboardText) return;

        if(selectedRange[0].cols === undefined || selectedRange[0].cols === null) return;
        if(selectedRange[0].rows === undefined || selectedRange[0].rows === null) return;

        const pastedData = clipboardText.split(/\r?\n/).map(l => l.split('\t'));

        const selectedColumn = selectedRange[0].cols[0];
        const selectedRow = selectedRange[0].rows[0];

        switch(selectedColumn)
        {
            case 1:
                for(let row = selectedRow; row < Math.min(selectedRow + pastedData.length, 20); ++row) {
                    const pastedDataIndex = row - selectedRow;
                    if(!pastedData[pastedDataIndex] || pastedData[pastedDataIndex].length === 0) continue;
                    createSkaterIfNeeded(row);
                    roster.skaters[row].number = pastedData[pastedDataIndex][0];
                    if(pastedData[pastedDataIndex].length >= 2) {
                        roster.skaters[row].name = pastedData[pastedDataIndex][1];
                    }
                }
                break;

            case 2:
                for(let row = selectedRow; row < Math.min(selectedRow + pastedData.length, 20); ++row) {
                    const pastedDataIndex = row - selectedRow;
                    if(!pastedData[pastedDataIndex] || pastedData[pastedDataIndex].length === 0) continue;
                    createSkaterIfNeeded(row);
                    roster.skaters[row].name = pastedData[pastedDataIndex][0];
                }
                break;

            default:
                break;
        }

        rerenderTable();
        setGameState({ ...gameState, rosters: { ...gameState.rosters, [teamType]: roster }});

    }, [selectedRange, createSkaterIfNeeded, roster, rerenderTable]);

    const handleDelete = useCallback(() => {
        if(selectedRange.length !== 1) return;

        if(selectedRange[0].cols === undefined || selectedRange[0].cols === null || selectedRange[0].cols.length !== 2) return;
        if(selectedRange[0].rows === undefined || selectedRange[0].rows === null || selectedRange[0].rows.length !== 2) return;

        for (let row = selectedRange[0].rows[0]; row <= selectedRange[0].rows[1]; ++row) {
            for (let column = selectedRange[0].cols[0]; column <= selectedRange[0].cols[1]; ++column) {
                if(!roster.skaters[row]) continue;
                switch (column) {
                    case 1:
                        roster.skaters[row].number = '';
                        break;

                    case 2:
                        roster.skaters[row].name = '';
                        break;

                    default:
                        break;
                }
            }
        }

        setGameState({ ...gameState, rosters: { ...gameState.rosters, [teamType]: roster }});
        rerenderTable();

    }, [selectedRange, roster, rerenderTable]);

    const handleCut = useCallback(() => {
        if(selectedRange.length !== 1) return;
        if(selectedRange[0].cols === undefined || selectedRange[0].cols === null || selectedRange[0].cols.length !== 2) return;
        if(selectedRange[0].rows === undefined || selectedRange[0].rows === null || selectedRange[0].rows.length !== 2) return;

        const cutData = range(selectedRange[0].rows[0], selectedRange[0].rows[1])
            .map(row => range(selectedRange[0].cols[0], selectedRange[0].cols[1])
                .map(column => {
                    switch (column) {
                        case 1:
                            return roster.skaters[row].number;

                        case 2:
                            return roster.skaters[row].name;

                        default:
                            return '';
                    }
                }).join('\t')
            ).join('\n');

        navigator.clipboard.writeText(cutData);

        handleDelete();
    }, [selectedRange, roster, handleDelete]);

    const hotkeys: HotkeyConfig[] = [
        {
            combo: 'mod+v',
            label: 'Paste',
            global: true,
            onKeyDown: handlePaste,
        },
        {
            combo: 'del',
            label: 'Delete',
            global: true,
            onKeyDown: handleDelete,
        },
        {
            combo: 'mod+x',
            label: 'Cut',
            global: true,
            onKeyDown: handleCut,
        },
    ];

    const handleSelect = useCallback((regions: Region[]) => setSelectedRange(regions), [setSelectedRange]);

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
                <HotkeysTarget2 hotkeys={hotkeys}>
                    <Table2 
                        numRows={20} 
                        enableRowResizing={false} 
                        enableColumnResizing={false}
                        enableRowHeader={false} 
                        enableColumnHeader={true}
                        enableFocusedCell={true}
                        enableGhostCells={false}
                        columnWidths={[100, 100, 600]}
                        renderMode={RenderMode.NONE}
                        getCellClipboardData={getCellData}
                        selectedRegions={selectedRange}
                        onSelection={handleSelect}
                        cellRendererDependencies={[cellRenderCount]}
                    >
                        <Column columnHeaderCellRenderer={renderHeader("# of players")} cellRenderer={renderPlayerNumberCell(LightPink)} />
                        <Column columnHeaderCellRenderer={renderHeader("Skater #")} cellRenderer={renderSkaterNumberCell(White)} />
                        <Column columnHeaderCellRenderer={renderHeader("Skater Name")} cellRenderer={renderSkaterNameCell(White)} />
                    </Table2>
                </HotkeysTarget2>
            </div>
        </div>
    )
}