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

export const getLowestValidityLevel = (validities: ValidityLevel[]) => 
    validities.find(v => v === ValidityLevel.ERROR) ? ValidityLevel.ERROR
    : validities.find(v => v === ValidityLevel.WARNING) ? ValidityLevel.WARNING
    : validities.find(v => v === ValidityLevel.INFO) ? ValidityLevel.INFO
    : ValidityLevel.VALID;
