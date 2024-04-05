import { PropsWithChildren, createContext, useCallback, useContext, useEffect, useState } from "react";
import { LoginStatus, useUserLoginContext } from "./UserLoginContext";
import { useApiContext } from "@/Api";
import { AppToaster } from "@/components";
import { Intent } from "@blueprintjs/core";

type BlankStatsBookDetails = {
    filename: string,
    id: string,
}

type UserDetails = {
    id: string,
    email: string,
    blankStatsbooks: BlankStatsBookDetails[],
}

interface UserInfoContextProps {
    user?: UserDetails,
}

const UserInfoContext = createContext<UserInfoContextProps>({ 
});

export const useUserInfoContext = () => useContext(UserInfoContext);

type UserInfo = {
    email: string,
    username: string,
};

export const UserInfoContextProvider = ({ children }: PropsWithChildren) => {

    const [user, setUser] = useState<UserDetails>();

    const { api } = useApiContext();

    const { token, loginStatus } = useUserLoginContext();

    const getUserData = useCallback(async () => {
        const userInfoResponse = await fetch('https://auth.awsxdr.com/oauth2/userInfo', {
            method: 'GET',
            headers: [
                ['Authorization', `Bearer ${token}` ]
            ]
        });

        if (!userInfoResponse.ok) {
            (await AppToaster).show({ message: 'Failed to retrieve user data. Please refresh the page', intent: Intent.DANGER });
            return;
        }

        const info: UserInfo = await userInfoResponse.json();

        setUser({
            id: info.username,
            email: info.email,
            blankStatsbooks: (await api?.getBlankStatsBooks() ?? []).map(s => ({ filename: s, id: '' })),
        });
    }, [token, setUser, api]);

    useEffect(() => {
        if(loginStatus !== LoginStatus.LOGGED_IN) {
            setUser(undefined);
            return;
        }

        if (token) {
            getUserData();
        }
    }, [token, loginStatus, setUser, getUserData]);

    console.log("Setting user value");

    return (
        <UserInfoContext.Provider value={{ user }}>
            {children}
        </UserInfoContext.Provider>
    );
}