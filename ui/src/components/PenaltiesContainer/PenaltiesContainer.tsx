import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Navbar, Tab, TabId, Tabs } from "@blueprintjs/core";
import classNames from "classnames";

import { PenaltyOfficialsSheet, PenaltySheet, ValidityIcon } from "@components";
import { TeamType, useValidation } from '@contexts';

import sharedStyles from '@/Shared.module.scss';

export const PenaltiesContainer = () => {
    const { subTab: selectedTab } = useParams();
    const navigate = useNavigate();

    const [isTransitioning, setIsTransitioning] = useState(false);

    const { penaltyValidity } = useValidation();

    useEffect(() => {
        if (!selectedTab) {
            navigate('/edit/penalties/p1home', { replace: true });
        }
    }, [selectedTab, navigate]);

    const handleTabChange = (tabId: TabId) => {
        navigate(`/edit/penalties/${tabId}`);
        setIsTransitioning(true);
    }

    const body = useMemo(() => {
        if(isTransitioning) {
            setTimeout(() => setIsTransitioning(false), 0);
            return (<></>);
        }

        switch(selectedTab) {
            case 'p1home':
                return (<PenaltySheet teamType={TeamType.HOME} period={1} />);
            case 'p1away':
                return (<PenaltySheet teamType={TeamType.AWAY} period={1} />);
            case 'p2home':
                return (<PenaltySheet teamType={TeamType.HOME} period={2} />);
            case 'p2away':
                return (<PenaltySheet teamType={TeamType.AWAY} period={2} />);
            case 'officials':
                return (<PenaltyOfficialsSheet />);
        }
    }, [selectedTab, isTransitioning, setIsTransitioning])

    return (
        <>
            <Navbar className={classNames(sharedStyles.subNavBar, sharedStyles.scrollableTabBar)} fixedToTop>
                <Tabs id='Tabs' onChange={handleTabChange} selectedTabId={selectedTab} renderActiveTabPanelOnly fill>
                    <Tab id='p1home'>Period 1 (Home)<ValidityIcon validity={penaltyValidity.validity.home[1]} /></Tab>
                    <Tab id='p1away'>Period 1 (Away)<ValidityIcon validity={penaltyValidity.validity.away[1]} /></Tab>
                    <Tab id='p2home'>Period 2 (Home)<ValidityIcon validity={penaltyValidity.validity.home[2]} /></Tab>
                    <Tab id='p2away'>Period 2 (Away)<ValidityIcon validity={penaltyValidity.validity.away[2]} /></Tab>
                    <Tab id='officials' title='Officials' />
                </Tabs>
            </Navbar>
            <div className={sharedStyles.tableContainer}>
                { body }
            </div>
        </>
    )
}
