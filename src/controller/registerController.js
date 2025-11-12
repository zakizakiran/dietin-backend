import { matchedData, validationResult } from 'express-validator';
import { Prisma } from '@prisma/client';
import { createAccount } from '../model/User.js';
import bcrypt from 'bcrypt';

const handleRegister = async (req) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
        return {
            status: 400,
            message: 'Invalid inputs',
            payload: result.array()
        };
    }

    const { name, email, password, confirmPassword } = matchedData(req);

    if (password !== confirmPassword) {
        return {
            status: 400,
            message: 'Password and Confirm Password do not match',
        };
    }

    const saltRounds = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, saltRounds);

    const newUser = {
        name,
        email,
        password: hashPassword,
    };

    try {
        const user = await createAccount(newUser);
        return {
            status: 201,
            message: 'Account created successfully',
            payload: {
                id: user.id,
                name: user.name,
                email: user.email,
            }
        };
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2002') {
                return {
                    status: 409,
                    message: 'Email already in use',
                };
            }
        }
        return {
            status: 500,
            message: 'Internal Server Error',
            payload: error.message
        };
    }
};

export default handleRegister;
