import { BlueprintProvider } from '@blueprintjs/core'

import { GameStateContextProvider, UserLoginContextProvider, UserInfoContextProvider, HotkeysProviderWithoutDialog, useCustomHotkeysContext } from '@contexts';
import { HomePage } from '@pages';
import { ApiProvider } from '@/Api';

import './App.css'
import { ValidationContextProvider } from './contexts/ValidationContext';

const InnerApp = () => {
    const hotkeys = useCustomHotkeysContext();

    return (
        <BlueprintProvider hotkeysProviderValue={hotkeys}>
            <HomePage />
            {/* <CookieConsent onAccept={() => window.location.reload()}>
                This website uses cookies to provide functionality
            </CookieConsent> */}
        </BlueprintProvider>
    );
}

// Blueprint moans about there being no hotkeys provider. Just disable them to stop the noise.
console.warn = () => {};

function App() {
    return (
        <UserLoginContextProvider>
            <ApiProvider>
                <UserInfoContextProvider>
                    <GameStateContextProvider>
                        <ValidationContextProvider>
                            <HotkeysProviderWithoutDialog>
                                <InnerApp />
                            </HotkeysProviderWithoutDialog>
                        </ValidationContextProvider>
                    </GameStateContextProvider>
                </UserInfoContextProvider>
            </ApiProvider>
        </UserLoginContextProvider>
    );
}

export default App
