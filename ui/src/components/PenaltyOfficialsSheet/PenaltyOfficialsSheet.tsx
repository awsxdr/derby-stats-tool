import { useState } from "react";
import { Card, CardList, FormGroup } from "@blueprintjs/core";

import { SuggestOfficial } from "@components";
import { Period, TeamType, useGameContext } from "@contexts";

import sharedStyles from '@/Shared.module.css';

export const PenaltyOfficialsSheet = () => {
    const { gameState, setGameState } = useGameContext();

    const [officialNames, setOfficialNames] = useState(gameState.officials.map(o => o.name));

    const handleNameAdded = (name: string) => setOfficialNames([...officialNames, name]);

    const setOfficial = (period: Period, team: TeamType) => (name: string) => 
        setGameState({ 
            ...gameState, 
            penalties: { 
                ...gameState.penalties, 
                [period]: { 
                    ...gameState.penalties[period],
                    [team]: {
                        ...gameState.penalties[period][team],
                        penaltyTracker: name,
                    } 
                }
            }
        });

    return (
        <CardList className={sharedStyles.officialsList}>
            <Card className={sharedStyles.periodCard}>
                <h3>Period 1</h3>
                <FormGroup label='Home team penalty tracker' fill>
                    <SuggestOfficial 
                        officialNames={officialNames} 
                        value={gameState.penalties[1].home.penaltyTracker} 
                        onChange={setOfficial(Period.ONE, TeamType.HOME)} 
                        onNameAdded={handleNameAdded} 
                    />
                </FormGroup>
                <FormGroup label='Away team penalty tracker (if different)' fill>
                    <SuggestOfficial 
                        officialNames={officialNames} 
                        value={gameState.penalties[1].away.penaltyTracker} 
                        onChange={setOfficial(Period.ONE, TeamType.AWAY)} 
                        onNameAdded={handleNameAdded} 
                    />
                </FormGroup>
            </Card>
            <Card className={sharedStyles.periodCard}>
                <h3>Period 2</h3>
                <FormGroup label='Home team penalty tracker' fill>
                    <SuggestOfficial 
                        officialNames={officialNames} 
                        value={gameState.penalties[2].home.penaltyTracker} 
                        onChange={setOfficial(Period.TWO, TeamType.HOME)} 
                        onNameAdded={handleNameAdded} 
                    />
                </FormGroup>
                <FormGroup label='Away team penalty tracker (if different)' fill>
                    <SuggestOfficial 
                        officialNames={officialNames} 
                        value={gameState.penalties[2].away.penaltyTracker} 
                        onChange={setOfficial(Period.TWO, TeamType.AWAY)} 
                        onNameAdded={handleNameAdded} 
                    />
                </FormGroup>
            </Card>
        </CardList>
    )
}