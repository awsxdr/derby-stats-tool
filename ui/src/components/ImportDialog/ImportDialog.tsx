import { DialogStep, DialogStepId, Intent, MultistepDialog } from "@blueprintjs/core";
import { SelectFilePanel } from "./SelectFilePanel";
import { useCallback, useState, useMemo, useEffect } from "react";
import { VerifyPanel } from "./VerifyPanel";
import { FileInfo, useImporter } from "@/StatsImporter";
import { ConfirmPanel } from "./ConfirmPanel";

interface ImportDialogProps {
    isOpen: boolean;
    onClose?: () => void;
}

export const ImportDialog = ({ isOpen, onClose }: ImportDialogProps) => {

    const [selectedFileName, setSelectedFileName] = useState<string>();
    const [selectedFile, setSelectedFile] = useState<File>();
    const [isBackButtonEnabled, setIsBackButtonEnabled] = useState(true);
    const [isNextButtonEnabled, setIsNextButtonEnabled] = useState(false);
    const [fileInfo, setFileInfo] = useState<FileInfo>();
    const [currentStepId, setCurrentStepId] = useState<DialogStepId>('selectFile');
    const [isImporting, setIsImporting] = useState(false);

    const { isLoading: isFileLoading, getFileInfo, importData } = useImporter(selectedFile);

    const isLoading = useMemo(() => isFileLoading && currentStepId === 'verify', [isFileLoading, currentStepId]);

    useEffect(() => {
        
        if (isFileLoading) return;

        setFileInfo(getFileInfo());

    }, [isFileLoading, getFileInfo]);

    const handleFileSelected = useCallback((file?: File) => {

        setSelectedFile(file);
        setSelectedFileName(file?.name);
        setIsNextButtonEnabled(!!file);

    }, [setSelectedFile, setSelectedFileName, setIsBackButtonEnabled]);

    const handleDialogChange = useCallback((newDialogStepId: DialogStepId) => 
        setCurrentStepId(newDialogStepId)
    , [setCurrentStepId]);

    const handleImport = useCallback(async () => {
        setIsImporting(true);
        await importData();

        handleClose();
    }, [importData]);

    const handleClose = useCallback(() => {
        setSelectedFileName(undefined);
        setSelectedFile(undefined);
        setIsBackButtonEnabled(true);
        setIsBackButtonEnabled(false);
        setFileInfo(undefined);
        setCurrentStepId('selectFile');
        setIsImporting(false);

        onClose && onClose();
    }, [setSelectedFileName, setSelectedFile, setIsBackButtonEnabled, setIsBackButtonEnabled, setFileInfo, setCurrentStepId, setIsImporting, onClose]);

    return (
        <>
            <MultistepDialog 
                icon='folder-open' 
                title='Import stats'
                navigationPosition={'top'}
                isOpen={isOpen}
                onChange={handleDialogChange}
                canEscapeKeyClose={!isImporting}
                canOutsideClickClose={!isImporting}
                backButtonProps={{ disabled: !isBackButtonEnabled || isImporting }}
                nextButtonProps={{ loading: isLoading, disabled: !isNextButtonEnabled }}
                finalButtonProps={{ intent: Intent.DANGER, text: 'Erase & import', onClick: handleImport, loading: isImporting }}
                onClose={handleClose}
            >
                <DialogStep
                    id='selectFile'
                    panel={<SelectFilePanel selectedFileName={selectedFileName} onFileSelected={handleFileSelected} />}
                    title='Select file'
                />
                <DialogStep
                    id='verify'
                    panel={<VerifyPanel fileInfo={fileInfo} />}
                    title='Verify data'
                />
                <DialogStep
                    id='confirm'
                    panel={<ConfirmPanel />}
                    title='Confirm'
                />
            </MultistepDialog>
        </>
    );
}