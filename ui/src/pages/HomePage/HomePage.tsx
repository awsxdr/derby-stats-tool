import { createBrowserRouter } from "react-router-dom";
import { RouterProvider, redirect } from 'react-router';

import { LoginStatus, useUserLoginContext } from "@contexts";
import { SplashPage, SheetEditorPage, SettingsPage } from "@pages";

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
            element: <SheetEditorPage />
        },
        {
            path: '/settings',
            loader: () => getLoginStatus() === LoginStatus.LOGGED_IN ? null : redirect("/"),
            element: <SettingsPage />
        },
    ]);

    return (
        <RouterProvider router={router} />
    )
}