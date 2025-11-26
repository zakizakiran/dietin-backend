import { findUserWithAllergies, addUserInformation, upsertAllergies } from "../model/User.js";

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

const handleUpdateUserProfile = async (req) => {
    try {
        const userId = req.user.id;
        const {
            name,
            birthDate,
            height,
            weight,
            mainGoal,
            weightGoal,
            activityLevel,
            gender,
            allergies
        } = req.body;

        const foundUser = await findUserWithAllergies(req.user.email);
        if (!foundUser || foundUser.id !== userId) {
            return {
                status: 404,
                message: "User not found.",
            };
        }

        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (birthDate !== undefined) updateData.birthDate = new Date(birthDate);
        if (height !== undefined) updateData.height = parseFloat(height);
        if (weight !== undefined) updateData.weight = parseFloat(weight);
        if (mainGoal !== undefined) updateData.mainGoal = mainGoal;
        if (weightGoal !== undefined) updateData.weightGoal = parseFloat(weightGoal);
        if (activityLevel !== undefined) updateData.activityLevel = activityLevel;
        if (gender !== undefined) updateData.gender = gender;

        const updatedUser = await addUserInformation(userId, updateData);

        if (allergies !== undefined) {
            await upsertAllergies(userId, allergies);
        }

        const resultUser = await findUserWithAllergies(updatedUser.email);
        const allergiesData = resultUser.allergies.length > 0
            ? resultUser.allergies[0].allergy
            : [];

        return {
            status: 200,
            message: "User profile updated successfully.",
            payload: {
                id: resultUser.id,
                name: resultUser.name,
                email: resultUser.email,
                birthDate: resultUser.birthDate,
                height: resultUser.height,
                weight: resultUser.weight,
                mainGoal: resultUser.mainGoal,
                weightGoal: resultUser.weightGoal,
                activityLevel: resultUser.activityLevel,
                gender: resultUser.gender,
                allergies: allergiesData,
            },
        };
    } catch (error) {
        console.error("Update user profile error:", error);
        return {
            status: 500,
            message: "Internal server error.",
        };
    }
};

export { handleGetUserProfile, handleUpdateUserProfile };
export default handleGetUserProfile;
