import express from 'express';
import {
    addFoodLog,
    getFoodLogsByDate,
    getAllFoodLogs,
    deleteFoodLog
} from '../controller/foodLogController.js';

const router = express.Router();

router.post('/', addFoodLog);

router.get('/date', getFoodLogsByDate);

router.get('/', getAllFoodLogs);

router.delete('/:id', deleteFoodLog);

export default router;
