import { Router, Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { ElectionService } from '../services/ElectionService.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/auth.js';

const router = Router();
const electionService = new ElectionService();

// Helper para manejar validaciones
const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Errores de validación',
      errors: errors.array(),
    });
  }
  next();
};

// Crear elección
router.post(
  '/',
  authenticateToken,
  requireRole(['admin', 'super_admin']),
  [
    body('title')
      .isString()
      .isLength({ min: 3, max: 200 })
      .withMessage('El título debe tener entre 3 y 200 caracteres'),
    body('description')
      .isString()
      .isLength({ min: 10, max: 2000 })
      .withMessage('La descripción debe tener entre 10 y 2000 caracteres'),
    body('startDate')
      .isISO8601()
      .toDate()
      .withMessage('La fecha de inicio debe ser válida'),
    body('endDate')
      .isISO8601()
      .toDate()
      .withMessage('La fecha de fin debe ser válida'),
    body('category')
      .isIn(['board_members', 'policy', 'budget', 'leadership', 'other'])
      .withMessage('Categoría no válida'),
    body('maxVotesPerUser')
      .optional()
      .isInt({ min: 1, max: 10 })
      .withMessage('Los votos máximos por usuario deben estar entre 1 y 10'),
    body('isPublic')
      .optional()
      .isBoolean()
      .withMessage('isPublic debe ser booleano'),
    body('requiresVoterRegistry')
      .optional()
      .isBoolean()
      .withMessage('requiresVoterRegistry debe ser booleano'),
    body('options')
      .isArray({ min: 2 })
      .withMessage('Debe proporcionar al menos 2 opciones'),
    body('options.*.title')
      .isString()
      .isLength({ min: 1, max: 100 })
      .withMessage('El título de la opción debe tener entre 1 y 100 caracteres'),
    body('options.*.description')
      .optional()
      .isString()
      .isLength({ max: 500 })
      .withMessage('La descripción de la opción no puede exceder 500 caracteres'),
    body('options.*.imageUrl')
      .optional()
      .custom((value) => {
        if (!value || value === '') return true;
        // Aceptar rutas relativas que empiecen con /
        if (value.startsWith('/')) return true;
        // Validar URLs absolutas
        try {
          new URL(value);
          return true;
        } catch {
          return false;
        }
      })
      .withMessage('La URL de la imagen debe ser válida o una ruta relativa'),
  ],
  handleValidationErrors,
  async (req: Request & { user: { id: string; organizationId: string; role: string } }, res: Response, next: NextFunction) => {
    try {
      // Si es super_admin y proporciona organizationId en el body, usarlo
      // Si no, usar la organización del usuario autenticado
      let targetOrganizationId = req.user.organizationId;

      if (req.user.role === 'super_admin' && req.body.organizationId) {
        targetOrganizationId = req.body.organizationId;
      }

      const election = await electionService.createElection(
        targetOrganizationId,
        req.user.id,
        req.body
      );

      res.status(201).json({
        success: true,
        message: 'Elección creada exitosamente',
        data: election,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Obtener todas las elecciones de una organización
router.get(
  '/',
  authenticateToken,
  [
    query('status')
      .optional()
      .isIn(['scheduled', 'active', 'completed', 'cancelled'])
      .withMessage('Estado no válido'),
    query('category')
      .optional()
      .isIn(['board_members', 'policy', 'budget', 'leadership', 'other'])
      .withMessage('Categoría no válida'),
    query('startDateFrom')
      .optional()
      .isISO8601()
      .toDate()
      .withMessage('Fecha de inicio desde no válida'),
    query('startDateTo')
      .optional()
      .isISO8601()
      .toDate()
      .withMessage('Fecha de inicio hasta no válida'),
  ],
  handleValidationErrors,
  async (req: Request & { user: { id: string; organizationId: string } }, res: Response, next: NextFunction) => {
    try {
      const { organizationId } = req.user;
      const elections = await electionService.getElections(
        organizationId,
        req.user.id,
        req.query
      );

      res.json({
        success: true,
        data: elections,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Obtener elección por ID
router.get(
  '/:id',
  authenticateToken,
  [
    param('id')
      .isUUID()
      .withMessage('ID de elección no válido'),
  ],
  handleValidationErrors,
  async (req: Request & { user: { id: string; organizationId: string } }, res: Response, next: NextFunction) => {
    try {
      const { organizationId } = req.user;
      const election = await electionService.getElectionById(
        organizationId,
        req.params.id,
        req.user.id
      );

      res.json({
        success: true,
        data: election,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Actualizar elección
router.put(
  '/:id',
  authenticateToken,
  requireRole(['admin', 'super_admin']),
  [
    param('id')
      .isUUID()
      .withMessage('ID de elección no válido'),
    body('title')
      .optional()
      .isString()
      .isLength({ min: 3, max: 200 })
      .withMessage('El título debe tener entre 3 y 200 caracteres'),
    body('description')
      .optional()
      .isString()
      .isLength({ min: 10, max: 2000 })
      .withMessage('La descripción debe tener entre 10 y 2000 caracteres'),
    body('startDate')
      .optional()
      .isISO8601()
      .toDate()
      .withMessage('La fecha de inicio debe ser válida'),
    body('endDate')
      .optional()
      .isISO8601()
      .toDate()
      .withMessage('La fecha de fin debe ser válida'),
    body('category')
      .optional()
      .isIn(['board_members', 'policy', 'budget', 'leadership', 'other'])
      .withMessage('Categoría no válida'),
    body('maxVotesPerUser')
      .optional()
      .isInt({ min: 1, max: 10 })
      .withMessage('Los votos máximos por usuario deben estar entre 1 y 10'),
    body('isPublic')
      .optional()
      .isBoolean()
      .withMessage('isPublic debe ser booleano'),
    body('requiresVoterRegistry')
      .optional()
      .isBoolean()
      .withMessage('requiresVoterRegistry debe ser booleano'),
    body('status')
      .optional()
      .isIn(['scheduled', 'active', 'completed', 'cancelled'])
      .withMessage('Estado no válido'),
    body('options')
      .optional()
      .isArray({ min: 2 })
      .withMessage('Debe proporcionar al menos 2 opciones'),
    body('options.*.title')
      .optional()
      .isString()
      .isLength({ min: 1, max: 100 })
      .withMessage('El título de la opción debe tener entre 1 y 100 caracteres'),
    body('options.*.description')
      .optional()
      .isString()
      .isLength({ max: 500 })
      .withMessage('La descripción de la opción no puede exceder 500 caracteres'),
    body('options.*.imageUrl')
      .optional()
      .custom((value) => {
        if (!value || value === '') return true;
        // Aceptar rutas relativas que empiecen con /
        if (value.startsWith('/')) return true;
        // Validar URLs absolutas
        try {
          new URL(value);
          return true;
        } catch {
          return false;
        }
      })
      .withMessage('La URL de la imagen debe ser válida o una ruta relativa'),
  ],
  handleValidationErrors,
  async (req: Request & { user: { id: string; organizationId: string } }, res: Response, next: NextFunction) => {
    try {
      const { organizationId } = req.user;
      const election = await electionService.updateElection(
        organizationId,
        req.params.id,
        req.user.id,
        req.body
      );

      res.json({
        success: true,
        message: 'Elección actualizada exitosamente',
        data: election,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Eliminar elección
router.delete(
  '/:id',
  authenticateToken,
  requireRole(['admin', 'super_admin']),
  [
    param('id')
      .isUUID()
      .withMessage('ID de elección no válido'),
  ],
  handleValidationErrors,
  async (req: Request & { user: { id: string; organizationId: string } }, res: Response, next: NextFunction) => {
    try {
      const { organizationId } = req.user;
      await electionService.deleteElection(
        organizationId,
        req.params.id,
        req.user.id
      );

      res.json({
        success: true,
        message: 'Elección eliminada exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }
);

// Iniciar elección
router.post(
  '/:id/start',
  authenticateToken,
  requireRole(['admin', 'super_admin']),
  [
    param('id')
      .isUUID()
      .withMessage('ID de elección no válido'),
  ],
  handleValidationErrors,
  async (req: Request & { user: { id: string; organizationId: string } }, res: Response, next: NextFunction) => {
    try {
      const { organizationId } = req.user;
      const election = await electionService.startElection(
        organizationId,
        req.params.id,
        req.user.id
      );

      res.json({
        success: true,
        message: 'Elección iniciada exitosamente',
        data: election,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Finalizar elección
router.post(
  '/:id/end',
  authenticateToken,
  requireRole(['admin', 'super_admin']),
  [
    param('id')
      .isUUID()
      .withMessage('ID de elección no válido'),
  ],
  handleValidationErrors,
  async (req: Request & { user: { id: string; organizationId: string } }, res: Response, next: NextFunction) => {
    try {
      const { organizationId } = req.user;
      const election = await electionService.endElection(
        organizationId,
        req.params.id,
        req.user.id
      );

      res.json({
        success: true,
        message: 'Elección finalizada exitosamente',
        data: election,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Voter Registry Routes

// Get voters for an election
router.get(
  '/:id/voters',
  authenticateToken,
  requireRole(['admin', 'super_admin']),
  [
    param('id').isUUID().withMessage('ID de elección no válido'),
  ],
  handleValidationErrors,
  async (req: Request & { user: { id: string; organizationId: string; role: string } }, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { organizationId, role } = req.user;

      // Verify election access via service (reusing getElectionById for permission check)
      const election = await electionService.getElectionById(organizationId, id, req.user.id);

      const VoterRegistryService = (await import('../services/VoterRegistryService.js')).default;
      const voters = await VoterRegistryService.getElectionVoters(id);
      const stats = await VoterRegistryService.getRegistryStats(id);

      res.json({
        success: true,
        data: {
          voters,
          stats,
          requiresRegistry: election.requiresVoterRegistry
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Add voter to election registry
router.post(
  '/:id/voters',
  authenticateToken,
  requireRole(['admin', 'super_admin']),
  [
    param('id').isUUID().withMessage('ID de elección no válido'),
    body('userId').isUUID().withMessage('ID de usuario no válido'),
  ],
  handleValidationErrors,
  async (req: Request & { user: { id: string; organizationId: string; role: string } }, res: Response, next: NextFunction) => {
    try {
      const { id: electionId } = req.params;
      const { userId } = req.body;
      const { organizationId } = req.user;
      const addedBy = req.user.id;

      // Verify access
      await electionService.getElectionById(organizationId, electionId, req.user.id);

      const VoterRegistryService = (await import('../services/VoterRegistryService.js')).default;
      const voterRecord = await VoterRegistryService.addVoterToRegistry({
        electionId,
        userId,
        addedBy,
      });

      res.json({
        success: true,
        message: 'Votante agregado al padrón',
        data: voterRecord
      });
    } catch (error) {
      next(error);
    }
  }
);

// Remove voter from election registry
router.delete(
  '/:id/voters/:userId',
  authenticateToken,
  requireRole(['admin', 'super_admin']),
  [
    param('id').isUUID().withMessage('ID de elección no válido'),
    param('userId').isUUID().withMessage('ID de usuario no válido'),
  ],
  handleValidationErrors,
  async (req: Request & { user: { id: string; organizationId: string; role: string } }, res: Response, next: NextFunction) => {
    try {
      const { id: electionId, userId } = req.params;
      const { organizationId } = req.user;

      // Verify access
      await electionService.getElectionById(organizationId, electionId, req.user.id);

      const VoterRegistryService = (await import('../services/VoterRegistryService.js')).default;
      const removed = await VoterRegistryService.removeVoterFromRegistry(electionId, userId);

      if (!removed) {
        return res.status(404).json({
          success: false,
          message: 'Votante no encontrado en el padrón'
        });
      }

      res.json({
        success: true,
        message: 'Votante eliminado del padrón'
      });
    } catch (error) {
      next(error);
    }
  }
);

// Bulk import voters to election registry
router.post(
  '/:id/voters/import',
  authenticateToken,
  requireRole(['admin', 'super_admin']),
  [
    param('id').isUUID().withMessage('ID de elección no válido'),
    body('voters').isArray({ min: 1 }).withMessage('Se requiere un array de votantes no vacío'),
  ],
  handleValidationErrors,
  async (req: Request & { user: { id: string; organizationId: string; role: string } }, res: Response, next: NextFunction) => {
    try {
      const { id: electionId } = req.params;
      const { voters } = req.body;
      const { organizationId } = req.user;
      const addedBy = req.user.id;

      // Verify access
      await electionService.getElectionById(organizationId, electionId, req.user.id);

      const VoterRegistryService = (await import('../services/VoterRegistryService.js')).default;
      const result = await VoterRegistryService.bulkAddVoters(
        electionId,
        voters,
        addedBy,
        organizationId
      );

      res.json({
        success: true,
        message: `Importación completada: ${result.added} agregados, ${result.skipped} omitidos`,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get registry statistics
router.get(
  '/:id/voters/stats',
  authenticateToken,
  requireRole(['admin', 'super_admin']),
  [
    param('id').isUUID().withMessage('ID de elección no válido'),
  ],
  handleValidationErrors,
  async (req: Request & { user: { id: string; organizationId: string; role: string } }, res: Response, next: NextFunction) => {
    try {
      const { id: electionId } = req.params;
      const { organizationId } = req.user;

      // Verify access
      await electionService.getElectionById(organizationId, electionId, req.user.id);

      const VoterRegistryService = (await import('../services/VoterRegistryService.js')).default;
      const stats = await VoterRegistryService.getRegistryStats(electionId);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;