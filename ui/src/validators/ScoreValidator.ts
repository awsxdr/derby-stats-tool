import { Period, TeamType, useGameContext } from "@contexts";
import { useCallback, useEffect, useMemo, useState } from "react";
import { OK, Validity, error, getLowestValidityLevel, info, warning } from "@validators";
import { isNumeric, range } from "@/helperMethods";

export type ScoreLineValidities = {
    scorekeeper: Validity,
    jammerRef: Validity,
    lines: ScoreLineValidity[],
}

export type ScoreLineValidity = {
    jam: Validity,
    jammer: Validity,
    lost: Validity,
    lead: Validity,
    call: Validity,
    injury: Validity,
    noInitial: Validity,
    trips: Validity[],
}

export const DEFAULT_SCORE_LINE_VALIDITY = (): ScoreLineValidity => ({
    jam: OK,
    jammer: OK,
    lost: OK,
    lead: OK,
    call: OK,
    injury: OK,
    noInitial: OK,
    trips: range(0, 8).map(() => OK),
});

export const DEFAULT_SCORE_VALIDITY = (): ScoreLineValidities => ({
    scorekeeper: OK,
    jammerRef: OK,
    lines: range(1, 38).map(DEFAULT_SCORE_LINE_VALIDITY)
});


const getScoringTrips = (trips: string[]) => trips.filter(t => t?.trim() !== '');

export const useScoreValidator = (period: Period, team: TeamType) => {
    const { gameState: game } = useGameContext();

    const oppositionTeam = useMemo(() => team == TeamType.HOME ? TeamType.AWAY : TeamType.HOME, [team]);

    const scores = useMemo(() => game.scores[period][team], [game, period, team]);
    const oppositionScores = useMemo(() => game.scores[period][oppositionTeam], [game, period, oppositionTeam]);

    const validateOfficial = useCallback(
        (_officialName: string, _role: string) => {

            // const official = game.officials.find(o => o.name.toLowerCase() === officialName.toLowerCase());

            // if (!official) {
            //     return warning('Official not found in roster');
            // }

            // if (official.role.trim().replace(/\s-/g, '').toLowerCase() !== role.trim().replace(/\s-/g, '').toLowerCase()) {
            //     return warning('Official not listed against expected role');
            // }

            return OK;
        },
        [game]);

    const validateJamNumber = useCallback((lineIndex: number) => {
            const { jam: jamNumber } = scores.lines[lineIndex];
            const { jam: oppositionJamNumber } = oppositionScores.lines[lineIndex];

            if(isNumeric(jamNumber)) {
                const numericJam = parseInt(jamNumber);
                const numericOppositionJam = parseInt(oppositionJamNumber);

                if(numericJam !== numericOppositionJam) {
                    return error(`Jam number does not match value on ${oppositionTeam} sheet`);
                }
            } else {
                const normalizedJam = jamNumber.trim().toLowerCase();
                if(normalizedJam === 'sp' || normalizedJam === 'sp*') {
                    const normalizedOppositionJam = oppositionJamNumber.trim().toLowerCase();
                    if (normalizedOppositionJam !== 'sp' && normalizedOppositionJam !== 'sp*') {
                        return error('Star pass indicator without matching star indicator for opposing team');
                    }
                } else if (normalizedJam !== '') {
                    return error('Jam number contains an invalid value');
                }
            }
            return OK;
        },
        [scores, oppositionScores, oppositionTeam]);
    
    const validateJammerNumber = useCallback((lineIndex: number) => {
            const { jammer: jammerNumber } = scores.lines[lineIndex];
            const roster = game.rosters[team];
            const normalizedJammerNumber = jammerNumber.trim().toLowerCase();

            if (normalizedJammerNumber !== '' && !roster.skaters.find(s => s?.number.trim().toLowerCase() === normalizedJammerNumber)) {
                return error('Skater not found in roster');
            }

            const jamNumber = scores.lines[lineIndex].jam.trim().toLowerCase();

            if (normalizedJammerNumber !== '' && jamNumber === '') {
                return error('Jammer number without corresponding jam number');
            }

            if (normalizedJammerNumber === '' && jamNumber !== '' && jamNumber !== 'sp*') {
                return error('Missing jammer number');
            }

            if (normalizedJammerNumber !== '' && jamNumber === 'sp*') {
                return error('Jammer number listed for SP* line');
            }

            return OK;
        },
        [game, scores, team]);

    const validateLost = useCallback((lineIndex: number) => {

        const { jammer: jammerNumber, lost, lead } = scores.lines[lineIndex];
        const normalizedJammerNumber = jammerNumber.trim().toLowerCase();

        const jammerIndex = game.rosters[team].skaters.findIndex(s => s.number.trim().toLowerCase() === normalizedJammerNumber);

        let jamNumber = scores.lines[lineIndex].jam.trim().toLowerCase();
        if (jamNumber === 'sp') {
            jamNumber = scores.lines[lineIndex - 1]?.jam.trim().toLowerCase();
        }

        if (jammerIndex >= 0) {
            const penalties = game.penalties[period][team].lines[jammerIndex];

            const jamPenalties = penalties?.filter(p => p.jam === jamNumber);

            const lostWithoutPenalty = lost && jamPenalties.length === 0;
            if (lostWithoutPenalty) {
                const nextLineIsStarPass = scores.lines[lineIndex + 1]?.jam.trim().toLowerCase() !== 'sp';
                if (nextLineIsStarPass) {
                    return info('Lost marked without penalty in jam. May be due to actions which don\'t cause a penalty.');
                }
            }

            if (lead && !lost && jamPenalties.length > 0) {
                return warning('Lost not marked despite penalty for jammer. Valid if penalty issued between jams.');
            }
        }

        return OK;

    }, [game, scores, team, period]);
    
    const validateCall = useCallback(
        (lineIndex: number) => {

            const { lost, lead, call } = scores.lines[lineIndex];

            if (call && oppositionScores.lines[lineIndex]?.call) {
                return error('Call marked for both teams');
            }

            if (call && !lead) {
                return warning('Call without lead');
            }

            if (call && lost) {
                return warning('Call when lead lost');
            }

            if (lead && !lost && !call && scores.lines[lineIndex].trips.filter(t => t.trim().length > 0).length < 3) {
                return info('Jam suspiciously short for no call');
            }

            return OK;
        },
        [scores, oppositionScores]);

    const validateNoInitial = useCallback(
        (lineIndex: number) => {

            const { noInitial, trips, jam } = scores.lines[lineIndex];
            const scoringTrips = getScoringTrips(trips);
            const normalizedJam = jam.trim().toLowerCase();

            if (noInitial && scoringTrips.length > 0) {
                return error('No initial marked for jam with scoring trips');
            }

            if (!noInitial && scoringTrips.length === 0 && normalizedJam !== 'sp*' && normalizedJam !== '') {
                return error('No scoring trips in jam but no initial not marked');
            }

            return OK;
        },
        [scores]);
    
    const validateTrip = useCallback(
        (lineIndex: number, tripIndex: number) => {

            const trip = scores.lines[lineIndex].trips[tripIndex];
            const followingTrips = scores.lines[lineIndex].trips.slice(tripIndex + 1);
            const normalizedTrip = trip.trim();

            if (normalizedTrip !== '' && !isNumeric(normalizedTrip)) {
                return error('Invalid character in trip');
            }

            const numericTrip = parseInt(normalizedTrip);

            const tooManyPointsOnFirstScoringTrip = tripIndex === 0 && numericTrip > 8;
            const tooManyPointsOnLaterScoringTrips = tripIndex > 0 && numericTrip > 4;

            if (tooManyPointsOnFirstScoringTrip || tooManyPointsOnLaterScoringTrips || numericTrip < 0) {
                return error('Invalid value for trip');
            }

            const { jam: jamNumber } = scores.lines[lineIndex];
            const lineIsStarPass = jamNumber.trim().toLowerCase() === 'sp';

            const followingTripsWithValues = followingTrips.filter(t => t.trim() !== '');
            const tripWithoutValueAndFollowingTripsWithValue = normalizedTrip === '' && followingTripsWithValues.length > 0;
            if (tripWithoutValueAndFollowingTripsWithValue && !lineIsStarPass) {
                return error('Missing value for trip');
            }
            
            if (lineIsStarPass) {
                const previousLineTrips = scores.lines[lineIndex - 1]?.trips.map(t => t.trim()) ?? range(1, 9).map(() => '');

                const tripWithoutValueAndFollowingTripsWithValueAndPreviousLineBlank = 
                    tripWithoutValueAndFollowingTripsWithValue && previousLineTrips[tripIndex] === '';
                
                if (tripWithoutValueAndFollowingTripsWithValueAndPreviousLineBlank) {
                    return error('Missing value for trip');
                }

                if (trip.trim() !== '' && previousLineTrips[tripIndex] !== '') {
                    return error('Both lines in a star pass contain points');
                }
            }

            return OK;

        }, [scores]);

    const [validity, setValidity] = useState<ScoreLineValidities>(DEFAULT_SCORE_VALIDITY());

    useEffect(() => {
        new Promise((resolve) => {

            setValidity({
                scorekeeper: validateOfficial(scores.scorekeeper, "scorekeeper"),
                jammerRef: validateOfficial(scores.jammerRef, "jammerref"),
                lines: scores.lines.map((line, lineIndex) => ({
                    jam: validateJamNumber(lineIndex),
                    jammer: validateJammerNumber(lineIndex),
                    lost: validateLost(lineIndex),
                    lead: OK,
                    call: validateCall(lineIndex),
                    injury: OK,
                    noInitial: validateNoInitial(lineIndex),
                    trips: line.trips.map((_, tripIndex) => validateTrip(lineIndex, tripIndex)),
                }))
            });

            resolve(0);
        });
    }, [scores, validateOfficial, validateJamNumber, validateJammerNumber, validateLost, validateCall, validateNoInitial, validateTrip]);

    const validityLevel = useMemo(() => getLowestValidityLevel([
        validity.jammerRef.validity,
        validity.scorekeeper.validity,
        ...validity.lines.map(l => getLowestValidityLevel([
            l.call.validity,
            l.injury.validity,
            l.jam.validity,
            l.jammer.validity,
            l.lead.validity,
            l.lost.validity,
            l.noInitial.validity,
            ...l.trips.map(t => t.validity)
        ]))
    ]), [validity]);

    return { validity, validityLevel };
};