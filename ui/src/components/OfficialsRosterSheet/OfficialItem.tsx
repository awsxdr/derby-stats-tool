import { KeyboardEvent, MouseEventHandler, useCallback, useRef, useState } from "react";
import { Button, Card, ControlGroup, FormGroup, InputGroup, MenuItem } from "@blueprintjs/core";
import { ItemPredicate, ItemRendererProps, Suggest } from "@blueprintjs/select";

import { Official } from "@contexts";
import { Role } from "./Role";

import styles from './OfficialsRosterSheet.module.scss';

interface OfficialItemProps {
    index: number;
    roles: Role[];
    official: Official;
    onRoleChange: (role: Role, index: number) => void;
    onNameChange: (name: string, index: number) => void;
    onLeagueChange: (league: string, index: number) => void;
    onCertificationLevelChange: (certificationLevel: string, index: number) => void;
    onRoleAdded: (value: string) => string;
    onDelete: (key: number) => void;
    onAddNewItem: () => void;
}

export const OfficialItem = ({ 
        roles, 
        official, 
        index, 
        onRoleChange,
        onNameChange, 
        onLeagueChange, 
        onCertificationLevelChange, 
        onRoleAdded, 
        onDelete,
        onAddNewItem,
    }: OfficialItemProps) => {

    const [selectedItemName, setSelectedItemName] = useState(roles[0].name);
    const nameInputRef = useRef<HTMLInputElement>(null);

    const handleDelete = useCallback(() => {
        onDelete(index);
    }, [index, onDelete])

    const renderItem = useCallback((item: Role, props: ItemRendererProps<HTMLLIElement>) =>
        props.modifiers.matchesPredicate && (
            <MenuItem 
                key={item.name} 
                text={item.name} 
                roleStructure='listoption' 
                active={props.modifiers.active}
                selected={item.name === selectedItemName}
                onClick={props.handleClick} 
                onFocus={props.handleFocus} 
                {...props} 
            />
        ) || null, 
        [selectedItemName]);

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
        setSelectedItemName(role.name);
        onRoleChange(role, index);
        nameInputRef.current?.focus();
    }, [onRoleChange, index]);

    const handleNameChange = useCallback((name: string) => {
        onNameChange(name, index);
    }, [onNameChange, index]);

    const handleLeagueChange = useCallback((league: string) => {
        onLeagueChange(league, index);
    }, [onLeagueChange, index]);

    const handleCertificationChange = useCallback((certificationLevel: string) => {
        onCertificationLevelChange(certificationLevel, index);
    }, [onCertificationLevelChange, index]);

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
                shouldDismissPopover={false}
            />
        )
    }, [onRoleAdded]);

    const handleInputKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
        if(e.code === 'Enter' && !e.altKey && !e.ctrlKey && !e.shiftKey) {
            onAddNewItem();
        }
    }

    return (
        <Card key={index}>
            <ControlGroup className={styles.officialItem} fill>
                <FormGroup label="Role" fill>
                    <Suggest<Role> 
                        items={roles}
                        itemsEqual={(l, r) => l.name.toLowerCase() === r.name.toLowerCase()}
                        itemPredicate={filterRoles}
                        itemRenderer={renderItem}
                        inputProps={{ autoFocus: true }}
                        inputValueRenderer={s => s.name}
                        createNewItemFromQuery={s => ({ name: s })}
                        createNewItemRenderer={renderCreateButton}
                        fill 
                        noResults={<MenuItem disabled text='No results.' roleStructure='listoption' />}
                        onItemSelect={handleItemSelect}
                        query={official.role}
                        selectedItem={roles.find(r => r.name === official.role)}
                        popoverProps={{ matchTargetWidth: true, minimal: true }}
                    />
                </FormGroup>
                <FormGroup label="Name" fill>
                    <InputGroup value={official.name} onValueChange={handleNameChange} onKeyDown={handleInputKeyPress} inputRef={nameInputRef} />
                </FormGroup>
                <FormGroup label="League affiliation" fill>
                    <InputGroup value={official.league} onValueChange={handleLeagueChange} onKeyDown={handleInputKeyPress} />
                </FormGroup>
                <FormGroup label="Certification level" fill>
                    <InputGroup value={official.certificationLevel} onValueChange={handleCertificationChange} onKeyDown={handleInputKeyPress} />
                </FormGroup>
            </ControlGroup>
            <Button icon='trash' minimal onClick={handleDelete} />
        </Card>
)
}