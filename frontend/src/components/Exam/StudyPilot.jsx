import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { generateStudyMaterials } from "../../features/exam/examSlice";
import StudyPlanMindMap from './StudyPlanMindMap'; 
import '../../styles/StudyPilot.css'; 

const StudyPilot = () => {
    const dispatch = useDispatch();
    const [sources, setSources] = useState([]);
    
    const [chatHistory, setChatHistory] = useState([]);
    const [chatInput, setChatInput] = useState("");
    const [loadingAction, setLoadingAction] = useState(null);

    const handleFileUpload = (e) => {
        const files = Array.from(e.target.files);
        setSources((prev) => [...prev, ...files]);
    };

    const handleGenerate = async (actionType, customPrompt = "") => {
        if (sources.length === 0) {
            alert("Upload at least one PDF source to generate materials.");
            return;
        }

        const userMsg = customPrompt || `Please generate a ${actionType} based on the uploaded notes.`;
        
        setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
        setLoadingAction(actionType || 'Custom');
        setChatInput(""); 
        
        const formData = new FormData();
        formData.append('actionType', actionType || 'Custom');
        formData.append('chatPrompt', userMsg);
        sources.forEach(file => formData.append('outlines', file));

        try {
            const resultAction = await dispatch(generateStudyMaterials(formData)).unwrap();
            
            if (resultAction.success) {
                setChatHistory(prev => [...prev, { 
                    role: 'ai', 
                    type: actionType || 'Custom', 
                    data: resultAction.data 
                }]);
            } else {
                setChatHistory(prev => [...prev, { role: 'ai', type: 'error', text: resultAction.message || "An error occurred." }]);
            }
        } catch (error) {
            console.error(`Error generating:`, error);
            // අර සාමාන්‍ය පණිවිඩය වෙනුවට, Backend එකෙන් එන නියම Error එක පෙන්වමු! 👇
            const actualErrorMessage = error?.message || "System Error detected. Please try again.";
            setChatHistory(prev => [...prev, { role: 'ai', type: 'error', text: actualErrorMessage }]);
        } finally {
            setLoadingAction(null);
        }
    };

    // --- 1. Summary UI (Safe) ---
    const RenderSummary = ({ data }) => {
        if (!data || typeof data !== 'object') return <p style={{color: '#ef4444'}}>NO Summery data</p>;
        
        let safeData = data?.summaryTitle ? data : {};
        try { safeData = data?.summaryTitle ? data : (Object.values(data).find(v => v?.summaryTitle) || data); } catch(e){}

        return (
            <div className="rendered-content summary-content">
                <h2 className="content-title">{safeData.summaryTitle || "Document Summary"}</h2>
                <div className="summary-section">
                    <h3>Key Points</h3>
                    <ul>
                        {Array.isArray(safeData.keyPoints) ? safeData.keyPoints.map((p, i) => <li key={i}>{p}</li>) : <li>No key points</li>}
                    </ul>
                </div>
                <div className="summary-section detailed-summary">
                    <h3>Detailed Explanation</h3>
                    <p>{safeData.detailedSummary || "No details provided."}</p>
                </div>
            </div>
        );
    };

    // --- 2. Flashcards UI (Safe) ---
    const RenderFlashcards = ({ data }) => {
        if (!data || typeof data !== 'object') return <p style={{color: '#ef4444'}}>Flashcards  Empty</p>;
        
        let safeData = [];
        try { safeData = Array.isArray(data) ? data : (Object.values(data).find(v => Array.isArray(v)) || []); } catch(e){}
        if (!Array.isArray(safeData) || safeData.length === 0) return <p style={{color: '#ef4444'}}>Failed to generate Flashcards.</p>;

        return (
            <div className="rendered-content flashcards-grid">
                {safeData.map((card, i) => (
                    <FlashcardItem key={i} front={card?.front} back={card?.back} index={i+1} />
                ))}
            </div>
        );
    };

    const FlashcardItem = ({ front, back, index }) => {
        const [isFlipped, setIsFlipped] = useState(false);
        return (
            <div className={`flashcard ${isFlipped ? 'flipped' : ''}`} onClick={() => setIsFlipped(!isFlipped)}>
                <div className="flashcard-inner">
                    <div className="flashcard-front">
                        <span className="card-number">{index}</span>
                        <h4>{front || "Empty"}</h4><p className="flip-hint">Click to flip 🔄</p>
                    </div>
                    <div className="flashcard-back"><p>{back || "Empty"}</p></div>
                </div>
            </div>
        );
    };

    // --- 3. Advanced Quiz UI (Safe) ---
    const RenderQuiz = ({ data }) => {
        const [userAnswers, setUserAnswers] = useState({}); 
        const [isFinished, setIsFinished] = useState(false);

        if (!data || typeof data !== 'object') return <p style={{color: '#ef4444'}}>No Quiz data.</p>;
        
        let safeData = [];
        try { safeData = Array.isArray(data) ? data : (Object.values(data).find(v => Array.isArray(v)) || []); } catch(e){}
        if (!Array.isArray(safeData) || safeData.length === 0) return <p style={{color: '#ef4444'}}>Failed to generate Quiz.</p>;

        const handleOptionSelect = (qIndex, option) => {
            if (isFinished) return;
            setUserAnswers(prev => {
                const currentSelections = prev[qIndex] || [];
                if (currentSelections.includes(option)) return { ...prev, [qIndex]: currentSelections.filter(opt => opt !== option) };
                else return { ...prev, [qIndex]: [...currentSelections, option] };
            });
        };

        return (
            <div className="rendered-content quiz-content">
                <h2 className="content-title">Practice Quiz</h2>
                {safeData.map((q, i) => {
                    const selectedOptions = userAnswers[i] || [];
                    const optionsArray = Array.isArray(q?.options) ? q.options : [];
                    const correctAnswersArray = Array.isArray(q?.correctAnswers) ? q.correctAnswers : [];

                    return (
                        <div key={i} className="quiz-card">
                            <h4>{i + 1}. {q?.question || "Untitled Question"}</h4>
                            <p className="hint-text">(Select all that apply)</p>
                            <div className="quiz-options">
                                {optionsArray.map((opt, j) => {
                                    const isSelected = selectedOptions.includes(opt);
                                    const isActuallyCorrect = correctAnswersArray.includes(opt);
                                    let statusClass = "";
                                    if (isFinished) {
                                        if (isActuallyCorrect) statusClass = "correct-answer"; 
                                        else if (isSelected && !isActuallyCorrect) statusClass = "wrong-answer"; 
                                        else statusClass = "unselected-answer";
                                    } else if (isSelected) {
                                        statusClass = "selected";
                                    }
                                    return (
                                        <div key={j} className={`quiz-option-wrapper ${statusClass}`}>
                                            <label className="quiz-option-label">
                                                <input type="checkbox" checked={isSelected} onChange={() => handleOptionSelect(i, opt)} disabled={isFinished} />
                                                {opt}
                                            </label>
                                            {isFinished && q?.explanations && q.explanations[opt] && (
                                                <div className="option-explanation">↳ {q.explanations[opt]}</div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
                {!isFinished && <button className="finish-quiz-btn" onClick={() => setIsFinished(true)}>FINISH QUIZ</button>}
            </div>
        );
    };

    // --- 4. Content Mindmap UI (Safe) ---
    const RenderMindmap = ({ data }) => {
        if (!data || typeof data !== 'object') return <p style={{color: '#ef4444'}}>Mindmap දත්ත නොමැත.</p>;
        
        let safeData = data?.nodes ? data : {};
        try { safeData = data?.nodes ? data : (Object.values(data).find(v => v?.nodes) || data); } catch(e){}

        return (
            <div className="rendered-content mindmap-content" style={{ height: '500px' }}>
                <h2 className="content-title">Knowledge Mind Map</h2>
                <StudyPlanMindMap aiPlanData={safeData} />
            </div>
        );
    };

    const renderChatBubble = (msg, index) => {
        if (msg.role === 'user') return <div key={index} className="chat-bubble user-bubble">{msg.text}</div>;
        if (msg.type === 'error') return <div key={index} className="chat-bubble ai-bubble error-bubble">{msg.text}</div>;

        return (
            <div key={index} className="chat-bubble ai-bubble">
                {msg.type === 'Summary' && <RenderSummary data={msg.data} />}
                {msg.type === 'Flashcards' && <RenderFlashcards data={msg.data} />}
                {msg.type === 'Quiz' && <RenderQuiz data={msg.data} />}
                {msg.type === 'Mindmap' && <RenderMindmap data={msg.data} />}
                {msg.type === 'Custom' && <pre>{JSON.stringify(msg.data, null, 2)}</pre>}
            </div>
        );
    };

    return (
        <div className="study-pilot-container">
            <div className="pilot-panel left-panel">
                <div className="panel-header">
                    <h3>Sources</h3>
                    <div className="source-count">{sources.length}</div>
                </div>
                <label className="upload-btn">
                    <span className="material-symbols-outlined">add</span> Add PDF source
                    <input type="file" multiple accept=".pdf" onChange={handleFileUpload} style={{ display: 'none' }} />
                </label>
                <div className="sources-list">
                    {sources.map((file, idx) => (
                        <div key={idx} className="source-item">📄 {file.name}</div>
                    ))}
                </div>
            </div>

            <div className="pilot-panel middle-panel chat-interface">
                <div className="chat-history">
                    {chatHistory.length === 0 ? (
                        <div className="empty-middle-state">
                            <h2>Welcome to Study Pilot Chat</h2>
                            <p>Upload a source document and select a tool from the Studio, or type your request below!</p>
                        </div>
                    ) : (
                        chatHistory.map((msg, idx) => renderChatBubble(msg, idx))
                    )}
                    {loadingAction && (
                        <div className="chat-bubble ai-bubble loading-bubble">
                            <div className="spinner"></div> generating {loadingAction}...
                        </div>
                    )}
                </div>
                
                <div className="chat-input-area">
                    <input type="text" placeholder="Ask me to generate a quiz, summarize notes..." value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleGenerate('Custom', chatInput)} />
                    <button onClick={() => handleGenerate('Custom', chatInput)}><span className="material-symbols-outlined">send</span></button>
                </div>
            </div>

            <div className="pilot-panel right-panel">
                <div className="panel-header"><h3>Studio Quick Actions</h3></div>
                <div className="studio-grid">
                    <button className="studio-card" onClick={() => handleGenerate('Summary')} disabled={loadingAction !== null}>Summary</button>
                    <button className="studio-card" onClick={() => handleGenerate('Flashcards')} disabled={loadingAction !== null}>Flashcards</button>
                    <button className="studio-card" onClick={() => handleGenerate('Quiz')} disabled={loadingAction !== null}>Quiz (MCQ)</button>
                    <button className="studio-card" onClick={() => handleGenerate('Mindmap')} disabled={loadingAction !== null}>Knowledge Map</button>
                </div>
            </div>
        </div>
    );
};

export default StudyPilot;