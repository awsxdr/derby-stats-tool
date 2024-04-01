import { useState } from "react";
import { Card, CardList, FormGroup } from "@blueprintjs/core";

import { SuggestOfficial } from "@components";
import { Period, TeamType, useGameContext } from "@contexts"

import sharedStyles from '@/Shared.module.css';

export const ScoreOfficialsSheet = () => {
    const { gameState, setGameState } = useGameContext();

    const [officialNames, setOfficialNames] = useState(gameState.officials.map(o => o.name));

    const handleNameAdded = (name: string) => setOfficialNames([...officialNames, name]);

    const setOfficial = (period: Period, team: TeamType, official: 'scorekeeper' | 'jammerRef') => (name: string) => 
        setGameState({ 
            ...gameState, 
            scores: { 
                ...gameState.scores, 
                [period]: { 
                    ...gameState.scores[period],
                    [team]: {
                        ...gameState.scores[period][team],
                        [official]: name,
                    } 
                }
            }
        });

    return (
        <CardList className={sharedStyles.officialsList}>
            <Card className={sharedStyles.periodCard}>
                <h3>Period 1</h3>
                <FormGroup label='Home team scorekeeper' fill>
                    <SuggestOfficial 
                        officialNames={officialNames} 
                        value={gameState.scores[1].home.scorekeeper} 
                        onChange={setOfficial(Period.ONE, TeamType.HOME, 'scorekeeper')} 
                        onNameAdded={handleNameAdded} 
                    />
                </FormGroup>
                <FormGroup label='Home team jammer ref' fill>
                    <SuggestOfficial 
                        officialNames={officialNames} 
                        value={gameState.scores[1].home.jammerRef} 
                        onChange={setOfficial(Period.ONE, TeamType.HOME, 'jammerRef')} 
                        onNameAdded={handleNameAdded} 
                    />
                </FormGroup>
                <FormGroup label='Away team scorekeeper' fill>
                    <SuggestOfficial 
                        officialNames={officialNames} 
                        value={gameState.scores[1].away.scorekeeper} 
                        onChange={setOfficial(Period.ONE, TeamType.AWAY, 'scorekeeper')} 
                        onNameAdded={handleNameAdded} 
                    />
                </FormGroup>
                <FormGroup label='Away team jammer ref' fill>
                    <SuggestOfficial 
                        officialNames={officialNames} 
                        value={gameState.scores[1].away.jammerRef} 
                        onChange={setOfficial(Period.ONE, TeamType.AWAY, 'jammerRef')} 
                        onNameAdded={handleNameAdded} 
                    />
                </FormGroup>
            </Card>
            <Card className={sharedStyles.periodCard}>
                <h3>Period 2</h3>
                <FormGroup label='Home team scorekeeper' fill>
                    <SuggestOfficial 
                        officialNames={officialNames} 
                        value={gameState.scores[2].home.scorekeeper} 
                        onChange={setOfficial(Period.TWO, TeamType.HOME, 'scorekeeper')} 
                        onNameAdded={handleNameAdded} 
                    />
                </FormGroup>
                <FormGroup label='Home team jammer ref' fill>
                    <SuggestOfficial 
                        officialNames={officialNames} 
                        value={gameState.scores[2].home.jammerRef} 
                        onChange={setOfficial(Period.TWO, TeamType.HOME, 'jammerRef')} 
                        onNameAdded={handleNameAdded} 
                    />
                </FormGroup>
                <FormGroup label='Away team scorekeeper' fill>
                    <SuggestOfficial 
                        officialNames={officialNames} 
                        value={gameState.scores[2].away.scorekeeper} 
                        onChange={setOfficial(Period.TWO, TeamType.AWAY, 'scorekeeper')} 
                        onNameAdded={handleNameAdded} 
                    />
                </FormGroup>
                <FormGroup label='Away team jammer ref' fill>
                    <SuggestOfficial 
                        officialNames={officialNames} 
                        value={gameState.scores[2].away.jammerRef} 
                        onChange={setOfficial(Period.TWO, TeamType.AWAY, 'jammerRef')} 
                        onNameAdded={handleNameAdded} 
                    />
                </FormGroup>
            </Card>
        </CardList>
    )
}