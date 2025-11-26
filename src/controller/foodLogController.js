import { PrismaClient } from '@prisma/client';
import response from '../responseScheme.js';

const prisma = new PrismaClient();

export const addFoodLog = async (req, res) => {
    try {
        const userId = req.user.id;
        const { date, mealType, foods } = req.body;

        if (!mealType) {
            return response(res, {
                status: 400,
                message: 'Meal type is required (Breakfast, Lunch, Dinner, or Snack)'
            });
        }

        if (!foods || !Array.isArray(foods) || foods.length === 0) {
            return response(res, {
                status: 400,
                message: 'Foods array is required and cannot be empty'
            });
        }

        const foodIds = foods.map(f => f.foodId);
        const existingFoods = await prisma.food.findMany({
            where: { id: { in: foodIds } }
        });

        if (existingFoods.length !== foodIds.length) {
            return response(res, {
                status: 404,
                message: 'One or more food IDs not found'
            });
        }

        const foodLog = await prisma.foodLog.create({
            data: {
                userId: userId,
                date: date ? new Date(date) : new Date(),
                mealType: mealType,
                foodLogItems: {
                    create: foods.map(food => ({
                        foodId: food.foodId,
                        servings: food.servings || 1
                    }))
                }
            },
            include: {
                foodLogItems: {
                    include: {
                        food: {
                            select: {
                                id: true,
                                name: true,
                                description: true,
                                imageUrl: true,
                                nutritionFacts: true
                            }
                        }
                    }
                }
            }
        });

        return response(res, {
            status: 201,
            message: 'Food log added successfully',
            payload: {
                id: foodLog.id,
                date: foodLog.date,
                mealType: foodLog.mealType,
                foods: foodLog.foodLogItems.map(item => ({
                    id: item.food.id,
                    name: item.food.name,
                    description: item.food.description,
                    imageUrl: item.food.imageUrl,
                    servings: item.servings,
                    nutritionFacts: item.food.nutritionFacts.map(nf => ({
                        name: nf.name,
                        value: nf.value
                    }))
                }))
            }
        });
    } catch (error) {
        console.error('Error adding food log:', error);
        return response(res, {
            status: 500,
            message: 'Failed to add food log',
            payload: { error: error.message }
        });
    }
};

export const getFoodLogsByDate = async (req, res) => {
    try {
        const userId = req.user.id;
        const { date } = req.query;

        if (!date) {
            return response(res, {
                status: 400,
                message: 'Date parameter is required (YYYY-MM-DD)'
            });
        }

        const startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);

        const endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);

        const foodLogs = await prisma.foodLog.findMany({
            where: {
                userId: userId,
                date: {
                    gte: startDate,
                    lte: endDate
                }
            },
            include: {
                foodLogItems: {
                    include: {
                        food: {
                            select: {
                                id: true,
                                name: true,
                                description: true,
                                imageUrl: true,
                                nutritionFacts: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                date: 'asc'
            }
        });

        const formattedLogs = foodLogs.map(log => ({
            id: log.id,
            date: log.date,
            mealType: log.mealType,
            foods: log.foodLogItems.map(item => ({
                id: item.food.id,
                name: item.food.name,
                description: item.food.description,
                imageUrl: item.food.imageUrl,
                servings: item.servings,
                nutritionFacts: item.food.nutritionFacts.map(nf => ({
                    name: nf.name,
                    value: nf.value
                }))
            }))
        }));

        return response(res, {
            status: 200,
            message: 'Food logs retrieved successfully',
            payload: formattedLogs
        });
    } catch (error) {
        console.error('Error getting food logs:', error);
        return response(res, {
            status: 500,
            message: 'Failed to get food logs',
            payload: { error: error.message }
        });
    }
};

export const getAllFoodLogs = async (req, res) => {
    try {
        const userId = req.user.id;
        const { limit = 30 } = req.query;

        const foodLogs = await prisma.foodLog.findMany({
            where: {
                userId: userId
            },
            include: {
                foodLogItems: {
                    include: {
                        food: {
                            select: {
                                id: true,
                                name: true,
                                description: true,
                                imageUrl: true,
                                nutritionFacts: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                date: 'desc'
            },
            take: parseInt(limit)
        });

        const formattedLogs = foodLogs.map(log => ({
            id: log.id,
            date: log.date,
            mealType: log.mealType,
            foods: log.foodLogItems.map(item => ({
                id: item.food.id,
                name: item.food.name,
                description: item.food.description,
                imageUrl: item.food.imageUrl,
                servings: item.servings,
                nutritionFacts: item.food.nutritionFacts.map(nf => ({
                    name: nf.name,
                    value: nf.value
                }))
            }))
        }));

        return response(res, {
            status: 200,
            message: 'Food logs retrieved successfully',
            payload: formattedLogs
        });
    } catch (error) {
        console.error('Error getting food logs:', error);
        return response(res, {
            status: 500,
            message: 'Failed to get food logs',
            payload: { error: error.message }
        });
    }
};

export const deleteFoodLog = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const foodLog = await prisma.foodLog.findUnique({
            where: { id: parseInt(id) }
        });

        if (!foodLog) {
            return response(res, {
                status: 404,
                message: 'Food log not found'
            });
        }

        if (foodLog.userId !== userId) {
            return response(res, {
                status: 403,
                message: 'Unauthorized to delete this food log'
            });
        }

        await prisma.foodLog.delete({
            where: { id: parseInt(id) }
        });

        return response(res, {
            status: 200,
            message: 'Food log deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting food log:', error);
        return response(res, {
            status: 500,
            message: 'Failed to delete food log',
            payload: { error: error.message }
        });
    }
};
