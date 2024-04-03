import { useMemo } from "react";
import classNames from "classnames";

import { DEFAULT_OFFICIAL, Official } from "@contexts";

import styles from './OfficialsList.module.scss';

interface OfficialsListProps {
    officials: Official[];
}

const TARGET_ORDER = [
    "Head Non-Skating Official",
    "Penalty Tracker",
    "Penalty Wrangler",
    "Inside Whiteboard Operator",
    "Jam Timer",
    "Scorekeeper",
    "Scorekeeper",
    "ScoreBoard Operator",
    "Penalty Box Manager",
    "Penalty Box Timer",
    "Penalty Box Timer",
    "Lineup Tracker",
    "Lineup Tracker",
    "Non-Skating Official Alternate",
    "Period Timer",
    "",
    "",
    "",
    "",
    "",
    "Head Referee",
    "Inside Pack Referee",
    "Jammer Referee",
    "Jammer Referee",
    "Outside Pack Referee",
    "Outside Pack Referee",
    "Outside Pack Referee",
    "Referee Alternate"
];

const normalizeRole = (role: string) => role.toLowerCase().replace(' ', '').replace('-', '');

export const OfficialsList = ({ officials }: OfficialsListProps) => {

    const orderedOfficials = useMemo(() => {
        const orderedOfficials: Official[] = [];
        const inputOfficials = Array.from(officials);

        TARGET_ORDER.forEach(target => {
            const normalizedTarget = normalizeRole(target);
            const matchIndex = inputOfficials.findIndex(o => normalizeRole(o.role) === normalizedTarget);

            if (matchIndex >= 0) {
                orderedOfficials.push(inputOfficials[matchIndex]);
                inputOfficials.splice(matchIndex, 1);
            } else {
                orderedOfficials.push({ ...DEFAULT_OFFICIAL(), role: target });
            }
        });

        if (inputOfficials.length > 5) {
            return officials;
        }

        const firstBlankTargetIndex = inputOfficials.findIndex(o => o.role.length === 0);
        for (let i = 0; i < inputOfficials.length; ++i) {
            orderedOfficials[firstBlankTargetIndex + i] = inputOfficials[i];
        }

        return orderedOfficials;
    }, [officials]);

    return (
        <>
            <div className={styles.row}>
                <div className={classNames(styles.dark, styles.head, styles.officialRole)}>Official Role</div>
                <div className={classNames(styles.dark, styles.head, styles.officialName)}>Official Name</div>
                <div className={classNames(styles.dark, styles.head, styles.leagueAffiliation)}>League Affiliation</div>
                <div className={classNames(styles.dark, styles.head, styles.certificationLevel)}>Certification Level</div>
            </div>
            {
                orderedOfficials.map((official, i) => (
                    <div className={classNames(styles.row, i % 2 === 1 ? styles.light : '')}>
                        <div className={classNames(styles.officialRole)}>{official.role}</div>
                        <div className={classNames(styles.officialName)}>{official.name}</div>
                        <div className={classNames(styles.leagueAffiliation)}>{official.league}</div>
                        <div className={classNames(styles.certificationLevel)}>{official.certificationLevel}</div>
                    </div>
                ))
            }
            <div className={classNames(styles.row, styles.dark, styles.footer)}>
                Positions may be left blank, and role names can be changed or added based on actual staffing. Head officials' names must stay in their current place.
            </div>
        </>
    );
};