import { matchedData } from "express-validator";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { findUserByEmail, addRefreshToken } from "../model/User.js";

const handleLogin = async (req) => {
    try {
        const { email, password } = matchedData(req);

        if (!email || !password) {
            return {
                status: 400,
                message: "Email and password are required.",
            };
        }

        const foundUser = await findUserByEmail(email);

        if (!foundUser) {
            return {
                status: 401,
                message: "User not found.",
            };
        }

        const match = await bcrypt.compare(password, foundUser.password);
        if (!match) {
            return {
                status: 401,
                message: "Email or password is incorrect.",
            };
        }

        const accessToken = jwt.sign(
            { email: foundUser.email },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: "15m" }
        );

        const refreshToken = jwt.sign(
            { email: foundUser.email },
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: "7d" }
        );

        await addRefreshToken(email, refreshToken);

        return {
            status: 200,
            message: "Login successful.",
            payload: {
                accessToken,
                refreshToken,
            },
        };
    } catch (error) {
        console.error("Login error:", error);
        return {
            status: 500,
            message: "Internal server error.",
        };
    }
};

export default handleLogin;