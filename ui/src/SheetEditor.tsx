import { Alert, Alignment, Button, Intent, Menu, MenuItem, Navbar, Popover, Tab, TabId, Tabs, Tooltip } from '@blueprintjs/core'
import { useCallback, useState } from 'react';
import { DefaultGameState, useGameContext } from './GameStateContext';
import { RostersContainer } from './RostersContainer';
import { ScoreSheetsContainer } from './ScoreSheetsContainer';
import { PenaltiesContainer } from './PenaltiesContainer';
import { LineupContainer } from './LineupContainer';
import { useUserLoginContext } from './UserLoginContext';
import styles from './SheetEditor.module.css';

export const SheetEditor = () => {
    const [selectedTab, setSelectedTab] = useState<TabId>('igrf');
    const [isConfirmNewOpen, setIsConfirmNewOpen] = useState(false);
    const { gameState, setGameState } = useGameContext();
    const { logout } = useUserLoginContext();
  
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

    const downloadFile = () => {
        fetch('/api/export', { 
            method: 'POST',
            body: JSON.stringify(gameState),
        }).then(response => {
            response.blob().then(blob => {
                const link = document.createElement('a');
                link.href = window.URL.createObjectURL(blob);
                link.download = 'stats.xlsx';

                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            })
        })
    }

    const UserMenu = () => (
        <Menu>
            <MenuItem text='Logout' onClick={logout} />
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
                        <Button intent='none' minimal icon='download' onClick={downloadFile} />
                    </Tooltip>
                    <Navbar.Divider />
                </Navbar.Group>
                <Navbar.Group align={Alignment.RIGHT}>
                    <Button minimal icon='cog' />
                    <Popover content={<UserMenu />} placement='bottom-start'>
                        <Button minimal icon='user' />
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
        </>
    );
}