import { ValidityLevel } from "@/validators";
import { Button, ButtonProps, IconName, Intent } from "@blueprintjs/core";

interface ValidityButtonProps extends Omit<ButtonProps, "icon" | "intent"> {
    validity: ValidityLevel;
}

export const ValidityButton = ({ validity, ...props }: ValidityButtonProps) => {

    const [icon, intent]: [IconName, Intent] =
        validity === ValidityLevel.VALID ? ['tick', Intent.SUCCESS]
        : validity === ValidityLevel.INFO ? ['info-sign', Intent.PRIMARY]
        : validity === ValidityLevel.WARNING ? ['warning-sign', Intent.WARNING]
        : ['error', Intent.DANGER];

    return (
        <Button icon={icon} intent={intent} {...props} />
    );
}