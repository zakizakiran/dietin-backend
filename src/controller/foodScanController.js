import OpenAI from 'openai';
import fs from 'fs';
import { v2 as cloudinary } from 'cloudinary';
import response from '../responseScheme.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Initialize Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Debug: Log cloudinary config (hapus setelah testing)
console.log('Cloudinary Config:', {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET ? '***' + process.env.CLOUDINARY_API_SECRET.slice(-4) : 'undefined'
});

// Initialize Groq client using OpenAI SDK
const groq = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: 'https://api.groq.com/openai/v1'
});

// Helper function to convert image to base64
const imageToBase64 = (filePath) => {
    const imageBuffer = fs.readFileSync(filePath);
    return imageBuffer.toString('base64');
};

// Helper function to get image mime type
const getImageMimeType = (filename) => {
    const ext = filename.toLowerCase().split('.').pop();
    const mimeTypes = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp'
    };
    return mimeTypes[ext] || 'image/jpeg';
};

export const scanFood = async (req, res) => {
    try {
        // Check if file is uploaded
        if (!req.file) {
            return response(res, {
                status: 400,
                message: 'Gambar makanan tidak ditemukan. Silakan upload gambar makanan'
            });
        }

        const imagePath = req.file.path;

        // Upload image to Cloudinary
        let cloudinaryResult;
        try {
            cloudinaryResult = await cloudinary.uploader.upload(imagePath, {
                folder: 'dietin/food-scans',
                resource_type: 'image',
                transformation: [
                    { width: 1000, height: 1000, crop: 'limit' },
                    { quality: 'auto' }
                ]
            });
        } catch (uploadError) {
            // Clean up local file
            fs.unlinkSync(imagePath);

            console.error('Cloudinary Upload Error:', uploadError);
            return response(res, {
                status: 500,
                message: `Gagal mengupload gambar ke cloud storage: ${uploadError.message}`
            });
        }

        const imageUrl = cloudinaryResult.secure_url;
        const imageBase64 = imageToBase64(imagePath);
        const mimeType = getImageMimeType(req.file.originalname);

        // Custom prompt untuk mendapatkan response dalam format yang diinginkan
        const systemPrompt = `Kamu adalah seorang ahli kuliner dan nutrisi yang bertugas menganalisis gambar makanan dan memberikan informasi lengkap tentang makanan tersebut dalam bahasa Indonesia.

Berdasarkan gambar yang diberikan, analisis makanan tersebut dan berikan response dalam format JSON yang STRICT dan VALID dengan struktur berikut:

{
  "name": "Nama makanan",
  "description": "Deskripsi singkat makanan (1-2 kalimat)",
  "imageUrl": "",
  "prepTime": waktu_persiapan_dalam_menit (number),
  "cookTime": waktu_memasak_dalam_menit (number),
  "servings": jumlah_porsi (number),
  "servingType": "satuan_porsi_standar_indonesia (misalnya: gram, mililiter, porsi, sendok)",
  "steps": [
    {
      "title": "Judul langkah (misalnya: Siapkan Bahan, Masak Bahan)",
      "substeps": [
        "Instruksi detail langkah 1",
        "Instruksi detail langkah 2"
      ]
    }
  ],
  "nutritionFacts": [
    {"name": "Kalori", "value": "XXX kkal"},
    {"name": "Protein", "value": "XX g"},
    {"name": "Lemak", "value": "XX g"},
    {"name": "Karbohidrat", "value": "XX g"},
    {"name": "Serat", "value": "XX g"},
    {"name": "Gula", "value": "XX g"}
  ],
  "ingredients": [
    {"name": "Nama bahan", "quantity": "jumlah dan satuan"}
  ]
}

PENTING:
- Response HARUS berupa valid JSON tanpa markdown code block atau karakter tambahan
- Jangan tambahkan \`\`\`json atau karakter lain di awal/akhir
- Semua string harus dalam bahasa Indonesia
- prepTime, cookTime, dan servings harus berupa angka (number), bukan string
- Estimasi nilai nutrisi berdasarkan standar makanan sejenis
- Berikan langkah-langkah memasak yang detail dan praktis
- imageUrl kosongkan dengan string kosong ""
- Berikan estimasi waktu persiapan dan memasak yang realistis`;

        const completion = await groq.chat.completions.create({
            model: 'meta-llama/llama-4-scout-17b-16e-instruct',
            messages: [
                {
                    role: 'system',
                    content: systemPrompt
                },
                {
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: 'Analisis gambar makanan ini dan berikan informasi lengkap sesuai format yang diminta.'
                        },
                        {
                            type: 'image_url',
                            image_url: {
                                url: `data:${mimeType};base64,${imageBase64}`
                            }
                        }
                    ]
                }
            ],
            temperature: 0.7,
            max_tokens: 2048,
            top_p: 1,
            response_format: { type: 'json_object' }
        });

        fs.unlinkSync(imagePath);

        const responseText = completion.choices[0].message.content;
        let foodData;

        try {
            foodData = JSON.parse(responseText);
            foodData.imageUrl = imageUrl;
        } catch (parseError) {
            console.error('JSON Parse Error:', parseError);
            console.error('Response Text:', responseText);
            return response(res, {
                status: 500,
                message: 'Gagal memproses response dari AI. Format response tidak valid'
            });
        }

        return response(res, {
            status: 200,
            message: 'Berhasil menganalisis gambar makanan',
            payload: foodData
        });

    } catch (error) {
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        console.error('Food Scan Error:', error);

        return response(res, {
            status: 500,
            message: `Gagal memproses gambar makanan: ${error.message}`
        });
    }
};

export const scanAndLogFood = async (req, res) => {
    try {
        const userId = req.user.id;
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
            ingredients,
            mealType,
            date,
            servingsConsumed
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

        if (!mealType) {
            return response(res, {
                status: 400,
                message: 'Meal type is required (Breakfast, Lunch, Dinner, or Snack)'
            });
        }

        let createdFood;
        try {
            createdFood = await prisma.food.create({
                data: {
                    name,
                    description,
                    imageUrl,
                    prepTime,
                    cookTime,
                    servings,
                    servingType: servingType || 'porsi',
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

            console.log('Food created with ID:', createdFood.id);

        } catch (dbError) {
            console.error('Database Error (Create Food):', dbError);
            return response(res, {
                status: 500,
                message: `Gagal menyimpan data makanan: ${dbError.message}`
            });
        }

        let foodLog;
        try {
            foodLog = await prisma.foodLog.create({
                data: {
                    userId: userId,
                    date: date ? new Date(date) : new Date(),
                    mealType: mealType,
                    foodLogItems: {
                        create: {
                            foodId: createdFood.id,
                            servings: servingsConsumed ? parseFloat(servingsConsumed) : 1
                        }
                    }
                },
                include: {
                    foodLogItems: {
                        include: {
                            food: {
                                include: {
                                    nutritionFacts: {
                                        orderBy: { order: 'asc' }
                                    }
                                }
                            }
                        }
                    }
                }
            });

            console.log('Food log created with ID:', foodLog.id);

        } catch (logError) {
            console.error('Database Error (Create Food Log):', logError);
            return response(res, {
                status: 500,
                message: `Makanan berhasil dibuat tetapi gagal ditambahkan ke log: ${logError.message}`
            });
        }

        const formattedResponse = {
            food: {
                id: createdFood.id,
                name: createdFood.name,
                description: createdFood.description,
                imageUrl: createdFood.imageUrl,
                prepTime: createdFood.prepTime,
                cookTime: createdFood.cookTime,
                servings: createdFood.servings,
                servingType: createdFood.servingType,
                steps: createdFood.steps.map(step => ({
                    title: step.title,
                    substeps: step.substeps.map(substep => substep.description)
                })),
                nutritionFacts: createdFood.nutritionFacts.map(nf => ({
                    name: nf.name,
                    value: nf.value
                })),
                ingredients: createdFood.ingredients.map(ing => ({
                    name: ing.name,
                    quantity: ing.quantity
                }))
            },
            foodLog: {
                id: foodLog.id,
                date: foodLog.date,
                mealType: foodLog.mealType,
                servings: foodLog.foodLogItems[0].servings,
                nutritionFacts: foodLog.foodLogItems[0].food.nutritionFacts.map(nf => ({
                    name: nf.name,
                    value: nf.value
                }))
            }
        };

        return response(res, {
            status: 201,
            message: 'Food created and added to food log successfully',
            payload: formattedResponse
        });

    } catch (error) {
        console.error('Create Food and Log Error:', error);

        return response(res, {
            status: 500,
            message: `Gagal memproses request: ${error.message}`
        });
    }
};
