import { Period, SkaterLineups, TeamType, useGameContext } from "@contexts";
import { useCallback, useEffect, useMemo, useState } from "react";
import { OK, Validity, error, getLowestValidityLevel, warning } from ".";
import { range } from "@/rangeMethods";

export type PenaltyLineValidities = {
    penaltyTracker: Validity,
    lines: PenaltyLineValidity[],
}

export type PenaltyLineValidity = PenaltyValidity[];

export type PenaltyValidity = {
    jam: Validity,
    code: Validity,
}

const VALID_CODES: readonly string[] = [ 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'L', 'M', 'N', 'P', 'X' ];

export const DEFAULT_PENALTY_VALIDITY = (): PenaltyValidity => ({
    code: OK,
    jam: OK,
});

export const DEFAULT_PENALTY_LINE_VALIDITY = (): PenaltyLineValidity =>
    range(1, 10).map(DEFAULT_PENALTY_VALIDITY);

export const DEFAULT_PENALTY_LINES_VALIDITY = (): PenaltyLineValidities => ({
    penaltyTracker: OK,
    lines: range(0, 18).map(DEFAULT_PENALTY_LINE_VALIDITY),
});

const isNumeric = (value: string) => !isNaN(parseInt(value));

const getSkaters = (line: SkaterLineups) => [
    line.jammer,
    line.pivot,
    line.blocker1,
    line.blocker2,
    line.blocker3,
];

export const usePenaltyValidator = (period: Period, team: TeamType) => {
    const { gameState: game } = useGameContext();

    const penalties = useMemo(() => game.penalties[period][team], [game, period, team]);
    const jams = useMemo(() => [...new Set([
        ...game.scores[period][TeamType.HOME].lines?.map(l => l?.jam).filter(isNumeric) ?? [],
        ...game.scores[period][TeamType.AWAY].lines?.map(l => l?.jam).filter(isNumeric) ?? [],
        ...game.lineups[period][TeamType.HOME].lines?.map(l => l?.jamNumber).filter(isNumeric) ?? [],
        ...game.lineups[period][TeamType.AWAY].lines?.map(l => l?.jamNumber).filter(isNumeric) ?? [],
        ])]
        .map(j => parseInt(j))
        .filter(j => !isNaN(j)),
        [game, period]);

    const validateJamNumber = useCallback((lineIndex: number, penaltyIndex: number) => {

        const line = penalties.lines[lineIndex];
        const { code, jam } = line[penaltyIndex];

        if (jam.trim() === '' && code.trim().length > 0) {
            return error('Jam number missing for penalty');
        }

        if (jam.trim() !== '') {
            if (jam.trim() === '?') {
                return warning('Jam number missing');
            }

            if (!isNumeric(jam)) {
                return error('Unexpected character in jam number box');
            }

            const jamNumber = parseInt(jam);

            if (jams.find(v => v === jamNumber) === undefined) {
                return error('Jam number not found in game');
            }

            const jamLineup = getSkaters(game.lineups[period][team].lines[jamNumber - 1].skaters).map(s => s.number);
            const skaterNumber = game.rosters[team].skaters[lineIndex]?.number.toLowerCase().trim() ?? '';

            const skaterIsInLineup = skaterNumber != '' && jamLineup.filter(n => n.toLowerCase().trim() === skaterNumber).length > 0;

            if (!skaterIsInLineup) {
                return error('Penalty for skater not in jam lineup');
            }
        }

        return OK;
    }, [penalties, jams]);

    const validatePenaltyCode = useCallback((lineIndex: number, penaltyIndex: number) => {

        const line = penalties.lines[lineIndex];
        const { code, jam } = line[penaltyIndex];

        const normalizedCode = code?.trim().toUpperCase() ?? '';

        if (normalizedCode === '' && jam.trim().length > 0) {
            return error('Penalty code missing for penalty');
        }

        if (normalizedCode === '') {
            return OK;
        }

        if (normalizedCode === '?') {
            return warning('Penalty code missing');
        }

        if (isNumeric(normalizedCode)) {
            return warning('Number in penalty code box. Swapped code and jam number?');
        }

        if (normalizedCode === 'FO' && penaltyIndex === 9) {
            return OK;
        }

        if (VALID_CODES.find(c => c === normalizedCode) === undefined) {
            return warning('Unexpected penalty code');
        }

        return OK;

    }, [penalties]);

    const [validity, setValidity] = useState<PenaltyLineValidities>(DEFAULT_PENALTY_LINES_VALIDITY());
    
    useEffect(() => {
        new Promise(resolve => {
            setValidity({
                penaltyTracker: OK,
                lines: penalties.lines?.map((line, lineIndex) =>
                    line?.map((_, penaltyIndex) => ({
                        jam: validateJamNumber(lineIndex, penaltyIndex),
                        code: validatePenaltyCode(lineIndex, penaltyIndex),
                    }))),
            });

            resolve(0);
        });
    }, [penalties, validateJamNumber, validatePenaltyCode]);

    const validityLevel = useMemo(() => getLowestValidityLevel([
        validity.penaltyTracker.validity,
        ...validity.lines.map(l => getLowestValidityLevel([
            ...l.map(p => getLowestValidityLevel([p.code.validity, p.jam.validity]))
        ])),
    ]), [validity]);

    return { validity, validityLevel };
};