import styles from './Footer.module.css';

export const Footer = () => {
    return (
        <div className={styles.footerContainer}>
            <span>
                This app is still in early development. Feedback and bug reports can be submitted <a href='https://discord.gg/U3dNQh5Avj' target='_blank'>on our Discord server</a>.
            </span>
        </div>
    )
}