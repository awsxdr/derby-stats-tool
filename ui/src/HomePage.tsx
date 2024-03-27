import { SheetEditor } from "./SheetEditor";
import { SplashPage } from "./SplashPage";
import { useUserLoginContext } from "./UserLoginContext"

export const HomePage = () => {

    const { isUserLoggedIn } = useUserLoginContext();

    return (
        <>
            { (isUserLoggedIn() ? <SheetEditor /> : <SplashPage /> )}
        </>
    )
}