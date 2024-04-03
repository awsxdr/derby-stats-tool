import { GameState, Period, TeamType } from "@contexts";

import { ScoreSheet } from "./ScoreSheet";
import { useCallback, useMemo } from "react";

interface PrintableScoreProps {
    game: GameState;
}


const getTripValue = (trip: string) =>
    parseInt(trip) || 0;

export const PrintableScore = ({ game }: PrintableScoreProps) => {

    const getTeamFirstPeriodTotal = useCallback((team: TeamType) =>
        game.scores[Period.ONE][team].lines.filter(l => l.jam.trim() !== '').length > 0
        ? game.scores[Period.ONE][team].lines.reduce((p, j) => p + j.trips.reduce((p, t) => p + getTripValue(t), 0), 0)
        : undefined
    , [game]);

    const teamFirstPeriodTotals = useMemo(() => ({
        home: getTeamFirstPeriodTotal(TeamType.HOME),
        away: getTeamFirstPeriodTotal(TeamType.AWAY),
    }), [getTeamFirstPeriodTotal]);

    return (
        <>
            <ScoreSheet game={game} period={Period.ONE} team={TeamType.HOME} previousPeriodTotal={0} />
            <ScoreSheet game={game} period={Period.TWO} team={TeamType.HOME} previousPeriodTotal={teamFirstPeriodTotals[TeamType.HOME]} />
            <ScoreSheet game={game} period={Period.ONE} team={TeamType.AWAY} previousPeriodTotal={0} />
            <ScoreSheet game={game} period={Period.TWO} team={TeamType.AWAY} previousPeriodTotal={teamFirstPeriodTotals[TeamType.AWAY]} />
        </>
    );
}