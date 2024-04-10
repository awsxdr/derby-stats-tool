import { useCallback, useMemo, useState } from "react";
import { Column, ColumnHeaderCell, EditableCell2 } from "@blueprintjs/table";

import { StatsTable, SuggestEditCell } from "@components";
import { Official, useGameContext } from "@contexts";

import { Role } from "./Role";

import * as Colors from '@/Colors';

import styles from './OfficialsRosterSheet.module.scss';

const DEFAULT_ROLES: Role[] = [
    { name: "Head Non-Skating Official", initials: "HNSO" },
    { name: "Penalty Tracker", initials: "PT" },
    { name: "Penalty Lineup Tracker", initials: "PLT" },
    { name: "Penalty Wrangler", initials: "PW" },
    { name: "Inside Whiteboard Operator", initials: "IWB" },
    { name: "Jam Timer", initials: "JT" },
    { name: "Scorekeeper", initials: "SK" },
    { name: "ScoreBoard Operator", initials: "SBO" },
    { name: "Penalty Box Manager", initials: "PBM" },
    { name: "Penalty Box Timer", initials: "PBT" },
    { name: "Lineup Tracker", initials: "LT" },
    { name: "Non-Skating Official Alternate", initials: "ALTN" },
    { name: "Head Referee", initials: "HR" },
    { name: "Inside Pack Referee", initials: "IPR" },
    { name: "Jammer Referee", initials: "JR" },
    { name: "Outside Pack Referee", initials: "OPR" },
    { name: "Referee Alternate", initials: "ALTR" },
];

const DEFAULT_OFFICIAL = (): Official => ({ role: '', name: '', league: '', certificationLevel: '' });

export const OfficialsRosterSheet = () => {

    const [roles, setRoles] = useState<Role[]>(DEFAULT_ROLES);
    const [isDeleteOfficialWarningOpen, setIsDeleteOfficialWarningOpen] = useState(false);
    const [selectedOfficialIndex, setSelectedOfficialIndex] = useState<number>();

    const { gameState, setGameState } = useGameContext();

    const officials = useMemo(() => gameState.officials, [gameState]);

    const addOfficial = useCallback(() => {
        setGameState({ ...gameState, officials: [...gameState.officials, DEFAULT_OFFICIAL()]})
    }, [gameState, setGameState]);

    const closeDeleteOfficialWarning = useCallback(() => setIsDeleteOfficialWarningOpen(false), [setIsDeleteOfficialWarningOpen]);

    const handleRoleSet = useCallback((role: Role, index: number) => {
        const officials = gameState.officials;
        officials[index].role = role.name;
        setGameState({ ...gameState, officials });
    }, [gameState, setGameState]);

    const handleNameSet = useCallback((name: string, index: number) => {
        const officials = gameState.officials;
        officials[index].name = name;
        setGameState({ ...gameState, officials });
    }, [gameState, setGameState]);

    const handleLeagueSet = useCallback((league: string, index: number) => {
        const officials = gameState.officials;
        officials[index].league = league;
        setGameState({ ...gameState, officials });
    }, [gameState, setGameState]);

    const handleCertificationLevelSet = useCallback((certificationLevel: string, index: number) => {
        const officials = gameState.officials;
        officials[index].certificationLevel = certificationLevel;
        setGameState({ ...gameState, officials });
    }, [gameState, setGameState]);

    const handleDeleteOfficial = (key: number) => {
        setSelectedOfficialIndex(key);
        setIsDeleteOfficialWarningOpen(true);
    }

    const handleRoleAdded = useCallback((role: string) => {
        const newRole = { name: role };
        setRoles(current => [...current.filter(v => v.name.toLowerCase() !== role.toLowerCase()), newRole]);
        return newRole;
    }, [setRoles]);

    const renderHeader = (name: string) => () => (
        <ColumnHeaderCell style={{ backgroundColor: Colors.Black, color: Colors.White }}>
            <span style={{ fontSize: '8pt' }}>{ name }</span>
        </ColumnHeaderCell>
    );

    const updateGameState = useCallback(() => {
        setGameState({ ...gameState, officials });
    }, [gameState, officials, setGameState])
    
    const getCellData = useCallback((row: number, column: number): string => {
        switch (column) {
            case 0:
                return officials[row].role;
            case 1:
                return officials[row].name;
            case 2:
                return officials[row].league;
            case 3:
                return officials[row].certificationLevel;
        }

        return '';
    }, [officials]);

    const setCellData = useCallback((row: number, column: number, value: string) => {
        switch (column) {
            case 0:
                officials[row].role = value;
                break;
            case 1:
                officials[row].name = value;
                break;
            case 2:
                officials[row].league = value;
                break;
            case 3:
                officials[row].certificationLevel = value;
                break;
        }
    }, [officials]);

    const deleteCellData = useCallback((row: number, column: number) => {
        switch (column) {
            case 0:
                officials[row].role = '';
                break;
            case 1:
                officials[row].name = '';
                break;
            case 2:
                officials[row].league = '';
                break;
            case 3:
                officials[row].certificationLevel = '';
                break;
        }

        if (officials[row].role === '' && officials[row].name === '' && officials[row].league === '' && officials[row].certificationLevel === '') {
            setGameState({ ...gameState, officials: officials.splice(row, 1) })
        }
    }, [officials, gameState, setGameState]);

    const createOfficialIfNeeded = useCallback((row: number) => {
        if (!officials[row]) {
            officials[row] = DEFAULT_OFFICIAL();
        }
    }, [officials])

    const handleRoleConfirm = useCallback((rowIndex: number) => (value: string) => {
        createOfficialIfNeeded(rowIndex);
        officials[rowIndex].name = value;
        updateGameState();
    }, [officials, createOfficialIfNeeded, updateGameState]);

    const renderRoleCell = (color: string) => (rowIndex: number) => (
        <SuggestEditCell<Role>
            style={{ backgroundColor: color }}
            value={roles.find(r => r.name === officials[rowIndex]?.role)}
            possibleValues={roles}
            valuesEqual={(l, r) => l?.name === r?.name}
            createNewPossibleValue={s => handleRoleAdded(s)}
            valueRenderer={v => v?.name ?? ''}
        />
    );

    const handleNameConfirm = useCallback((rowIndex: number) => (value: string) => {
        createOfficialIfNeeded(rowIndex);
        officials[rowIndex].name = value;
        updateGameState();
    }, [officials, createOfficialIfNeeded, updateGameState]);

    const renderNameCell = (color: string) => (rowIndex: number) => (
        <EditableCell2 
            style={{ backgroundColor: color }}
            value={(officials && officials[rowIndex]?.name) ?? ''}
            onConfirm={handleNameConfirm(rowIndex)}
        />
    );

    const handleLeagueConfirm = useCallback((rowIndex: number) => (value: string) => {
        createOfficialIfNeeded(rowIndex);
        officials[rowIndex].league = value;
        updateGameState();
    }, [officials, createOfficialIfNeeded, updateGameState]);

    const renderLeagueCell = (color: string) => (rowIndex: number) => (
        <EditableCell2 
            style={{ backgroundColor: color }}
            value={(officials && officials[rowIndex]?.league) ?? ''}
            onConfirm={handleLeagueConfirm(rowIndex)}
        />
    );

    const handleCertificationConfirm = useCallback((rowIndex: number) => (value: string) => {
        createOfficialIfNeeded(rowIndex);
        officials[rowIndex].certificationLevel = value;
        updateGameState();
    }, [officials, createOfficialIfNeeded, updateGameState]);

    const renderCertificationCell = (color: string) => (rowIndex: number) => (
        <EditableCell2 
            style={{ backgroundColor: color }}
            value={(officials && officials[rowIndex]?.certificationLevel) ?? ''}
            onConfirm={handleCertificationConfirm(rowIndex)}
        />
    );

    return (
        <div className={styles.officialsTable}>
            <StatsTable
                rowCount={officials.length + 1}
                columnWidths={[200, 200, 200, 100]}
                getCellData={getCellData}
                setCellData={setCellData}
                deleteCellData={deleteCellData}
                onBatchOperationCompleted={updateGameState}
            >
                <Column columnHeaderCellRenderer={renderHeader("Role")} cellRenderer={renderRoleCell(Colors.White)} />
                <Column columnHeaderCellRenderer={renderHeader("Name")} cellRenderer={renderNameCell(Colors.White)} />
                <Column columnHeaderCellRenderer={renderHeader("League affiliation")} cellRenderer={renderLeagueCell(Colors.White)} />
                <Column columnHeaderCellRenderer={renderHeader("Cert. level")} cellRenderer={renderCertificationCell(Colors.White)} />
            </StatsTable>
        </div>
    );
}