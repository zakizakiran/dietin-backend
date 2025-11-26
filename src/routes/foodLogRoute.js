import express from 'express';
import {
    addFoodLog,
    getFoodLogsByDate,
    getAllFoodLogs,
    deleteFoodLog
} from '../controller/foodLogController.js';

const router = express.Router();

// POST - Add food log
router.post('/', addFoodLog);

// GET - Get food logs by date
router.get('/date', getFoodLogsByDate);

// GET - Get all food logs
router.get('/', getAllFoodLogs);

// DELETE - Delete food log
router.delete('/:id', deleteFoodLog);

export default router;
