import { createBrowserRouter } from "react-router-dom";
import { RouterProvider, redirect } from 'react-router';

import { LoginStatus, useUserLoginContext } from "@contexts";
import { SplashPage, SheetEditorPage, SettingsPage, PrintPage } from "@pages";

export const HomePage = () => {

    const { loginStatus } = useUserLoginContext();

    const router = createBrowserRouter([
        {
            path: '/',
            loader: () => loginStatus === LoginStatus.LOGGED_IN ? redirect("/edit/igrf/game") : null,
            element: <SplashPage />
        },
        {
            path: '/edit',
            loader: () => redirect('/edit/igrf/game'),
        },
        {
            path: '/edit/:tab/:subTab?',
            loader: () => loginStatus === LoginStatus.LOGGED_IN ? null : redirect("/"),
            element: <SheetEditorPage />
        },
        {
            path: '/settings',
            loader: () => loginStatus === LoginStatus.LOGGED_IN ? null : redirect("/"),
            element: <SettingsPage />
        },
        {
            path: '/print',
            loader: () => loginStatus === LoginStatus.LOGGED_IN ? null : redirect("/"),
            element: <PrintPage />
        },
    ]);

    return (
        <RouterProvider router={router} />
    )
}