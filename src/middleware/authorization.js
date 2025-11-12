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
    refreshToken ?? null;
    if (refreshToken == null) {
        return response(res, { status: 400, message: "no token found in request body" });
    }
    const user = (await findRefreshToken(refreshToken)) ?? "";
    console.log(user);
    try {
        jwt.verify(
            user.refreshToken,
            process.env.REFRESH_TOKEN_SECRET,
            async (err, decoded) => {
                if (err) {
                    response(res, { status: 403, message: "invalid refresh token" });
                } else {
                    await deleteRefreshToken(decoded.id);
                    response(res, { status: 200, message: "success logout" });
                }
            }
        );
    } catch (err) {
        console.log(err);
        response(res, { status: 500, message: "internal server error" });
    }
};


export { authorizeToken, refreshTokenHandler, createToken, logoutHandler };
