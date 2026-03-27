import express from 'express';
import multer from 'multer';
import { generateExamPlan } from '../controllers/examPlanController.js';

const router = express.Router();

// Multer වින්‍යාස කිරීම (PDF files memory එකේ තබාගෙන Python එකට යැවීමට)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// මෙතැන ඇති upload.array('outlines') කියන කොටස අනිවාර්යයි! 
// ඒකෙන් තමයි Frontend එකෙන් එන FormData එක කියවලා req.body සහ req.files හදලා දෙන්නේ.
router.post('/setup', upload.array('outlines'), generateExamPlan); 

export default router;