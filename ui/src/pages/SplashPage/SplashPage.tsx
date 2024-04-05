import { Alignment, Button, Card, Intent, Navbar } from "@blueprintjs/core";

import { useUserLoginContext } from "@contexts";

import background from '@/public/home_background.png';

import styles from './SplashPage.module.css';

export const SplashPage = () => {

    const { startLogin, startRegister } = useUserLoginContext();

    return (
        <>
            <Navbar fixedToTop>
                <Navbar.Group align={Alignment.LEFT}>
                    <Navbar.Heading>DerbyStats</Navbar.Heading>
                </Navbar.Group>
                <Navbar.Group align={Alignment.RIGHT}>
                    <Button intent={Intent.PRIMARY} onClick={startRegister}>Register</Button>
                    <Button minimal onClick={startLogin}>Login</Button>
                </Navbar.Group>
            </Navbar>
            <div className={styles.backgroundContainer}>
                <div className={styles.backgroundImageContainerOuter}>
                    <div className={styles.backgroundImageContainerInner}>
                        <img src={background} className={styles.backgroundImage} />
                    </div>
                </div>
            </div>
            <div className={styles.bodyContainer}>
                <Card className={styles.bodyCard} elevation={2}>
                    <h2>Welcome to DerbyStats!</h2>
                    <p>DerbyStats is an interactive platform for creating and editing roller derby stats books.</p>
                    <p>It is currently in early development and so there are likely to be bugs and missing features. However, please feel free to sign up and have a play around. We're very keen to receive any feedback (positive or negative), and would love to hear what features you would like to see in future.</p>
                    <Button intent={Intent.PRIMARY} onClick={startRegister}>Register for an account</Button>
                </Card>
            </div>
        </>
    );
}