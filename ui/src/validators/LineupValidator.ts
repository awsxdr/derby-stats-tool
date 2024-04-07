import { Period, SkaterType, TeamType, useGameContext } from "@contexts";
import { useCallback, useEffect, useMemo, useState } from "react";
import { OK, Validity, error, getLowestValidityLevel } from ".";
import { range } from "@/rangeMethods";

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

export const useLineupValidator = (period: Period, team: TeamType) => {
    const { gameState: game } = useGameContext();

    const lineups = useMemo(() => game.lineups[period][team], [game, period, team]);
    const scores = useMemo(() => game.scores[period][team], [game, period, team]);
    const roster = useMemo(() => game.rosters[team].skaters.filter(s => s), [game, team]);

    const validateSkaterNumber = useCallback((skaterType: SkaterType, lineIndex: number) => {

        const skater = lineups.lines[lineIndex]?.skaters[skaterType];
        const jamNumber = scores.lines[lineIndex]?.jam.toLowerCase().trim();

        const normalizedNumber = skater?.number?.trim() ?? '';

        if (normalizedNumber !== '' && roster.find(s => s.number === normalizedNumber) === undefined) {
            return error('Skater not found in roster');
        }

        if (normalizedNumber !== '' && jamNumber === 'sp*') {
            return error('Skater entered on SP* line');
        }

        if (normalizedNumber !== '' && jamNumber === '') {
            return error('Data entered for line without jam number')
        }

        return OK;
    }, [lineups, scores, roster]);

    const validateNoPivot = useCallback((lineIndex: number) => {

        const noPivot = lineups.lines[lineIndex]?.noPivot ?? false;
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

    }, [lineups, scores]);

    const validateEvent = useCallback((skaterType: SkaterType, lineIndex: number, eventIndex: number) => {

        const event = lineups.lines[lineIndex]?.skaters[skaterType]?.events[eventIndex].trim();

        if (event !== '' && VALID_EVENTS.find(e => e === event) === undefined) {
            return error('Invalid event code used');
        }

        return OK;
    }, [lineups]);

    const validateSkater = useCallback((skaterType: SkaterType, lineIndex: number) => ({
        number: validateSkaterNumber(skaterType, lineIndex),
        events: lineups.lines[lineIndex]?.skaters[skaterType].events.map((_, eventIndex) => validateEvent(skaterType, lineIndex, eventIndex))
    }), [lineups, validateSkaterNumber, validateEvent]);

    const [validity, setValidity] = useState<LineupLineValidities>(DEFAULT_LINEUP_LINES_VALIDITY());

    useEffect(() => {
        new Promise(resolve => {
            setValidity({
                lineupTracker: OK,
                lines: lineups.lines?.map((_, lineIndex) => ({
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
    }, [lineups, validateSkater, validateNoPivot]);

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
    ]), []);

    return { validity, validityLevel };
};