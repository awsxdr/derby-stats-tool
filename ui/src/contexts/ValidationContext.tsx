import { PropsWithChildren, createContext, useContext, useMemo } from "react";

import { 
    DEFAULT_LINEUP_LINES_VALIDITY,
    DEFAULT_PENALTY_LINES_VALIDITY, 
    DEFAULT_SCORE_VALIDITY, 
    LineupLineValidities, 
    PenaltyLineValidities, 
    ScoreLineValidities, 
    ValidityLevel, 
    getLowestValidityLevel, 
    useLineupValidator, 
    usePenaltyValidator, 
    useScoreValidator 
} from "@validators";
import { Period, TeamType } from "@contexts";

export type PeriodValidity = {
    scoreValidity: { validity: ScoreLineValidities, validityLevel: ValidityLevel },
    penaltyValidity: { validity: PenaltyLineValidities, validityLevel: ValidityLevel },
    lineupValidity: { validity: LineupLineValidities, validityLevel: ValidityLevel },
}

export type TeamValidity = {
    [period in Period]: PeriodValidity
}

export type Validators = {
    [team in TeamType]: TeamValidity
}

const DEFAULT_PERIOD_VALIDITY = (): PeriodValidity => ({
    scoreValidity: { validity: DEFAULT_SCORE_VALIDITY(), validityLevel: ValidityLevel.VALID },
    penaltyValidity: { validity: DEFAULT_PENALTY_LINES_VALIDITY(), validityLevel: ValidityLevel.VALID },
    lineupValidity: { validity: DEFAULT_LINEUP_LINES_VALIDITY(), validityLevel: ValidityLevel.VALID },
});

const DEFAULT_TEAM_VALIDITY = (): TeamValidity => ({
    [1]: DEFAULT_PERIOD_VALIDITY(),
    [2]: DEFAULT_PERIOD_VALIDITY(),
});

const DEFAULT_VALIDITY = (): Validators => ({
    ['home']: DEFAULT_TEAM_VALIDITY(),
    ['away']: DEFAULT_TEAM_VALIDITY(),
});

type PeriodValidityLevels = { [period in Period]: ValidityLevel };
type TeamValidityLevels = { [team in TeamType]: PeriodValidityLevels };

export type SheetValidity = {
    validity: TeamValidityLevels;
    validityLevel: ValidityLevel;
}

type ValidationContextProps = {
    validators: Validators;
    validity: ValidityLevel,
    igrfValidity: ValidityLevel;
    scoreValidity: SheetValidity;
    penaltyValidity: SheetValidity;
    lineupValidity: SheetValidity;    
}

const DEFAULT_SHEET_VALIDITY = (): SheetValidity => ({
    validity: {
        home: { 1: ValidityLevel.VALID, 2: ValidityLevel.VALID },
        away: { 1: ValidityLevel.VALID, 2: ValidityLevel.VALID },
    },
    validityLevel: ValidityLevel.VALID,
});

const ValidationContext = createContext<ValidationContextProps>({ 
    validators: DEFAULT_VALIDITY(),
    validity: ValidityLevel.VALID,
    igrfValidity: ValidityLevel.VALID,
    scoreValidity: DEFAULT_SHEET_VALIDITY(),
    penaltyValidity: DEFAULT_SHEET_VALIDITY(),
    lineupValidity: DEFAULT_SHEET_VALIDITY(),
});


export const useValidation = () => useContext(ValidationContext);

export const ValidationContextProvider = ({ children }: PropsWithChildren) => {

    const validators: Validators = {
        [TeamType.HOME]: {
            [Period.ONE]: {
                scoreValidity: useScoreValidator(Period.ONE, TeamType.HOME),
                penaltyValidity: usePenaltyValidator(Period.ONE, TeamType.HOME),
                lineupValidity: useLineupValidator(Period.ONE, TeamType.HOME),
            },
            [Period.TWO]: {
                scoreValidity: useScoreValidator(Period.TWO, TeamType.HOME),
                penaltyValidity: usePenaltyValidator(Period.TWO, TeamType.HOME),
                lineupValidity: useLineupValidator(Period.TWO, TeamType.HOME),
            }
        },
        [TeamType.AWAY]: {
            [Period.ONE]: {
                scoreValidity: useScoreValidator(Period.ONE, TeamType.AWAY),
                penaltyValidity: usePenaltyValidator(Period.ONE, TeamType.AWAY),
                lineupValidity: useLineupValidator(Period.ONE, TeamType.AWAY),
            },
            [Period.TWO]: {
                scoreValidity: useScoreValidator(Period.TWO, TeamType.AWAY),
                penaltyValidity: usePenaltyValidator(Period.TWO, TeamType.AWAY),
                lineupValidity: useLineupValidator(Period.TWO, TeamType.AWAY),
            },
        },
    };

    const igrfValidity = ValidityLevel.VALID;

    const scoreValidity = useMemo(() => ({
        validity: {
            home: {
                1: validators.home[1].scoreValidity.validityLevel,
                2: validators.home[2].scoreValidity.validityLevel,
            },
            away: {
                1: validators.away[1].scoreValidity.validityLevel,
                2: validators.away[2].scoreValidity.validityLevel,
            }
        },
        validityLevel: getLowestValidityLevel([
            validators.home[1].scoreValidity.validityLevel,
            validators.home[2].scoreValidity.validityLevel,
            validators.away[1].scoreValidity.validityLevel,
            validators.away[2].scoreValidity.validityLevel,
        ]),
    }), [validators.home[1].scoreValidity, validators.home[2].scoreValidity, validators.away[1].scoreValidity, validators.away[2].scoreValidity]);

    const penaltyValidity = useMemo(() => ({
        validity: {
            home: {
                1: validators.home[1].penaltyValidity.validityLevel,
                2: validators.home[2].penaltyValidity.validityLevel,
            },
            away: {
                1: validators.away[1].penaltyValidity.validityLevel,
                2: validators.away[2].penaltyValidity.validityLevel,
            },
        },
        validityLevel: getLowestValidityLevel([
            validators.home[1].penaltyValidity.validityLevel,
            validators.home[2].penaltyValidity.validityLevel,
            validators.away[1].penaltyValidity.validityLevel,
            validators.away[2].penaltyValidity.validityLevel,
        ]),
    }), [validators.home[1].penaltyValidity, validators.home[2].penaltyValidity, validators.away[1].penaltyValidity, validators.away[2].penaltyValidity]);

    const lineupValidity = useMemo(() => ({
        validity: {
            home: {
                1: validators.home[1].lineupValidity.validityLevel,
                2: validators.home[2].lineupValidity.validityLevel,
            },
            away: {
                1: validators.away[1].lineupValidity.validityLevel,
                2: validators.away[2].lineupValidity.validityLevel,
            },
        },
        validityLevel: getLowestValidityLevel([
            validators.home[1].lineupValidity.validityLevel,
            validators.home[2].lineupValidity.validityLevel,
            validators.away[1].lineupValidity.validityLevel,
            validators.away[2].lineupValidity.validityLevel,
        ]),
    }), [validators.home, validators.away]);

    const validity = getLowestValidityLevel([ 
        igrfValidity, 
        scoreValidity.validityLevel, 
        penaltyValidity.validityLevel, 
        lineupValidity.validityLevel 
    ]);

    return (
        <ValidationContext.Provider value={{ validators, validity, igrfValidity, scoreValidity, penaltyValidity, lineupValidity }}>
            { children }
        </ValidationContext.Provider>
    )
}
