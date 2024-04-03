import { Skater, TeamRoster, TeamType } from "@contexts"
import classNames from 'classnames';

import styles from './TeamDetails.module.scss';
import { range } from "@/rangeMethods";

interface RosterRowProps {
    skater: Skater;
    row: number;
}

const RosterRow = ({ skater, row }: RosterRowProps) => (
    <div className={classNames(styles.fillableLine, styles.row)} key={row}>
        <div className={classNames(styles.box, styles.light, styles.rowNumber, styles.columnHead, styles.head)}>{row + 1}</div>
        <div className={classNames(styles.box, styles.skaterNumber)}>{ skater?.number }</div>
        <div className={classNames(styles.box, styles.skaterName)}>{ skater?.name }</div>
    </div>
);

interface TeamDetailsProps {
    team: TeamRoster,
    type: TeamType,
}

const DEFAULT_SKATER = (): Skater => ({
    name: '',
    number: '',
});

export const TeamDetails = ({ team, type }: TeamDetailsProps) => (
    <div className={styles.team}>
        <div className={classNames(styles.teamHead, styles.dark)}>
            { (type === TeamType.HOME ?  "HOME" : "VISITING") } TEAM
        </div>
        <div className={classNames(styles.fillableLine, styles.row)}>
            <div className={classNames(styles.box, styles.light, styles.columnHead, styles.head)}>LEAGUE</div>
            <div className={classNames(styles.box, styles.teamLeague)}>{team.league}</div>
        </div>
        <div className={classNames(styles.fillableLine, styles.row)}>
            <div className={classNames(styles.box, styles.light, styles.columnHead, styles.head)}>TEAM</div>
            <div className={classNames(styles.box, styles.teamLeague)}>{team.team}</div>
        </div>
        <div className={classNames(styles.fillableLine, styles.row)}>
            <div className={classNames(styles.box, styles.light, styles.columnHead, styles.head)}>COLOR</div>
            <div className={classNames(styles.box, styles.teamLeague)}>{team.color}</div>
        </div>
        <div className={classNames(styles.fillableLine, styles.row)}>
            <div className={classNames(styles.box, styles.dark, styles.columnHead, styles.head)}># of players</div>
            <div className={classNames(styles.box, styles.dark, styles.columnHead, styles.head)}>Skater #</div>
            <div className={classNames(styles.box, styles.dark, styles.columnHead, styles.skaterNameHead, styles.head)}>Skater Name</div>
        </div>
        {
            range(0, 19).map(i => team.skaters.length > i ? team.skaters[i] : DEFAULT_SKATER()).map((s, i) => <RosterRow skater={s} row={i} />)
        }
    </div>
);

