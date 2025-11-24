import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { Organization, User } from '../models/index.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { Op } from 'sequelize';

const router = express.Router();

// Types
type AdminUser = { id: string; organizationId: string; role: 'voter' | 'admin' | 'super_admin' };
type AdminRequest = Request & { user: AdminUser };

// Validation middleware
const validateOrganization = [
    body('name').isString().isLength({ min: 3, max: 100 }).withMessage('El nombre debe tener entre 3 y 100 caracteres'),
    body('rut').isString().isLength({ min: 8, max: 12 }).withMessage('El RUT debe tener entre 8 y 12 caracteres'),
    body('email').isEmail().withMessage('Debe ser un email válido'),
    body('isActive').optional().isBoolean(),
];

// GET / - Listar organizaciones
router.get('/', authenticateToken, requireRole(['super_admin']), async (req: AdminRequest, res: Response) => {
    try {
        const { page = '1', limit = '10', search = '' } = req.query as Record<string, string>;

        const whereClause: any = {};

        if (search) {
            whereClause[Op.or] = [
                { name: { [Op.like]: `%${search}%` } },
                { rut: { [Op.like]: `%${search}%` } },
                { email: { [Op.like]: `%${search}%` } }
            ];
        }

        const offset = (Number(page) - 1) * Number(limit);

        const { count, rows } = await Organization.findAndCountAll({
            where: whereClause,
            limit: Number(limit),
            offset,
            order: [['createdAt', 'DESC']]
        });

        res.json({
            success: true,
            data: {
                organizations: rows,
                pagination: {
                    total: count,
                    page: Number(page),
                    pages: Math.ceil(count / Number(limit))
                }
            }
        });
    } catch (error) {
        console.error('Error fetching organizations:', error);
        res.status(500).json({
            success: false,
            message: 'Error al cargar organizaciones'
        });
    }
});

// GET /:id - Obtener una organización
router.get('/:id', authenticateToken, requireRole(['super_admin']), async (req: AdminRequest, res: Response) => {
    try {
        const organization = await Organization.findByPk(req.params.id);

        if (!organization) {
            return res.status(404).json({
                success: false,
                message: 'Organización no encontrada'
            });
        }

        res.json({
            success: true,
            data: organization
        });
    } catch (error) {
        console.error('Error fetching organization:', error);
        res.status(500).json({
            success: false,
            message: 'Error al cargar la organización'
        });
    }
});

// POST / - Crear organización
router.post('/', authenticateToken, requireRole(['super_admin']), validateOrganization, async (req: AdminRequest, res: Response) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Error de validación',
                errors: errors.array()
            });
        }

        const { name, rut, email, isActive } = req.body;

        // Check existing RUT or Email
        const existingOrg = await Organization.findOne({
            where: {
                [Op.or]: [{ rut }, { email }]
            }
        });

        if (existingOrg) {
            return res.status(400).json({
                success: false,
                message: 'Ya existe una organización con este RUT o Email'
            });
        }

        const organization = await Organization.create({
            name,
            rut,
            email,
            isActive: isActive !== undefined ? isActive : true
        });

        res.status(201).json({
            success: true,
            message: 'Organización creada exitosamente',
            data: organization
        });
    } catch (error) {
        console.error('Error creating organization:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear la organización'
        });
    }
});

// PUT /:id - Actualizar organización
router.put('/:id', authenticateToken, requireRole(['super_admin']), validateOrganization, async (req: AdminRequest, res: Response) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Error de validación',
                errors: errors.array()
            });
        }

        const organization = await Organization.findByPk(req.params.id);
        if (!organization) {
            return res.status(404).json({
                success: false,
                message: 'Organización no encontrada'
            });
        }

        const { name, rut, email, isActive } = req.body;

        // Check unique constraints excluding current org
        const existingOrg = await Organization.findOne({
            where: {
                [Op.and]: [
                    { id: { [Op.ne]: req.params.id } },
                    { [Op.or]: [{ rut }, { email }] }
                ]
            }
        });

        if (existingOrg) {
            return res.status(400).json({
                success: false,
                message: 'Ya existe otra organización con este RUT o Email'
            });
        }

        await organization.update({
            name,
            rut,
            email,
            isActive
        });

        res.json({
            success: true,
            message: 'Organización actualizada exitosamente',
            data: organization
        });
    } catch (error) {
        console.error('Error updating organization:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar la organización'
        });
    }
});

// DELETE /:id - Eliminar organización
router.delete('/:id', authenticateToken, requireRole(['super_admin']), async (req: AdminRequest, res: Response) => {
    try {
        const organization = await Organization.findByPk(req.params.id);
        if (!organization) {
            return res.status(404).json({
                success: false,
                message: 'Organización no encontrada'
            });
        }

        // Check if organization has users
        const userCount = await User.count({ where: { organizationId: req.params.id } });
        if (userCount > 0) {
            return res.status(400).json({
                success: false,
                message: `No se puede eliminar la organización porque tiene ${userCount} usuarios asociados`
            });
        }

        await organization.destroy();

        res.json({
            success: true,
            message: 'Organización eliminada exitosamente'
        });
    } catch (error) {
        console.error('Error deleting organization:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar la organización'
        });
    }
});

export default router;
