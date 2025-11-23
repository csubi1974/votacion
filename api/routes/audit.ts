import express, { Request, Response } from 'express';
import { AuditService } from '../services/AuditService.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();
const auditService = new AuditService();

// Create audit log entry
type AuthedReq = Request & { user: { id: string; organizationId: string } };

router.post('/log', authenticateToken, async (req: AuthedReq, res: Response) => {
  try {
    const { action, resourceType, resourceId } = req.body;
    const userId = req.user.id;

    await auditService.logActivity({
      userId,
      action,
      resourceType,
      resourceId: resourceId ? String(resourceId) : undefined,
      oldValues: undefined,
      newValues: undefined,
      ipAddress: req.ip || '',
    });

    res.json({
      success: true,
      message: 'Registro de auditoría creado exitosamente'
    });
  } catch (error) {
    console.error('Audit log creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear registro de auditoría'
    });
  }
});

// Get audit logs (admin only)
router.get('/logs', authenticateToken, requireRole(['admin', 'super_admin']), async (req: AuthedReq, res: Response) => {
  try {
    const {
      userId,
      action,
      resourceType,
      startDate,
      endDate,
      limit = 50,
      offset = 0,
    } = req.query as Record<string, string>;

    const filters = {
      userId: typeof userId === 'string' ? userId : undefined,
      action: typeof action === 'string' ? action : undefined,
      resourceType: typeof resourceType === 'string' ? resourceType : undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit: Number(limit),
      offset: Number(offset),
    };

    const result = await auditService.getAuditLogs(filters);

    res.json({
      success: true,
      data: result.logs,
      pagination: {
        total: result.total,
        limit: filters.limit,
        offset: filters.offset,
        hasMore: result.total > (filters.offset + filters.limit),
      }
    });
  } catch (error) {
    console.error('Audit logs fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener registros de auditoría'
    });
  }
});

// Get current user's activity logs (any authenticated user)
router.get('/my-activity', authenticateToken, async (req: AuthedReq, res: Response) => {
  try {
    const userId = req.user.id;
    const { limit = 10 } = req.query as Record<string, string>;

    const logs = await auditService.getUserActivity(userId, parseInt(limit as string));

    res.json({
      success: true,
      data: logs,
      total: logs.length,
    });
  } catch (error) {
    console.error('Get user activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener actividad del usuario',
    });
  }
});

export default router;