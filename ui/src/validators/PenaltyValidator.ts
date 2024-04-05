import { Period, TeamType, useGameContext } from "@contexts";
import { useCallback, useMemo } from "react";
import { OK, Validity, error, warning } from ".";

type PenaltyLineValidities = {
    penaltyTracker: Validity,
    lines: PenaltyLineValidity[],
}

type PenaltyLineValidity = PenaltyValidity[];

type PenaltyValidity = {
    jam: Validity,
    code: Validity,
}

const VALID_CODES: readonly string[] = [ 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'L', 'M', 'N', 'P', 'X' ];

const isNumeric = (value: string) => !isNaN(parseInt(value));

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

        if (jam.trim() === '') {
            return OK;
        }

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

    const validity = useMemo<PenaltyLineValidities>(() => ({
        penaltyTracker: OK,
        lines: penalties.lines?.map((line, lineIndex) =>
            line?.map((_, penaltyIndex) => ({
                jam: validateJamNumber(lineIndex, penaltyIndex),
                code: validatePenaltyCode(lineIndex, penaltyIndex),
            }))),
    }), [penalties, validateJamNumber, validatePenaltyCode]);

    return validity;
};