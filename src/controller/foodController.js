import { PrismaClient } from '@prisma/client';
import response from '../responseScheme.js';

const prisma = new PrismaClient();

export const getAllFoods = async (req, res) => {
    try {
        const foods = await prisma.food.findMany({
            include: {
                steps: {
                    orderBy: { order: 'asc' },
                    include: {
                        substeps: {
                            orderBy: { order: 'asc' }
                        }
                    }
                },
                nutritionFacts: {
                    orderBy: { order: 'asc' }
                },
                ingredients: {
                    orderBy: { order: 'asc' }
                }
            }
        });

        const formattedFoods = foods.map(food => ({
            id: food.id,
            name: food.name,
            description: food.description,
            imageUrl: food.imageUrl,
            prepTime: food.prepTime,
            cookTime: food.cookTime,
            servings: food.servings,
            servingType: food.servingType,
            steps: food.steps.map(step => ({
                title: step.title,
                substeps: step.substeps.map(substep => substep.description)
            })),
            nutritionFacts: food.nutritionFacts.map(nf => ({
                name: nf.name,
                value: nf.value
            })),
            ingredients: food.ingredients.map(ing => ({
                name: ing.name,
                quantity: ing.quantity
            })),
            createdAt: food.createdAt,
            updatedAt: food.updatedAt
        }));

        return response(res, {
            status: 200,
            message: 'Foods retrieved successfully',
            payload: formattedFoods
        });
    } catch (error) {
        console.error('Error getting foods:', error);
        return response(res, {
            status: 500,
            message: 'Failed to get foods',
            payload: { error: error.message }
        });
    }
};

export const getFoodById = async (req, res) => {
    try {
        const { id } = req.params;

        const food = await prisma.food.findUnique({
            where: { id: parseInt(id) },
            include: {
                steps: {
                    orderBy: { order: 'asc' },
                    include: {
                        substeps: {
                            orderBy: { order: 'asc' }
                        }
                    }
                },
                nutritionFacts: {
                    orderBy: { order: 'asc' }
                },
                ingredients: {
                    orderBy: { order: 'asc' }
                }
            }
        });

        if (!food) {
            return response(res, {
                status: 404,
                message: 'Food not found'
            });
        }

        const formattedFood = {
            id: food.id,
            name: food.name,
            description: food.description,
            imageUrl: food.imageUrl,
            prepTime: food.prepTime,
            cookTime: food.cookTime,
            servings: food.servings,
            steps: food.steps.map(step => ({
                title: step.title,
                substeps: step.substeps.map(substep => substep.description)
            })),
            nutritionFacts: food.nutritionFacts.map(nf => ({
                name: nf.name,
                value: nf.value
            })),
            ingredients: food.ingredients.map(ing => ({
                name: ing.name,
                quantity: ing.quantity
            })),
            createdAt: food.createdAt,
            updatedAt: food.updatedAt
        };

        return response(res, {
            status: 200,
            message: 'Food retrieved successfully',
            payload: formattedFood
        });
    } catch (error) {
        console.error('Error getting food:', error);
        return response(res, {
            status: 500,
            message: 'Failed to get food',
            payload: { error: error.message }
        });
    }
};

export const createFood = async (req, res) => {
    try {
        const {
            name,
            description,
            imageUrl,
            prepTime,
            cookTime,
            servings,
            servingType,
            steps,
            nutritionFacts,
            ingredients
        } = req.body;

        if (!name) {
            return response(res, {
                status: 400,
                message: 'Name is required'
            });
        }

        if (!steps || !Array.isArray(steps) || steps.length === 0) {
            return response(res, {
                status: 400,
                message: 'Steps are required'
            });
        }

        if (!nutritionFacts || !Array.isArray(nutritionFacts) || nutritionFacts.length === 0) {
            return response(res, {
                status: 400,
                message: 'Nutrition facts are required'
            });
        }

        if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
            return response(res, {
                status: 400,
                message: 'Ingredients are required'
            });
        }

        // Create food dengan relasi
        const food = await prisma.food.create({
            data: {
                name,
                description,
                imageUrl,
                prepTime,
                cookTime,
                servings,
                servingType,
                steps: {
                    create: steps.map((step, stepIndex) => ({
                        title: step.title,
                        order: stepIndex + 1,
                        substeps: {
                            create: step.substeps.map((substep, substepIndex) => ({
                                description: substep,
                                order: substepIndex + 1
                            }))
                        }
                    }))
                },
                nutritionFacts: {
                    create: nutritionFacts.map((nf, index) => ({
                        name: nf.name,
                        value: nf.value,
                        order: index + 1
                    }))
                },
                ingredients: {
                    create: ingredients.map((ing, index) => ({
                        name: ing.name,
                        quantity: ing.quantity,
                        order: index + 1
                    }))
                }
            },
            include: {
                steps: {
                    orderBy: { order: 'asc' },
                    include: {
                        substeps: {
                            orderBy: { order: 'asc' }
                        }
                    }
                },
                nutritionFacts: {
                    orderBy: { order: 'asc' }
                },
                ingredients: {
                    orderBy: { order: 'asc' }
                }
            }
        });

        const formattedFood = {
            id: food.id,
            name: food.name,
            description: food.description,
            imageUrl: food.imageUrl,
            prepTime: food.prepTime,
            cookTime: food.cookTime,
            servings: food.servings,
            servingType: food.servingType,
            steps: food.steps.map(step => ({
                title: step.title,
                substeps: step.substeps.map(substep => substep.description)
            })),
            nutritionFacts: food.nutritionFacts.map(nf => ({
                name: nf.name,
                value: nf.value
            })),
            ingredients: food.ingredients.map(ing => ({
                name: ing.name,
                quantity: ing.quantity
            })),
            createdAt: food.createdAt,
            updatedAt: food.updatedAt
        };

        return response(res, {
            status: 201,
            message: 'Food created successfully',
            payload: formattedFood
        });
    } catch (error) {
        console.error('Error creating food:', error);
        return response(res, {
            status: 500,
            message: 'Failed to create food',
            payload: { error: error.message }
        });
    }
};

export const updateFood = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name,
            description,
            imageUrl,
            prepTime,
            cookTime,
            servings,
            servingType,
            steps,
            nutritionFacts,
            ingredients
        } = req.body;

        const existingFood = await prisma.food.findUnique({
            where: { id: parseInt(id) }
        });

        if (!existingFood) {
            return response(res, {
                status: 404,
                message: 'Food not found'
            });
        }

        if (steps) {
            await prisma.substep.deleteMany({
                where: {
                    step: {
                        foodId: parseInt(id)
                    }
                }
            });
            await prisma.step.deleteMany({
                where: { foodId: parseInt(id) }
            });
        }

        if (nutritionFacts) {
            await prisma.nutritionFact.deleteMany({
                where: { foodId: parseInt(id) }
            });
        }

        if (ingredients) {
            await prisma.ingredient.deleteMany({
                where: { foodId: parseInt(id) }
            });
        }

        const food = await prisma.food.update({
            where: { id: parseInt(id) },
            data: {
                ...(name && { name }),
                ...(description !== undefined && { description }),
                ...(imageUrl !== undefined && { imageUrl }),
                ...(prepTime !== undefined && { prepTime }),
                ...(cookTime !== undefined && { cookTime }),
                ...(servings !== undefined && { servings }),
                ...(servingType !== undefined && { servingType }),
                ...(steps && {
                    steps: {
                        create: steps.map((step, stepIndex) => ({
                            title: step.title,
                            order: stepIndex + 1,
                            substeps: {
                                create: step.substeps.map((substep, substepIndex) => ({
                                    description: substep,
                                    order: substepIndex + 1
                                }))
                            }
                        }))
                    }
                }),
                ...(nutritionFacts && {
                    nutritionFacts: {
                        create: nutritionFacts.map((nf, index) => ({
                            name: nf.name,
                            value: nf.value,
                            order: index + 1
                        }))
                    }
                }),
                ...(ingredients && {
                    ingredients: {
                        create: ingredients.map((ing, index) => ({
                            name: ing.name,
                            quantity: ing.quantity,
                            order: index + 1
                        }))
                    }
                })
            },
            include: {
                steps: {
                    orderBy: { order: 'asc' },
                    include: {
                        substeps: {
                            orderBy: { order: 'asc' }
                        }
                    }
                },
                nutritionFacts: {
                    orderBy: { order: 'asc' }
                },
                ingredients: {
                    orderBy: { order: 'asc' }
                }
            }
        });

        const formattedFood = {
            id: food.id,
            name: food.name,
            description: food.description,
            imageUrl: food.imageUrl,
            prepTime: food.prepTime,
            cookTime: food.cookTime,
            servings: food.servings,
            servingType: food.servingType,
            steps: food.steps.map(step => ({
                title: step.title,
                substeps: step.substeps.map(substep => substep.description)
            })),
            nutritionFacts: food.nutritionFacts.map(nf => ({
                name: nf.name,
                value: nf.value
            })),
            ingredients: food.ingredients.map(ing => ({
                name: ing.name,
                quantity: ing.quantity
            })),
            createdAt: food.createdAt,
            updatedAt: food.updatedAt
        };

        return response(res, {
            status: 200,
            message: 'Food updated successfully',
            payload: formattedFood
        });
    } catch (error) {
        console.error('Error updating food:', error);
        return response(res, {
            status: 500,
            message: 'Failed to update food',
            payload: { error: error.message }
        });
    }
};

export const deleteFood = async (req, res) => {
    try {
        const { id } = req.params;

        const existingFood = await prisma.food.findUnique({
            where: { id: parseInt(id) }
        });

        if (!existingFood) {
            return response(res, {
                status: 404,
                message: 'Food not found'
            });
        }

        await prisma.food.delete({
            where: { id: parseInt(id) }
        });

        return response(res, {
            status: 200,
            message: 'Food deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting food:', error);
        return response(res, {
            status: 500,
            message: 'Failed to delete food',
            payload: { error: error.message }
        });
    }
};
