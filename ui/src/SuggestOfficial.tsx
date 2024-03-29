import { MenuItem } from "@blueprintjs/core";
import { ItemPredicate, ItemRendererProps, Suggest } from "@blueprintjs/select";
import { MouseEventHandler, useCallback } from "react";

interface SuggestOfficialProps {
    officialNames: string[],
    value: string,
    onChange: (value: string) => void;
    onNameAdded: (name: string) => void;
}

export const SuggestOfficial = ({ officialNames, value, onChange, onNameAdded }: SuggestOfficialProps) => {
    const renderItem = (item: string, props: ItemRendererProps<HTMLLIElement>) =>
        props.modifiers.matchesPredicate && (
            <MenuItem key={item} text={item} roleStructure='listoption' onClick={props.handleClick} onFocus={props.handleFocus} {...props} />
        ) || null;


    const filterNames: ItemPredicate<string> = (query, name, _, exactMatch) => {
        if (exactMatch) {
            return query.toLowerCase() === name.toLowerCase();
        } else {
            return name.toLowerCase().indexOf(query.toLowerCase()) >= 0;
        }
    }

    const handleItemSelect = useCallback((name: string) => {
        onChange(name);
    }, [onChange]);

    const renderCreateButton = useCallback((query: string, active: boolean, handleClick: MouseEventHandler<HTMLAnchorElement>) => {

        const handleAddName = (event: React.MouseEvent<HTMLAnchorElement>) => {
            onNameAdded(query);
            handleClick(event);
        };

        return (
            <MenuItem 
                icon='add' 
                text={`Create "${query}"`} 
                roleStructure='listoption' 
                active={active} 
                onClick={handleAddName} 
                shouldDismissPopover={false} />
        )
    }, [onNameAdded]);

    return (
        <Suggest<string> 
            items={officialNames}
            itemsEqual={(l, r) => l.toLowerCase() === r.toLowerCase()}
            itemPredicate={filterNames}
            itemRenderer={renderItem} 
            inputValueRenderer={s => s}
            createNewItemFromQuery={s => s}
            createNewItemRenderer={renderCreateButton}
            fill 
            noResults={<MenuItem disabled text='No results.' roleStructure='listoption' />}
            onItemSelect={handleItemSelect}
            query={value}
            selectedItem={officialNames.find(n => n === value)}
            inputProps={{
                placeholder: ''
            }}
        />
    );
}
