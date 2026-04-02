// backend/src/routes/studyPilotRoutes.js
import express from 'express';
import multer from 'multer';
import { generatePilotMaterials } from '../controllers/studyPilotController.js';

const router = express.Router();

// Memory Storage භාවිතා කිරීම මගින් ෆයිල් එක කෙලින්ම Buffer එකක් විදිහට Controller එකට යවයි
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// මෙතන upload.array('outlines') කියන එක අනිවාර්යයි!
// ඒකෙන් තමයි React එකෙන් එවන 'outlines' කියන නම තියෙන ෆයිල්ස් ටික අල්ලගන්නේ.
router.post('/generate', upload.array('outlines'), generatePilotMaterials);

export default router;