import { body } from 'express-validator';
import express from 'express';
import handleRegister from '../controller/registerController.js';
import response from '../responseScheme.js';

const router = express.Router();

router.post(
    '/',
    [
        body('name').notEmpty().withMessage('Name is required'),
        body('email').isEmail().withMessage('Invalid email'),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 chars'),
        body('confirmPassword').notEmpty().withMessage('Confirm Password is required')
    ],
    async (req, res) => {
        const result = await handleRegister(req);
        return response(res, result);
    }
);

export default router;
