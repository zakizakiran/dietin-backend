import { findUserWithAllergies } from "../model/User.js";

const handleGetUserProfile = async (req) => {
    try {
        const userId = req.user.id;
        const foundUser = await findUserWithAllergies(req.user.email);
        if (!foundUser || foundUser.id !== userId) {
            return {
                status: 404,
                message: "User not found.",
            };
        }

        const allergiesData = foundUser.allergies.length > 0
            ? foundUser.allergies[0].allergy
            : [];

        return {
            status: 200,
            message: "User profile retrieved successfully.",
            payload: {
                id: foundUser.id,
                name: foundUser.name,
                email: foundUser.email,
                birthDate: foundUser.birthDate,
                height: foundUser.height,
                weight: foundUser.weight,
                mainGoal: foundUser.mainGoal,
                weightGoal: foundUser.weightGoal,
                activityLevel: foundUser.activityLevel,
                gender: foundUser.gender,
                allergies: allergiesData,
            },
        };
    } catch (error) {
        console.error("Get user profile error:", error);
        return {
            status: 500,
            message: "Internal server error.",
        };
    }
};

export default handleGetUserProfile;
