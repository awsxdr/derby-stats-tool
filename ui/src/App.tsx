import CookieConsent from 'react-cookie-consent';
import { OverlaysProvider } from '@blueprintjs/core'

import { GameStateContextProvider, UserLoginContextProvider, UserInfoContextProvider } from '@contexts';
import { HomePage } from '@pages';
import { ApiProvider } from '@/Api';

import './App.css'

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
