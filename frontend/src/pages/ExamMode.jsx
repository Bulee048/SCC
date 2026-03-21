import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import SetupExamForm from '../components/Exam/SetupExamForm';
import '../styles/ExamMode.css';

const ExamMode = () => {
    // Redux store >> currentExam
    const { currentExam } = useSelector((state) => state.exam);
    const [showSetup, setShowSetup] = useState(false);

    const todayFormatted = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    const todayStr = new Date().toISOString().split('T')[0];

    // 
    const todaysWork = currentExam?.dailyPlan?.find(p => p.date === todayStr);

    return (
        <div className="scc-exam-layout">
            {/* --- SIDEBAR --- */}
            <aside className="scc-sidebar">
                <div className="sidebar-brand">
                    <span className="material-symbols-outlined brand-icon">bolt</span>
                    <h2>SCC EXAM MODE</h2>
                </div>

                <div className="sidebar-user">
                    <img 
                        src="https://ui-avatars.com/api/?name=Mithun+Madusanka&background=81a1c6&color=fff&bold=true" 
                        alt="Profile" 
                        className="user-avatar" 
                    />
                    <div className="user-info">
                        <h4>Mithun Madusanka</h4>
                        <p>Student Account</p>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <a href="#" className="nav-item active">
                        <span className="material-symbols-outlined">dashboard</span> Student Dashboard
                    </a>
                    <a href="#" className="nav-item" onClick={() => setShowSetup(true)}>
                        <span className="material-symbols-outlined">edit_calendar</span> Setup Your Exams
                    </a>
                    <a href="#" className="nav-item">
                        <span className="material-symbols-outlined">event_note</span> Planning & Preparation
                    </a>
                    <a href="#" className="nav-item">
                        <span className="material-symbols-outlined">hub</span> Creator Hub
                    </a>
                    {/* The O.R.A.C.L.E link removed from here */}
                </nav>

                <div className="sidebar-footer">
                    <div className="system-health">
                        <p className="status-label">SYSTEM HEALTH</p>
                        <div className="status-indicator">
                            <span className="dot online"></span>
                            <span>System Online</span> {/* Changed text since O.R.A.C.L.E is removed */}
                        </div>
                    </div>
                </div>
            </aside>

            {/* --- MAIN CONTENT --- */}
            <main className="scc-main-container">
                {/* Top Header */}
                <header className="scc-top-header">
                    <div className="search-bar">
                        <span className="material-symbols-outlined">search</span>
                        <input type="text" placeholder="Search exams, resources, or topics..." />
                    </div>
                    <div className="header-actions">
                        <span className="material-symbols-outlined">notifications</span>
                        <span className="material-symbols-outlined">settings</span>
                    </div>
                </header>

                <div className="scc-content-scroll">
                    {/* Clock */}
                    <section className="doomsday-section">
                        <h3 className="doomsday-title">FINAL EXAMS</h3>
                        <div className="clock-grid">
                            <div className="clock-box"><h1>12</h1><p>DAYS</p></div>
                            <div className="clock-box"><h1>08</h1><p>HOURS</p></div>
                            <div className="clock-box"><h1>45</h1><p>MINUTES</p></div>
                            <div className="clock-box"><h1>12</h1><p>SECONDS</p></div>
                        </div>
                    </section>

                    <div className="dashboard-grid">
                        {/* Tasks Section */}
                        <div className="tasks-column">
                            <div className="section-header">
                                <h2 className="section-title">WHAT SHOULD I DO TODAY</h2>
                                <span className="date-tag">{todayFormatted}</span>
                            </div>

                            <div className="task-list">
                                {!currentExam ? (
                                    <div className="empty-tasks-msg">
                                        <p style={{ color: '#94a3b8' }}>No active exams. Click "Setup Your Exams" to generate a plan.</p>
                                    </div>
                                ) : todaysWork && todaysWork.topics.length > 0 ? (
                                    todaysWork.topics.map((topic, i) => (
                                        <div key={i} className={`scc-task-card ${i === 0 ? 'priority' : ''}`}>
                                            <input type="checkbox" className="task-check" />
                                            <div className="task-details">
                                                <h4>{topic}</h4>
                                                <p>{currentExam.module_name} • Daily Session</p>
                                            </div>
                                            {i === 0 && <span className="priority-tag">PRIORITY</span>}
                                        </div>
                                    ))
                                ) : (
                                    <div className="empty-tasks-msg">
                                        <p style={{ color: '#94a3b8' }}>No specific tasks for today. Great job keeping up! 🎉</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Column Stats */}
                        <div className="stats-column">
                            <div className="scc-card readiness-card">
                                <div className="card-header">
                                    <p>READINESS SCORE</p>
                                    <span className="material-symbols-outlined">analytics</span>
                                </div>
                                {/* Readiness score dynamically */}
                                <h1>{currentExam?.readinessScore || 0}<span>%</span></h1>
                                <p className="growth-text">Based on your plan</p>
                                <div className="progress-container">
                                    <div className="progress-bar" style={{ width: `${currentExam?.readinessScore || 0}%` }}></div>
                                </div>
                            </div>
                            
                            {/* O.R.A.C.L.E. AI Chat card completely removed from here */}
                            
                        </div>
                    </div>
                </div>
            </main>
            
            {showSetup && <SetupExamForm onClose={() => setShowSetup(false)} />}
        </div>
    );
};

export default ExamMode;