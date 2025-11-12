import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { refreshTokenHandler } from './middleware/authorization.js';
dotenv.config();

const app = express();
const PORT = process.env.PORT;

app.use(cors());
app.use(express.json());

import registerRoute from './routes/registerRoute.js';
import loginRoute from './routes/loginRoute.js';

app.use(express.json());
app.use(logger);
app.use('/register', registerRoute);
app.use('/login', loginRoute);

function logger(req, res, next) {
    console.log(`[${new Date().toString()}] - ${req.method} ${req.path}`);
    next();
}

app.post("/token", (req, res) => {
    refreshTokenHandler(req, res);
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
