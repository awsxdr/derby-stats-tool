import { Navbar, Tab, TabId, Tabs } from "@blueprintjs/core";
import { useState } from "react";
import { RosterSheet } from "./RosterSheet";
import { TeamType } from "./GameStateContext";

export const RostersContainer = () => {
    const [selectedTab, setSelectedTab] = useState<TabId>('home');
  
    const handleTabChange = (tabId: TabId) => {
      setSelectedTab(tabId);
    }
  
    return (
      <Navbar className='subNavBar' fixedToTop>
        <Tabs id='Tabs' onChange={handleTabChange} selectedTabId={selectedTab} renderActiveTabPanelOnly fill>
          <Tab id='home' title='Home' panel={<RosterSheet teamType={TeamType.HOME} />} />
          <Tab id='away' title='Away' panel={<RosterSheet teamType={TeamType.AWAY} />} />
        </Tabs>
      </Navbar>
    )
  }
  