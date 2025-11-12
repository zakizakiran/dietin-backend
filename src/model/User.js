import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const createAccount = async (userData) => {
    const { email, password, name } = userData;
    const user = {
        data: {
            email: email,
            password: password,
            name: name,
        },
    };
    return await prisma.user.create(user);
}

const addUserInformation = async (userId, userInfo) => {
    return await prisma.user.update({
        where: { id: userId },
        data: userInfo,
    });
}

const findUserByEmail = async (email) => {
    return await prisma.user.findUnique({
        where: { email: email },
    });
};

const findUserWithAllergies = async (email) => {
    return await prisma.user.findUnique({
        where: { email: email },
        include: {
            allergies: true  // ✅ Include relasi allergies
        }
    });
};

const addRefreshToken = async (email, refreshToken) => {
    return await prisma.user.update({
        where: { email: email },
        data: { refreshToken: refreshToken },
    });
};

const findRefreshToken = async (refreshToken) => {
    return await prisma.user.findFirst({
        where: { refreshToken: refreshToken },
    });
};

const deleteRefreshToken = async (userId) => {
    return await prisma.user.update({
        where: { id: userId },
        data: { refreshToken: null },
    });
};

const upsertAllergies = async (userId, allergiesData) => {
    return await prisma.allergy.upsert({
        where: { userId: userId },
        update: { allergy: allergiesData },
        create: {
            userId: userId,
            allergy: allergiesData
        },
    });
};

const getAllergiesByUserId = async (userId) => {
    return await prisma.allergy.findUnique({
        where: { userId: userId },
    });
};

export {
    createAccount,
    findUserByEmail,
    findUserWithAllergies,
    addRefreshToken,
    findRefreshToken,
    deleteRefreshToken,
    addUserInformation,
    upsertAllergies,
    getAllergiesByUserId,
};