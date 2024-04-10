import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Navbar, Tab, TabId, Tabs } from "@blueprintjs/core";
import classNames from "classnames";

import { ScoreSheet, ScoreOfficialsSheet, ValidityIcon } from "@components";
import { TeamType, useValidation } from "@contexts";

import sharedStyles from '@/Shared.module.scss';

export const ScoreSheetsContainer = () => {
    const { subTab: selectedTab } = useParams();
    const navigate = useNavigate();

    const [isTransitioning, setIsTransitioning] = useState(false);

    const { scoreValidity } = useValidation();

    useEffect(() => {
        if (!selectedTab) {
            navigate('/edit/score/p1home', { replace: true });
        }
    }, [selectedTab, navigate]);

    const handleTabChange = useCallback((tabId: TabId) => {
        navigate(`/edit/score/${tabId}`);
        setIsTransitioning(true);
    }, [navigate, setIsTransitioning]);

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
                    <Tab id='p1home'>Period 1 (Home)<ValidityIcon validity={scoreValidity.validity.home[1]} /></Tab>
                    <Tab id='p1away'>Period 1 (Away)<ValidityIcon validity={scoreValidity.validity.away[1]} /></Tab>
                    <Tab id='p2home'>Period 2 (Home)<ValidityIcon validity={scoreValidity.validity.home[2]} /></Tab>
                    <Tab id='p2away'>Period 2 (Away)<ValidityIcon validity={scoreValidity.validity.away[2]} /></Tab>
                    <Tab id='officials' title='Officials' />
                </Tabs>
            </Navbar>
            <div className={sharedStyles.tableContainer}>
                { body }
            </div>
        </>
        )
    }
  