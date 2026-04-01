import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api'; // ✅ Use the existing interceptor (adjust path if needed)

// Send request to Backend API 
export const createExamPlan = createAsyncThunk(
    'exam/createExamPlan',
    async (formData, thunkAPI) => {
        try {
            //Axios Automatically creationg Content-Type & boundary while sending formdata
            const response = await api.post('/api/exams/setup', formData);
            return response.data;
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response?.data || "Something went wrong");
        }
    }
);

//Study Pilot - Updated with proper headers and error handling
export const generateStudyMaterials = createAsyncThunk(
    'exam/generateStudyMaterials',
    async (formData, thunkAPI) => {
        try {
            const response = await api.post('/api/study-pilot/generate', formData, {
                // මෙතන අනිවාර්යයෙන්ම multipart/form-data තිබිය යුතුයි
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            return response.data;
        } catch (error) {
            // දෝෂය අල්ලාගෙන ඒක එහෙම්මම UI එකට යවනවා
            return thunkAPI.rejectWithValue(error.response?.data || { message: "Network Error - Unable to connect to the server." });
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
                // put action.payload.data into currentPlan 
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