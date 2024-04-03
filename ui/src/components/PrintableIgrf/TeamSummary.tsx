import { useCallback } from 'react';
import classNames from 'classnames';

import { GameState, Period, TeamType } from '@contexts';

import styles from './TeamSummary.module.scss';

interface TeamSummaryProps {
    game: GameState;
    type: TeamType;
}

const getTripValue = (trip: string) =>
    parseInt(trip) || 0;

export const TeamSummary = ({ game, type }: TeamSummaryProps) => {

    const getScoreTotal = useCallback((period: Period) =>
        game.scores[period][type].lines.reduce((p, j) => p + j.trips.reduce((p, t) => p + getTripValue(t), 0), 0),
        [game, type]);

    const getPenaltyTotal = useCallback((period: Period) =>
        game.penalties[period][type].lines.reduce((c, l) => c + (l?.filter(p => p.code?.trim().length === 1).length ?? 0), 0),
        [game, type]);

    return (
        <div className={styles.teamSummary}>
            <div className={classNames(styles.teamHead, styles.dark)}>
                { (type === TeamType.HOME ?  "HOME" : "VISITING") } TEAM
            </div>
            <div className={classNames(styles.fillableLine, styles.row)}>
                <div className={classNames(styles.light, styles.item, styles.box, styles.head)}>Period 1</div>
                <div className={classNames(styles.light, styles.item, styles.box)}>Points</div>
                <div className={classNames(styles.item, styles.box)}>{getScoreTotal(Period.ONE)}</div>
                <div className={classNames(styles.light, styles.item, styles.box)}>Penalties</div>
                <div className={classNames(styles.item, styles.box)}>{getPenaltyTotal(Period.ONE)}</div>
            </div>
            <div className={classNames(styles.fillableLine, styles.row)}>
                <div className={classNames(styles.light, styles.item, styles.box, styles.head)}>Period 2</div>
                <div className={classNames(styles.light, styles.item, styles.box)}>Points</div>
                <div className={classNames(styles.item, styles.box)}>{getScoreTotal(Period.TWO)}</div>
                <div className={classNames(styles.light, styles.item, styles.box)}>Penalties</div>
                <div className={classNames(styles.item, styles.box)}>{getPenaltyTotal(Period.TWO)}</div>
            </div>
            <div className={classNames(styles.fillableLine, styles.row)}>
                <div className={classNames(styles.dark, styles.totals, styles.box, styles.head)}>TOTAL POINTS</div>
                <div className={classNames(styles.dark, styles.item, styles.box)}>{getScoreTotal(Period.ONE) + getScoreTotal(Period.TWO)}</div>
                <div className={classNames(styles.dark, styles.item, styles.box, styles.head)}>PENALTIES</div>
                <div className={classNames(styles.dark, styles.item, styles.box)}>{getPenaltyTotal(Period.ONE) + getPenaltyTotal(Period.TWO)}</div>
            </div>
        </div>
    );
}