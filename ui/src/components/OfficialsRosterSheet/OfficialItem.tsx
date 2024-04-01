import { MouseEventHandler, useCallback } from "react";
import { Button, Card, ControlGroup, FormGroup, InputGroup, MenuItem } from "@blueprintjs/core";
import { ItemPredicate, ItemRendererProps, Suggest } from "@blueprintjs/select";

import { Official } from "@contexts";
import { Role } from "./Role";

import styles from './OfficialsRosterSheet.module.scss';

interface OfficialItemProps {
    index: number,
    roles: Role[],
    official: Official,
    onRoleChange: (role: Role, index: number) => void,
    onNameChange: (name: string, index: number) => void,
    onLeagueChange: (league: string, index: number) => void,
    onCertificationLevelChange: (certificationLevel: string, index: number) => void,
    onRoleAdded: (value: string) => string,
    onDelete: (key: number) => void,
}

export const OfficialItem = ({ roles, official, index, onRoleChange, onNameChange, onLeagueChange, onCertificationLevelChange, onRoleAdded, onDelete }: OfficialItemProps) => {

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
                <FormGroup label="League affiliation" fill>
                    <InputGroup value={official.league} onValueChange={handleLeagueChange} />
                </FormGroup>
                <FormGroup label="Certification level" fill>
                    <InputGroup value={official.certificationLevel} onValueChange={handleCertificationChange} />
                </FormGroup>
            </ControlGroup>
            <Button icon='trash' minimal onClick={handleDelete} />
        </Card>
    )
}