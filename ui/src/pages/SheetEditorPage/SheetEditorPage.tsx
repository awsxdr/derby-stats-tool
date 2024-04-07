import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Alert, Alignment, Button, Card, Icon, Intent, Menu, MenuDivider, MenuItem, Navbar, Overlay2, Popover, Spinner, Tab, TabId, Tabs, Tooltip } from '@blueprintjs/core'

import { AppToaster, Footer, ImportDialog, LineupContainer, PenaltiesContainer, RostersContainer, ScoreSheetsContainer } from '@components';
import { DefaultGameState, useGameContext, useUserInfoContext, useUserLoginContext } from '@contexts';
import { useApiContext } from '@/Api';

import styles from './SheetEditorPage.module.scss';
import classNames from 'classnames';

export const SheetEditorPage = () => {
    const [selectedTab, setSelectedTab] = useState<TabId>('igrf');
    const [isConfirmNewOpen, setIsConfirmNewOpen] = useState(false);
    const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
    const [isWarnNoBlankStatsOpen, setIsWarnNoBlankStatsOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    const { gameState, setGameState, isLoading, isDirty, isFaulted, retryUpload } = useGameContext();
    const { logout } = useUserLoginContext();
    const { user } = useUserInfoContext();
    const { api } = useApiContext();
    const navigate = useNavigate();

    const showSpinner = useMemo(() => !user || isLoading, [user, isLoading]);
  
    const handleTabChange = (tabId: TabId) => {
        setSelectedTab(tabId);
    }
  
    const confirmNew = useCallback(() => {
        setIsConfirmNewOpen(true);
    }, [setIsConfirmNewOpen]);

    const importDocument = useCallback(() => {
        setIsImportDialogOpen(true);
    }, [setIsImportDialogOpen]);
  
    const handleConfirmNewCancel = useCallback(() => setIsConfirmNewOpen(false), [setIsConfirmNewOpen]);
    const handleConfirmNewConfirm = useCallback(() => {
        setGameState(DefaultGameState());
        setIsConfirmNewOpen(false);
    }, [setGameState, setIsConfirmNewOpen]);

    const closeWarnNoBlankStats = useCallback(() => setIsWarnNoBlankStatsOpen(false), [setIsWarnNoBlankStatsOpen]);
    const openSettings = useCallback(() => navigate('/settings'), [navigate]);

    const downloadFile = useCallback(() => {
        if (user?.blankStatsbooks.length ?? 0 > 0) {
            setIsExporting(true);
            api?.exportStatsBook(gameState)
            ?.catch(() => AppToaster.then(toaster => toaster.show({ message: 'Failed to export document', intent: Intent.DANGER })))
            .finally(() => setIsExporting(false));
        } else {
            setIsWarnNoBlankStatsOpen(true);
        }
    }, [gameState, api, user, setIsWarnNoBlankStatsOpen, setIsExporting]);

    const handleImportClose = useCallback(() => {
        setIsImportDialogOpen(false);
    }, [setIsImportDialogOpen]);

    const UserMenu = () => (
        <Menu>
            <MenuItem text='Print' icon='print' href='/print' target='_blank' />
            <MenuDivider />
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
                    <Tooltip content="Import stats book" placement='bottom'>
                        <Button intent='none' minimal icon='folder-open' onClick={importDocument} />
                    </Tooltip>
                    <Tooltip content="Download stats book" placement='bottom'>
                        <Button intent='none' minimal icon='download' onClick={downloadFile} disabled={!user} loading={isExporting} />
                    </Tooltip>
                    <Navbar.Divider />
                </Navbar.Group>
                <Navbar.Group align={Alignment.RIGHT}>
                    {(
                        isFaulted ? <Button minimal icon='cloud-upload' intent='danger' onClick={retryUpload} />
                        : isDirty ? <Icon icon='cloud-upload' intent='warning' className={classNames(styles.uploadingStatus, styles.statusIcon)} />
                        : <Icon icon='cloud-tick' intent='success' className={styles.statusIcon} />
                    )}
                    
                    <Popover content={<UserMenu />} placement='bottom-start'>
                        <Button minimal icon='menu' />
                    </Popover>
                </Navbar.Group>
                { !isLoading &&
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
                }
            </Navbar>
            <Overlay2 isOpen={showSpinner}>
                <div>
                    <div className={styles.loadingContainer}>
                        <Card>
                            <Spinner />
                        </Card>
                    </div>
                </div>
            </Overlay2>
            <Footer />
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
            <ImportDialog isOpen={isImportDialogOpen} onClose={handleImportClose} />
        </>
    );
}