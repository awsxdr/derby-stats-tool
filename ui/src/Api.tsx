import { PropsWithChildren, createContext, useContext, useMemo } from "react";
import { useUserLoginContext } from "./contexts/UserLoginContext";
import { DefaultGameState, GameState } from "./contexts/GameStateContext";

type DocumentResponse = {
    game: GameState,
    isDefault: boolean,
}

interface IApi {
    uploadBlankStatsBook: (fileName: string, fileContents: string) => Promise<void>,
    getBlankStatsBooks: () => Promise<string[]>,
    exportStatsBook: (game: GameState) => Promise<void>,
    getDocument: () => Promise<DocumentResponse>,
    setDocument: (game: GameState) => Promise<void>,
}

const Api = (getToken: () => Promise<string>): IApi => ({
    uploadBlankStatsBook: async (fileName: string, fileContents: string) => {
        await fetch('https://stats.awsxdr.com/api/stats/blank', {
            method: 'POST',
            headers: [["Authorization", `Bearer ${await getToken()}`]],
            body: JSON.stringify({
                filename: fileName,
                data: fileContents
            }),
        });
    },

    getBlankStatsBooks: async () => {
        const response = await fetch('https://stats.awsxdr.com/api/stats/blank', {
            method: 'GET',
            headers: [["Authorization", `Bearer ${await getToken()}`]],
        });

        const blankStatsBooks: string[] = await response.json();

        return blankStatsBooks;
    },

    exportStatsBook: async (game: GameState) => {
        const response = await fetch('https://stats.awsxdr.com/api/export', { 
            method: 'POST',
            body: JSON.stringify(game),
            headers: [["Authorization", `Bearer ${await getToken()}`]],
        });

        if (!response.ok) return;

        const blob = await response.blob();
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = 'stats.xlsx';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    },

    getDocument: async () => {
        try {
            const response = await fetch('https://stats.awsxdr.com/api/stats', {
                method: 'GET',
                headers: [["Authorization", `Bearer ${await getToken()}`]],
            });

            if(response.ok) {
                return { isDefault: false, game: await response.json() };
            } else {
                if(response.status === 404) {
                    return { isDefault: true, game: DefaultGameState() };
                } else {
                    throw new Error(`Unexpected status code: ${response.status}`);
                }
            }
        } catch(e) {
            console.log("Error!", e);
            return { isDefault: false, game: DefaultGameState() };
        }
    },

    setDocument: async (game: GameState) => {
        await fetch('https://stats.awsxdr.com/api/stats', {
            method: 'POST',
            body: JSON.stringify(game),
            headers: [["Authorization", `Bearer ${await getToken()}`]],
        });
    },
});

type ApiContextProps = {
    api?: IApi
}

const ApiContext = createContext<ApiContextProps>({});

export const useApiContext = () => useContext(ApiContext);

export const ApiProvider = ({ children }: PropsWithChildren) => {

    const { getToken } = useUserLoginContext();

    const api = useMemo(() => Api(getToken), [getToken]);

    return (
        <ApiContext.Provider value={{ api }}>
            { children }
        </ApiContext.Provider>
    )
}