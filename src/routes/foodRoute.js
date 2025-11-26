import express from 'express';
import {
    getAllFoods,
    getFoodById,
    createFood,
    updateFood,
    deleteFood
} from '../controller/foodController.js';

const router = express.Router();

router.get('/', getAllFoods);

router.get('/:id', getFoodById);

router.post('/', createFood);

router.put('/:id', updateFood);

router.delete('/:id', deleteFood);

export default router;
