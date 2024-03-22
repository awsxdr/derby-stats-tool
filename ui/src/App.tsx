import { OverlaysProvider } from '@blueprintjs/core'
import './App.css'
import { GameStateContextProvider } from './GameStateContext';
import { HomePage } from './HomePage';

function App() {

  return (
    <GameStateContextProvider>
      <OverlaysProvider>
        <HomePage />
      </OverlaysProvider>
    </GameStateContextProvider>
  )
}

export default App
