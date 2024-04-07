import { FileInfo, FileType } from "@/StatsImporter"
import { DialogBody, Spinner } from "@blueprintjs/core";

type VerifyPanelProps = {
    fileInfo?: FileInfo;
}

export const VerifyPanel = ({ fileInfo }: VerifyPanelProps) => {

    return (
        <DialogBody>
            { !fileInfo && <Spinner />}
            { fileInfo && (
            <>
                <p>Found:</p>
                { fileInfo.fileType === FileType.WFTDA_STATSBOOK && <p>WFTDA statsbook v{fileInfo.version}</p> }
                { fileInfo.fileType !== FileType.WFTDA_STATSBOOK && (<>
                    <p>Unknown</p>
                    <p>The file type could not be determined. This file may not be compatible. You may attempt to import anyway but the import may fail.</p>
                </>)}
            </>
            )}
        </DialogBody>
    )
}