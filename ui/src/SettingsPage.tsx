import { Alignment, AnchorButton, Button, ControlGroup, FileInput, FormGroup, Icon, Intent, Navbar, Section, SectionCard } from "@blueprintjs/core";
import sharedStyles from './Shared.module.css';
import styles from './SettingsPage.module.css';
import { useUserInfoContext } from "./UserInfoContext";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { Base64 } from "js-base64";
import { useApiContext } from "./Api";

export const SettingsPage = () => {
    const { user } = useUserInfoContext();
    const { api } = useApiContext();

    const [selectedFileName, setSelectedFileName] = useState<string>();
    const [selectedFile, setSelectedFile] = useState<File>();
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        setSelectedFileName((user?.blankStatsbooks.length ?? 0) && user?.blankStatsbooks[0]?.filename || '');
    }, [user, setSelectedFileName])

    const handleInputChange = useCallback((event: FormEvent<HTMLInputElement>) => {
        const validFiles = Array.from(event.currentTarget?.files ?? []).filter(file => file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        if(validFiles.length > 0) {
            setSelectedFileName(validFiles[0].name);
            setSelectedFile(validFiles[0]);
        } else {
            setSelectedFileName(undefined);
        }
    }, [setSelectedFileName, setSelectedFile]);

    const readFile = (file: Blob) => new Promise<ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader();

        reader.addEventListener('load', () => {
            resolve(reader.result as ArrayBuffer ?? new ArrayBuffer(0));
        });
        reader.addEventListener('error', reject);

        reader.readAsArrayBuffer(file);
    });

    const uploadBlankStatsBook = useCallback(async () => {
        if(!selectedFile) return;

        const readData = new Uint8Array(await readFile(selectedFile));

        if (readData.length === 0) return;

        const base64Data = Base64.fromUint8Array(readData);

        setIsUploading(true);
        await api?.uploadBlankStatsBook(selectedFile.name, base64Data);
        setIsUploading(false);

        setSelectedFile(undefined);

    }, [selectedFile, setSelectedFile, setIsUploading, api]);

    return (
        <>
            <Navbar fixedToTop>
                <Navbar.Group align={Alignment.LEFT} className={sharedStyles.logo}>
                    <Navbar.Heading>DerbyStats</Navbar.Heading>
                    <Navbar.Divider />
                </Navbar.Group>
                <Navbar.Group align={Alignment.RIGHT}>
                    <AnchorButton intent={Intent.PRIMARY} href='/edit'>Close</AnchorButton>
                </Navbar.Group>
            </Navbar>
            <Section title="Settings" className={styles.settingsBox}>
                <SectionCard>
                    <FormGroup
                        label="Blank stats book"
                        helperText={<span>Provide a blank stats book to be filled in. <a href='https://community.wftda.org/resources/document-libraries/competition-documents#statsbook' target='_blank'>Available from WFTDA <Icon icon='share' /></a></span>}
                    >
                        <ControlGroup className={styles.reactiveControlGroup}>
                            <FileInput 
                                text={ selectedFileName || "Choose file..."} 
                                inputProps={{ accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }} 
                                onInputChange={handleInputChange}
                                hasSelection={ !!selectedFileName }
                                fill 
                            />
                            <Button 
                                intent={Intent.PRIMARY} 
                                disabled={!selectedFile} 
                                loading={isUploading}
                                onClick={uploadBlankStatsBook}
                            >
                                Upload
                            </Button>
                        </ControlGroup>
                    </FormGroup>
                </SectionCard>
            </Section>
        </>
    );
}