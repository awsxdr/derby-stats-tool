import * as React from "react";
import classNames from "classnames";

import {
    type HotkeyConfig,
    HotkeysTarget2,
    type UseHotkeysReturnValue,
    EditableTextProps,
    EditableText,
    MenuItem,
} from "@blueprintjs/core";

import * as Classes from '@blueprintjs/table/lib/cjs/common/classes';
import { Draggable } from '@blueprintjs/table/lib/cjs/interactions/draggable';

import { Cell, type CellProps } from "@blueprintjs/table/lib/cjs/cell/cell";
import { deepCompareKeys, shallowCompareKeys } from "@blueprintjs/core/lib/esm/common/utils";
import { ItemRendererProps, Suggest } from "@blueprintjs/select";

interface SuggestEditCellProps<TSuggest> extends Omit<CellProps, "onKeyDown" | "onKeyUp"> {
    isFocused?: boolean;
    value?: TSuggest;
    possibleValues: TSuggest[];
    valuesEqual: (left?: TSuggest, right?: TSuggest) => boolean;
    createNewPossibleValue: (value: string) => TSuggest;
    selectedItem?: TSuggest;
    onConfirm?: (value: TSuggest) => void;
    valueRenderer: (value?: TSuggest) => string;
    editableTextProps?: Omit<EditableTextProps, "elementRef">;
}

interface SuggestEditCellState<TSuggest> {
    isEditing?: boolean;
    value?: TSuggest;
    dirtyValue?: string;
}

export class SuggestEditCell<TSuggest> extends React.Component<SuggestEditCellProps<TSuggest>, SuggestEditCellState<TSuggest>> {
    public static defaultProps = {
        truncated: true,
        wrapText: false,
    };

    private cellRef = React.createRef<HTMLDivElement>();

    private contentsRef = React.createRef<HTMLInputElement>();

    public state: SuggestEditCellState<TSuggest> = {
        isEditing: false,
        value: this.props.value,
    };

    public componentDidMount() {
        this.checkShouldFocus();
    }

    public componentDidUpdate(previousProps: SuggestEditCellProps<TSuggest>) {
        const didPropsChange =
            !shallowCompareKeys(this.props, previousProps, { exclude: ["style"] }) ||
            !deepCompareKeys(this.props, previousProps, ["style"]);
        
        const { value, valueRenderer } = this.props;
        if(didPropsChange && value !== null) {
            this.setState({ value, dirtyValue: valueRenderer(value) });
        }
        
        this.checkShouldFocus();
    }

    public shouldComponentUpdate(nextProps: Readonly<SuggestEditCellProps<TSuggest>>, nextState: Readonly<SuggestEditCellState<TSuggest>>): boolean {
        return (
            !shallowCompareKeys(this.props, nextProps, { exclude: ['style'] })
            || !shallowCompareKeys(this.state, nextState)
            || !deepCompareKeys(this.props, nextProps, ['style']));
    }

    public render() {
        return <HotkeysTarget2 hotkeys={[]}>{this.renderCell}</HotkeysTarget2>;
    }

    private renderItem = (item: TSuggest, props: ItemRendererProps<HTMLLIElement>) =>
        props.modifiers.matchesPredicate && (
            <MenuItem 
                key={1} 
                text={this.props.valueRenderer(item)} 
                roleStructure='listoption' 
                active={props.modifiers.active}
                selected={this.props.valuesEqual(item, this.props.selectedItem)}
                onClick={props.handleClick} 
                onFocus={props.handleFocus} 
                {...props} 
            />
        ) || null;

    private renderCell = ({ handleKeyDown, handleKeyUp }: UseHotkeysReturnValue) => {
        const {
            editableTextProps,
            onConfirm,
            tabIndex = 0,
            truncated,
            wrapText,
            ...spreadableProps
        } = this.props;

        const { isEditing, dirtyValue, value } = this.state;
        const interactive = spreadableProps.interactive || isEditing;

        const cellContents =
            isEditing
            ? (
                <Suggest<TSuggest>
                    className={classNames(Classes.TABLE_EDITABLE_TEXT, Classes.TABLE_EDITABLE_NAME, editableTextProps?.className ?? null)}
                    items={this.props.possibleValues}
                    itemsEqual={this.props.valuesEqual}
                    createNewItemFromQuery={this.props.createNewPossibleValue}
                    query={this.state.dirtyValue}
                    selectedItem={this.props.selectedItem}
                    itemRenderer={this.renderItem}
                    inputProps={{
                        inputRef: this.contentsRef
                    }}
                />
            ) : (
                <div className={classNames(Classes.TABLE_EDITABLE_TEXT, Classes.TABLE_TRUNCATED_TEXT, Classes.TABLE_NO_WRAP_TEXT)} ref={this.contentsRef}>
                    {this?.props?.valueRenderer(this.state.value)}
                </div>
            );

        return (
            <Cell
                {...spreadableProps}
                wrapText={wrapText}
                truncated={false}
                interactive={interactive}
                cellRef={this.cellRef}
                onKeyDown={handleKeyDown}
                onKeyPress={this.handleKeyPress}
                onKeyUp={handleKeyUp}
                tabIndex={tabIndex}
            >
                <Draggable
                    onActivate={this.handleCellActivate}
                    onDoubleClick={this.handleCellDoubleClick}
                    preventDefault={false}
                    stopPropagation={interactive}
                    targetRef={this.contentsRef}
                >
                    {cellContents}
                </Draggable>
            </Cell>
        );
    };

    private checkShouldFocus() {
        if (this.props.isFocused && !this.state.isEditing) {
            this.cellRef.current?.focus();
        }
    }

    private handleKeyPress = (e: React.KeyboardEvent) => {
        console.log('Key press', e);
        if (this.state.isEditing || !this.props.isFocused) {
            return;
        }
        this.setState({ isEditing: true, dirtyValue: '', value: this.state.value });
    };

    private handleEdit = () => {
        this.setState({ isEditing: true, dirtyValue: this.props.valueRenderer(this.state.value) });
    }

    private handleCellActivate = () => {
        return true;
    };

    private handleCellDoubleClick = () => {
        this.handleEdit();
    };
}