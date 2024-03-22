import { Navbar, Tab, TabId, Tabs } from "@blueprintjs/core";
import { useState } from "react";
import { PenaltySheet } from "./PenaltySheet";
import { TeamType } from "./GameStateContext";

export const PenaltiesContainer = () => {
    const [selectedTab, setSelectedTab] = useState<TabId>('p1home');
  
    const handleTabChange = (tabId: TabId) => {
      setSelectedTab(tabId);
    }
  
    return (
      <Navbar className='subNavBar' fixedToTop>
        <Tabs id='Tabs' onChange={handleTabChange} selectedTabId={selectedTab} renderActiveTabPanelOnly fill>
          <Tab id='p1home' title='Period 1 (Home)' panel={<PenaltySheet teamType={TeamType.HOME} period={1} />} />
          <Tab id='p1away' title='Period 1 (Away)' panel={<PenaltySheet teamType={TeamType.AWAY} period={1} />} />
          <Tab id='p2home' title='Period 2 (Home)' panel={<PenaltySheet teamType={TeamType.HOME} period={2} />} />
          <Tab id='p2away' title='Period 2 (Away)' panel={<PenaltySheet teamType={TeamType.AWAY} period={2} />} />
        </Tabs>
      </Navbar>
    )
  }
  