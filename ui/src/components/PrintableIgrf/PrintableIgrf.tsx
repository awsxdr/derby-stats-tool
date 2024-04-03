import { GameState, TeamType } from '@contexts';
import classNames from 'classnames';

import styles from './PrintableIgrf.module.scss';
import { TeamDetails } from './TeamDetails';
import { TeamSummary } from './TeamSummary';
import { Signature } from './Signature';
import { OfficialsList } from './OfficialsList';

interface PrintableIgrfProps {
    game: GameState
}

export const PrintableIgrf = ({ game }: PrintableIgrfProps) => {

    return (
        <>
            <div className={styles.igrf}>
                <div className={styles.header}>Interleague Game Reporting Form (IGRF)</div>
                <div className={styles.sectionHeader}>Section 1. VENUE &amp; ROSTERS (Complete BEFORE the game)</div>
                <div className={styles.row}>
                    <div className={classNames(styles.box, styles.dark, styles.columnHead, styles.head)}>Location:</div>
                    <div className={styles.venueBox}>
                        <div className={classNames(styles.box, styles.fillableLine)}>{game.game.venue}</div>
                        <div className={classNames(styles.box, styles.light, styles.line, styles.head)}>VENUE NAME</div>
                    </div>
                    <div className={styles.cityBox}>
                        <div className={classNames(styles.box, styles.fillableLine)}>{game.game.city}</div>
                        <div className={classNames(styles.box, styles.light, styles.line, styles.head)}>CITY</div>
                    </div>
                    <div className={styles.state}>
                        <div className={classNames(styles.box, styles.fillableLine)}>{game.game.state}</div>
                        <div className={classNames(styles.box, styles.light, styles.line, styles.head)}>ST/PRV</div>
                    </div>
                    <div className={styles.gameNumber}>
                        <div className={classNames(styles.box, styles.fillableLine)}>{game.game.gameNumber}</div>
                        <div className={classNames(styles.box, styles.light, styles.line, styles.head)}>GAME #</div>
                    </div>
                </div>
                <div className={styles.row}>
                    <div className={classNames(styles.box, styles.dark, styles.columnHead, styles.head)}>Tournament/ Multi-Day Event:</div>
                    <div className={styles.tournament}>
                        <div className={classNames(styles.box, styles.fillableLine)}>{game.game.tournament}</div>
                        <div className={classNames(styles.box, styles.light, styles.line, styles.head)}>TOURNAMENT/MULTI-DAY EVENT NAME</div>
                    </div>
                    <div className={styles.hostLeague}>
                        <div className={classNames(styles.box, styles.fillableLine)}>{game.game.hostLeague}</div>
                        <div className={classNames(styles.box, styles.light, styles.line, styles.head)}>HOST LEAGUE NAME</div>
                    </div>
                </div>
                <div className={classNames(styles.row, styles.fillableLine)}>
                    <div className={classNames(styles.box, styles.dark, styles.columnHead, styles.head)}>Date:</div>
                    <div className={classNames(styles.box, styles.date)}>{game.game.date}</div>
                    <div className={classNames(styles.box, styles.dark, styles.columnHead, styles.head)}>Start Time:</div>
                    <div className={classNames(styles.box, styles.startTime)}>{game.game.time}</div>
                    <div className={classNames(styles.box, styles.dark, styles.columnHead, styles.suspensionHead, styles.head)}>Suspension:</div>
                    <div className={classNames(styles.box, styles.suspension)}>YES | NO</div>
                </div>
                <div className={styles.rosterHeader}>TEAM ROSTERS - List in order of Skater number</div>
                <div className={styles.teamsContainer}>
                    <TeamDetails team={game.rosters.home} type={TeamType.HOME} />
                    <TeamDetails team={game.rosters.away} type={TeamType.AWAY} />
                </div>
                <div className={styles.sectionHeader}>Section 2. SCORE &amp; PENALTIES (Complete DURING or IMMEDIATELY AFTER game)</div>
                <div className={styles.teamSummaryContainer}>
                    <TeamSummary game={game} type={TeamType.HOME} />
                    <TeamSummary game={game} type={TeamType.AWAY} />
                </div>
                <div className={classNames(styles.row, styles.fillableLine)}>
                    <div className={classNames(styles.adjustmentRequired, styles.box)}>
                        The Official Score in this game required adjustment:
                    </div>
                    <div className={classNames(styles.box, styles.adjustmentRequiredValue)}></div>
                    <div className={classNames(styles.adjustmentReason, styles.box)}>
                        Reason for OS adjustment:
                    </div>
                    <div className={classNames(styles.box, styles.adjustmentReasonValue)}></div>
                </div>
                <div className={classNames(styles.row, styles.fillableLine)}>
                    <div className={classNames(styles.box, styles.dark, styles.expulsionNotes)}>Expulsion/Suspension notes:</div>
                    <div className={classNames(styles.box, styles.light, styles.suspensionServedBy)}>Suspension was served by:</div>
                    <div className={classNames(styles.box, styles.suspensionServedByValue)}></div>
                </div>
                <div className={classNames(styles.row, styles.expulsionLine)}>
                    <div className={styles.expulsionHead}>Expulsion:</div>
                    <div className={styles.expulsionSuspensionContainer}>
                        <div className={classNames(styles.dark, styles.columnHead)}>Suspension:</div>
                        <div className={classNames(styles.columnHead)}>YES | NO</div>
                    </div>
                </div>
                <div className={classNames(styles.row, styles.expulsionLine)}>
                    <div className={styles.expulsionHead}>Expulsion:</div>
                    <div className={styles.expulsionSuspensionContainer}>
                        <div className={classNames(styles.dark, styles.columnHead)}>Suspension:</div>
                        <div className={classNames(styles.columnHead)}>YES | NO</div>
                    </div>
                </div>
                <div className={classNames(styles.row, styles.expulsionLine)}>
                    <div className={styles.expulsionHead}>Expulsion:</div>
                    <div className={styles.expulsionSuspensionContainer}>
                        <div className={classNames(styles.dark, styles.columnHead)}>Suspension:</div>
                        <div className={classNames(styles.columnHead)}>YES | NO</div>
                    </div>
                </div>
                <div className={styles.sectionHeader}>Section 3. VERIFICATION (Complete IMMEDIATELY AFTER game)</div>
                <div>
                    <Signature title='Home Team Captain' skateName={game.rosters.home.captainSkateName} legalName={game.rosters.home.captainLegalName} />
                    <Signature title='Visiting Team Captain' skateName={game.rosters.away.captainSkateName} legalName={game.rosters.away.captainLegalName} />
                </div>
                <div>
                    <Signature title='Head Referee' skateName={game.officials.find(o => o.role === 'Head Referee')?.name ?? ''} legalName='' />
                    <Signature title='Head NSO' skateName={game.officials.find(o => o.role === 'Head Non-Skating Official')?.name ?? ''} legalName='' />
                </div>
            </div>
            <div className={styles.igrf}>
                <div className={styles.sectionHeader}>Section 4. ROSTER OF NON-SKATING OFFICIALS/STAT TRACKERS/SKATING OFFICIALS</div>
                <OfficialsList officials={game.officials} />
           </div>
       </>
    );
}