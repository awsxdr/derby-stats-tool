import * as React from "react";
import classNames from "classnames";

import {
    type HotkeyConfig,
    HotkeysTarget2,
    type UseHotkeysReturnValue,
} from "@blueprintjs/core";

import * as Classes from '@blueprintjs/table/lib/cjs/common/classes';
import { Draggable } from '@blueprintjs/table/lib/cjs/interactions/draggable';

import { Cell, type CellProps } from "@blueprintjs/table/lib/cjs/cell/cell";

interface ToggleCellProps extends Omit<CellProps, "onKeyDown" | "onKeyUp"> {
    isFocused?: boolean;
    value?: boolean;
    onConfirm?: (value: boolean) => void;
}

interface ToggleCellState {
    value: boolean;
}

export class ToggleCell extends React.Component<ToggleCellProps, ToggleCellState> {
    public static defaultProps = {
        truncated: true,
        wrapText: false,
    };

    private cellRef = React.createRef<HTMLDivElement>();

    private contentsRef = React.createRef<HTMLDivElement>();

    public state: ToggleCellState = {
        value: this.props.value ?? false,
    };

    public componentDidMount() {
        this.checkShouldFocus();
    }

    public componentDidUpdate(previousProps: ToggleCellProps) {
        if(this.props.value !== previousProps.value) {
            this.setState({ value: this.props.value ?? false });
        }
        
        this.checkShouldFocus();
    }

    public render() {
        return <HotkeysTarget2 hotkeys={this.hotkeys} options={{ showDialogKeyCombo: 'invalid' }}>{this.renderCell}</HotkeysTarget2>;
    }

    private renderCell = ({ handleKeyDown, handleKeyUp }: UseHotkeysReturnValue) => {
        const {
            tabIndex = 0,
            truncated,
            wrapText,
            ...spreadableProps
        } = this.props;

        const interactive = spreadableProps.interactive;

        const textClasses = classNames(Classes.TABLE_EDITABLE_TEXT, {
            [Classes.TABLE_TRUNCATED_TEXT]: truncated,
            [Classes.TABLE_NO_WRAP_TEXT]: !wrapText,
        });

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
                    <div className={textClasses} style={{padding: 0}} ref={this.contentsRef}>
                        {this.state.value ? 'X' : ''}
                    </div>
                </Draggable>
            </Cell>
        );
    };

    private checkShouldFocus() {
        if (this.props.isFocused) {
            this.cellRef.current?.focus();
        }
    }

    private handleKeyPress = (e: React.KeyboardEvent) => {
        if (!this.props.isFocused) {
            return;
        }
        e.preventDefault();
        e.bubbles = false;

        this.toggleValue();
    };

    private handleCellActivate = () => {
        return true;
    };

    private handleCellDoubleClick = () => {
        this.toggleValue();
    };

    private toggleValue = () => {
        const newValue = !this.state.value;
        this.setState({ value: newValue });
        this.props.onConfirm && this.props.onConfirm(newValue);
    }

    private hotkeys: HotkeyConfig[] = [
    ];
}