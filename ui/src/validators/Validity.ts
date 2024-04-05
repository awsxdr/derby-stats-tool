export enum ValidityLevel {
    VALID = 'valid',
    INFO = 'info',
    WARNING = 'warning',
    ERROR = 'error'
}

export type Validity = {
    validity: ValidityLevel;
    message?: string;
}

export const OK = { validity: ValidityLevel.VALID };

export const error = (message: string): Validity => ({ validity: ValidityLevel.ERROR, message });
export const warning = (message: string): Validity => ({ validity: ValidityLevel.WARNING, message });
export const info = (message: string): Validity => ({ validity: ValidityLevel.INFO, message });
