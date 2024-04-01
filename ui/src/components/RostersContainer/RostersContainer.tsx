import { useMemo, useState } from "react";
import { Navbar, Tab, TabId, Tabs } from "@blueprintjs/core";
import classNames from "classnames";

import { GameDetailsSheet, OfficialsRosterSheet, RosterSheet } from "@components";
import { TeamType } from "@/contexts";

import sharedStyles from '@/Shared.module.css';

export const RostersContainer = () => {
    const [selectedTab, setSelectedTab] = useState<TabId>('game');
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
            case 'game':
                return (<GameDetailsSheet />);
            case 'officials':
                return (<OfficialsRosterSheet />);
            case 'home':
                return (<RosterSheet teamType={TeamType.HOME} />);
            case 'away':
                return (<RosterSheet teamType={TeamType.AWAY} />);
        }
    }, [selectedTab, isTransitioning, setIsTransitioning])

    return (
        <>
            <Navbar className={classNames(sharedStyles.subNavBar, sharedStyles.scrollableTabBar)} fixedToTop>
                <Tabs id='Tabs' onChange={handleTabChange} selectedTabId={selectedTab} renderActiveTabPanelOnly fill>
                    <Tab id='game' title='Game' />
                    <Tab id='home' title='Home' />
                    <Tab id='away' title='Away' />
                    <Tab id='officials' title='Officials' />
                </Tabs>
            </Navbar>
            <div className={sharedStyles.tableContainer}>
                { body }
            </div>
        </>
    );
}