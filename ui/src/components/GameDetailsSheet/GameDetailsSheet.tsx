import { FormGroup, InputGroup, NumericInput } from "@blueprintjs/core";
import { DateInput3 } from "@blueprintjs/datetime2";
import moment from 'moment';

import { GameDetails, useGameContext } from "@contexts";

import styles from './GameDetailsSheet.module.css';

export const GameDetailsSheet = () => {

    const { gameState, setGameState } = useGameContext();

    const updateState = (update: (game: GameDetails, value: string) => void) => (value: string) => {
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
                <NumericInput id="game-number-input" min={1} value={gameState.game.gameNumber} onValueChange={(_, value) => updateState((g, v) => g.gameNumber = v)(value)} />
            </FormGroup>
            <FormGroup label="Tournament name" labelFor="tournament-input" fill>
                <InputGroup id="tournament-input" fill value={gameState.game.tournament} onValueChange={updateState((g, v) => g.tournament = v)} />
            </FormGroup>
            <FormGroup label="Host league name" labelFor="host-input" fill>
                <InputGroup id="host-input" fill value={gameState.game.hostLeague} onValueChange={updateState((g, v) => g.hostLeague = v)} />
            </FormGroup>
            <FormGroup label="Date & time" labelFor="date-time-input" fill>
                <DateInput3 
                    timePickerProps={{ 
                        value: new Date(moment(gameState.game.time).date()),
                        onChange: value => updateState((g, v) => g.time = v)(moment(value).format('HH:mm')),
                    }} 
                    popoverProps={{ placement: "bottom" }}
                    closeOnSelection 
                    fill 
                    value={`${gameState.game.date} ${gameState.game.time}`} 
                    onChange={value => updateState((g, v) => {
                        const date = moment(v);
                        g.date = date.format('YYYY-MM-DD');
                    })(value || moment(Date.now()).format('YYYY-MM-DD'))}
                />
            </FormGroup>
        </div>
    );
}