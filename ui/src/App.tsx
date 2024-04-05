import { BlueprintProvider } from '@blueprintjs/core'

import { GameStateContextProvider, UserLoginContextProvider, UserInfoContextProvider } from '@contexts';
import { HomePage } from '@pages';
import { ApiProvider } from '@/Api';

import './App.css'
import { HotkeysProviderWithoutDialog, useCustomHotkeysContext } from './contexts/CustomHotkeysContext';

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
                        <HotkeysProviderWithoutDialog>
                            <InnerApp />
                        </HotkeysProviderWithoutDialog>
                    </GameStateContextProvider>
                </UserInfoContextProvider>
            </ApiProvider>
        </UserLoginContextProvider>
    );
}

export default App
