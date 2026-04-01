import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createExamPlan, clearCurrentPlan } from '../../features/exam/examSlice';
import StudyPlanMindMap from './StudyPlanMindMap';

const SetupExamForm = ({ onClose }) => {
    const dispatch = useDispatch();
    
    // ✅ වෙනස 1: මෙහිදී 'currentPlan' ලබා ගැනීම
    const { loading, error, currentPlan } = useSelector((state) => state.exam);

    const [planCategory, setPlanCategory] = useState('Official'); 
    const [dailyHours, setDailyHours] = useState(4);

    const [modules, setModules] = useState([
        {
            id: '', name: '', file: null, examDate: '', examTime: '', examType: 'final', difficulty: 'Medium', topics: ''
        }
    ]);

    const handleModuleChange = (index, field, value) => {
        const updatedModules = [...modules];
        updatedModules[index][field] = value;
        setModules(updatedModules);
    };

    const handleFileChange = (index, e) => {
        const updatedModules = [...modules];
        updatedModules[index].file = e.target.files[0];
        setModules(updatedModules);
    };

    const addModule = () => {
        setModules([...modules, {
            id: '', name: '', file: null, examDate: '', examTime: '', examType: 'final', difficulty: 'Medium', topics: ''
        }]);
    };

    const removeModule = (indexToRemove) => {
        const updatedModules = modules.filter((_, index) => index !== indexToRemove);
        setModules(updatedModules);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        const formData = new FormData();
        formData.append('student_id', '12345'); 
        formData.append('planCategory', planCategory);
        formData.append('dailyHours', dailyHours);
        
        formData.append('modulesData', JSON.stringify(modules.map(m => ({
            id: m.id,
            name: m.name,
            examDate: m.examDate,
            examTime: m.examTime,
            examType: m.examType,
            difficulty: m.difficulty,
            topics: m.topics.split(',').map(t => t.trim())
        }))));

        modules.forEach((mod) => {
            if (mod.file) {
                formData.append('outlines', mod.file);
            }
        });

        // මෙහිදී then() කොටස ඉවත් කර ඇත, මන්ද සාර්ථක වුවහොත් State එක වෙනස් වී Mindmap එක පෙන්වන බැවිනි.
        dispatch(createExamPlan(formData)); 
    };

    // අලුතින් Plan එකක් සෑදීමට අවශ්‍ය වූ විට
    const handleCreateNew = () => {
        dispatch(clearCurrentPlan());
        setModules([{ id: '', name: '', file: null, examDate: '', examTime: '', examType: 'final', difficulty: 'Medium', topics: '' }]);
    };

    return (
        <div className="modal-overlay">
            {/* Modal එකේ පළල වෙනස් කිරීම - Mind Map එකක් නම් ලොකුවට පෙන්වීම */}
            <div className="modal-content" style={{ maxWidth: currentPlan ? '1000px' : '800px', width: '100%' }}>
                <div className="modal-header">
                    <h2>{currentPlan ? "YOUR AI STUDY PLAN" : "SETUP YOUR STUDY PLANS"}</h2>
                    <button className="close-btn" onClick={onClose} disabled={loading}>
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
                
                {error && <div style={{color: 'red', marginBottom: '10px'}}>{error.error || error.message}</div>}

                {/* ✅ වෙනස 2: Conditional Rendering - දත්ත ඇත්නම් Mind Map එක, නැත්නම් Form එක පෙන්වීම */}
                {currentPlan ? (
                    
                    <div className="mindmap-container">
                        <StudyPlanMindMap aiPlanData={currentPlan} />
                        
                        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button className="btn-secondary" onClick={handleCreateNew}>Create New Plan</button>
                            <button className="btn-primary" onClick={onClose}>Done</button>
                        </div>
                    </div>

                ) : (

                    <form onSubmit={handleSubmit} className="exam-form">
                        
                        <div className="form-group" style={{ display: 'flex', gap: '20px' }}>
                            <label>
                                <input type="radio" value="Official" checked={planCategory === 'Official'} onChange={(e) => setPlanCategory(e.target.value)} /> Official
                            </label>
                            <label>
                                <input type="radio" value="Non-official" checked={planCategory === 'Non-official'} onChange={(e) => setPlanCategory(e.target.value)} /> Non-official
                            </label>
                        </div>

                        {modules.map((mod, index) => (
                            <div key={index} style={{ border: '1px solid #ccc', padding: '15px', marginBottom: '15px', borderRadius: '8px', position: 'relative' }}>
                                
                                {modules.length > 1 && (
                                    <button 
                                        type="button" 
                                        onClick={() => removeModule(index)} 
                                        style={{ position: 'absolute', top: '10px', right: '10px', background: 'transparent', color: 'red', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
                                    >
                                        - Remove
                                    </button>
                                )}

                                <div className="form-group input-row">
                                    <div>
                                        <label>Module ID & Name</label>
                                        <input type="text" placeholder="ID" value={mod.id} onChange={(e) => handleModuleChange(index, 'id', e.target.value)} required />
                                    </div>
                                    <div>
                                        <label>&nbsp;</label>
                                        <input type="text" placeholder="Name" value={mod.name} onChange={(e) => handleModuleChange(index, 'name', e.target.value)} required />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Upload Module Outline (PDF)</label>
                                    <input type="file" accept="application/pdf" onChange={(e) => handleFileChange(index, e)} />
                                </div>

                                <div className="form-group input-row">
                                    <div>
                                        <label>Exam Date & Time</label>
                                        <input type="date" value={mod.examDate} onChange={(e) => handleModuleChange(index, 'examDate', e.target.value)} required />
                                    </div>
                                    <div>
                                        <label>&nbsp;</label>
                                        <input type="time" value={mod.examTime} onChange={(e) => handleModuleChange(index, 'examTime', e.target.value)} required />
                                    </div>
                                </div>

                                <div className="form-group input-row">
                                    <div>
                                        <label>Exam Type</label>
                                        <select value={mod.examType} onChange={(e) => handleModuleChange(index, 'examType', e.target.value)}>
                                            <option value="Lab test">Lab test</option>
                                            <option value="VIVA">VIVA</option>
                                            <option value="MID">MID</option>
                                            <option value="FINAL">FINAL</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label>Module Difficulty</label>
                                        <select value={mod.difficulty} onChange={(e) => handleModuleChange(index, 'difficulty', e.target.value)}>
                                            <option value="Easy">Easy</option>
                                            <option value="Medium">Medium</option>
                                            <option value="Noob">Noob</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Cover Topics</label>
                                    <textarea placeholder="Topics add textbox" value={mod.topics} onChange={(e) => handleModuleChange(index, 'topics', e.target.value)} rows="2" required />
                                </div>
                            </div>
                        ))}

                        <button type="button" onClick={addModule} className="btn-secondary" style={{ marginBottom: '20px' }}>
                            + Add More Modules
                        </button>

                        <div className="form-group">
                            <label>Daily Commitment Hours</label>
                            <input type="number" min="1" value={dailyHours} onChange={(e) => setDailyHours(e.target.value)} required style={{ width: '100px' }}/>
                        </div>

                        <div className="form-actions">
                            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
                            <button type="submit" className="btn-primary" disabled={loading}>
                                {loading ? "Generating AI Plan..." : "CONFIRM / Generate Plan"}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default SetupExamForm;