import { ValidityLevel } from "@/validators"
import { Button, IconName, Intent } from "@blueprintjs/core";
import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router";

export type ValidityLinkItem = {
    message: string;
    validity: ValidityLevel;
    href: string;
}

type ValidityLinkProps = {
    item: ValidityLinkItem;
    onClick: () => void;
}

export const ValidityLink = ({ item: { message, validity, href }, onClick }: ValidityLinkProps) => {

    const navigate = useNavigate();

    const handleClick = useCallback(() => {
        navigate(href);
        onClick();
    }, [navigate, href, onClick]);

    const [icon, intent]: [IconName, Intent] = useMemo(() =>
            validity === ValidityLevel.VALID ? ['tick', Intent.SUCCESS]
            : validity === ValidityLevel.INFO ? ['info-sign', Intent.PRIMARY]
            : validity === ValidityLevel.WARNING ? ['warning-sign', Intent.WARNING]
            : ['error', Intent.DANGER],
        [validity]);

    return (
        <Button minimal icon={icon} intent={intent} alignText="left" onClick={handleClick}>{message}</Button>
    )
}
