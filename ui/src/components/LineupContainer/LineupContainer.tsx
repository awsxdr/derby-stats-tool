import { useMemo, useState } from "react";
import { Navbar, Tab, TabId, Tabs } from "@blueprintjs/core";
import classNames from "classnames";

import { LineupSheet, LineupOfficialsSheet } from "@components";
import { TeamType } from "@contexts";

import sharedStyles from '@/Shared.module.css';

export const LineupContainer = () => {
    const [selectedTab, setSelectedTab] = useState<TabId>('p1home');
    const [isTransitioning, setIsTransitioning] = useState(false);

    const handleTabChange = (tabId: TabId) => {
        setSelectedTab(tabId);
        setIsTransitioning(true);
    }

    const body = useMemo(() => {
        if(isTransitioning) {
            setTimeout(() => setIsTransitioning(false), 0);
            return (<></>);
        }

        switch(selectedTab) {
            case 'p1home':
                return (<LineupSheet teamType={TeamType.HOME} period={1} />);
            case 'p1away':
                return (<LineupSheet teamType={TeamType.AWAY} period={1} />);
            case 'p2home':
                return (<LineupSheet teamType={TeamType.HOME} period={2} />);
            case 'p2away':
                return (<LineupSheet teamType={TeamType.AWAY} period={2} />);
            case 'officials':
                return (<LineupOfficialsSheet />);
        }
    }, [selectedTab, isTransitioning, setIsTransitioning])

    return (
        <>
            <Navbar className={classNames(sharedStyles.subNavBar, sharedStyles.scrollableTabBar)} fixedToTop>
                <Tabs id='Tabs' onChange={handleTabChange} selectedTabId={selectedTab} renderActiveTabPanelOnly fill>
                    <Tab id='p1home' title='Period 1 (Home)' />
                    <Tab id='p1away' title='Period 1 (Away)' />
                    <Tab id='p2home' title='Period 2 (Home)' />
                    <Tab id='p2away' title='Period 2 (Away)' />
                    <Tab id='officials' title='Officials' />
                </Tabs>
            </Navbar>
            <div className={sharedStyles.tableContainer}>
                { body }
            </div>
        </>
    )
}
