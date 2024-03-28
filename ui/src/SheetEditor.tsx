import { Alert, Alignment, Button, Intent, Menu, MenuDivider, MenuItem, Navbar, Popover, Tab, TabId, Tabs, Tooltip } from '@blueprintjs/core'
import { useCallback, useState } from 'react';
import { DefaultGameState, useGameContext } from './GameStateContext';
import { RostersContainer } from './RostersContainer';
import { ScoreSheetsContainer } from './ScoreSheetsContainer';
import { PenaltiesContainer } from './PenaltiesContainer';
import { LineupContainer } from './LineupContainer';
import { useUserLoginContext } from './UserLoginContext';
import styles from './Shared.module.css';
import { useUserInfoContext } from './UserInfoContext';
import { useApiContext } from './Api';
import { useNavigate } from 'react-router';

export const SheetEditor = () => {
    const [selectedTab, setSelectedTab] = useState<TabId>('igrf');
    const [isConfirmNewOpen, setIsConfirmNewOpen] = useState(false);
    const [isWarnNoBlankStatsOpen, setIsWarnNoBlankStatsOpen] = useState(false);

    const { gameState, setGameState } = useGameContext();
    const { logout } = useUserLoginContext();
    const { user } = useUserInfoContext();
    const { api } = useApiContext();
    const navigate = useNavigate();
  
    const handleTabChange = (tabId: TabId) => {
      setSelectedTab(tabId);
    }
  
    const confirmNew = useCallback(() => {
      setIsConfirmNewOpen(true);
    }, [setIsConfirmNewOpen]);
  
    const handleConfirmNewCancel = useCallback(() => setIsConfirmNewOpen(false), [setIsConfirmNewOpen]);
    const handleConfirmNewConfirm = useCallback(() => {
      setGameState(DefaultGameState());
      setIsConfirmNewOpen(false);
    }, [setGameState, setIsConfirmNewOpen]);

    const closeWarnNoBlankStats = useCallback(() => setIsWarnNoBlankStatsOpen(false), [setIsWarnNoBlankStatsOpen]);
    const openSettings = useCallback(() => navigate('/settings'), [navigate]);

    const downloadFile = useCallback(() => {
        if (user?.blankStatsbooks.length ?? 0 > 0) {
            api?.exportStatsBook(gameState);
        } else {
            setIsWarnNoBlankStatsOpen(true);
        }
    }, [gameState, api, user, setIsWarnNoBlankStatsOpen]);

    const UserMenu = () => (
        <Menu>
            <MenuItem text='Settings' icon='cog' href='/settings' />
            <MenuDivider />
            <MenuItem text='Logout' icon='log-out' onClick={logout} />
        </Menu>
    );

    return (
        <>
            <Navbar fixedToTop>
                <Navbar.Group align={Alignment.LEFT} className={styles.logo}>
                    <Navbar.Heading>DerbyStats</Navbar.Heading>
                    <Navbar.Divider />
                </Navbar.Group>
                <Navbar.Group align={Alignment.LEFT}>
                    <Tooltip content="Clear data" placement='bottom'>
                        <Button intent='none' minimal icon='document' onClick={confirmNew} />
                    </Tooltip>
                    <Tooltip content="Import stats book or JSON" placement='bottom'>
                        <Button intent='none' minimal icon='folder-open' disabled />
                    </Tooltip>
                    <Tooltip content="Download stats book" placement='bottom'>
                        <Button intent='none' minimal icon='download' onClick={downloadFile} disabled={!user} />
                    </Tooltip>
                    <Navbar.Divider />
                </Navbar.Group>
                <Navbar.Group align={Alignment.RIGHT}>
                    <Popover content={<UserMenu />} placement='bottom-start'>
                        <Button minimal icon='menu' />
                    </Popover>
                </Navbar.Group>
                <Tabs 
                    id='MainTabs' 
                    onChange={handleTabChange} 
                    selectedTabId={selectedTab} 
                    className={styles.scrollableTabBar} 
                    renderActiveTabPanelOnly 
                    large 
                    fill
                >
                    <Tab id='igrf' title='IGRF' panel={<RostersContainer />} />
                    <Tab id='score' title='Score' panel={<ScoreSheetsContainer />} />
                    <Tab id='penalties' title='Penalties' panel={<PenaltiesContainer />} />
                    <Tab id='lineup' title='Lineups' panel={<LineupContainer />} />
                </Tabs>
            </Navbar>
            <Alert
                cancelButtonText='Cancel'
                confirmButtonText='Erase'
                intent={Intent.DANGER}
                isOpen={isConfirmNewOpen}
                onCancel={handleConfirmNewCancel}
                onConfirm={handleConfirmNewConfirm}
            >
                <p>Are you sure you wish to erase all data and start a new stats book?</p>
            </Alert>
            <Alert
                cancelButtonText='Cancel'
                confirmButtonText='Open Settings'
                intent={Intent.WARNING}
                isOpen={isWarnNoBlankStatsOpen}
                onCancel={closeWarnNoBlankStats}
                onConfirm={openSettings}
            >
                <p>No blank stats book has been configured. Please go to the settings screen to upload one.</p>
                <p>Blank stats books can be <a href='https://community.wftda.org/resources/document-libraries/competition-documents#statsbook' target='_blank'>downloaded from WFTDA</a></p>
            </Alert>
        </>
    );
}