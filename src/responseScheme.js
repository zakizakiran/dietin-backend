const response = (res, data) => {
    return res.status(data.statusCode).json({
        status: data.status,
        message: data.message,
        response: {
            payload: data?.payload,
        },
    });
}

module.exports = response;