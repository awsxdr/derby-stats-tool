import classNames from 'classnames';
import styles from './Signature.module.scss';

interface SignatureProps {
    title: string;
    skateName: string;
    legalName: string;
}

export const Signature = ({ title, skateName, legalName }: SignatureProps) => (
    <div className={styles.signature}>
        <div className={classNames(styles.dark, styles.head)}>{title}</div>
        <div className={classNames(styles.row)}>
            <div className={styles.dark}>Skate Name:</div>
            <div>{skateName}</div>
        </div>
        <div className={classNames(styles.row)}>
            <div className={styles.dark}>Legal Name:</div>
            <div>{legalName}</div>
        </div>
        <div className={classNames(styles.row, styles.signatureRow)}>
            <div className={styles.dark}>Signature:</div>
            <div className={styles.light}></div>
        </div>
    </div>
)