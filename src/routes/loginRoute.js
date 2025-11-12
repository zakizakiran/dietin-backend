import express from 'express';
import { body } from 'express-validator';
import handleLogin from '../controller/loginController.js';
import { default as response } from '../responseScheme.js';

const router = express.Router();

router.post(
    '/',
    [
        body('email').isEmail().withMessage('Invalid email'),
        body('password').notEmpty().withMessage('Password is required')
    ],
    async (req, res) => {
        const result = await handleLogin(req);
        return response(res, result);
    }
);

export default router;