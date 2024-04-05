import { useCallback, useState } from "react";
import { Card, CardList, FormGroup } from "@blueprintjs/core";

import { SuggestOfficial } from "@components";
import { Period, TeamType, useGameContext } from "@contexts"

import sharedStyles from '@/Shared.module.scss';

export const LineupOfficialsSheet = () => {
    const { gameState, setGameState } = useGameContext();

    const [officialNames, setOfficialNames] = useState(gameState.officials.map(o => o.name));

    const handleNameAdded = (name: string) => setOfficialNames([...officialNames, name]);

    const setOfficial = useCallback((period: Period, team: TeamType) => (name: string) => 
        setGameState({ 
            ...gameState, 
            lineups: { 
                ...gameState.lineups, 
                [period]: { 
                    ...gameState.lineups[period],
                    [team]: {
                        ...gameState.lineups[period][team],
                        lineupTracker: name,
                    } 
                }
            }
        }), [gameState, setGameState]);

    return (
        <CardList className={sharedStyles.officialsList}>
            <Card className={sharedStyles.periodCard}>
                <h3>Period 1</h3>
                <FormGroup label='Home team lineup tracker' fill>
                    <SuggestOfficial 
                        officialNames={officialNames} 
                        value={gameState.lineups[Period.ONE].home.lineupTracker ?? ''} 
                        onChange={setOfficial(Period.ONE, TeamType.HOME)} 
                        onNameAdded={handleNameAdded} 
                    />
                </FormGroup>
                <FormGroup label='Away team lineup tracker' fill>
                    <SuggestOfficial 
                        officialNames={officialNames} 
                        value={gameState.lineups[Period.ONE].away.lineupTracker ?? ''} 
                        onChange={setOfficial(Period.ONE, TeamType.AWAY)} 
                        onNameAdded={handleNameAdded} 
                    />
                </FormGroup>
            </Card>
            <Card className={sharedStyles.periodCard}>
                <h3>Period 2</h3>
                <FormGroup label='Home team lineup tracker' fill>
                    <SuggestOfficial 
                        officialNames={officialNames} 
                        value={gameState.lineups[Period.TWO].home.lineupTracker ?? ''} 
                        onChange={setOfficial(Period.TWO, TeamType.HOME)} 
                        onNameAdded={handleNameAdded} 
                    />
                </FormGroup>
                <FormGroup label='Away team lineup tracker' fill>
                    <SuggestOfficial 
                        officialNames={officialNames} 
                        value={gameState.lineups[Period.TWO].away.lineupTracker ?? ''} 
                        onChange={setOfficial(Period.TWO, TeamType.AWAY)} 
                        onNameAdded={handleNameAdded} 
                    />
                </FormGroup>
            </Card>
        </CardList>
    )
}