import { PropsWithChildren, createContext, useCallback, useContext, useEffect, useState } from "react";
import { useUserLoginContext } from "./UserLoginContext";

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

    console.log(user);

    const { getToken, isUserLoggedIn } = useUserLoginContext();

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
            blankStatsbooks: []
        });
    }, [getToken, setUser]);

    useEffect(() => {
        if(!isUserLoggedIn) {
            setUser(undefined);
            return;
        }

        getUserData();
    }, [isUserLoggedIn, setUser, getUserData]);

    return (
        <UserInfoContext.Provider value={{ user }}>
            {children}
        </UserInfoContext.Provider>
    )
}