import { Alert, Button, Card, CardList, ControlGroup, FormGroup, InputGroup, Intent, MenuItem } from "@blueprintjs/core";
import { ItemPredicate, ItemRendererProps, Suggest } from "@blueprintjs/select";
import { MouseEventHandler, useCallback, useState } from "react";
import { Official, useGameContext } from "./GameStateContext";
import styles from './OfficialsRosterSheet.module.css';

type Role = {
    name: string,
    initials?: string,
}

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

interface OfficialItemProps {
    index: number,
    roles: Role[],
    official: Official,
    onRoleChange: (role: Role, index: number) => void,
    onNameChange: (name: string, index: number) => void,
    onRoleAdded: (value: string) => string,
    onDelete: (key: number) => void,
}

const OfficialItem = ({ roles, official, index, onRoleChange, onNameChange, onRoleAdded, onDelete }: OfficialItemProps) => {

    const handleDelete = useCallback(() => {
        onDelete(index);
    }, [index, onDelete])

    const renderItem = (item: Role, props: ItemRendererProps<HTMLLIElement>) =>
        props.modifiers.matchesPredicate && (
            <MenuItem key={item.name} text={item.name} roleStructure='listoption' onClick={props.handleClick} onFocus={props.handleFocus} {...props} />
        ) || null;

    const filterRoles: ItemPredicate<Role> = (query, role, _, exactMatch) => {
        if (exactMatch) {
            return query.toLowerCase() === role.name.toLowerCase()
                || query.toLowerCase() === role.initials?.toLocaleLowerCase();
        } else {
            return role.name.toLowerCase().indexOf(query.toLowerCase()) >= 0
                || (role.initials?.toLowerCase().indexOf(query.toLowerCase()) ?? -1) >= 0;
        }
    }

    const handleItemSelect = useCallback((role: Role) => {
        onRoleChange(role, index);
    }, [onRoleChange, index]);

    const handleNameChange = useCallback((name: string) => {
        onNameChange(name, index);
    }, [onNameChange, index]);

    const renderCreateButton = useCallback((query: string, active: boolean, handleClick: MouseEventHandler<HTMLAnchorElement>) => {

        const handleAddRole = (event: React.MouseEvent<HTMLAnchorElement>) => {
            onRoleAdded(query);
            handleClick(event);
        };

        return (
            <MenuItem 
                icon='add' 
                text={`Create "${query}"`} 
                roleStructure='listoption' 
                active={active} 
                onClick={handleAddRole} 
                shouldDismissPopover={false} />
        )
    }, [onRoleAdded]);

    return (
        <Card key={index}>
            <ControlGroup className={styles.officialItem} fill>
                <FormGroup label="Role" fill>
                    <Suggest<Role> 
                        items={roles}
                        itemsEqual={(l, r) => l.name.toLowerCase() === r.name.toLowerCase()}
                        itemPredicate={filterRoles}
                        itemRenderer={renderItem} 
                        inputValueRenderer={s => s.name}
                        createNewItemFromQuery={s => ({ name: s })}
                        createNewItemRenderer={renderCreateButton}
                        fill 
                        noResults={<MenuItem disabled text='No results.' roleStructure='listoption' />}
                        onItemSelect={handleItemSelect}
                        query={official.role}
                        selectedItem={roles.find(r => r.name === official.role)}
                    />
                </FormGroup>
                <FormGroup label="Name" fill>
                    <InputGroup value={official.name} onValueChange={handleNameChange} />
                </FormGroup>
                <Button icon='trash' minimal onClick={handleDelete} />
            </ControlGroup>
        </Card>
    )
}

export const OfficialsRosterSheet = () => {

    const [roles, setRoles] = useState<Role[]>(DEFAULT_ROLES);
    const [isDeleteOfficialWarningOpen, setIsDeleteOfficialWarningOpen] = useState(false);
    const [selectedOfficialIndex, setSelectedOfficialIndex] = useState<number>();

    const { gameState, setGameState } = useGameContext();

    const addOfficial = useCallback(() => {
        setGameState({ ...gameState, officials: [...gameState.officials, { role: '', name: '' }]})
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