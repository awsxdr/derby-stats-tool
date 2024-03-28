import { createBrowserRouter } from "react-router-dom";
import { RouterProvider, redirect } from 'react-router';
import { SheetEditor } from "./SheetEditor";
import { SplashPage } from "./SplashPage";
import { LoginStatus, useUserLoginContext } from "./UserLoginContext"
import { SettingsPage } from "./SettingsPage";

export const HomePage = () => {

    const { getLoginStatus } = useUserLoginContext();

    const router = createBrowserRouter([
        {
            path: '/',
            loader: () => getLoginStatus() === LoginStatus.LOGGED_IN ? redirect("/edit") : null,
            element: <SplashPage />
        },
        {
            path: '/edit',
            loader: () => getLoginStatus() === LoginStatus.LOGGED_IN ? null : redirect("/"),
            element: <SheetEditor />
        },
        {
            path: '/settings',
            loader: () => getLoginStatus() === LoginStatus.LOGGED_IN ? null : redirect("/"),
            element: <SettingsPage />
        }
    ]);

    return (
        <RouterProvider router={router} />
    )
}