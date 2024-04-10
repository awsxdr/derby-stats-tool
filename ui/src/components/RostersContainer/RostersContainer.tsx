import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Navbar, Tab, TabId, Tabs } from "@blueprintjs/core";
import classNames from "classnames";

import { GameDetailsSheet, OfficialsRosterSheet, RosterSheet } from "@components";
import { TeamType } from "@/contexts";

import sharedStyles from '@/Shared.module.scss';

export const RostersContainer = () => {
    const { subTab: selectedTab } = useParams();
    const navigate = useNavigate();

    const [isTransitioning, setIsTransitioning] = useState(false);

    useEffect(() => {
        if (!selectedTab) {
            navigate('/edit/igrf/game', { replace: true });
        }
    }, [selectedTab, navigate]);

    const handleTabChange = (tabId: TabId) => {
        navigate(`/edit/igrf/${tabId}`);
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
                    <Tab id='game'>Game</Tab>
                    <Tab id='home'>Home</Tab>
                    <Tab id='away'>Away</Tab>
                    <Tab id='officials'>Officials</Tab>
                </Tabs>
            </Navbar>
            <div className={sharedStyles.tableContainer}>
                { body }
            </div>
        </>
    );
}
