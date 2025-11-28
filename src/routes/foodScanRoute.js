import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs'; // Import fs untuk cek folder
import { scanFood, scanAndLogFood, searchFoodByUPC, scanAndLogFoodByUPC } from '../controller/foodScanController.js';
import { authorizeToken } from '../middleware/authorization.js';

const router = express.Router();

// Pastikan folder uploads ada
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'food-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    // --- DEBUG LOGGING ---
    console.log('---------------------------------------');
    console.log('[Multer] Menerima File Baru:');
    console.log('Nama File Asli :', file.originalname);
    console.log('Mimetype       :', file.mimetype);
    console.log('---------------------------------------');

    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

    // Validasi: Cek mimetype ATAU ekstensi (agar lebih fleksibel terhadap quirk client)
    // Idealnya cek keduanya, tapi octet-stream sering terjadi di mobile dev
    const isMimeTypeImage = allowedTypes.test(file.mimetype);
    const isOctetStream = file.mimetype === 'application/octet-stream';

    if ((isMimeTypeImage || isOctetStream) && extname) {
        return cb(null, true);
    } else {
        const errorMsg = `File ditolak! Mimetype: ${file.mimetype}, Ext: ${path.extname(file.originalname)}`;
        console.error(errorMsg);
        cb(new Error(`Hanya file gambar yang diperbolehkan. (${file.mimetype})`));
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB max file size
    },
    fileFilter: fileFilter
});

router.post('/scan', authorizeToken, upload.single('image'), scanFood);

router.post('/scan-and-log', authorizeToken, scanAndLogFood);

router.get('/upc/:upc', authorizeToken, searchFoodByUPC);

router.post('/upc/:upc/log', authorizeToken, scanAndLogFoodByUPC);

export default router;