import { Period, TeamType, useGameContext } from "@contexts";
import { useCallback, useMemo } from "react";
import { OK, Validity, error, info, warning } from ".";

type ScoreLineValidities = {
    scorekeeper: Validity,
    jammerRef: Validity,
    lines: ScoreLineValidity[],
}

type ScoreLineValidity = {
    jam: Validity,
    jammer: Validity,
    lost: Validity,
    lead: Validity,
    call: Validity,
    injury: Validity,
    noInitial: Validity,
    trips: Validity[],
}

const isNumeric = (value: string) => !isNaN(parseInt(value));
const getScoringTrips = (trips: string[]) => trips.filter(t => t?.trim() !== '');

export const useScoreValidator = (period: Period, team: TeamType) => {
    const { gameState: game } = useGameContext();

    const oppositionTeam = useMemo(() => team == TeamType.HOME ? TeamType.AWAY : TeamType.HOME, [team]);

    const scores = useMemo(() => game.scores[period][team], [game, period, team]);
    const oppositionScores = useMemo(() => game.scores[period][oppositionTeam], [game, period, oppositionTeam]);

    const validateOfficial = useCallback(
        (officialName: string, role: string) => {

            const official = game.officials.find(o => o.name.toLowerCase() === officialName.toLowerCase());

            if (!official) {
                return warning('Official not found in roster');
            }

            if (official.role.trim().replace(/\s-/g, '').toLowerCase() !== role.trim().replace(/\s-/g, '').toLowerCase()) {
                return warning('Official not listed against expected role');
            }

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

            if (!roster.skaters.find(s => s?.number.trim().toLowerCase() === normalizedJammerNumber)) {
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

            if (lead && !call && scores.lines[lineIndex].trips.filter(t => t.trim().length > 0).length < 3) {
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

            if (trip.trim() !== '' && !isNumeric(trip)) {
                return error('Invalid character in trip');
            }
            
            return OK;

        }, [scores]);

    const validity = useMemo<ScoreLineValidities>(() => ({
        scorekeeper: validateOfficial(scores.scorekeeper, "scorekeeper"),
        jammerRef: validateOfficial(scores.jammerRef, "jammerref"),
        lines: scores.lines.map((line, lineIndex) => ({
            jam: validateJamNumber(lineIndex),
            jammer: validateJammerNumber(lineIndex),
            lost: OK,
            lead: OK,
            call: validateCall(lineIndex),
            injury: OK,
            noInitial: validateNoInitial(lineIndex),
            trips: line.trips.map((_, tripIndex) => validateTrip(lineIndex, tripIndex)),
        }))
    }), [scores, validateOfficial, validateJamNumber, validateJammerNumber, validateCall, validateNoInitial, validateTrip]);

    return validity;
};