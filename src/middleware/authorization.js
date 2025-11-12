import jwt from 'jsonwebtoken';
import response from '../responseScheme.js';
import { findRefreshToken, deleteRefreshToken, findUserByEmail, addRefreshToken } from '../model/User.js';

const authorizeToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (token == null) {
        return response(res, {
            status: 401,
            message: "no token found in auth request header",
        });
    }

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, decoded) => {
        if (err) {
            if (err.name === 'TokenExpiredError') {
                return response(res, {
                    status: 401,
                    message: "access token has expired",
                    code: "TOKEN_EXPIRED"
                });
            }
            return response(res, {
                status: 403,
                message: "access token is invalid",
            });
        }

        const userIsExist = await findUserByEmail(decoded?.email);
        if (!userIsExist) {
            return response(res, {
                status: 403,
                message: "user not exist",
            });
        }
        if (!userIsExist.refreshToken) {
            return response(res, {
                status: 403,
                message: "user is logged out",
            });
        }

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

    let decoded;
    try {
        decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    } catch (err) {
        return response(res, {
            status: 403,
            message: "Refresh token has expired or is invalid"
        });
    }

    const user = (await findRefreshToken(refreshToken)) ?? null;
    if (!user) {
        return response(res, {
            status: 403,
            message: "Cannot make refresh token. User is logged out",
        });
    }

    if (decoded.email !== user.email) {
        return response(res, {
            status: 403,
            message: "Token mismatch"
        });
    }

    const payload = {
        id: user.id,
        username: user.username,
        email: user.email,
    };

    const newAccessToken = createToken(payload);

    const newRefreshToken = jwt.sign(
        payload,
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: "7d" }
    );

    try {
        await addRefreshToken(user.email, newRefreshToken);

        response(res, {
            status: 200,
            message: "Success refresh token",
            payload: {
                accessToken: newAccessToken,
                refreshToken: newRefreshToken
            },
        });
    } catch (error) {
        return response(res, {
            status: 500,
            message: "Failed to update refresh token"
        });
    }
};

const createToken = (payload) => {
    return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
}

const logoutHandler = async (req, res) => {
    const refreshToken = req.body.token;

    if (!refreshToken) {
        return response(res, {
            status: 400,
            message: "no token found in request body"
        });
    }

    let decoded;

    try {
        decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    } catch (err) {
        return response(res, {
            status: 403,
            message: "invalid or expired refresh token"
        });
    }

    const user = await findRefreshToken(refreshToken);
    if (!user) {
        return response(res, {
            status: 403,
            message: "token not found or user already logged out"
        });
    }

    if (decoded.email !== user.email) {
        return response(res, {
            status: 403,
            message: "token mismatch"
        });
    }

    try {
        await deleteRefreshToken(user.id);
        return response(res, {
            status: 200,
            message: "success logout"
        });
    } catch (err) {
        console.error("Logout error:", err);
        return response(res, {
            status: 500,
            message: "failed to logout"
        });
    }
};


export { authorizeToken, refreshTokenHandler, createToken, logoutHandler };
