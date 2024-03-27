import { OverlaysProvider } from '@blueprintjs/core'
import './App.css'
import { GameStateContextProvider } from './GameStateContext';
import { UserLoginContextProvider } from './UserLoginContext';
import { HomePage } from './HomePage';
import { RouterProvider } from 'react-router';
import { createBrowserRouter } from 'react-router-dom';
import CookieConsent from 'react-cookie-consent';
import { UserInfoContextProvider } from './UserInfoContext';

function App() {

    const Root = () => (
        <UserLoginContextProvider>
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
        </UserLoginContextProvider>
    );

    const router = createBrowserRouter([
        {
            path: '/',
            element: <Root />
        }
    ]);

  return (
    <RouterProvider router={router} />
  )
}

export default App
