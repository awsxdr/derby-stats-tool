import { ValidityLevel } from "@/validators";
import { Icon, IconName, Intent } from "@blueprintjs/core";

import styles from './ValidityIcon.module.scss';

type ValidityIconProps = {
    validity: ValidityLevel;
}

export const ValidityIcon = ({ validity }: ValidityIconProps) => {

    const [icon, intent]: [IconName, Intent] =
        validity === ValidityLevel.VALID ? ['tick', Intent.SUCCESS]
        : validity === ValidityLevel.INFO ? ['info-sign', Intent.PRIMARY]
        : validity === ValidityLevel.WARNING ? ['warning-sign', Intent.WARNING]
        : ['error', Intent.DANGER];

    return (
        <Icon icon={icon} intent={intent} size={12} className={styles.validityIcon} />
    );
}