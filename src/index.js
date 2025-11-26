import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { refreshTokenHandler, authorizeToken, logoutHandler } from './middleware/authorization.js';
import registerRoute from './routes/registerRoute.js';
import loginRoute from './routes/loginRoute.js';
import onboardRoute from './routes/onboardRoute.js';
import userRoute from './routes/userRoute.js';
import foodRoute from './routes/foodRoute.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT;

app.use(cors());
app.use(express.json());


app.use(express.json());
app.use(logger);
app.use('/register', registerRoute);
app.use('/login', loginRoute);
app.use('/onboard', onboardRoute);
app.use('/user', authorizeToken, userRoute);
app.use('/foods', foodRoute);
app.delete('/logout', async (req, res) => {
    await logoutHandler(req, res);
});

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
