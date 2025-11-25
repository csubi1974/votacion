import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { Op } from 'sequelize';
import { User } from '../models/User.js';
import { Election } from '../models/Election.js';
import { ElectionOption } from '../models/ElectionOption.js';
import { Vote } from '../models/Vote.js';
import { Organization } from '../models/Organization.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { AuditService } from '../services/AuditService.js';
import bcrypt from 'bcryptjs';

const router = express.Router();
const auditService = new AuditService();

// Validation rules
const validateElection = [
  body('title').isString().isLength({ min: 3, max: 200 }).withMessage('Title must be 3-200 characters'),
  body('description').isString().isLength({ min: 10, max: 1000 }).withMessage('Description must be 10-1000 characters'),
  body('startDate').isISO8601().withMessage('Start date must be valid ISO date'),
  body('endDate').isISO8601().withMessage('End date must be valid ISO date'),
  body('category').isIn(['board_members', 'policy', 'budget', 'leadership', 'other']).withMessage('Invalid category'),
  body('maxVotesPerUser').isInt({ min: 1, max: 10 }).withMessage('Max votes must be between 1-10'),
  body('isPublic').isBoolean().withMessage('isPublic must be boolean'),
];

const validateUser = [
  body('rut').isString().isLength({ min: 8, max: 12 }).withMessage('RUT must be 8-12 characters'),
  body('email').isEmail().withMessage('Valid email required'),
  body('fullName').isString().isLength({ min: 2, max: 100 }).withMessage('Full name must be 2-100 characters'),
  body('role').isIn(['voter', 'admin', 'super_admin']).withMessage('Role must be voter, admin or super_admin'),
];

// Get dashboard statistics
type AdminUser = { id: string; organizationId: string; role: 'voter' | 'admin' | 'super_admin' };
type AdminRequest = Request & { user: AdminUser };

router.get('/dashboard', authenticateToken, requireRole(['admin', 'super_admin']), async (req: AdminRequest, res: Response) => {
  try {
    const organizationId = req.user.organizationId;
    const userRole = req.user.role;

    const whereClause: any = {};
    if (userRole !== 'super_admin') {
      whereClause.organizationId = organizationId;
    }

    const [
      totalUsers,
      totalElections,
      activeElections,
      totalVotes,
      recentElections,
      recentUsers
    ] = await Promise.all([
      User.count({ where: whereClause }),
      Election.count({ where: whereClause }),
      Election.count({
        where: {
          ...whereClause,
          status: 'active',
          startDate: { [Op.lte]: new Date() },
          endDate: { [Op.gte]: new Date() }
        }
      }),
      Vote.count({
        include: [{
          model: Election,
          as: 'election',
          where: whereClause,
          required: true
        }]
      }),
      Election.findAll({
        where: whereClause,
        order: [['createdAt', 'DESC']],
        limit: 5,
        include: [{
          model: ElectionOption,
          as: 'options',
          required: false
        }]
      }),
      User.findAll({
        where: whereClause,
        order: [['createdAt', 'DESC']],
        limit: 5,
        attributes: ['id', 'rut', 'email', 'fullName', 'role', 'createdAt']
      })
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalElections,
          activeElections,
          totalVotes,
        },
        recentElections,
        recentUsers
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load dashboard data'
    });
  }
});

// Get organizations list
router.get('/organizations', authenticateToken, requireRole(['admin', 'super_admin']), async (req: AdminRequest, res: Response) => {
  try {
    const userRole = req.user.role;
    const organizationId = req.user.organizationId;

    const whereClause: any = {};
    if (userRole !== 'super_admin') {
      whereClause.id = organizationId;
    }

    const organizations = await Organization.findAll({
      where: whereClause,
      attributes: ['id', 'name'],
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      data: organizations
    });
  } catch (error) {
    console.error('Error fetching organizations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch organizations'
    });
  }
});

// User management routes
router.get('/users', authenticateToken, requireRole(['admin', 'super_admin']), async (req: AdminRequest, res: Response) => {
  try {
    const { page = '1', limit = '10', search = '' } = req.query as Record<string, string>;
    const organizationId = req.user.organizationId;
    const userRole = req.user.role;

    const whereClause: any = {};
    if (userRole !== 'super_admin') {
      whereClause.organizationId = organizationId;
    }

    if (search) {
      whereClause[Op.or] = [
        { fullName: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { rut: { [Op.like]: `%${search}%` } }
      ];
    }

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows: users } = await User.findAndCountAll({
      where: whereClause,
      attributes: ['id', 'rut', 'email', 'fullName', 'role', 'emailVerified', 'createdAt'],
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset
    });

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(count / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('Users list error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load users'
    });
  }
});

router.get('/users/:id', authenticateToken, requireRole(['admin', 'super_admin']), async (req: AdminRequest, res: Response) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;
    const userRole = req.user.role;

    const whereClause: any = { id };
    if (userRole !== 'super_admin') {
      whereClause.organizationId = organizationId;
    }

    const user = await User.findOne({
      where: whereClause,
      attributes: ['id', 'rut', 'email', 'fullName', 'role', 'organizationId', 'emailVerified', 'twoFactorEnabled', 'createdAt'],
      include: [{
        model: Organization,
        as: 'organization',
        attributes: ['id', 'name', 'rut']
      }]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load user'
    });
  }
});

router.post('/users', authenticateToken, requireRole(['admin', 'super_admin']), validateUser, async (req: AdminRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { rut, email, fullName, role, organizationId: bodyOrgId } = req.body;
    // Use organizationId from body if provided, otherwise use user's organizationId
    const organizationId = bodyOrgId || req.user.organizationId;

    // Check if user exists
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ email }, { rut }],
        organizationId
      }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or RUT already exists'
      fullName,
        role,
        organizationId,
        emailVerified: false
      });

      // Log audit event
      await auditService.logActivity({
        userId: req.user.id,
        action: 'USER_CREATED',
        resourceType: 'user',
        resourceId: user.id,
        oldValues: null,
        newValues: {
          rut: user.rut,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          organizationId: user.organizationId
        },
        ipAddress: req.ip || '0.0.0.0',
      });

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: {
          user: {
            id: user.id,
            rut: user.rut,
            email: user.email,
            fullName: user.fullName,
            role: user.role
          },
          tempPassword
        }
      });
    } catch (error) {
      console.error('User creation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create user'
      });
    }
  });

router.put('/users/:id', authenticateToken, requireRole(['admin', 'super_admin']), async (req: AdminRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { fullName, role, emailVerified } = req.body;
    const organizationId = req.user.organizationId;
    const userRole = req.user.role;

    const whereClause: any = { id };
    if (userRole !== 'super_admin') {
      whereClause.organizationId = organizationId;
    }

    const user = await User.findOne({ where: whereClause });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const oldValues = {
      fullName: user.fullName,
      role: user.role,
      emailVerified: user.emailVerified
    };

    await user.update({
      fullName,
      role,
      emailVerified
    });

    // Log audit event
    await auditService.logActivity({
      userId: req.user.id,
      action: 'USER_UPDATED',
      resourceType: 'user',
      resourceId: user.id,
      oldValues,
      newValues: {
        fullName: user.fullName,
        role: user.role,
        emailVerified: user.emailVerified
      },
      ipAddress: req.ip || '0.0.0.0',
    });

    res.json({
      success: true,
      message: 'User updated successfully',
      data: user
    });
  } catch (error) {
    console.error('User update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user'
    });
  }
});

router.delete('/users/:id', authenticateToken, requireRole(['admin', 'super_admin']), async (req: AdminRequest, res: Response) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;
    const userRole = req.user.role;

    const whereClause: any = { id };
    if (userRole !== 'super_admin') {
      whereClause.organizationId = organizationId;
    }

    const user = await User.findOne({ where: whereClause });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent deleting yourself
    if (user.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    await user.destroy();

    // Log audit event
    await auditService.logActivity({
      userId: req.user.id,
      action: 'USER_DELETED',
      resourceType: 'user',
      resourceId: user.id,
      oldValues: {
        rut: user.rut,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        organizationId: user.organizationId
      },
      newValues: null,
      ipAddress: req.ip || '0.0.0.0',
    });

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('User deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user'
    });
  }
});

// Election management routes
router.get('/elections', authenticateToken, requireRole(['admin', 'super_admin']), async (req: AdminRequest, res: Response) => {
  try {
    // Auto-update statuses before fetching
    const { ElectionScheduler } = await import('../services/ElectionScheduler.js');
    await ElectionScheduler.updateElectionStatuses();

    const { page = '1', limit = '10', status = '', search = '' } = req.query as Record<string, string>;
    const organizationId = req.user.organizationId;
    const userRole = req.user.role;

    const whereClause: any = {};
    if (userRole !== 'super_admin') {
      whereClause.organizationId = organizationId;
    }

    if (status && ['scheduled', 'active', 'completed', 'cancelled'].includes(status)) {
      whereClause.status = status as 'scheduled' | 'active' | 'completed' | 'cancelled';
    }

    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows: elections } = await Election.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Organization,
          as: 'organization',
          attributes: ['id', 'name', 'rut']
        },
        {
          model: ElectionOption,
          as: 'options',
          required: false
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset
    });

    res.json({
      success: true,
      data: {
        elections,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(count / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('Elections list error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load elections'
    });
  }
});

router.post('/elections', authenticateToken, requireRole(['admin', 'super_admin']), validateElection, async (req: AdminRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { title, description, startDate, endDate, category, maxVotesPerUser, isPublic, options } = req.body;
    const organizationId = req.user.organizationId;

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after start date'
      });
    }

    // Validate options
    if (!options || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'At least 2 options are required'
      });
    }

    // Determine initial status based on dates
    const now = new Date();
    let initialStatus = 'scheduled';
    if (start <= now && end > now) {
      initialStatus = 'active';
    }

    // Create election
    const election = await Election.create({
      title,
      description,
      startDate: start,
      endDate: end,
      category,
      maxVotesPerUser,
      isPublic,
      requiresVoterRegistry: req.body.requiresVoterRegistry || false,
      organizationId,
      status: initialStatus as any,
    });

    // Create options
    const electionOptions = await Promise.all(
      options.map((option: any, index: number) =>
        ElectionOption.create({
          electionId: election.id,
          text: option.text,
          imageUrl: option.imageUrl || null,
          orderIndex: index
        })
      )
    );

    res.json({
      success: true,
      message: 'Election created successfully',
      data: {
        election,
        options: electionOptions
      }
    });
  } catch (error) {
    console.error('Election creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create election'
    });
  }
});

router.put('/elections/:id', authenticateToken, requireRole(['admin', 'super_admin']), async (req: AdminRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, startDate, endDate, category, maxVotesPerUser, isPublic, status, requiresVoterRegistry } = req.body;
    const organizationId = req.user.organizationId;
    const userRole = req.user.role;

    const whereClause: Record<string, unknown> = { id };
    if (userRole !== 'super_admin') {
      whereClause.organizationId = organizationId;
    }

    const election = await Election.findOne({ where: whereClause });

    if (!election) {
      return res.status(404).json({
        success: false,
        message: 'Election not found'
      });
    }

    // Allow editing if election is scheduled, or if only changing status
    // If election is active/completed, prevent changing critical fields unless super_admin
    if ((election.status === 'active' || election.status === 'completed') && userRole !== 'super_admin') {
      // If trying to change critical fields
      if (title || description || startDate || endDate || category || maxVotesPerUser) {
        // Allow status change (e.g. to cancel)
        if (!status) {
          return res.status(400).json({
            success: false,
            message: 'Cannot edit critical fields of active/completed elections'
          });
        }
      }
    }

    await election.update({
      title,
      description,
      startDate,
      endDate,
      category,
      maxVotesPerUser,
      isPublic,
      status,
      requiresVoterRegistry
    });

    res.json({
      success: true,
      message: 'Election updated successfully',
      data: election
    });
  } catch (error) {
    console.error('Election update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update election'
    });
  }
});

router.delete('/elections/:id', authenticateToken, requireRole(['admin', 'super_admin']), async (req: AdminRequest, res: Response) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;
    const userRole = req.user.role;

    const whereClause: Record<string, unknown> = { id };
    if (userRole !== 'super_admin') {
      whereClause.organizationId = organizationId;
    }

    const election = await Election.findOne({ where: whereClause });

    if (!election) {
      return res.status(404).json({
        success: false,
        message: 'Election not found'
      });
    }

    // Prevent deleting elections that have already started
    if (election.status === 'active' || election.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete elections that have already started'
      });
    }

    await election.destroy();

    res.json({
      success: true,
      message: 'Election deleted successfully'
    });
  } catch (error) {
    console.error('Election deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete election'
    });
  }
});

// Get election results
router.get('/elections/:id/results', authenticateToken, requireRole(['admin', 'super_admin']), async (req: AdminRequest, res: Response) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;
    const userRole = req.user.role;

    const whereClause: any = { id };
    if (userRole !== 'super_admin') {
      whereClause.organizationId = organizationId;
    }

    const election = await Election.findOne({
      where: whereClause,
      include: [
        {
          model: ElectionOption,
          as: 'options',
          include: [{
            model: Vote,
            as: 'votes',
            required: false
          }]
        }
      ]
    });

    if (!election) {
      return res.status(404).json({
        success: false,
        message: 'Election not found'
      });
    }

    const options = (election as unknown as { options?: (ElectionOption & { votes?: Vote[] })[] }).options || [];
    const totalVotesAcrossOptions = options.reduce((sum, opt) => sum + (opt.votes?.length || 0), 0) || 0;

    const results = options.map(option => ({
      id: option.id,
      text: option.text,
      imageUrl: option.imageUrl || null,
      votes: option.votes?.length || 0,
      percentage: totalVotesAcrossOptions > 0 ? ((option.votes?.length || 0) / totalVotesAcrossOptions) * 100 : 0
    }));

    const totalVotes = results.reduce((sum, result) => sum + result.votes, 0);

    res.json({
      success: true,
      data: {
        election: {
          id: election.id,
          title: election.title,
          description: election.description,
          status: election.status,
          startDate: election.startDate,
          endDate: election.endDate
        },
        results,
        totalVotes
      }
    });
  } catch (error) {
    console.error('Election results error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load election results'
    });
  }
});

export default router;