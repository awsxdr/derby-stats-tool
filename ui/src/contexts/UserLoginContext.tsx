import { PropsWithChildren, createContext, useCallback, useContext, useEffect, useState } from "react";
import { sha256 } from "js-sha256";
import { Base64 } from 'js-base64';
import { getCookie, setCookie } from 'typescript-cookie';

const CLIENT_ID = "28l7gt8eaarjpmri9ot01ehtma";
const CLIENT_SECRET = "q2b38tqqtjftukbnipqktr5l2qhhfa0ih3mv22db4v214k7cdlh";

export interface LoginState {
    refreshToken?: string,
    currentToken?: string,
    expiryDate: number,
}

export enum LoginStatus {
    LOGGED_OUT = 0,
    LOGGED_IN = 1,
    INDETERMINATE = 2,
}

export const DefaultLoginState = (): LoginState => ({
    expiryDate: 0,
});

interface UserLoginContextProps {
    getLoginStatus: () => LoginStatus,
    startLogin: () => void,
    logout: () => void,
    getToken: () => Promise<string>,
}

const UserLoginContext = createContext<UserLoginContextProps>({ 
    getLoginStatus: () => LoginStatus.INDETERMINATE,
    startLogin: () => {},
    logout: () => {},
    getToken: () => Promise.resolve(""),
 });

export const useUserLoginContext = () => useContext(UserLoginContext);

type TokenResponse = {
    id_token: string,
    access_token: string,
    refresh_token: string,
    expires_in: number,
}

const generateRandomKey = (length: number): string => {
    const validCharacters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz01234567890_-,.";
    return Array.from(Array(length)).map(() => validCharacters.charAt(Math.floor(Math.random() * validCharacters.length))).join("");
}

const getRedirectUri = () => `${window.location.protocol}//${window.location.host}/`;

const getTokenFromCode = async (code: string): Promise<TokenResponse> => {
    const verifier = getCookie("verifier");

    if(verifier) {
        const formData = new URLSearchParams();
        formData.append("grant_type", "authorization_code");
        formData.append("code", code);
        formData.append("redirect_uri", getRedirectUri());
        formData.append("code_verifier", verifier);

        const response = await fetch("https://auth.awsxdr.com/oauth2/token", {
            method: 'POST',
            headers: [
                ['Authorization', `Basic ${Base64.encode(`${(CLIENT_ID)}:${CLIENT_SECRET}`)}` ]
            ],
            body: formData,
        });

        if(response.ok) {
            return await response.json();
        }
    }

    return { id_token: '', access_token: '', refresh_token: '', expires_in: 0 };
}

const refreshToken = async (token: string): Promise<TokenResponse> => {
    const formData = new URLSearchParams();
    formData.append("grant_type", "refresh_token");
    formData.append("refresh_token", token);

    const response = await fetch("https://auth.awsxdr.com/oauth2/token", {
        method: 'POST',
        headers: [
            ['Authorization', `Basic ${Base64.encode(`${(CLIENT_ID)}:${CLIENT_SECRET}`)}` ]
        ],
        body: formData,
    });

    if(response.ok) {
        return await response.json();
    }

    return { id_token: '', access_token: '', refresh_token: '', expires_in: 0 };
}

const revokeTokens = async (refreshToken: string) => {
    const formData = new URLSearchParams();
    formData.append('token', refreshToken);
    formData.append('client_id', CLIENT_ID);

    await fetch('https://auth.awsxdr.com/oauth2/revoke', {
        method: 'POST',
        headers: [
            ['Authorization', `Basic ${Base64.encode(`${(CLIENT_ID)}:${CLIENT_SECRET}`)}` ]
        ],
        body: formData,
    });
}

export const UserLoginContextProvider = ({ children }: PropsWithChildren) => {
    const [state, setState] = useState(DefaultLoginState());
    const [loginStatus, setLoginStatus] = useState(LoginStatus.INDETERMINATE);

    const setAndStoreState = useCallback((newState: (current: LoginState) => LoginState) => {
        setState(current => {
            const state = newState(current);
            setCookie("user", JSON.stringify(state), { sameSite: "Strict" });

            return state;
        } );
    }, [setState]);

    const startLogin = useCallback(() => {
        const verifier = generateRandomKey(Math.floor(Math.random() * 256) + 256);
        const hash = sha256.array(verifier);
        const challenge = Base64.fromUint8Array(new Uint8Array(hash)).replace('+', '-').replace('/', '_').replace('=', '');

        setCookie("verifier", verifier);
        setLoginStatus(LoginStatus.INDETERMINATE);

        const authUrl = `https://auth.awsxdr.com/authorize?client_id=${CLIENT_ID}&response_type=code&scope=email+openid&redirect_uri=${encodeURIComponent(getRedirectUri())}&code_challenge=${challenge}&code_challenge_method=S256`

        window.location.href = authUrl;
    }, []);

    const logout = useCallback(() => {
        if(state.currentToken && state.refreshToken) {
            revokeTokens(state.refreshToken);
        }
        setAndStoreState(() => DefaultLoginState());
        setLoginStatus(LoginStatus.LOGGED_OUT);

        const logoutUrl = `https://auth.awsxdr.com/logout?client_id=${CLIENT_ID}&response_type=code&logout_uri=${encodeURIComponent(getRedirectUri())}`;

        window.location.href = logoutUrl;
    }, [state, setAndStoreState]);

    const getToken = useCallback(async () => {
        const search = new URLSearchParams(window.location.search);
        if(search.has("code")) {
            // We're in the middle of login, don't try to return a token
            return "";
        }

        if(state.currentToken) {
            if(Date.now() > state.expiryDate - 60000) {
                if (state.refreshToken) {
                    const { access_token, refresh_token, expires_in } = await refreshToken(state.refreshToken);
                    const expiryDate = Date.now() + expires_in * 1000;
                    setAndStoreState(current => ({ ...current, currentToken: access_token, refreshToken: refresh_token, expiryDate }));
                    return access_token;
                } else {
                    setAndStoreState(() => DefaultLoginState());
                    return "";
                }
            } else {
                return state.currentToken;
            }
        } else {
            if(state.refreshToken) {
                const { access_token, refresh_token, expires_in } = await refreshToken(state.refreshToken);
                const expiryDate = Date.now() + expires_in * 1000;
                setAndStoreState(current => ({ ...current, currentToken: access_token, refreshToken: refresh_token, expiryDate }));
                return access_token;
            } else {
                return "";
            }
        }
    }, [state, setAndStoreState])

    useEffect(() => {
        const search = new URLSearchParams(location.search);
        if(search.has("code")) {
            setLoginStatus(LoginStatus.INDETERMINATE);
            const code = search.get("code");
            if(code) {
                getTokenFromCode(code).then(({ access_token, refresh_token, expires_in }) => {
                    const expiryDate = Date.now() + expires_in * 1000;
                    setLoginStatus(LoginStatus.LOGGED_IN);
                    setAndStoreState(current => ({ ...current, currentToken: access_token, refreshToken: refresh_token, expiryDate }));
                });
            }
        }
    }, [setAndStoreState]);

    useEffect(() => {
        const storedLoginCookieValue = getCookie("user");

        if(storedLoginCookieValue) {
            const storedLogin: LoginState = JSON.parse(storedLoginCookieValue);

            if(storedLogin.currentToken) {
                setLoginStatus(LoginStatus.LOGGED_IN);
            } else {
                setLoginStatus(LoginStatus.LOGGED_OUT);
            }

            setState(storedLogin);
        } else {
            setLoginStatus(LoginStatus.LOGGED_OUT);
        }

    }, [setState]);

    return (
        <UserLoginContext.Provider value={{ 
            getLoginStatus: useCallback(() => loginStatus, [loginStatus]),
            startLogin,
            logout,
            getToken,
        }}>
            {loginStatus !== LoginStatus.INDETERMINATE && children}
        </UserLoginContext.Provider>
    )
}