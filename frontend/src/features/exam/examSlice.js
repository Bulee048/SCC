import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api'; // ✅ Use the existing interceptor (adjust path if needed)
import { refreshAccessToken } from '../auth/authSlice';

// Backend API එකට Request එක යැවීම
export const createExamPlan = createAsyncThunk(
    'exam/createExamPlan',
    async (formData, thunkAPI) => {
        try {
            // ✅ වෙනස: මෙතැන තිබුණු headers {...} කොටස සම්පූර්ණයෙන්ම ඉවත් කර ඇත.
            // FormData යවද්දී Axios ඉබේම නිවැරදි Content-Type සහ Boundary සකස් කරගනී.
            const response = await api.post('/api/exams/setup', formData);
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
                // ✅ වෙනස: කෙළින්ම action.payload.data එක currentPlan එකට දමන්න
                state.currentPlan = action.payload.data; 
                state.error = null;
            })
            .addCase(createExamPlan.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const { clearCurrentPlan } = examSlice.actions;
export default examSlice.reducer;