import { PropsWithChildren, createContext, useCallback, useContext, useEffect, useState } from "react";
import { getCookie, setCookie } from 'typescript-cookie';
import moment from 'moment';

export enum TeamType {
    HOME = 'home',
    AWAY = 'away',
}

export enum Period {
    ONE = 1,
    TWO = 2,
}

type Skater = {
    number: string,
    name: string,
}

type TeamRoster = {
    league: string,
    team: string,
    color: string,
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
    jamTotal: string,
    gameTotal: string,
}

type ScoreLines = ScoreLine[];

type PeriodScores = { [team in TeamType]: ScoreLines };
type Scores = { [period in Period]: PeriodScores };

export type Penalty = {
    jam: string,
    code: string,
}

export type PenaltyLine = Penalty[];
type PenaltyLines = PenaltyLine[];
type PeriodPenalties = { [team in TeamType]: PenaltyLines };
type Penalties = { [period in Period]: PeriodPenalties };

type LineupItem = {
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

type LineupLines = LineupLine[];
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

interface GameState {
    game: GameDetails,
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
    rosters: {
        home: { league: '', team: '', color: '', skaters: [] },
        away: { league: '', team: '', color: '', skaters: [] },
    },
    scores: {
        1: { home: [], away: [] },
        2: { home: [], away: [] },
    },
    penalties: {
        1: { home: [], away: [] },
        2: { home: [], away: [] },
    },
    lineups: {
        1: { home: [], away: [] },
        2: { home: [], away: [] },
    },
})

interface GameStateContextProps {
    gameState: GameState,
    setGameState: (state: GameState) => void,
}

const GameContext = createContext<GameStateContextProps>({ gameState: DefaultGameState(), setGameState: () => {} });

export const useGameContext = () => useContext(GameContext);

export const GameStateContextProvider = ({ children }: PropsWithChildren) => {
    const [state, setState] = useState(DefaultGameState());

    useEffect(() => {
        const storedGameCookieValue = getCookie("current-game");

        if(storedGameCookieValue) {
            const storedGame: GameState = JSON.parse(storedGameCookieValue);

            setState(storedGame);
        }

    }, [setState])

    const setAndStoreState = useCallback((state: GameState) => {
        setState(state);
        setCookie("current-game", JSON.stringify(state));
    }, [setState]);

    return (
        <GameContext.Provider value={{ gameState: state, setGameState: setAndStoreState }}>
            {children}
        </GameContext.Provider>
    )
}