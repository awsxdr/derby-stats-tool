import { DialogBody, Icon } from "@blueprintjs/core";

import styles from './ConfirmPanel.module.scss';

export const ConfirmPanel = () => {
    return (
        <DialogBody>
            <p className={styles.warningIcon}>
                <Icon intent="danger" icon='error' size={32} />
            </p>
            <p>Importing will erase your current data.</p>
            <p>Please make sure you have exported any needed data before continuing.</p>
        </DialogBody>
    );
}