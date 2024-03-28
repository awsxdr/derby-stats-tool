import { PropsWithChildren, createContext, useCallback, useContext, useEffect, useState } from "react";
import { LoginStatus, useUserLoginContext } from "./UserLoginContext";
import { useApiContext } from "./Api";

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

    const { getToken, getLoginStatus } = useUserLoginContext();

    const getUserData = useCallback(async () => {
        const token = await getToken();

        const userInfoResponse = await fetch('https://auth.awsxdr.com/oauth2/userInfo', {
            method: 'GET',
            headers: [
                ['Authorization', `Bearer ${token}` ]
            ]
        });

        if (!userInfoResponse.ok) {
            return;
        }

        const info: UserInfo = await userInfoResponse.json();

        setUser({
            id: info.username,
            email: info.email,
            blankStatsbooks: (await api?.getBlankStatsBooks() ?? []).map(s => ({ filename: s, id: '' })),
        });
    }, [getToken, setUser, api]);

    useEffect(() => {
        if(getLoginStatus() !== LoginStatus.LOGGED_IN) {
            setUser(undefined);
            return;
        }

        getUserData();
    }, [getLoginStatus, setUser, getUserData]);

    return (
        <UserInfoContext.Provider value={{ user }}>
            {children}
        </UserInfoContext.Provider>
    );
}