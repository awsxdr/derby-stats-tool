import { OverlaysProvider } from '@blueprintjs/core'
import './App.css'
import { GameStateContextProvider } from './GameStateContext';
import { UserLoginContextProvider } from './UserLoginContext';
import { HomePage } from './HomePage';
import CookieConsent from 'react-cookie-consent';
import { UserInfoContextProvider } from './UserInfoContext';
import { ApiProvider } from './Api';

function App() {

  return (
        <UserLoginContextProvider>
            <ApiProvider>
                <UserInfoContextProvider>
                    <GameStateContextProvider>
                        <OverlaysProvider>
                            <HomePage />
                            <CookieConsent onAccept={() => window.location.reload()}>
                                This website uses cookies to provide functionality
                            </CookieConsent>
                        </OverlaysProvider>
                    </GameStateContextProvider>
                </UserInfoContextProvider>
            </ApiProvider>
        </UserLoginContextProvider>
    );
}

export default App
