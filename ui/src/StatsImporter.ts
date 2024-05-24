import { useCallback, useEffect, useState } from "react";
import * as ExcelJS from 'exceljs';
import { GameState, LineupItem, useGameContext } from "./contexts";
import { AppToaster } from "./components";
import { Intent } from "@blueprintjs/core";
import { range } from "./helperMethods";
import moment from "moment";

export enum FileType {
    UNKNOWN = 'unknown',
    WFTDA_STATSBOOK = 'wftda-stats',
    CRG_JSON = 'crg-json',
}

export type FileInfo = {
    fileType: FileType;
    version?: string;
}

const readFile = (file: Blob) => new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();

    reader.addEventListener('load', () => {
        resolve(reader.result as ArrayBuffer);
    });
    reader.addEventListener('error', reject);
    
    reader.readAsArrayBuffer(file);
});

export const useImporter = (file?: File) => {
    const [isLoading, setIsLoading] = useState(true);
    const [workbook, setWorkbook] = useState<ExcelJS.Workbook>();
    const [fileType, setFileType] = useState(FileType.UNKNOWN);
    const { setGameState } = useGameContext();

    useEffect(() => {
        setIsLoading(true);

        const loadWorkbook = async () => {
            const data = await readFile(file!);

            const workbook = new ExcelJS.Workbook();

            try {
                await workbook.xlsx.load(data);

                setWorkbook(workbook);

                setFileType(FileType.WFTDA_STATSBOOK);
            } catch {
                setFileType(FileType.UNKNOWN);
            }

            setIsLoading(false);
        }

        if (file) {
            loadWorkbook();
        }

    }, [file, setWorkbook]);

    const getVersion = useCallback(() => {
        if(!workbook) return '';

        const versionString = workbook.getWorksheet("IGRF")?.getCell("A57").text!;

        const versionRegex = /IGRF Rev\. (\d+) © 2019 Women's Flat Track Derby Association \(WFTDA\)/;

        const versionMatchResults = versionString.match(versionRegex) ?? [];

        if(versionMatchResults.length !== 2) {
            setFileType(FileType.UNKNOWN);
            return '';
        }

        return versionMatchResults[1] as string;
    }, [workbook, setFileType]);

    const getFileInfo = useCallback((): FileInfo => ({
        fileType: fileType,
        version: getVersion(),
    }), [getVersion, fileType]);

    const importData = useCallback(async () => {
        if (!workbook) {
            (await AppToaster).show({ message: 'Import failed. Check the file and try again.', intent: Intent.DANGER });
            return;
        }

        const columnFromNumber = (number: number): string =>
            number < 26
            ? String.fromCharCode('A'.charCodeAt(0) + number)
            : `${columnFromNumber(Math.floor(number / 26) - 1)}${columnFromNumber(number % 26)}`;

        const numberFromColumn = (column: string): number => {
            const normalizedColumn = column.toUpperCase().trim().split('').map(c => c.charCodeAt(0) - 'A'.charCodeAt(0));
            switch (normalizedColumn.length) {
                case 1:
                    return normalizedColumn[0];
                case 2:
                    return (normalizedColumn[0] + 1) * 26 + normalizedColumn[1];

                default:
                    return 0;
            }
        }

        const igrf = workbook.getWorksheet('IGRF');
        const scores = workbook.getWorksheet('Score');
        const penalties = workbook.getWorksheet('Penalties');
        const lineups = workbook.getWorksheet('Lineups');

        if (!igrf) {
            (await AppToaster).show({ message: 'Import failed. Could not find IGRF sheet. Check the file and try again.', intent: Intent.DANGER });
            return;
        }

        if (!scores) {
            (await AppToaster).show({ message: 'Import failed. Could not find Scores sheet. Check the file and try again.', intent: Intent.DANGER });
            return;
        }

        if (!penalties) {
            (await AppToaster).show({ message: 'Import failed. Could not find Penalties sheet. Check the file and try again.', intent: Intent.DANGER });
            return;
        }

        if (!lineups) {
            (await AppToaster).show({ message: 'Import failed. Could not find Lineups sheet. Check the file and try again.', intent: Intent.DANGER });
            return;
        }

        const getLineupSkater = (column: number, row: number): LineupItem => ({
            number: lineups.getCell(`${columnFromNumber(column)}${row}`).text,
            events: range(column + 1, column + 3).map(columnFromNumber).map(column => lineups.getCell(`${column}${row}`).text),
        });

        const copyNumberFromScoreIfRequired = (column: number, row: number, skater: LineupItem): LineupItem => ({
            ...skater,
            number: skater.number.trim() === '' ? scores.getCell(`${column === numberFromColumn('C') ? 'B' : 'U'}${row}`).text : skater.number,
        });

        const game: GameState = {
            game: { 
                venue: igrf.getCell('B3').text, 
                city: igrf.getCell('I3').text, 
                state: igrf.getCell('K3').text, 
                gameNumber: igrf.getCell('L3').text, 
                tournament: igrf.getCell('B5').text, 
                hostLeague: igrf.getCell('I5').text, 
                date: moment(igrf.getCell('B7').text).format('YYYY-MM-DD'), 
                time: moment(igrf.getCell('I7').text).format('HH:mm'), 
            },
            officials: 
                range(60, 87).map(row => ({
                    role: igrf.getCell(`A${row}`).text,
                    name: igrf.getCell(`C${row}`).text,
                    league: igrf.getCell(`H${row}`).text,
                    certificationLevel: igrf.getCell(`K${row}`).text,
                })).filter(o => o.name.trim() !== ''),
            rosters: {
                home: { 
                    league: igrf.getCell('B10').text, 
                    team: igrf.getCell('B11').text, 
                    color: igrf.getCell('B12').text, 
                    captainSkateName: igrf.getCell('B49').text, 
                    captainLegalName: igrf.getCell('B50').text, 
                    skaters: range(14, 33).map(row => ({
                        number: igrf.getCell(`B${row}`).text,
                        name: igrf.getCell(`C${row}`).text,
                    })).filter(s => s.number.trim() !== ''),
                },
                away: { 
                    league: igrf.getCell('I10').text, 
                    team: igrf.getCell('I11').text, 
                    color: igrf.getCell('I12').text, 
                    captainSkateName: igrf.getCell('I49').text, 
                    captainLegalName: igrf.getCell('I50').text, 
                    skaters: range(14, 33).map(row => ({
                        number: igrf.getCell(`I${row}`).text,
                        name: igrf.getCell(`J${row}`).text,
                    })).filter(s => s.number.trim() !== ''),
                },
            },
            scores: {
                1: { 
                    home: {
                        scorekeeper: scores.getCell('L1').text,
                        jammerRef: scores.getCell('O1').text,
                        lines: range(4, 41).map(row => ({
                            jam: scores.getCell(`A${row}`).text,
                            jammer: scores.getCell(`B${row}`).text,
                            lost: scores.getCell(`C${row}`).text.trim() !== '',
                            lead: scores.getCell(`D${row}`).text.trim() !== '',
                            call: scores.getCell(`E${row}`).text.trim() !== '',
                            injury: scores.getCell(`F${row}`).text.trim() !== '',
                            noInitial: scores.getCell(`G${row}`).text.trim() !== '',
                            trips: range(0, 8).map(column => columnFromNumber(numberFromColumn('H') + column)).map(column =>
                                scores.getCell(`${column}${row}`).text,
                            ),
                        })),
                    }, 
                    away: {
                        scorekeeper: scores.getCell('AE1').text,
                        jammerRef: scores.getCell('AH1').text,
                        lines: range(4, 41).map(row => ({
                            jam: scores.getCell(`T${row}`).text,
                            jammer: scores.getCell(`U${row}`).text,
                            lost: scores.getCell(`V${row}`).text.trim() !== '',
                            lead: scores.getCell(`W${row}`).text.trim() !== '',
                            call: scores.getCell(`X${row}`).text.trim() !== '',
                            injury: scores.getCell(`Y${row}`).text.trim() !== '',
                            noInitial: scores.getCell(`Z${row}`).text.trim() !== '',
                            trips: range(0, 8).map(column => columnFromNumber(numberFromColumn('AA') + column)).map(column =>
                                scores.getCell(`${column}${row}`).text,
                            ),
                        })),
                    },
                },
                2: { 
                    home: {
                        scorekeeper: scores.getCell('L43').text,
                        jammerRef: scores.getCell('O43').text,
                        lines: range(46, 83).map(row => ({
                            jam: scores.getCell(`A${row}`).text,
                            jammer: scores.getCell(`B${row}`).text,
                            lost: scores.getCell(`C${row}`).text.trim() !== '',
                            lead: scores.getCell(`D${row}`).text.trim() !== '',
                            call: scores.getCell(`E${row}`).text.trim() !== '',
                            injury: scores.getCell(`F${row}`).text.trim() !== '',
                            noInitial: scores.getCell(`G${row}`).text.trim() !== '',
                            trips: range(0, 8).map(column => columnFromNumber(numberFromColumn('H') + column)).map(column =>
                                scores.getCell(`${column}${row}`).text,
                            ),
                        })),
                    }, 
                    away: {
                        scorekeeper: scores.getCell('AE43').text,
                        jammerRef: scores.getCell('AH43').text,
                        lines: range(46, 83).map(row => ({
                            jam: scores.getCell(`T${row}`).text,
                            jammer: scores.getCell(`U${row}`).text,
                            lost: scores.getCell(`V${row}`).text.trim() !== '',
                            lead: scores.getCell(`W${row}`).text.trim() !== '',
                            call: scores.getCell(`X${row}`).text.trim() !== '',
                            injury: scores.getCell(`Y${row}`).text.trim() !== '',
                            noInitial: scores.getCell(`Z${row}`).text.trim() !== '',
                            trips: range(0, 8).map(column => columnFromNumber(numberFromColumn('AA') + column)).map(column =>
                                scores.getCell(`${column}${row}`).text,
                            ),
                        })),
                    },
                },
            },
            penalties: {
                1: { 
                    home: {
                        penaltyTracker: penalties.getCell('N1').text,
                        lines: range(0, 18).map(row => range(numberFromColumn('B'), numberFromColumn('K')).map(columnFromNumber).map(column => ({
                            code: penalties.getCell(`${column}${4 + row * 2}`).text,
                            jam: penalties.getCell(`${column}${5 + row * 2}`).text,
                        }))),
                    }, 
                    away: {
                        penaltyTracker: penalties.getCell('N1').text,
                        lines: range(0, 18).map(row => range(numberFromColumn('Q'), numberFromColumn('Z')).map(columnFromNumber).map(column => ({
                            code: penalties.getCell(`${column}${4 + row * 2}`).text,
                            jam: penalties.getCell(`${column}${5 + row * 2}`).text,
                        }))),
                    }, 
                },
                2: { 
                    home: {
                        penaltyTracker: penalties.getCell('AP1').text,
                        lines: range(0, 18).map(row => range(numberFromColumn('AD'), numberFromColumn('AM')).map(columnFromNumber).map(column => ({
                            code: penalties.getCell(`${column}${4 + row * 2}`).text,
                            jam: penalties.getCell(`${column}${5 + row * 2}`).text,
                        }))),
                    }, 
                    away: {
                        penaltyTracker: penalties.getCell('AP1').text,
                        lines: range(0, 18).map(row => range(numberFromColumn('AS'), numberFromColumn('BB')).map(columnFromNumber).map(column => ({
                            code: penalties.getCell(`${column}${4 + row * 2}`).text,
                            jam: penalties.getCell(`${column}${5 + row * 2}`).text,
                        }))),
                    }, 
                },
            },
            lineups: {
                1: { 
                    home: {
                        lineupTracker: lineups.getCell('P1').text,
                        lines: range(4, 41).map(row => ({
                            jamNumber: lineups.getCell(`A${row}`).text,
                            noPivot: lineups.getCell(`B${row}`).text.trim() !== '',
                            skaters: {
                                jammer: copyNumberFromScoreIfRequired(numberFromColumn('C'), row, 
                                    getLineupSkater(numberFromColumn('C'), row)),
                                pivot: getLineupSkater(numberFromColumn('G'), row),
                                blocker1: getLineupSkater(numberFromColumn('K'), row),
                                blocker2: getLineupSkater(numberFromColumn('O'), row),
                                blocker3: getLineupSkater(numberFromColumn('S'), row),
                            }
                        })),
                    },
                    away: {
                        lineupTracker: lineups.getCell('AP1').text,
                        lines: range(4, 41).map(row => ({
                            jamNumber: lineups.getCell(`AA${row}`).text,
                            noPivot: lineups.getCell(`AB${row}`).text.trim() !== '',
                            skaters: {
                                jammer: copyNumberFromScoreIfRequired(numberFromColumn('AC'), row, 
                                    getLineupSkater(numberFromColumn('AC'), row)),
                                pivot: getLineupSkater(numberFromColumn('AG'), row),
                                blocker1: getLineupSkater(numberFromColumn('AK'), row),
                                blocker2: getLineupSkater(numberFromColumn('AO'), row),
                                blocker3: getLineupSkater(numberFromColumn('AS'), row),
                            }
                        })),
                    },
                },
                2: { 
                    home: {
                        lineupTracker: lineups.getCell('P43').text,
                        lines: range(46, 83).map(row => ({
                            jamNumber: lineups.getCell(`A${row}`).text,
                            noPivot: lineups.getCell(`B${row}`).text.trim() !== '',
                            skaters: {
                                jammer: copyNumberFromScoreIfRequired(numberFromColumn('C'), row, 
                                    getLineupSkater(numberFromColumn('C'), row)),
                                pivot: getLineupSkater(numberFromColumn('G'), row),
                                blocker1: getLineupSkater(numberFromColumn('K'), row),
                                blocker2: getLineupSkater(numberFromColumn('O'), row),
                                blocker3: getLineupSkater(numberFromColumn('S'), row),
                            }
                        })),
                    },
                    away: {
                        lineupTracker: lineups.getCell('AP43').text,
                        lines: range(46, 83).map(row => ({
                            jamNumber: lineups.getCell(`AA${row}`).text,
                            noPivot: lineups.getCell(`AB${row}`).text.trim() !== '',
                            skaters: {
                                jammer: copyNumberFromScoreIfRequired(numberFromColumn('AC'), row, 
                                    getLineupSkater(numberFromColumn('AC'), row)),
                                pivot: getLineupSkater(numberFromColumn('AG'), row),
                                blocker1: getLineupSkater(numberFromColumn('AK'), row),
                                blocker2: getLineupSkater(numberFromColumn('AO'), row),
                                blocker3: getLineupSkater(numberFromColumn('AS'), row),
                            }
                        })),
                    },
                },
            },
        };

        setGameState(game);

    }, [workbook, setGameState]);

    return { isLoading, getFileInfo, importData };
}