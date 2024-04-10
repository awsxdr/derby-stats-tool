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
    loginStatus: LoginStatus,
    startLogin: () => void,
    startRegister: () => void,
    logout: () => void,
    expireToken: () => void,
    token?: string;
}

const UserLoginContext = createContext<UserLoginContextProps>({ 
    loginStatus: LoginStatus.INDETERMINATE,
    startLogin: () => {},
    startRegister: () => {},
    logout: () => {},
    expireToken: () => {},
    token: "",
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

const requestTokenRefresh = async (token: string): Promise<TokenResponse> => {
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
        return { ...await response.json(), refresh_token: token };
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

const generateChallenge = () => {
    const verifier = generateRandomKey(Math.floor(Math.random() * 256) + 256);
    const hash = sha256.array(verifier);
    const challenge = Base64.fromUint8Array(new Uint8Array(hash)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

    return [verifier, challenge];
}

export const UserLoginContextProvider = ({ children }: PropsWithChildren) => {
    const [token, setToken] = useState<string>();
    const [refreshToken, setRefreshToken] = useState<string>();
    const [expiryDate, setExpiryDate] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    const [loginStatus, setLoginStatus] = useState(LoginStatus.INDETERMINATE);

    const startLogin = useCallback(() => {

        const [verifier, challenge] = generateChallenge();
        setCookie("verifier", verifier);
        setLoginStatus(LoginStatus.INDETERMINATE);

        const authUrl = `https://auth.awsxdr.com/authorize?client_id=${CLIENT_ID}&response_type=code&scope=email+openid&redirect_uri=${encodeURIComponent(getRedirectUri())}&code_challenge=${challenge}&code_challenge_method=S256`;

        window.location.href = authUrl;
    }, []);

    const startRegister = useCallback(() => {
        const [verifier, challenge] = generateChallenge();
        setCookie("verifier", verifier);
        setLoginStatus(LoginStatus.INDETERMINATE);

        const registerUrl = `https://auth.awsxdr.com/signup?client_id=${CLIENT_ID}&response_type=code&scope=email+openid&redirect_uri=${encodeURIComponent(getRedirectUri())}&code_challenge=${challenge}&code_challenge_method=S256`;

        window.location.href = registerUrl;
    }, []);

    const logout = useCallback(() => {
        if(refreshToken) {
            revokeTokens(refreshToken);
        }
        setToken(undefined);
        setRefreshToken(undefined);
        setExpiryDate(0);
        setLoginStatus(LoginStatus.LOGGED_OUT);

        const logoutUrl = `https://auth.awsxdr.com/logout?client_id=${CLIENT_ID}&response_type=code&logout_uri=${encodeURIComponent(getRedirectUri())}`;

        window.location.href = logoutUrl;
    }, [refreshToken, setToken, setRefreshToken, setExpiryDate, setLoginStatus]);

    const expireToken = useCallback(() => {
        setExpiryDate(0);
    }, [setExpiryDate]);

    useEffect(() => {
        const getToken = async () => {
            const search = new URLSearchParams(window.location.search);
            if(search.has("code")) {
                // We're in the middle of login, don't try to return a token
                return;
            }

            if(token) {
                if(Date.now() > expiryDate - 60000) {
                    if (refreshToken) {
                        const { access_token, refresh_token, expires_in } = await requestTokenRefresh(refreshToken);
                        setExpiryDate(Date.now() + expires_in * 1000);
                        setToken(access_token);
                        setRefreshToken(refresh_token)
                    } else {
                        setExpiryDate(0);
                        setToken(undefined);
                        setRefreshToken(undefined);
                    }
                } else {
                    setLoginStatus(LoginStatus.LOGGED_IN);
                }
            } else {
                if(refreshToken) {
                    const { access_token, refresh_token, expires_in } = await requestTokenRefresh(refreshToken);
                    setExpiryDate(Date.now() + expires_in * 1000);
                    setToken(access_token);
                    setRefreshToken(refresh_token)
                } else if(!isLoading) {
                    setLoginStatus(LoginStatus.LOGGED_OUT);
                }

            }
        };

        getToken();
    }, [isLoading, expiryDate, refreshToken, token]);

    useEffect(() => {
        const search = new URLSearchParams(location.search);
        if(search.has("code")) {
            setLoginStatus(LoginStatus.INDETERMINATE);
            const code = search.get("code");
            if(code) {
                getTokenFromCode(code).then(({ access_token, refresh_token, expires_in }) => {
                    setExpiryDate(Date.now() + expires_in * 1000);
                    setToken(access_token);
                    setRefreshToken(refresh_token)
                    setLoginStatus(LoginStatus.LOGGED_IN);
                    setCookie("refresh_token", refresh_token, { expires: 30 });
                });
            }
        }
    }, []);

    useEffect(() => {
        const storedRefreshToken = getCookie("refresh_token");

        if(storedRefreshToken) {
            setRefreshToken(storedRefreshToken);
        }
        setIsLoading(false);
    }, []);

    return (
        <UserLoginContext.Provider value={{ 
            loginStatus,
            startLogin,
            startRegister,
            logout,
            expireToken,
            token,
        }}>
            {loginStatus !== LoginStatus.INDETERMINATE && children}
        </UserLoginContext.Provider>
    )
}