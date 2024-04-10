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

const Api = (token: string, expireToken: () => void): IApi => ({
    uploadBlankStatsBook: async (fileName: string, fileContents: string) => {
        const response = await fetch('https://stats.awsxdr.com/api/stats/blank', {
            method: 'POST',
            headers: [["Authorization", `Bearer ${token}`]],
            body: JSON.stringify({
                filename: fileName,
                data: fileContents
            }),
        });

        if(!response.ok) {
            if (response.status === 401) {
                expireToken();
            }
            throw new Error(`Upload failed. Status code: ${response.status}`);
        }
    },

    getBlankStatsBooks: async () => {
        const response = await fetch('https://stats.awsxdr.com/api/stats/blank', {
            method: 'GET',
            headers: [["Authorization", `Bearer ${token}`]],
        });

        const blankStatsBooks: string[] = await response.json();

        return blankStatsBooks;
    },

    exportStatsBook: async (game: GameState) => {
        const response = await fetch('https://stats.awsxdr.com/api/export', { 
            method: 'POST',
            body: JSON.stringify(game),
            headers: [["Authorization", `Bearer ${token}`]],
        });

        if (!response.ok) {
            if (response.status === 401) {
                expireToken();
            }
            throw new Error("Failed to export stats book");
        }

        const blob = await response.blob();
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);

        const statsBookName = 
            !!game.rosters.home.team && !!game.rosters.away.team
            ? `STATS-${game.game.date}_${game.rosters.home.league.replace(/\s/g, '')}${game.rosters.home.team.replace(/\s/g, '')}_vs_${game.rosters.away.league.replace(/\s/g, '')}${game.rosters.away.team.replace(/\s/g, '')}.xlsx`
            : 'statsbook.xlsx';

        link.download = statsBookName;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    },

    getDocument: async () => {
        try {
            const response = await fetch('https://stats.awsxdr.com/api/stats', {
                method: 'GET',
                headers: [["Authorization", `Bearer ${token}`]],
            });

            if(response.ok) {
                return { isDefault: false, game: await response.json() };
            } else {
                if(response.status === 404) {
                    return { isDefault: true, game: DefaultGameState() };
                } else {
                    if (response.status === 401) {
                        expireToken();
                    }
        
                    throw new Error(`Unexpected status code: ${response.status}`);
                }
            }
        } catch(e) {
            return { isDefault: false, game: DefaultGameState() };
        }
    },

    setDocument: async (game: GameState) => {
        const response = await fetch('https://stats.awsxdr.com/api/stats', {
            method: 'POST',
            body: JSON.stringify(game),
            headers: [["Authorization", `Bearer ${token}`]],
        });

        if (!response.ok) {
            if (response.status === 401) {
                expireToken();
            }

            throw new Error(`Error uploading changes. Status code: ${response.status}`);
        }
    },
});

type ApiContextProps = {
    api?: IApi
}

const ApiContext = createContext<ApiContextProps>({});

export const useApiContext = () => useContext(ApiContext);

export const ApiProvider = ({ children }: PropsWithChildren) => {

    const { token, expireToken } = useUserLoginContext();

    const api = useMemo(() => token ? Api(token, expireToken) : undefined, [token, expireToken]);

    return (
        <ApiContext.Provider value={{ api }}>
            { children }
        </ApiContext.Provider>
    )
}