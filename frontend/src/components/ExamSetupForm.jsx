import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const ExamSetupForm = () => {
  const [subjects, setSubjects] = useState('');
  const [examDate, setExamDate] = useState('');
  const [hours, setHours] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const subjectArray = subjects.split(',').map(s => s.trim());
      const formData = {
        subjects: subjectArray,
        examDate,
        availableHoursPerDay: hours,
        userPreferences: "Focus on problem solving" // ඔබට තව fields එකතු කළ හැක
      };

      // Backend API එකට Call කිරීම
      const response = await axios.post('/api/exam-plan/generate-plan', formData);
      
      if (response.data.success) {
        // Generate වූ Mind Map data Dashboard එකට pass කිරීම
        // (State management හරහා හෝ URL through pass කළ හැක)
        navigate('/dashboard', { state: { mindMapData: response.data.data } });
      }
    } catch (error) {
      console.error("Error generating plan:", error);
      alert("Plan එක generate කිරීමේදී දෝෂයක් ඇති විය.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Setup your exam (Setup Your Exam)</h2>
      <form onSubmit={handleGenerate}>
        <div>
          <label>Subjects (separate by ,):</label><br />
          <input type="text" value={subjects} onChange={(e) => setSubjects(e.target.value)} required placeholder="උදා: Physics, Chemistry" />
        </div>
        <br />
        <div>
          <label>Exam date:</label><br />
          <input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} required />
        </div>
        <br />
        <div>
          <label>hrs per day (Hr):</label><br />
          <input type="number" value={hours} onChange={(e) => setHours(e.target.value)} required min="1" />
        </div>
        <br />
        <button type="submit" disabled={loading}>
          {loading ? 'Genarating...' : ' (Generate Plan)'}
        </button>
      </form>
    </div>
  );
};

export default ExamSetupForm;