import classNames from 'classnames';

import { ScoreLine } from '@contexts';

import styles from './ScoreRow.module.scss';
import { range } from '@/helperMethods';

interface ScoreRowProps {
    rowIndex: number;
    scores: ScoreLine;
    jamTotal: number;
    gameTotal: number;
}

export const ScoreRow = ({ rowIndex, scores, jamTotal, gameTotal }: ScoreRowProps) => {
    return (
        <div key={rowIndex} className={classNames(styles.row, styles.scoreRow, rowIndex % 2 === 0 ? styles.lightRow : styles.darkRow)}>
            <div className={styles.jamNumber}>{scores.jam}</div>
            <div className={styles.jammerNumber}>{scores.jammer}</div>
            <div className={styles.lost}>{scores.lost ? 'X' : ''}</div>
            <div className={styles.lead}>{scores.lead ? 'X' : ''}</div>
            <div className={styles.call}>{scores.call ? 'X' : ''}</div>
            <div className={styles.injury}>{scores.injury ? 'X' : ''}</div>
            <div className={styles.noInitial}>{scores.noInitial ? 'X' : ''}</div>
            {
                range(0, 8).map(t => (
                    <div className={styles.trip}>{scores.trips.length > t ? scores.trips[t] : ''}</div>
                ))
            }
            <div className={styles.jamTotal}>{scores.jam.trim() !== '' && jamTotal}</div>
            <div className={styles.gameTotal}>{scores.jam.trim() !== '' && gameTotal}</div>
        </div>
    );
}