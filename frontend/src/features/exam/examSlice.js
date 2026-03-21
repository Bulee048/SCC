import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api'; // ✅ Use the existing interceptor (adjust path if needed)
import { refreshAccessToken } from '../auth/authSlice';

// Backend API එකට Request එක යැවීම
export const createExamPlan = createAsyncThunk(
    'exam/createExamPlan',
    async (examData, thunkAPI) => {
        try {
            // ✅ No need to manually attach token — the api interceptor handles it automatically
            const response = await api.post('/api/exams/setup', examData);
            return response.data;
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response?.data || "Something went wrong");
        }
    }
);

const examSlice = createSlice({
    name: 'exam',
    initialState: {
        upcomingExams: [],
        currentExam: null,
        currentPlan: null,
        loading: false,
        error: null,
    },
    reducers: {
        clearCurrentPlan: (state) => {
            state.currentPlan = null;
            state.currentExam = null;
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(createExamPlan.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createExamPlan.fulfilled, (state, action) => {
                state.loading = false;
                const examData = action.payload.examDetails || action.payload;
                state.currentExam = examData;
                state.upcomingExams.push(examData);
                state.currentPlan = action.payload.planData || examData.dailyPlan;
            })
            .addCase(createExamPlan.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const { clearCurrentPlan } = examSlice.actions;
export default examSlice.reducer;