import { LineupItem, LineupLine, Period, SkaterLineups, SkaterType, TeamType, useGameContext } from "@contexts";
import { useCallback, useEffect, useMemo, useState } from "react";
import { OK, Validity, error, getLowestValidityLevel, info, warning } from "@validators";
import { isNumeric, range } from "@/helperMethods";

export type LineupItemValidity = {
    number: Validity,
    events: Validity[],
};

export type SkaterLineupValidities = { [skater in SkaterType]: LineupItemValidity };

export type LineupLineValidity = {
    skaters: SkaterLineupValidities,
    jamNumber: Validity,
    noPivot: Validity,
};

export type LineupLineValidities = {
    lineupTracker: Validity,
    lines: LineupLineValidity[],
};

const VALID_EVENTS = ['S', '$', '-', '+', '3'];

export const DEFAULT_LINEUP_ITEM_VALIDITY = (): LineupItemValidity => ({
    number: OK,
    events: range(1, 3).map(() => OK),
});

export const DEFAULT_SKATER_LINEUP_VALIDITIES = (): SkaterLineupValidities => ({
    jammer: DEFAULT_LINEUP_ITEM_VALIDITY(),
    pivot: DEFAULT_LINEUP_ITEM_VALIDITY(),
    blocker1: DEFAULT_LINEUP_ITEM_VALIDITY(),
    blocker2: DEFAULT_LINEUP_ITEM_VALIDITY(),
    blocker3: DEFAULT_LINEUP_ITEM_VALIDITY(),
})

export const DEFAULT_LINEUP_LINE_VALIDITY = (): LineupLineValidity => ({
    jamNumber: OK,
    noPivot: OK,
    skaters: DEFAULT_SKATER_LINEUP_VALIDITIES(),
});

export const DEFAULT_LINEUP_LINES_VALIDITY = (): LineupLineValidities => ({
    lineupTracker: OK,
    lines: range(1, 38).map(DEFAULT_LINEUP_LINE_VALIDITY),
});

type SkaterLineupItem = LineupItem & { type: SkaterType };
type AllLineupsLine = LineupLine & { period: Period };
type TimelineItem = SkaterLineupItem & { period: Period, jam: string, lastNumericJam: string, lineIndex: number };

const asArray = (skaters: SkaterLineups): SkaterLineupItem[] => skaters && [
    { type: SkaterType.Jammer, ...skaters.jammer },
    { type: SkaterType.Pivot, ...skaters.pivot },
    { type: SkaterType.Blocker1, ...skaters.blocker1 },
    { type: SkaterType.Blocker2, ...skaters.blocker2 },
    { type: SkaterType.Blocker3, ...skaters.blocker3 },
] || [];


const withPeriod = (period: Period) => (line: LineupLine) => ({ ...line, period });

export const useLineupValidator = (period: Period, team: TeamType) => {
    const { gameState: game } = useGameContext();

    const periodLineups = useMemo(() => game.lineups[period][team], [game, period, team]);
    const allLineups: AllLineupsLine[] = useMemo(() => [
        ...game.lineups[Period.ONE][team].lines.map(withPeriod(Period.ONE)), 
        ...game.lineups[Period.TWO][team].lines.map(withPeriod(Period.TWO)),
    ], [game, team]);
    const scores = useMemo(() => game.scores[period][team], [game, period, team]);
    const allScores = useMemo(() => [
        ...game.scores[Period.ONE][team].lines,
        ...game.scores[Period.TWO][team].lines,
    ], [game, team]);
    const roster = useMemo(() => game.rosters[team].skaters.filter(s => s), [game, team]);

    type TimelineReductionItem = { items: TimelineItem[], lastNumericJam: string };

    const buildEventTimeline = useCallback((skaterNumber: string) => {
        const skaterLineups: TimelineItem[] = 
            allLineups
                .map((l, i) => ({
                    skater: asArray(l.skaters).find(s => s.number.toLowerCase().trim() === skaterNumber),
                    period: l.period,
                    jam: allScores[i].jam?.trim().toLowerCase(),
                    noPivot: l.noPivot,
                    lineIndex: i,
                }))
                .filter(l => l !== undefined && l.jam !== '')
                .map(s => {
                    const { skater, ...x } = s;
                    return { ...skater!, ...x };
                })
                .reduce<TimelineReductionItem>((p, c) => {
                    const lastNumericJam = isNumeric(c.jam) ? c.jam : p.lastNumericJam;

                    return ({
                        items: [ ...p.items, { ...c, lastNumericJam }],
                        lastNumericJam
                    });
                }, { items: [], lastNumericJam: '' })
                .items;
        
        return skaterLineups.flatMap(l => l.events?.map(e => ({ 
            jam: l.jam.trim().toLowerCase(),
            lastNumericJam: l.lastNumericJam.trim().toLowerCase(),
            period: l.period,
            event: e,
            lineIndex: l.lineIndex,
        })) ?? []);
    }, [allLineups, allScores]);

    const timelines = useMemo(() => Object.fromEntries(
        roster.map(s =>  [s.number.trim().toLowerCase(), buildEventTimeline(s.number.trim().toLowerCase())])
    ), [roster, buildEventTimeline]);

    const validateSkaterNumber = useCallback((skaterType: SkaterType, lineIndex: number) => {

        const skater = periodLineups.lines[lineIndex]?.skaters[skaterType];
        const jamNumber = scores.lines[lineIndex]?.jam.toLowerCase().trim();

        const normalizedNumber = skater?.number?.trim() ?? '';

        if (normalizedNumber !== '') {

            if (normalizedNumber === '?') {
                return info('Missing skater number')
            }

            if (roster.find(s => s.number === normalizedNumber) === undefined) {
                return error('Skater not found in roster');
            }

            if (jamNumber === 'sp*') {
                return error('Skater entered on SP* line');
            }

            if (jamNumber === '') {
                return error('Data entered for line without jam number')
            }

            if (asArray(periodLineups.lines[lineIndex].skaters).filter(s => s.number.trim() === normalizedNumber).length > 1) {
                return error('Skater in lineup more than once')
            }
        } else {
            if (jamNumber !== '' && jamNumber !== 'sp*') {
                return error('Missing skater');
            }
        }

        return OK;
    }, [periodLineups, scores, roster]);

    const validateNoPivot = useCallback((lineIndex: number) => {

        const noPivot = periodLineups.lines[lineIndex]?.noPivot ?? false;
        const { jam: jamNumber } = scores.lines[lineIndex];
        const normalizedJamNumber = jamNumber.trim().toLowerCase();

        if (normalizedJamNumber === 'sp*' && noPivot) {
            return error('No pivot checked for SP* line');
        }

        if (normalizedJamNumber === 'sp' && !noPivot) {
            return error('No pivot should be checked for SP line');
        }

        if (normalizedJamNumber === '' && noPivot) {
            return error('Data entered for line without jam number')
        }

        return OK;

    }, [periodLineups, scores]);

    const validateEvent = useCallback((skaterType: SkaterType, lineIndex: number, eventIndex: number) => {

        const event = periodLineups.lines[lineIndex]?.skaters[skaterType]?.events[eventIndex].toUpperCase().trim();

        if (event !== '' && VALID_EVENTS.find(e => e === event) === undefined) {
            return error('Invalid event code used');
        }

        const followingEvents = periodLineups.lines[lineIndex]?.skaters[skaterType]?.events.slice(eventIndex + 1).map(e => e.trim()) ?? [];

        const eventIsEmptyButFollowingEventsAreNot = event === '' && !followingEvents.every(e => e === '');
        if (eventIsEmptyButFollowingEventsAreNot) {
            return error('Event code is empty but following events are not');
        }

        const skaterNumber = periodLineups.lines[lineIndex]?.skaters[skaterType].number.trim().toLowerCase();

        if(skaterNumber !== '') {
            const previousJam = periodLineups.lines.slice(0, lineIndex).reverse().find(l => isNumeric(l.jamNumber));

            const startsInBox = event === '$' || event === 'S';

            if (previousJam) {
                const skaterInPreviousJam = 
                    lineIndex > 0 
                    && !!asArray(previousJam.skaters).find(v => v.number.trim().toLowerCase() === skaterNumber)

                if (startsInBox && !skaterInPreviousJam) {
                    return warning('Skater starting in box despite not being in previous jam. May be a substitution.');
                }
            }

            const lineJamNumber = scores.lines[lineIndex]?.jam.trim().toLowerCase() ?? '';
            const isStarPass = lineJamNumber == 'sp' || lineJamNumber === 'sp*';
            const jamNumber = isStarPass ? scores.lines[lineIndex - 1]?.jam.trim().toLowerCase() ?? '' : lineJamNumber;
            const eventTimeline = timelines[skaterNumber];

            if (eventTimeline) {
                const timelineIndex = eventTimeline.findIndex(e => 
                    e.period === period 
                    && e.lastNumericJam === jamNumber 
                    && e.jam.trim().toLowerCase() === lineJamNumber)
                    + eventIndex;

                if (event === '-') {
                    const followingEvents = eventTimeline.slice(timelineIndex + 1);
                    const exitEventIndex = followingEvents.findIndex(e => e.event !== '');
                    const exitEvent = followingEvents[exitEventIndex];
                    const allLinesLineIndex = period === Period.ONE ? lineIndex : lineIndex + allLineups.length - periodLineups.lines.length;

                    if (exitEvent) {
                        if (exitEvent?.event.trim() === '-') {
                            return error('No box exit found for this entry');
                        }

                        const skaterIsAlwaysOnTrackDuringPenaltySit = 
                            allLineups.slice(allLinesLineIndex, exitEvent.lineIndex + 1)
                            .every(l => 
                                l.jamNumber.trim() === ''
                                || l.jamNumber.trim().toLowerCase() === 'sp*'
                                || asArray(l.skaters).some(s => s.number === skaterNumber));

                        if(!skaterIsAlwaysOnTrackDuringPenaltySit) {
                            return error('Skater not on track before penalty finished being served');
                        }
                    }
                }
            }
        }

        return OK;
    }, [periodLineups, scores, timelines, period]);

    const validateSkater = useCallback((skaterType: SkaterType, lineIndex: number) => ({
        number: validateSkaterNumber(skaterType, lineIndex),
        events: periodLineups.lines[lineIndex]?.skaters[skaterType].events.map((_, eventIndex) => validateEvent(skaterType, lineIndex, eventIndex))
    }), [periodLineups, validateSkaterNumber, validateEvent]);

    const [validity, setValidity] = useState<LineupLineValidities>(DEFAULT_LINEUP_LINES_VALIDITY());

    useEffect(() => {
        new Promise(resolve => {
            setValidity({
                lineupTracker: OK,
                lines: periodLineups.lines?.map((_, lineIndex) => ({
                    jamNumber: OK,
                    noPivot: validateNoPivot(lineIndex),
                    skaters: {
                        jammer: validateSkater(SkaterType.Jammer, lineIndex),
                        pivot: validateSkater(SkaterType.Pivot, lineIndex),
                        blocker1: validateSkater(SkaterType.Blocker1, lineIndex),
                        blocker2: validateSkater(SkaterType.Blocker2, lineIndex),
                        blocker3: validateSkater(SkaterType.Blocker3, lineIndex),
                    },
                }))
            });

            resolve(0);
        });
    }, [periodLineups, validateSkater, validateNoPivot]);

    const validityLevel = useMemo(() => getLowestValidityLevel([
        validity.lineupTracker.validity,
        ...validity.lines.map(l => getLowestValidityLevel([
            l.jamNumber.validity,
            l.noPivot.validity,
            l.skaters.jammer.number.validity,
            ...l.skaters.jammer.events.map(e => e.validity),
            l.skaters.pivot.number.validity,
            ...l.skaters.pivot.events.map(e => e.validity),
            l.skaters.blocker1.number.validity,
            ...l.skaters.blocker1.events.map(e => e.validity),
            l.skaters.blocker2.number.validity,
            ...l.skaters.blocker2.events.map(e => e.validity),
            l.skaters.blocker3.number.validity,
            ...l.skaters.blocker3.events.map(e => e.validity),
        ]))
    ]), [validity]);

    return { validity, validityLevel };
};