import OpenAI from 'openai';
import fs from 'fs';
import { v2 as cloudinary } from 'cloudinary';
import axios from 'axios';
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

const convertNutrients = (nutrients) => {
    const nutritionMapping = [
        { name: 'Kalori', key: 'energy-kcal', unit: 'kkal' },
        { name: 'Protein', key: 'proteins', unit: 'g' },
        { name: 'Lemak', key: 'fat', unit: 'g' },
        { name: 'Karbohidrat', key: 'carbohydrates', unit: 'g' },
        { name: 'Serat', key: 'fiber', unit: 'g' },
        { name: 'Gula', key: 'sugars', unit: 'g' }
    ];

    return nutritionMapping.map(mapping => {
        const value = nutrients[mapping.key] || nutrients[`${mapping.key}_100g`];
        return {
            name: mapping.name,
            value: value ? `${Math.round(value * 10) / 10} ${mapping.unit}` : `0 ${mapping.unit}`
        };
    });
};

const needsCookingSteps = (categories, productName = '') => {
    if (!categories && !productName) return false;

    const categoriesLower = (categories || '').toLowerCase();
    const productNameLower = (productName || '').toLowerCase();

    const needsCookingCategories = [
        'noodles', 'mie', 'instant noodles', 'pasta', 'spaghetti', 'macaroni',
        'rice', 'nasi', 'beras', 'quinoa', 'barley', 'oats', 'cereals',
        'frozen meals', 'ready meals', 'soup', 'instant soup', 'ramen',
        'vermicelli', 'bihun', 'kwetiau', 'laksa'
    ];

    const needsCooking = needsCookingCategories.some(cat =>
        categoriesLower.includes(cat) || productNameLower.includes(cat)
    );

    if (needsCooking) return true;

    const noCookingCategories = [
        'beverages', 'chocolates', 'candies', 'cookies', 'biscuits',
        'crackers', 'chips', 'nuts', 'fruits', 'dairy', 'yogurts', 'cheese',
        'milk', 'drinks', 'waters', 'juices', 'sodas', 'energy-drinks',
        'breakfast-cereals', 'ready-to-eat', 'bars', 'ice cream', 'snacks'
    ];

    const explicitlyNoCooking = noCookingCategories.some(cat => categoriesLower.includes(cat));

    return !explicitlyNoCooking;
};

const completeMissingProductInfo = async (productData, upc, needsCooking = false, retryCount = 0) => {
    try {
        const productName = productData.product_name || productData.product_name_id || 'Produk Tidak Dikenal';
        const categories = productData.categories || '';
        const brand = productData.brands || '';

        console.log('LLM Input - Product Name:', productName);
        console.log('LLM Input - Brand:', brand);
        console.log('LLM Input - Categories:', categories);
        console.log('LLM Retry Count:', retryCount);

        const systemPrompt = `Kamu adalah ahli nutrisi dan produk makanan yang sangat berpengalaman. Berdasarkan NAMA PRODUK, BRAND, dan KATEGORI yang diberikan, analisis dan berikan informasi ingredients yang AKURAT berdasarkan pengetahuanmu tentang produk sejenis yang beredar di Indonesia dan internasional.

FOKUS UTAMA: Berikan ingredients (bahan-bahan) yang REALISTIS dan UMUM ditemukan pada jenis produk ini.

Berikan response dalam format JSON yang STRICT dan VALID dengan struktur berikut:

{
  "ingredients": [
    {"name": "Tepung terigu", "quantity": "200g"},
    {"name": "Gula", "quantity": "125g"},
    {"name": "Minyak kelapa sawit", "quantity": "75g"},
    {"name": "Telur", "quantity": "50g"},
    {"name": "Garam", "quantity": "5g"}
  ],
  "description": "Deskripsi singkat produk yang lebih informatif dan menarik (1-2 kalimat)",
  "steps": [
    {
      "title": "Persiapan",
      "substeps": [
        "Siapkan semua bahan dan peralatan",
        "Baca petunjuk pada kemasan"
      ]
    }
  ]
}

ATURAN WAJIB:
- Response HARUS berupa valid JSON tanpa markdown code block atau karakter tambahan apapun
- WAJIB berikan minimal 3-8 ingredients yang REALISTIS untuk produk ini
- Gunakan pengetahuanmu tentang komposisi umum produk sejenis
- Untuk produk seperti mie instan: tepung terigu, minyak sawit, garam, MSG, bumbu
- Untuk biskuit/cookies: tepung terigu, gula, mentega/margarin, telur
- Untuk minuman: air, gula, perisa, pengawet
- Quantity gunakan satuan gram (g) untuk bahan padat, mililiter (ml) untuk cairan
- Berikan estimasi realistic berdasarkan ukuran kemasan standar (contoh: 500g total)
- Contoh: "250g" untuk tepung, "100g" untuk gula, "50ml" untuk minyak, "5g" untuk garam
- Untuk bumbu dan rempah gunakan gram kecil seperti "2g", "5g", "10g"
- Jika produk perlu dimasak, berikan 2-3 steps praktis
- Jika siap konsumsi, kosongkan array steps: []
- JANGAN gunakan kata "tidak tersedia" atau "tidak diketahui" dalam ingredients
- Semua text dalam bahasa Indonesia yang profesional`;

        const completion = await groq.chat.completions.create({
            model: 'meta-llama/llama-3.1-70b-versatile',
            messages: [
                {
                    role: 'system',
                    content: systemPrompt
                },
                {
                    role: 'user',
                    content: `Analisis produk berikut dan berikan informasi ingredients yang akurat:
                    
Nama Produk: ${productName}
Brand: ${brand}
Kategori: ${categories}
UPC Code: ${upc}
Perlu Memasak: ${needsCooking ? 'Ya' : 'Tidak'}

Berikan estimasi ingredients yang realistis berdasarkan jenis produk ini, description yang informatif, dan ${needsCooking ? 'steps memasak yang praktis' : 'kosongkan steps untuk produk siap konsumsi'}.

WAJIB: Berikan minimal 3-5 ingredients yang umum untuk produk jenis ini, jangan gunakan "tidak tersedia".`
                }
            ],
            temperature: 0.3,
            max_tokens: 1500,
            top_p: 0.9,
            response_format: { type: 'json_object' }
        });

        const responseText = completion.choices[0].message.content;
        console.log('LLM Raw Response:', responseText);

        const parsedResult = JSON.parse(responseText);
        console.log('LLM Parsed Result:', parsedResult);

        // Validate that we got proper ingredients
        if (!parsedResult.ingredients || !Array.isArray(parsedResult.ingredients) || parsedResult.ingredients.length === 0) {
            throw new Error('LLM did not return proper ingredients array');
        }

        // Validate ingredients don't contain "not available" type messages
        const hasInvalidIngredients = parsedResult.ingredients.some(ing =>
            !ing.name ||
            ing.name.toLowerCase().includes('tidak tersedia') ||
            ing.name.toLowerCase().includes('tidak diketahui') ||
            ing.name.toLowerCase().includes('not available')
        );

        if (hasInvalidIngredients) {
            throw new Error('LLM returned invalid ingredients');
        }

        return parsedResult;

    } catch (error) {
        console.error('LLM Completion Error:', error);
        console.error('Error details:', error.message);

        // Retry logic for LLM failure
        if (retryCount < 2) {
            console.log(`Retrying LLM completion (attempt ${retryCount + 1}/3)...`);
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
            return completeMissingProductInfo(productData, upc, needsCooking, retryCount + 1);
        }

        // If all retries failed, return fallback based on product type
        console.log('All LLM retries failed, using smart fallback...');
        return generateFallbackIngredients(productData, needsCooking);
    }
};

const generateFallbackIngredients = (productData, needsCooking) => {
    const productName = (productData.product_name || productData.product_name_id || '').toLowerCase();
    const categories = (productData.categories || '').toLowerCase();

    let ingredients = [];
    let description = 'Produk makanan kemasan';
    let steps = [];

    if (productName.includes('mie') || productName.includes('noodle') || categories.includes('noodle')) {
        ingredients = [
            { name: 'Tepung terigu', quantity: '300g' },
            { name: 'Minyak kelapa sawit', quantity: '75g' },
            { name: 'Garam', quantity: '25g' },
            { name: 'Bumbu penyedap', quantity: '15g' },
            { name: 'Pengawet alami', quantity: '2g' }
        ];
        description = 'Mi instan siap seduh dengan bumbu pelengkap';

        if (needsCooking) {
            steps = [
                {
                    title: 'Persiapan',
                    substeps: ['Siapkan 400ml air mendidih', 'Buka kemasan mi dan bumbu']
                },
                {
                    title: 'Memasak',
                    substeps: ['Masukkan mi ke dalam air mendidih', 'Tambahkan bumbu dan aduk rata', 'Masak 3-4 menit hingga matang']
                }
            ];
        }

    } else if (productName.includes('biskuit') || productName.includes('cookie') || categories.includes('biscuit')) {
        ingredients = [
            { name: 'Tepung terigu', quantity: '225g' },
            { name: 'Gula', quantity: '125g' },
            { name: 'Mentega', quantity: '75g' },
            { name: 'Telur', quantity: '50g' },
            { name: 'Garam', quantity: '3g' }
        ];
        description = 'Biskuit renyah dengan cita rasa manis yang lezat';

    } else if (productName.includes('susu') || productName.includes('milk') || categories.includes('dairy')) {
        ingredients = [
            { name: 'Susu segar', quantity: '425ml' },
            { name: 'Gula', quantity: '50g' },
            { name: 'Perisa alami', quantity: '15ml' },
            { name: 'Vitamin', quantity: '10mg' }
        ];
        description = 'Minuman susu bergizi dengan tambahan vitamin';

    } else if (productName.includes('teh') || productName.includes('tea') || categories.includes('tea')) {
        ingredients = [
            { name: 'Ekstrak daun teh', quantity: '350ml' },
            { name: 'Gula', quantity: '125g' },
            { name: 'Perisa alami', quantity: '15ml' },
            { name: 'Asam sitrat', quantity: '10g' }
        ];
        description = 'Minuman teh siap minum dengan rasa yang menyegarkan';

    } else {
        ingredients = [
            { name: 'Bahan utama sereal', quantity: '250g' },
            { name: 'Gula atau pemanis', quantity: '100g' },
            { name: 'Lemak nabati', quantity: '75g' },
            { name: 'Garam', quantity: '25g' },
            { name: 'Pengawet alami', quantity: '3g' },
            { name: 'Vitamin dan mineral', quantity: '5g' }
        ];
        description = 'Produk makanan olahan siap konsumsi dengan nutrisi seimbang';
    }

    return {
        ingredients,
        description,
        steps
    };
};

export const searchFoodByUPC = async (req, res) => {
    try {
        const { upc } = req.params;

        if (!upc || upc.length < 8) {
            return response(res, {
                status: 400,
                message: 'Kode UPC tidak valid. Harap masukkan kode UPC yang valid'
            });
        }

        const openFoodFactsUrl = `https://world.openfoodfacts.org/api/v2/product/${upc}.json`;

        let productData;
        try {
            const apiResponse = await axios.get(openFoodFactsUrl);

            if (apiResponse.data.status === 0) {
                return response(res, {
                    status: 404,
                    message: 'Produk dengan kode UPC tersebut tidak ditemukan'
                });
            }

            productData = apiResponse.data.product;
        } catch (apiError) {
            console.error('Open Food Facts API Error:', apiError);
            return response(res, {
                status: 500,
                message: 'Gagal mengakses database produk makanan'
            });
        }

        const name = productData.product_name || productData.product_name_id || 'Produk Tidak Dikenal';
        let description = productData.generic_name || `Produk dengan kode ${upc}`;
        const imageUrl = productData.image_url || productData.image_front_url || '';
        const categories = productData.categories || '';

        const needsCooking = needsCookingSteps(categories, name);

        const nutritionFacts = convertNutrients(productData.nutriments || {});

        let ingredients = [];

        let steps = [];
        console.log('Using LLM to generate product information based on product name...');

        const llmCompletion = await completeMissingProductInfo(productData, upc, needsCooking);
        console.log('LLM completion result:', llmCompletion);

        if (llmCompletion && llmCompletion.ingredients && Array.isArray(llmCompletion.ingredients) && llmCompletion.ingredients.length > 0) {
            ingredients = llmCompletion.ingredients;
            console.log('Successfully got ingredients from LLM:', ingredients.length, 'items');

            if (llmCompletion.description && llmCompletion.description.trim()) {
                description = llmCompletion.description;
            }

            if (needsCooking && llmCompletion.steps && Array.isArray(llmCompletion.steps) && llmCompletion.steps.length > 0) {
                steps = llmCompletion.steps;
            } else if (needsCooking) {
                steps = [
                    {
                        title: "Siapkan Bahan",
                        substeps: [
                            "Siapkan semua bahan yang diperlukan",
                            "Pastikan semua bahan dalam kondisi baik"
                        ]
                    },
                    {
                        title: "Proses Memasak",
                        substeps: [
                            "Ikuti petunjuk pada kemasan produk",
                            "Masak sesuai dengan instruksi yang tertera"
                        ]
                    }
                ];
            }

            console.log('LLM completion successful with', ingredients.length, 'ingredients');
        } else {
            console.error('Critical error: Could not generate ingredients even with fallback');
            ingredients = [{
                name: 'Bahan utama produk',
                quantity: 'Informasi tidak tersedia'
            }];
        }

        const servings = productData.quantity ? 1 : 1;
        const servingType = productData.serving_size ? 'gram' : 'porsi';

        const prepTime = needsCooking ? 5 : 0;
        const cookTime = needsCooking ? 10 : 0;

        const foodData = {
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
            upcCode: upc,
            brand: productData.brands || '',
            categories: categories
        };

        return response(res, {
            status: 200,
            message: 'Berhasil menemukan informasi produk',
            payload: foodData
        });

    } catch (error) {
        console.error('UPC Search Error:', error);

        return response(res, {
            status: 500,
            message: `Gagal mencari produk: ${error.message}`
        });
    }
};

export const scanAndLogFoodByUPC = async (req, res) => {
    try {
        const userId = req.user.id;
        const { upc } = req.params;
        const { mealType, date, servingsConsumed } = req.body;

        if (!upc || upc.length < 8) {
            return response(res, {
                status: 400,
                message: 'Kode UPC tidak valid. Harap masukkan kode UPC yang valid'
            });
        }

        if (!mealType) {
            return response(res, {
                status: 400,
                message: 'Meal type is required (Breakfast, Lunch, Dinner, or Snack)'
            });
        }

        const openFoodFactsUrl = `https://world.openfoodfacts.org/api/v2/product/${upc}.json`;

        let productData;
        try {
            const apiResponse = await axios.get(openFoodFactsUrl);

            if (apiResponse.data.status === 0) {
                return response(res, {
                    status: 404,
                    message: 'Produk dengan kode UPC tersebut tidak ditemukan'
                });
            }

            productData = apiResponse.data.product;
        } catch (apiError) {
            console.error('Open Food Facts API Error:', apiError);
            return response(res, {
                status: 500,
                message: 'Gagal mengakses database produk makanan'
            });
        }

        let name = productData.product_name || productData.product_name_id || 'Produk Tidak Dikenal';
        let description = productData.generic_name || `Produk dengan kode ${upc}`;
        const imageUrl = productData.image_url || productData.image_front_url || '';
        const categories = productData.categories || '';

        const needsCooking = needsCookingSteps(categories, name);

        const nutritionFacts = convertNutrients(productData.nutriments || {});

        let ingredients = [];

        let steps = [];
        console.log('Using LLM to complete product information...');

        const llmCompletion = await completeMissingProductInfo(productData, upc, needsCooking);
        console.log('LLM completion result:', llmCompletion);

        if (llmCompletion && llmCompletion.ingredients && Array.isArray(llmCompletion.ingredients) && llmCompletion.ingredients.length > 0) {
            ingredients = llmCompletion.ingredients;
            console.log('Successfully got ingredients from LLM:', ingredients.length, 'items');

            if (llmCompletion.description && llmCompletion.description.trim()) {
                description = llmCompletion.description;
            }

            if (needsCooking && llmCompletion.steps && Array.isArray(llmCompletion.steps) && llmCompletion.steps.length > 0) {
                steps = llmCompletion.steps;
            } else if (needsCooking) {
                steps = [
                    {
                        title: "Siapkan Bahan",
                        substeps: [
                            "Siapkan semua bahan yang diperlukan",
                            "Pastikan semua bahan dalam kondisi baik"
                        ]
                    },
                    {
                        title: "Proses Memasak",
                        substeps: [
                            "Ikuti petunjuk pada kemasan produk",
                            "Masak sesuai dengan instruksi yang tertera"
                        ]
                    }
                ];
            }

            console.log('LLM completion successful with', ingredients.length, 'ingredients');
        } else {
            console.error('Critical error: Could not generate ingredients even with fallback');
            ingredients = [{
                name: 'Bahan utama produk',
                quantity: 'Informasi tidak tersedia'
            }];

            if (needsCooking) {
                steps = [
                    {
                        title: "Siapkan Bahan",
                        substeps: [
                            "Siapkan semua bahan yang diperlukan",
                            "Pastikan semua bahan dalam kondisi baik"
                        ]
                    },
                    {
                        title: "Proses Memasak",
                        substeps: [
                            "Ikuti petunjuk pada kemasan produk",
                            "Masak sesuai dengan instruksi yang tertera"
                        ]
                    }
                ];
            }
        }

        const servings = productData.quantity ? 1 : 1;
        const servingType = productData.serving_size ? 'gram' : 'porsi';

        const prepTime = needsCooking ? 5 : 0;
        const cookTime = needsCooking ? 10 : 0;

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
                    servingType,
                    upcCode: upc,
                    steps: steps.length > 0 ? {
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
                    } : undefined,
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
                upcCode: createdFood.upcCode,
                steps: createdFood.steps ? createdFood.steps.map(step => ({
                    title: step.title,
                    substeps: step.substeps.map(substep => substep.description)
                })) : [],
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
            message: 'Food created and added to food log successfully from UPC',
            payload: formattedResponse
        });

    } catch (error) {
        console.error('UPC Scan and Log Error:', error);

        return response(res, {
            status: 500,
            message: `Gagal memproses request: ${error.message}`
        });
    }
};
