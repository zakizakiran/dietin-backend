import jwt from 'jsonwebtoken';
import response from '../responseScheme.js';
import { findRefreshToken, deleteRefreshToken, findUserByEmail } from '../model/User.js';

const authorizeToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (token == null) {
        return response(res, {
            status: 400,
            message: "no token found in auth request header",
        });
    }

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, user) => {
        const userIsExist = await findUserByEmail(user?.email);
        if (!userIsExist) {
            return response(res, {
                status: 403,
                message: "user not exist",
            });
        }
        if (!userIsExist.refreshToken) {
            return response(res, {
                status: 403,
                message: "unauthorized",
            });
        }
        if (err)
            return response(res, {
                status: 403,
                message: "access token has expired or is invalid",
            });
        req.user = userIsExist;
        next();
    });
};

const refreshTokenHandler = async (req, res) => {
    const refreshToken = req.body.token;
    if (refreshToken == null) {
        return response(res, {
            status: 400,
            message: "No token found in request body",
        });
    }

    const user = (await findRefreshToken(refreshToken)) ?? null;
    if (!user) {
        return response(res, {
            status: 403,
            message: "Cannot make refresh token. User is logged out",
        });
    }

    const payload = {
        id: user.id,
        username: user.username,
        email: user.email,
    };

    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err) => {
        if (err) {
            response(res, { status: 403, message: "Invalid refresh token" });
        } else {
            const accessToken = createToken(payload);
            response(res, {
                status: 200,
                message: "Success refresh token",
                payload: { accessToken: accessToken },
            });
        }
    });
};

const createToken = (payload) => {
    return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
}

export { authorizeToken, refreshTokenHandler, createToken };
