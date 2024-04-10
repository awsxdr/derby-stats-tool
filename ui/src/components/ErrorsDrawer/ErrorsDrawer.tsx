import { Period, PeriodValidity, TeamType, TeamValidity, Validators, useValidation } from "@contexts";
import { LineupItemValidity, LineupLineValidities, PenaltyLineValidities, ScoreLineValidities, Validity, ValidityLevel } from "@validators";
import { Drawer } from "@blueprintjs/core";
import { useMemo } from "react";
import { ValidityLink, ValidityLinkItem } from "./ValidityLink";

import styles from './ErrorsDrawer.module.scss';

type ErrorsDrawer = {
    isOpen: boolean;
    onClose: () => void;
}


const getValidityLink = (sheet: string, period: Period, team: TeamType, validity: Validity): ValidityLinkItem => ({
    message: validity.message ?? '',
    validity: validity.validity,
    href: `/edit/${sheet}/p${period}${team}`,
});    

const getScoreValidities = (period: Period, team: TeamType, validity: ScoreLineValidities) => [
    getValidityLink('score', period, team, validity.jammerRef),
    getValidityLink('score', period, team, validity.scorekeeper),
    ...validity.lines.flatMap(l => [
        getValidityLink('score', period, team, l.jam),
        getValidityLink('score', period, team, l.jammer),
        getValidityLink('score', period, team, l.lost),
        getValidityLink('score', period, team, l.lead),
        getValidityLink('score', period, team, l.call),
        getValidityLink('score', period, team, l.injury),
        getValidityLink('score', period, team, l.noInitial),
        ...l.trips.map(t => getValidityLink('score', period, team, t))
    ]),
]

const getPenaltyValidities = (period: Period, team: TeamType, validity: PenaltyLineValidities) => [
    getValidityLink('penalties', period, team, validity.penaltyTracker),
    ...validity.lines.flatMap(l => l.flatMap(p => [
        getValidityLink('penalties', period, team, p.code),
        getValidityLink('penalties', period, team, p.jam),
    ])),
]

const getSkaterValidityLinks = (period: Period, team: TeamType, skater: LineupItemValidity) => [
    getValidityLink('lineup', period, team, skater.number),
    ...skater.events.map(e => getValidityLink('lineup', period, team, e))
];

const getLineupValidities = (period: Period, team: TeamType, validity: LineupLineValidities) => [
    getValidityLink('lineups', period, team, validity.lineupTracker),
    ...validity.lines.flatMap(l => [
        getValidityLink('lineup', period, team, l.jamNumber),
        getValidityLink('lineup', period, team, l.noPivot),
        ...getSkaterValidityLinks(period, team, l.skaters.jammer),
        ...getSkaterValidityLinks(period, team, l.skaters.pivot),
        ...getSkaterValidityLinks(period, team, l.skaters.blocker1),
        ...getSkaterValidityLinks(period, team, l.skaters.blocker2),
        ...getSkaterValidityLinks(period, team, l.skaters.blocker3),
    ])
]

const getPeriodValidities = (period:Period, team: TeamType, validity: PeriodValidity) => [
    ...getScoreValidities(period, team, validity.scoreValidity.validity),
    ...getPenaltyValidities(period, team, validity.penaltyValidity.validity),
    ...getLineupValidities(period, team, validity.lineupValidity.validity),
];

const getTeamValidities = (team: TeamType, validity: TeamValidity) => [
    ...getPeriodValidities(Period.ONE, team, validity[Period.ONE]),
    ...getPeriodValidities(Period.TWO, team, validity[Period.TWO]),
];

const getValidities = (validity: Validators) => [
    ...getTeamValidities(TeamType.HOME, validity.home),
    ...getTeamValidities(TeamType.AWAY, validity.away),
];


export const ErrorsDrawer = ({ isOpen, onClose }: ErrorsDrawer) => {

    const { validity, validators } = useValidation();

    const validities = useMemo(() => getValidities(validators), [validators]);
    const errors = useMemo(() => validities.filter(v => v.validity === ValidityLevel.ERROR), [validities]);
    const warnings = useMemo(() => validities.filter(v => v.validity === ValidityLevel.WARNING), [validities]);
    const info = useMemo(() => validities.filter(v => v.validity === ValidityLevel.INFO), [validities]);

    const icon =
        validity === ValidityLevel.VALID ? 'tick'
        : validity === ValidityLevel.INFO ? 'info-sign'
        : validity === ValidityLevel.WARNING ? 'warning-sign'
        : 'error';

    return (
        <Drawer isOpen={isOpen} icon={icon} onClose={onClose} title='Validation' className={styles.responsiveDrawer}>
            <div className={styles.errorsDrawerBody}>
                { errors.map(w => <ValidityLink item={w} onClick={onClose} />) }
                { warnings.map(w => <ValidityLink item={w} onClick={onClose} />) }
                { info.map(w => <ValidityLink item={w} onClick={onClose} />) }
                { errors.length === 0 && warnings.length === 0 && info.length === 0 && <div className={styles.noIssuesText}>No issues found</div> }
            </div>
        </Drawer>
    );
}