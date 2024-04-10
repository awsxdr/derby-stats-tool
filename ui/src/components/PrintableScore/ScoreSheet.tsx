import { GameState, Period, ScoreLine, TeamType } from '@contexts';

import styles from './ScoreSheet.module.scss';
import classNames from 'classnames';
import { ScoreRow } from './ScoreRow';
import { range } from '@/helperMethods';
import { useCallback, useMemo } from 'react';

interface ScoreSheetProps {
    game: GameState;
    period: Period;
    team: TeamType;
    previousPeriodTotal?: number;
}

const DEFAULT_SCORE_LINE = (): ScoreLine => ({
    jam: '',
    jammer: '',
    lost: false,
    lead: false,
    call: false,
    injury: false,
    noInitial: false,
    trips: [],
});

type ScoreLineInfo = {
    line: ScoreLine,
    jamTotal: number;
    gameTotal: number;
}

const getTripValue = (trip: string) =>
    parseInt(trip) || 0;

export const ScoreSheet = ({ game, period, team, previousPeriodTotal }: ScoreSheetProps) => {

    const scoreRows = useMemo(() =>range(0, 37).map(i => (
            game.scores[period][team].lines.length > i ? game.scores[period][team].lines[i] : DEFAULT_SCORE_LINE()
        )).map(line => ({
            line,
            jamTotal: line.trips.map(getTripValue).reduce((p, c) => p + c, 0),
        })).reduce((items: ScoreLineInfo[], { line, jamTotal }) => ([
            ...items,
            {
                line,
                jamTotal,
                gameTotal: jamTotal + (items.length > 0 ? items[items.length - 1].gameTotal : (previousPeriodTotal ?? 0)),
            }
        ]), []), [game, period, team, previousPeriodTotal]);

    const showTotals = useMemo(() => !!game.scores[period][team].lines.filter(l => !!parseInt(l.jam)).length, [game, period, team]);

    const getTripColumnTotal = useCallback((trip: number) =>
        game.scores[period][team].lines.filter(l => !isNaN(parseInt(l.trips[trip]))).length > 0
        ? game.scores[period][team].lines.reduce((c, l) => c + getTripValue(l.trips[trip]), 0).toString()
        : '', 
        [game, period, team]);

    const periodTotal = useMemo(
        () => game.scores[period][team].lines.reduce((p, j) => p + j.trips.reduce((p, t) => p + getTripValue(t), 0), 0),
        [game, period, team]);

    return (
        <div className={styles.scoreSheet} key={`${team}_${period}`}>
            <div className={classNames(styles.row, styles.header)}>
                <div className={classNames(styles.teamName, styles.light)}>
                    {( team === TeamType.HOME ? 'Home Team' : 'Away Team' )}
                </div>
                <div className={classNames(styles.color)}>
                    <div className={classNames(styles.fillableHeader)}>{ game.rosters[team].color }</div>
                    <div className={classNames(styles.headerTitle)}>Color</div>
                </div>
                <div className={classNames(styles.date, styles.light)}>
                    <div className={classNames(styles.fillableHeader)}>{ game.game.date }</div>
                    <div className={classNames(styles.headerTitle)}>Date</div>
                </div>
                <div className={classNames(styles.keeper)}>
                    <div className={classNames(styles.fillableHeader)}>{ game.scores[period][team].scorekeeper }</div>
                    <div className={classNames(styles.headerTitle)}>Scorekeeper</div>
                </div>
                <div className={classNames(styles.ref, styles.light)}>
                    <div className={classNames(styles.fillableHeader)}>{ game.scores[period][team].jammerRef }</div>
                    <div className={classNames(styles.headerTitle)}>Jammer Ref</div>
                </div>
                <div className={classNames(styles.periodNumber)}>{period}</div>
            </div>
            <div className={classNames(styles.row, styles.columnHeader)}>
                <div className={styles.jamNumber}>JAM</div>
                <div className={styles.jammerNumber}>Jammer's Number</div>
                <div className={styles.lost}>LOST</div>
                <div className={styles.lead}>LEAD</div>
                <div className={styles.call}>CALL</div>
                <div className={styles.injury}>INJ.</div>
                <div className={styles.noInitial}>N.I.</div>
                { range(2, 10).map(t => (<div className={styles.trip}>Trip {t}</div>)) }
                <div className={styles.jamTotal}>Jam Total</div>
                {
                    period === Period.ONE
                    ? <div className={styles.gameTotal}>Game Total</div>
                    : <div className={styles.previousPeriodTotal}>{previousPeriodTotal}</div>
                }
            </div>
            {
                scoreRows.map((r, i) => (
                    <ScoreRow rowIndex={i} scores={r.line} jamTotal={r.jamTotal} gameTotal={r.gameTotal} />
                ))
            }
            <div className={classNames(styles.row, styles.totals)}>
                <div className={styles.jamNumber}>{showTotals && game.scores[period][team].lines.filter(l => !!parseInt(l.jam)).length}</div>
                <div className={styles.jammerNumber}>PERIOD TOTALS</div>
                <div className={styles.lost}>{showTotals && game.scores[period][team].lines.filter(l => l.lost).length}</div>
                <div className={styles.lead}>{showTotals && game.scores[period][team].lines.filter(l => l.lead).length}</div>
                <div className={styles.call}>{showTotals && game.scores[period][team].lines.filter(l => l.call).length}</div>
                <div className={styles.injury}>{showTotals && game.scores[period][team].lines.filter(l => l.injury).length}</div>
                <div className={styles.noInitial}>{showTotals && game.scores[period][team].lines.filter(l => l.noInitial).length}</div>
                { range(0, 8).map(t => (<div className={styles.trip}>{showTotals && getTripColumnTotal(t).toString()}</div>)) }
                <div className={styles.jamTotal}>{showTotals && periodTotal.toString()}</div>
                <div className={styles.gameTotal}>{showTotals && (periodTotal + (previousPeriodTotal ?? 0)).toString()}</div>
            </div>
        </div>
    );
}
