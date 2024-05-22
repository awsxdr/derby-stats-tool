import { useCallback, useMemo } from "react";
import { Column, ColumnHeaderCell, EditableCell2 } from "@blueprintjs/table";

import { StatsTable } from "@components";
import { Official, useGameContext } from "@contexts";

import * as Colors from '@/Colors';

import styles from './OfficialsRosterSheet.module.scss';

const DEFAULT_OFFICIAL = (): Official => ({ role: '', name: '', league: '', certificationLevel: '' });

export const OfficialsRosterSheet = () => {

    const { gameState, setGameState } = useGameContext();

    const officials = useMemo(() => gameState.officials, [gameState]);

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
        officials[rowIndex].role = value;
        updateGameState();
    }, [officials, createOfficialIfNeeded, updateGameState]);

    const renderRoleCell = (color: string) => (rowIndex: number) => (
        <EditableCell2
            style={{ backgroundColor: color }}
            value={officials[rowIndex]?.role}
            onConfirm={handleRoleConfirm(rowIndex)}
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