import { Router, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import { authenticateToken } from '../middleware/auth.js';
import { AppError } from '../utils/AppError.js';
import fs from 'fs';

const router = Router();

// Extender el tipo Request para incluir file
interface MulterRequest extends Express.Request {
    file?: Express.Multer.File;
}

// Configurar almacenamiento de multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(process.cwd(), 'public', 'uploads');

        // Crear directorio si no existe
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `election-${uniqueSuffix}${ext}`);
    }
});

// Filtro para aceptar solo imágenes
const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new AppError('Solo se permiten archivos de imagen (JPEG, PNG, GIF, WebP)', 400));
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB máximo
    }
});

// Endpoint para subir imagen
router.post(
    '/image',
    authenticateToken,
    upload.single('image'),
    async (req: MulterRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.file) {
                throw new AppError('No se proporcionó ningún archivo', 400);
            }

            // Construir URL de la imagen
            const imageUrl = `/uploads/${req.file.filename}`;

            res.json({
                success: true,
                message: 'Imagen subida exitosamente',
                data: {
                    url: imageUrl,
                    filename: req.file.filename,
                    size: req.file.size,
                    mimetype: req.file.mimetype,
                },
            });
        } catch (error) {
            // Si hay error, eliminar el archivo si se subió
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }
            next(error);
        }
    }
);

export default router;
