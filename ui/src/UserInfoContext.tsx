import { PropsWithChildren, createContext, useContext, useEffect, useState } from "react";
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

export const UserInfoContextProvider = ({ children }: PropsWithChildren) => {

    const [user, setUser] = useState<UserDetails>();

    const { getToken, isUserLoggedIn } = useUserLoginContext();

    useEffect(() => {
        if(!isUserLoggedIn) {
            setUser(undefined);
            return;
        }

        getToken().then(token => {
            //if(token) { alert(token); }
            // fetch('https://stats.awsxdr.com/api/user', {
            //     method: 'GET',
            //     headers: [
            //         ['Authorization', `Bearer ${token}` ]
            //     ]
            // });
        });

    }, [isUserLoggedIn, setUser, getToken]);

    return (
        <UserInfoContext.Provider value={{ user }}>
            {children}
        </UserInfoContext.Provider>
    )
}