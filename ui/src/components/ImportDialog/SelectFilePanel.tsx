import { DialogBody, FileInput, FormGroup } from "@blueprintjs/core"
import { FormEvent, useCallback } from "react";

type SelectedFilePanelProps = {
    selectedFileName?: string;
    onFileSelected: (file?: File) => void;
}

export const SelectFilePanel = ({ selectedFileName, onFileSelected }: SelectedFilePanelProps) => {
    const handleInputChange = useCallback((event: FormEvent<HTMLInputElement>) => {
        const files = event.currentTarget?.files ?? [];
        
        onFileSelected(files[0]);
    }, [onFileSelected]);

    return (
        <DialogBody>
            <FormGroup label="Stats file">
                <FileInput 
                    text={ selectedFileName || "Choose file..."} 
                    inputProps={{ accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }} 
                    onInputChange={handleInputChange}
                    hasSelection={ !!selectedFileName }
                    fill 
                />
            </FormGroup>
        </DialogBody>
    )
}

