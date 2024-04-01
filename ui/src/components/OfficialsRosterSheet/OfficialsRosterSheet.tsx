import { useCallback, useState } from "react";
import { Alert, Button, CardList, Intent } from "@blueprintjs/core";

import { Official, useGameContext } from "@contexts";
import { Role } from "./Role";

import styles from './OfficialsRosterSheet.module.scss';
import { OfficialItem } from "./OfficialItem";

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
        setRoles(current => [...current.filter(v => v.name.toLowerCase() !== role.toLowerCase()), { name: role }]);
        return role;
    }, [setRoles]);
    
    const deleteOfficial = useCallback(() => {
        setGameState({ ...gameState, officials: [ ...gameState.officials.slice(0, selectedOfficialIndex), ...gameState.officials.slice((selectedOfficialIndex ?? 0) + 1) ]});
        setIsDeleteOfficialWarningOpen(false);
    }, [gameState, setGameState, selectedOfficialIndex]);

    return (
        <>
            <div className={styles.officialsContainer}>
                <CardList bordered>
                    { gameState.officials.map((o, i) => (
                        <OfficialItem 
                            official={o} 
                            roles={roles} 
                            index={i}
                            onDelete={handleDeleteOfficial} 
                            onRoleChange={handleRoleSet}
                            onNameChange={handleNameSet}
                            onLeagueChange={handleLeagueSet}
                            onCertificationLevelChange={handleCertificationLevelSet}
                            onRoleAdded={handleRoleAdded}
                        />
                    )) }
                </CardList>
            </div>
            <Button icon='plus' outlined onClick={addOfficial} />
            <Alert
                cancelButtonText='No'
                confirmButtonText='Yes'
                intent={Intent.DANGER}
                isOpen={isDeleteOfficialWarningOpen}
                onCancel={closeDeleteOfficialWarning}
                onConfirm={deleteOfficial}
            >
                <p>Delete official?</p>
            </Alert>
        </>
    );
}