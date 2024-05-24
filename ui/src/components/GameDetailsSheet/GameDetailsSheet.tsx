import { ControlGroup, FormGroup, InputGroup, NumericInput } from "@blueprintjs/core";
import { DateInput3 } from "@blueprintjs/datetime2";
import moment from 'moment';

import { GameDetails, useGameContext } from "@contexts";

import styles from './GameDetailsSheet.module.css';

export const GameDetailsSheet = () => {

    const { gameState, setGameState } = useGameContext();

    const updateState = <TValue,>(update: (game: GameDetails, value: TValue) => void) => (value: TValue) => {
        const game = gameState.game;
        update(game, value);
        setGameState({ ...gameState, game});
    }

    return (
        <div className={styles.gameDetailsContainer}>
            <FormGroup label="Venue" labelFor="venue-input" fill>
                <InputGroup id="venue-input" fill value={gameState.game.venue} onValueChange={updateState((g, v) => g.venue = v)} />
            </FormGroup>
            <FormGroup label="City" labelFor="city-input" fill>
                <InputGroup id="city-input" fill value={gameState.game.city} onValueChange={updateState((g, v) => g.city = v)} />
            </FormGroup>
            <FormGroup label="State/province" labelFor="state-input" fill>
                <InputGroup id="state-input" fill value={gameState.game.state} onValueChange={updateState((g, v) => g.state = v)} />
            </FormGroup>
            <FormGroup label="Game #" labelFor="game-number-input" fill>
                <InputGroup id="game-number-input" value={gameState.game.gameNumber} onValueChange={updateState((g, v) => g.gameNumber = v)} />
            </FormGroup>
            <FormGroup label="Tournament name" labelFor="tournament-input" fill>
                <InputGroup id="tournament-input" fill value={gameState.game.tournament} onValueChange={updateState((g, v) => g.tournament = v)} />
            </FormGroup>
            <FormGroup label="Host league name" labelFor="host-input" fill>
                <InputGroup id="host-input" fill value={gameState.game.hostLeague} onValueChange={updateState((g, v) => g.hostLeague = v)} />
            </FormGroup>
            <FormGroup label="Date & time" labelFor="date-input" fill>
                <ControlGroup fill>
                    <DateInput3 
                        inputProps={{ id: 'date-time-input' }}
                        popoverProps={{ placement: "bottom" }}
                        closeOnSelection 
                        fill 
                        value={`${gameState.game.date}`} 
                        onChange={value => updateState((g, v: string) => {
                            const date = moment(v);
                            g.date = date.format('YYYY-MM-DD');
                        })(value || moment(Date.now()).format('YYYY-MM-DD'))}
                    />
                </ControlGroup>
                <ControlGroup fill>
                    <NumericInput
                        allowNumericCharactersOnly
                        selectAllOnFocus
                        selectAllOnIncrement
                        fill
                        value={gameState.game.time.split(':')?.[0] ?? '12'}
                        min={0}
                        max={23}
                        onValueChange={updateState((g, v) => {
                            const time = moment(`2000-01-01 ${v}:${g.time.split(':')?.[1] ?? '00'}`);
                            g.time = time.format('HH:mm');
                        })}
                    />
                    <NumericInput
                        allowNumericCharactersOnly
                        selectAllOnFocus
                        selectAllOnIncrement
                        fill
                        value={gameState.game.time.split(':')?.[1] ?? '00'}
                        min={0}
                        max={59}
                        onValueChange={updateState((g, v) => {
                            const time = moment(`2000-01-01 ${g.time.split(':')?.[0] ?? '12'}:${v}`);
                            g.time = time.format('HH:mm');
                        })}
                    />
                </ControlGroup>
            </FormGroup>
        </div>
    );
}