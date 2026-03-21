import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createExamPlan } from '../../features/exam/examSlice'; // නිවැරදි Import එක

const SetupExamForm = ({ onClose }) => {
    const dispatch = useDispatch();
    const { loading, error } = useSelector((state) => state.exam);

    const [formData, setFormData] = useState({
        student_id: '12345', // දැනට dummy ID එකක්. පස්සේ Auth වලින් එන ID එක දාන්න
        module_Id: '',
        module_name: '',
        examDate: '',
        exam_Type: 'final',
        coverage_Topics: '',
        difficulty: 2,
        availableHoursPerDay: 4
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Topics ටික array එකක් බවට පත් කිරීම
        const topicsArray = formData.coverage_Topics.split(',').map(topic => topic.trim());
        const dataToSend = { ...formData, coverage_Topics: topicsArray };
        
        // Redux හරහා Backend එකට දත්ත යැවීම
        dispatch(createExamPlan(dataToSend)).then((res) => {
            if(!res.error) {
                onClose(); // සාර්ථක වුණොත් විතරක් Form එක close වෙනවා
            }
        });
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>Setup Your Exams</h2>
                    <button className="close-btn" onClick={onClose} disabled={loading}>
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
                
                {error && <div style={{color: 'red', marginBottom: '10px', fontSize: '12px'}}>{error.error || error.message || "An error occurred"}</div>}

                <form onSubmit={handleSubmit} className="exam-form">
                    <div className="form-group">
                        <label>Module ID & Name</label>
                        <div className="input-row">
                            <input type="text" name="module_Id" placeholder="e.g. IT3010" onChange={handleChange} required />
                            <input type="text" name="module_name" placeholder="Module Name" onChange={handleChange} required />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Exam Date & Type</label>
                        <div className="input-row">
                            <input type="date" name="examDate" onChange={handleChange} required />
                            <select name="exam_Type" onChange={handleChange}>
                                <option value="midterm">Midterm</option>
                                <option value="final">Final</option>
                                <option value="repeat">Repeat</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Coverage Topics (Comma separated)</label>
                        <textarea 
                            name="coverage_Topics" 
                            placeholder="e.g. Greedy Algorithms, Dynamic Programming, Graphs" 
                            onChange={handleChange} 
                            required 
                            rows="3"
                        />
                    </div>

                    <div className="form-group input-row">
                        <div>
                            <label>Difficulty (1-3)</label>
                            <input type="number" name="difficulty" min="1" max="3" value={formData.difficulty} onChange={handleChange} />
                        </div>
                        <div>
                            <label>Hours Per Day</label>
                            <input type="number" name="availableHoursPerDay" min="1" max="24" value={formData.availableHoursPerDay} onChange={handleChange} required />
                        </div>
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? "Generating Plan..." : "Generate Plan"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SetupExamForm;