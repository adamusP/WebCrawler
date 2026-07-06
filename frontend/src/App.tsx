import React, { useState } from 'react';
import styles from './App.module.css';

export default function App() {
    const [activeView, setActiveView] = useState<'executions' | 'graph'>('executions');
    const [selectedWebsiteId, setSelectedWebsiteId] = useState<string | null>(null);

    return (
        <div className={styles.appContainer}>

            <aside className={styles.sidebar}>
                <div className={styles.sectionHeader}>
                    <h2>Web Entries</h2>
                    <button className={styles.button}>Add</button>
                </div>

                <div className={styles.placeholderList}>
                    <p>List WebEntries</p>
                </div>
            </aside>

            <main className={styles.mainContent}>

                <div className={styles.viewSwitcher}>
                    <button
                        className={activeView === 'executions' ? styles.switchBtnActive : styles.switchBtn}
                        onClick={() => setActiveView('executions')}
                    >
                        Executions
                    </button>
                    <button
                        className={activeView === 'graph' ? styles.switchBtnActive : styles.switchBtn}
                        onClick={() => setActiveView('graph')}
                    >
                        Graph
                    </button>
                </div>

                {activeView === 'executions' ? (
                    <section className={styles.container}>
                        <h2>Executions</h2>
                        <div className={styles.placeholderContent}>Executions table</div>
                    </section>
                ) : (
                    <section className={styles.container}>
                        <h2>Cytoscape Visualization</h2>
                        <div className={styles.placeholderContent}>
                            Cytoscape.js Canvas
                        </div>
                    </section>
                )}

            </main>
        </div>
    );
}