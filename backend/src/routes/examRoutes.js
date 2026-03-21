import express from 'express';
import { generateExamPlan } from '../controllers/examPlanController.js';


const router = express.Router();

// මෙතන '/generate-plan' වෙනුවට '/setup' ලෙස වෙනස් කරන්න
router.post('/setup', generateExamPlan); 

export default router;