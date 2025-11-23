import express, { Response } from 'express';
import multer from 'multer';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { BulkImportService } from '../services/BulkImportService.js';

const router = express.Router();
const bulkImportService = new BulkImportService();

// Configure multer for file upload
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max
    },
    fileFilter: (req, file, cb) => {
        const allowedMimes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
            'application/vnd.ms-excel', // .xls
            'text/csv', // .csv
        ];

        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Formato de archivo no válido. Use Excel (.xlsx, .xls) o CSV'));
        }
    },
});

/**
 * @route   POST /api/bulk-import/users
 * @desc    Import users from Excel/CSV file
 * @access  Admin only
 */
router.post(
    '/users',
    authenticateToken,
    requireRole(['admin', 'super_admin']),
    upload.single('file'),
    async (req: any, res: Response) => {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'No se proporcionó ningún archivo',
                });
            }

            const { organizationId } = req.body;

            if (!organizationId) {
                return res.status(400).json({
                    success: false,
                    message: 'Organization ID es requerido',
                });
            }

            // Process import
            const result = await bulkImportService.importUsers(
                req.file.buffer,
                req.file.originalname,
                organizationId
            );

            // If successful and credentials were generated, include them in response
            res.json(result);
        } catch (error) {
            console.error('Bulk import error:', error);
            res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : 'Error al importar usuarios',
            });
        }
    }
);

/**
 * @route   POST /api/bulk-import/download-credentials
 * @desc    Generate Excel file with credentials
 * @access  Admin only
 */
router.post(
    '/download-credentials',
    authenticateToken,
    requireRole(['admin', 'super_admin']),
    async (req: any, res: Response) => {
        try {
            const { credentials } = req.body;

            if (!credentials || !Array.isArray(credentials) || credentials.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No se proporcionaron credenciales',
                });
            }

            const buffer = bulkImportService.generateCredentialsFile(credentials);

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=credenciales-${Date.now()}.xlsx`);
            res.send(buffer);
        } catch (error) {
            console.error('Download credentials error:', error);
            res.status(500).json({
                success: false,
                message: 'Error al generar archivo de credenciales',
            });
        }
    }
);

/**
 * @route   GET /api/bulk-import/template
 * @desc    Download Excel template for bulk import
 * @access  Admin only
 */
router.get(
    '/template',
    authenticateToken,
    requireRole(['admin', 'super_admin']),
    async (req: any, res: Response) => {
        try {
            const XLSX = await import('xlsx');

            const templateData = [
                {
                    RUT: '12.345.678-9',
                    'Nombre Completo': 'Juan Pérez González',
                    Email: 'juan.perez@example.com',
                    Organización: 'org-123 (opcional)',
                },
                {
                    RUT: '98.765.432-1',
                    'Nombre Completo': 'María García López',
                    Email: 'maria.garcia@example.com',
                    Organización: '',
                },
            ];

            const worksheet = XLSX.utils.json_to_sheet(templateData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Plantilla');

            const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=plantilla-importacion.xlsx');
            res.send(buffer);
        } catch (error) {
            console.error('Template download error:', error);
            res.status(500).json({
                success: false,
                message: 'Error al generar plantilla',
            });
        }
    }
);

export default router;
