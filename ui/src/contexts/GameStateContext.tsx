import { PropsWithChildren, createContext, useCallback, useContext, useEffect, useState } from "react";
import moment from 'moment';
import { useApiContext } from "@/Api";
import { AppToaster } from "@components";
import { Intent } from "@blueprintjs/core";

export enum TeamType {
    HOME = 'home',
    AWAY = 'away',
}

export enum Period {
    ONE = 1,
    TWO = 2,
}

export type Skater = {
    number: string,
    name: string,
}

export type TeamRoster = {
    league: string,
    team: string,
    color: string,
    captainSkateName: string,
    captainLegalName: string,
    skaters: Skater[],
};

type Rosters = { [team in TeamType]: TeamRoster };

export type ScoreLine = {
    jam: string,
    jammer: string,
    lost: boolean,
    lead: boolean,
    call: boolean,
    injury: boolean,
    noInitial: boolean,
    trips: string[],
}

export type ScoreLines = {
    scorekeeper: string,
    jammerRef: string,
    lines: ScoreLine[],
}

const DEFAULT_SCORE_LINES = (): ScoreLines => ({
    scorekeeper: '',
    jammerRef: '',
    lines: [],
});

type PeriodScores = { [team in TeamType]: ScoreLines };
type Scores = { [period in Period]: PeriodScores };

export type Penalty = {
    jam: string,
    code: string,
}

export type PenaltyLine = Penalty[];

type PenaltyLines = {
    penaltyTracker: string,
    lines: PenaltyLine[],
};

const DEFAULT_PENALTY_LINES = (): PenaltyLines => ({
    penaltyTracker: '',
    lines: [],
});

type PeriodPenalties = { [team in TeamType]: PenaltyLines };
type Penalties = { [period in Period]: PeriodPenalties };

export type LineupItem = {
    number: string,
    events: string[],
};

export enum SkaterType {
    Jammer = 'jammer',
    Pivot = 'pivot',
    Blocker1 = 'blocker1',
    Blocker2 = 'blocker2',
    Blocker3 = 'blocker3',
}

type SkaterLineups = { [skater in SkaterType]: LineupItem };

export type LineupLine = {
    skaters: SkaterLineups,
    jamNumber: string,
    noPivot: boolean,
};

type LineupLines = {
    lineupTracker: string,
    lines: LineupLine[],
};

const DEFAULT_LINEUP_LINES = (): LineupLines => ({
    lineupTracker: '',
    lines: [],
});

type PeriodLineups = { [team in TeamType]: LineupLines };
type Lineups = { [period in Period]: PeriodLineups };

export type GameDetails = {
    venue: string,
    city: string,
    state: string,
    gameNumber: string,
    tournament: string,
    hostLeague: string,
    date: string,
    time: string,
}

export type Official = {
    role: string,
    name: string,
    league: string,
    certificationLevel: string,
}

export const DEFAULT_OFFICIAL = (): Official => ({
    role: '',
    name: '',
    league: '',
    certificationLevel: '',
});

type Officials = Official[];

export interface GameState {
    game: GameDetails,
    officials: Officials,
    rosters: Rosters,
    scores: Scores,
    penalties: Penalties,
    lineups: Lineups,
}

export const DefaultGameState = (): GameState => ({
    game: { 
        venue: '', 
        city: '', 
        state: '', 
        gameNumber: '', 
        tournament: '', 
        hostLeague: '', 
        date: moment(Date.now()).format("YYYY-MM-DD"), 
        time: moment(Date.now()).format("HH:mm"), 
    },
    officials: [],
    rosters: {
        home: { league: '', team: '', color: '', captainSkateName: '', captainLegalName: '', skaters: [] },
        away: { league: '', team: '', color: '', captainSkateName: '', captainLegalName: '', skaters: [] },
    },
    scores: {
        1: { home: DEFAULT_SCORE_LINES(), away: DEFAULT_SCORE_LINES() },
        2: { home: DEFAULT_SCORE_LINES(), away: DEFAULT_SCORE_LINES() },
    },
    penalties: {
        1: { home: DEFAULT_PENALTY_LINES(), away: DEFAULT_PENALTY_LINES() },
        2: { home: DEFAULT_PENALTY_LINES(), away: DEFAULT_PENALTY_LINES() },
    },
    lineups: {
        1: { home: DEFAULT_LINEUP_LINES(), away: DEFAULT_LINEUP_LINES() },
        2: { home: DEFAULT_LINEUP_LINES(), away: DEFAULT_LINEUP_LINES() },
    },
})

interface GameStateContextProps {
    gameState: GameState,
    isLoading: boolean,
    isDirty: boolean,
    isFaulted: boolean,
    retryUpload: () => void,
    setGameState: (state: GameState) => void,
}

const GameContext = createContext<GameStateContextProps>({ 
    gameState: DefaultGameState(),
    isLoading: true,
    isDirty: false,
    isFaulted: false,
    retryUpload: () => {},
    setGameState: () => {},
 });

export const useGameContext = () => useContext(GameContext);

export const GameStateContextProvider = ({ children }: PropsWithChildren) => {
    const [state, setState] = useState(DefaultGameState());
    const [isLoading, setIsLoading] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [isFaulted, setIsFaulted] = useState(false);
    const { api } = useApiContext();

    useEffect(() => {
        setIsLoading(true);
        api?.getDocument().then(({ game, isDefault }) => {
            setState(game);
            setIsLoading(false);
            setIsDirty(isDefault);
            setIsFaulted(false);
        })
        .catch(() => {
            setState(DefaultGameState());
            setIsLoading(false);
            setIsDirty(true);
            setIsFaulted(true);
        });
    }, [setState, setIsLoading, setIsDirty, api]);

    useEffect(() => {
        const timeout = setTimeout(() => {
            if (isDirty && !isFaulted) {
                console.log("Writing");
                api?.setDocument(state)
                    .then(() => {
                        setIsDirty(false);
                    })
                    .catch(() => {
                        setIsFaulted(true);
                        AppToaster.then(t => t.show({ message: 'Error uploading changes', intent: Intent.DANGER }));
                    });
            }
        }, 1500);

        return () => clearTimeout(timeout);
    }, [isDirty, setIsDirty, isFaulted, setIsFaulted, api, state]);

    const retryUpload = useCallback(() => {
        setIsFaulted(false);
    }, [setIsFaulted]);

    const setAndStoreState = useCallback((state: GameState) => {
        setState(state);
        setIsDirty(true);
    }, [setState, setIsDirty]);

    return (
        <GameContext.Provider value={{ gameState: state, setGameState: setAndStoreState, isLoading, isDirty, isFaulted, retryUpload }}>
            {children}
        </GameContext.Provider>
    )
}