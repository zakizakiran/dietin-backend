import express from "express";
import handleGetUserProfile from "../controller/userController.js";
import response from "../responseScheme.js";

const router = express.Router();
router.get("/", async (req, res) => {
    const result = await handleGetUserProfile(req);
    return response(res, result);
}
);

export default router;