import express from "express"
import { body, validationResult } from "express-validator";
import handleOnboard from "../controller/onboardController.js";
import response from "../responseScheme.js";
import { authorizeToken } from "../middleware/authorization.js";

const router = express.Router();

router.post(
    "/",
    authorizeToken,
    [
        body("birthDate").optional().isISO8601().withMessage("Birth date must be a valid date."),
        body("height").isFloat({ min: 0 }).withMessage("Height must be a positive number."),
        body("weight").isFloat({ min: 0 }).withMessage("Weight must be a positive number."),
        body("mainGoal").optional().isString().withMessage("Main goal must be a string."),
        body("weightGoal").optional().isFloat({ min: 0 }).withMessage("Weight goal must be a positive number."),
        body("gender").isIn(["Male", "Female"]).withMessage("Gender must be either Male or Female."),
        body("activityLevel").optional().isString().withMessage("Activity level must be a string."),
        body("allergies").optional().isArray().withMessage("Allergies must be an array.")
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const result = await handleOnboard(req);
        return response(res, result);
    }
);

export default router;
