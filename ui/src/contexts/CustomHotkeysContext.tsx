import { HotkeyConfig, HotkeysContextInstance } from "@blueprintjs/core";
import { shallowCompareKeys } from "@blueprintjs/core/lib/esm/common/utils/compareUtils";
import { PropsWithChildren, createContext, useContext, useReducer } from "react";

interface HotkeysContextState {
    hasProvider: boolean;
    hotkeys: HotkeyConfig[];
    isDialogOpen: boolean;
}

type HotkeysAction =
    | { type: "ADD_HOTKEYS" | "REMOVE_HOTKEYS"; payload: HotkeyConfig[] }
    | { type: "CLOSE_DIALOG" | "OPEN_DIALOG" };

const DEFAULT_HOTKEYS_STATE = (): HotkeysContextState => ({ hasProvider: false, hotkeys: [], isDialogOpen: false });

const hotkeysReducer = (state: HotkeysContextState, action: HotkeysAction) => {
    switch (action.type) {
        case "ADD_HOTKEYS": {
            // only pick up unique hotkeys which haven't been registered already
            const newUniqueHotkeys = [];
            for (const a of action.payload) {
                let isUnique = true;
                for (const b of state.hotkeys) {
                    isUnique &&= !shallowCompareKeys(a, b, { exclude: ["onKeyDown", "onKeyUp"] });
                }
                if (isUnique) {
                    newUniqueHotkeys.push(a);
                }
            }
            return {
                ...state,
                hotkeys: [...state.hotkeys, ...newUniqueHotkeys],
            };
        }
        case "REMOVE_HOTKEYS": {
            return {
                ...state,
                hotkeys: state.hotkeys.filter(key => action.payload.indexOf(key) === -1),
            };
        }
        default:
            return state;
    }
}

const HotkeysContextWithoutDialog = createContext<HotkeysContextInstance>([DEFAULT_HOTKEYS_STATE(), () => {}]);

export const useCustomHotkeysContext = () => useContext(HotkeysContextWithoutDialog);

export const HotkeysProviderWithoutDialog = ({ children }: PropsWithChildren) => {
    const [, dispatch] = useReducer(hotkeysReducer, { ... DEFAULT_HOTKEYS_STATE(), hasProvider: true });

    return (
        <HotkeysContextWithoutDialog.Provider value={[DEFAULT_HOTKEYS_STATE(), dispatch]}>
            { children }
        </HotkeysContextWithoutDialog.Provider>
    )
}