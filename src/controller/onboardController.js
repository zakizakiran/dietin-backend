import { addUserInformation, upsertAllergies } from "../model/User.js";

const handleOnboard = async (req) => {
    const userId = req.user.id;
    const { birthDate, height, weight, mainGoal, weightGoal, gender, activityLevel, allergies } = req.body;
    try {
        const updatedUser = await addUserInformation(userId, {
            birthDate: birthDate ? new Date(birthDate) : null,
            height: height,
            weight: weight,
            mainGoal: mainGoal,
            weightGoal: weightGoal || null,
            gender: gender,
            activityLevel: activityLevel || null,
        });

        // Handle allergies separately if provided
        let userAllergies = null;
        if (allergies && Array.isArray(allergies)) {
            userAllergies = await upsertAllergies(userId, allergies);
        }

        return {
            status: 200,
            message: "User information updated successfully",
            payload: {
                id: updatedUser.id,
                name: updatedUser.name,
                birthDate: updatedUser.birthDate,
                height: updatedUser.height,
                weight: updatedUser.weight,
                mainGoal: updatedUser.mainGoal,
                weightGoal: updatedUser.weightGoal,
                gender: updatedUser.gender,
                activityLevel: updatedUser.activityLevel,
                allergies: userAllergies?.allergy || []
            }
        };
    } catch (error) {
        console.error("Onboard error:", error);
        return {
            status: 500,
            message: "Internal server error.",
        };
    }
};

export default handleOnboard;