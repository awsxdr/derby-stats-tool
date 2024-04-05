import { useCallback, useMemo, useState } from "react";
import { Navbar, Tab, TabId, Tabs } from "@blueprintjs/core";
import classNames from "classnames";

import { ScoreSheet, ScoreOfficialsSheet } from "@components";
import { TeamType } from "@contexts";

import sharedStyles from '@/Shared.module.scss';

export const ScoreSheetsContainer = () => {
    const [selectedTab, setSelectedTab] = useState<TabId>('p1home');
    const [isTransitioning, setIsTransitioning] = useState(false);

    const handleTabChange = useCallback((tabId: TabId) => {
        setSelectedTab(tabId);
        setIsTransitioning(true);
    }, [setSelectedTab, setIsTransitioning]);

    const body = useMemo(() => {
        if(isTransitioning) {
            setTimeout(() => setIsTransitioning(false), 0);
            return (<></>);
        }

        switch(selectedTab) {
            case 'p1home':
                return (<ScoreSheet teamType={TeamType.HOME} period={1} />);
            case 'p1away':
                return (<ScoreSheet teamType={TeamType.AWAY} period={1} />);
            case 'p2home':
                return (<ScoreSheet teamType={TeamType.HOME} period={2} />);
            case 'p2away':
                return (<ScoreSheet teamType={TeamType.AWAY} period={2} />);
            case 'officials':
                return (<ScoreOfficialsSheet />);
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
  