import { useCallback, useState } from "react";
import { ColumnProps, Region, RenderMode, Table2 } from "@blueprintjs/table";
import { range } from "@/rangeMethods";
import { HotkeyConfig, HotkeysTarget2 } from "@blueprintjs/core";

interface StatsTableProps {
    children?: React.ReactElement<ColumnProps> | Array<React.ReactElement<ColumnProps>>;
    rowCount: number;
    columnWidths: number[];
    cellRendererDependencies?: React.DependencyList;
    getCellData: (row: number, column: number) => string;
    setCellData: (row: number, column: number, value: string) => void;
    deleteCellData: (row: number, column: number) => void;
    onBatchOperationCompleted: () => void;
}

export const StatsTable = ({ children, rowCount, columnWidths, deleteCellData, cellRendererDependencies, getCellData, setCellData, onBatchOperationCompleted }: StatsTableProps) => {
    const [ selectedRange, setSelectedRange ] = useState<Region[]>([]);
    const [ cellRenderCount, setCellRenderCount ] = useState(0);

    const rerenderTable = useCallback(() => setCellRenderCount(c => c + 1), [setCellRenderCount]);

    const handlePaste = useCallback(async () => {

        if(selectedRange.length !== 1) return;

        const clipboardText = await navigator.clipboard.readText();

        if(!clipboardText) return;

        if(selectedRange[0].cols === undefined || selectedRange[0].cols === null) return;
        if(selectedRange[0].rows === undefined || selectedRange[0].rows === null) return;

        const pastedData = clipboardText.split(/\r?\n/).map(l => l.split('\t'));

        const selectedColumn = selectedRange[0].cols[0];
        const selectedRow = selectedRange[0].rows[0];

        const pastedDataWidth = Math.max(...pastedData.map(r => r.length));

        for (let row = selectedRow; row < Math.min(selectedRow + pastedData.length, rowCount); ++row) {
            for (let column = selectedColumn; column < Math.min(selectedColumn + pastedDataWidth, columnWidths.length); ++column) {
                setCellData(row, column, pastedData[row - selectedRow][column - selectedColumn]);
            }
        }

        onBatchOperationCompleted();
        rerenderTable();

    }, [columnWidths, rowCount, selectedRange, setCellData, onBatchOperationCompleted, rerenderTable]);

    const handleDelete = useCallback(() => {
        if(selectedRange.length !== 1) return;

        if(selectedRange[0].cols === undefined || selectedRange[0].cols === null || selectedRange[0].cols.length !== 2) return;
        if(selectedRange[0].rows === undefined || selectedRange[0].rows === null || selectedRange[0].rows.length !== 2) return;

        for (let row = selectedRange[0].rows[0]; row <= selectedRange[0].rows[1]; ++row) {
            for (let column = selectedRange[0].cols[0]; column <= selectedRange[0].cols[1]; ++column) {
                deleteCellData(row, column);
            }
        }

        onBatchOperationCompleted();
        rerenderTable();

    }, [selectedRange, deleteCellData, onBatchOperationCompleted, rerenderTable]);

    const handleCut = useCallback(() => {
        if(selectedRange.length !== 1) return;
        if(selectedRange[0].cols === undefined || selectedRange[0].cols === null || selectedRange[0].cols.length !== 2) return;
        if(selectedRange[0].rows === undefined || selectedRange[0].rows === null || selectedRange[0].rows.length !== 2) return;

        const cutData = range(selectedRange[0].rows[0], selectedRange[0].rows[1])
            .map(row => range(selectedRange[0].cols![0], selectedRange[0].cols![1])
                .map(column =>
                    getCellData(row, column)
                ).join('\t')
            ).join('\n');

        navigator.clipboard.writeText(cutData);

        handleDelete();
    }, [selectedRange, getCellData, handleDelete]);

    const handleSelect = useCallback((regions: Region[]) => setSelectedRange(regions), [setSelectedRange]);

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

    return (
        <HotkeysTarget2 hotkeys={hotkeys}>
            <Table2 
                numRows={rowCount} 
                enableRowResizing={false} 
                enableColumnResizing={false}
                enableRowHeader={false} 
                enableColumnHeader={true}
                enableFocusedCell={true}
                enableGhostCells={false}
                columnWidths={columnWidths}
                renderMode={RenderMode.NONE}
                getCellClipboardData={getCellData}
                selectedRegions={selectedRange}
                onSelection={handleSelect}
                cellRendererDependencies={(cellRendererDependencies ?? []).concat([cellRenderCount])}
            >
                { children }
            </Table2>
        </HotkeysTarget2>
    );
}