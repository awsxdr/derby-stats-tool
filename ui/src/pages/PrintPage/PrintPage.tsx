import { PrintableIgrf, PrintableScore } from "@/components";
import { useGameContext } from "@/contexts";

import styles from './PrintPage.module.scss';
import { useEffect } from "react";
import { Spinner } from "@blueprintjs/core";

export const PrintPage = () => {

    const { gameState, isLoading } = useGameContext();

    useEffect(() => {
        if (!isLoading) {
            setTimeout(() => window.print(), 500);
        }
    }, [isLoading]);

    return (
        <div className={styles.printContainer}>
            {
                isLoading
                ? (
                    <div className={styles.loadingContainer}>
                        <Spinner />
                    </div>
                )
                : (
                    <div className={styles.printPages}>
                        <div className={styles.print}>
                            <PrintableIgrf game={gameState} />
                            <PrintableScore game={gameState} />
                        </div>
                    </div>
                )
            }
        </div>
    );
}