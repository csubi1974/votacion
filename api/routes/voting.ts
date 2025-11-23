import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { VotingService } from '../services/VotingService.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const votingService = new VotingService();

// Validation middleware
const validateVote = [
  body('electionId').isUUID().withMessage('ID de elección inválido'),
  body('optionIds').isArray({ min: 1 }).withMessage('Debes seleccionar al menos una opción'),
  body('optionIds.*').isUUID().withMessage('Opción inválida'),
];

type AuthenticatedRequest = Request & { user: { id: string; organizationId: string } };

router.get('/available', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user.id;
    const organizationId = req.user.organizationId;

    const elections = await votingService.getAvailableElections(userId, organizationId);

    res.json({
      success: true,
      data: elections
    });
  } catch (error) {
    console.error('Available elections error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cargar elecciones disponibles'
    });
  }
});

// Get election details for voting
router.get('/elections/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const organizationId = req.user.organizationId;

    const election = await votingService.getElectionDetails(id, userId, organizationId);

    if (!election) {
      return res.status(404).json({
        success: false,
        message: 'Elección no encontrada o no disponible'
      });
    }

    // Check if user has already voted
    const hasVoted = await votingService.hasUserVoted(id, userId);

    res.json({
      success: true,
      data: {
        election,
        hasVoted
      }
    });
  } catch (error) {
    console.error('Election details error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cargar detalles de la elección'
    });
  }
});

// Validate vote (first step of 2-step confirmation)
router.post('/validate', authenticateToken, validateVote, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Errores de validación',
        errors: errors.array()
      });
    }

    const { electionId, optionIds } = req.body;
    const userId = req.user.id;
    const organizationId = req.user.organizationId;

    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.ip || '';
    const userAgent = (req.headers['user-agent'] as string) || '';

    const validation = await votingService.validateVote({
      electionId,
      optionIds,
      userId,
      organizationId,
      ipAddress,
      userAgent,
    });

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.errors.join(', ')
      });
    }

    res.json({
      success: true,
      message: 'Voto válido'
    });
  } catch (error) {
    console.error('Vote validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al validar el voto'
    });
  }
});

// Cast vote (second step of 2-step confirmation)
router.post('/cast', authenticateToken, validateVote, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Errores de validación',
        errors: errors.array()
      });
    }

    const { electionId, optionIds } = req.body;
    const userId = req.user.id;
    const organizationId = req.user.organizationId;

    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.ip || '';
    const userAgent = (req.headers['user-agent'] as string) || '';

    const votes = await votingService.castVote({
      electionId,
      optionIds,
      userId,
      organizationId,
      ipAddress,
      userAgent
    });

    // Emit real-time update
    try {
      const { getIO } = await import('../config/socket.js');
      const io = getIO();
      io.to(`election_${electionId}`).emit('vote_update', {
        electionId,
        timestamp: new Date().toISOString()
      });
    } catch (socketError) {
      console.error('Socket emission error:', socketError);
      // Don't fail the request if socket fails
    }

    res.json({
      success: true,
      message: 'Voto registrado exitosamente',
      data: votes
    });
  } catch (error: unknown) {
    console.error('Vote casting error:', error);
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'Error al registrar el voto'
    });
  }
});

// Get user voting history
router.get('/history', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user.id;

    const history = await votingService.getUserVotingHistory(userId);

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Voting history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cargar historial de votación'
    });
  }
});

// Get election results (for public viewing)
router.get('/elections/:id/results', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    const results = await votingService.getElectionResults(id, organizationId);

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Election results error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cargar resultados de la elección'
    });
  }
});

export default router;