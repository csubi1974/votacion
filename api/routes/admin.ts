import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { User } from '../models/User.js';
import { Organization } from '../models/Organization.js';
import { Election } from '../models/Election.js';
import { ElectionOption } from '../models/ElectionOption.js';
import { Vote } from '../models/Vote.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { Op } from 'sequelize';

const router = express.Router();

// Validation middleware
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
  body('role').isIn(['voter', 'admin']).withMessage('Role must be voter or admin'),
];

// Get dashboard statistics
type AdminUser = { id: string; organizationId: string; role: 'voter' | 'admin' | 'super_admin' };
type AdminRequest = Request & { user: AdminUser };

router.get('/dashboard', authenticateToken, requireRole(['admin', 'super_admin']), async (req: AdminRequest, res: Response) => {
  try {
    const organizationId = req.user.organizationId;
    const userRole = req.user.role;

    const whereClause: Record<string, unknown> = {};
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

// User management routes
router.get('/users', authenticateToken, requireRole(['admin', 'super_admin']), async (req: AdminRequest, res: Response) => {
  try {
    const { page = '1', limit = '10', search = '', role = '' } = req.query as Record<string, string>;
    const organizationId = req.user.organizationId;
    const userRole = req.user.role;

    const whereClause: Record<string, unknown> = {};
    if (userRole !== 'super_admin') {
      whereClause.organizationId = organizationId;
    }

    if (search) {
      whereClause[Op.or] = [
        { rut: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { fullName: { [Op.like]: `%${search}%` } }
      ];
    }

    if (role && ['voter', 'admin'].includes(role)) {
      whereClause.role = role as 'voter' | 'admin';
    }

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows: users } = await User.findAndCountAll({
      where: whereClause,
      attributes: ['id', 'rut', 'email', 'fullName', 'role', 'emailVerified', 'twoFactorEnabled', 'createdAt', 'updatedAt'],
      include: [{
        model: Organization,
        as: 'organization',
        attributes: ['id', 'name', 'rut']
      }],
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

    const { rut, email, fullName, role } = req.body;
    const organizationId = req.user.organizationId;

    // Check if user already exists
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ rut }, { email }]
      }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this RUT or email already exists'
      });
    }

    // Generate temporary password
    const temporaryPassword = Math.random().toString(36).slice(-8);
    const { hashPassword } = await import('../utils/security.js');
    const passwordHash = await hashPassword(temporaryPassword);

    const user = await User.create({
      rut,
      email,
      fullName,
      role,
      organizationId,
      passwordHash,

    });

    // TODO: Send email with temporary password
    console.log(`Temporary password for ${email}: ${temporaryPassword}`);

    res.json({
      success: true,
      message: 'User created successfully. Temporary password sent to email.',
      data: {
        id: user.id,
        rut: user.rut,
        email: user.email,
        fullName: user.fullName,
        role: user.role
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

    const whereClause: Record<string, unknown> = { id };
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

    await user.update({
      fullName,
      role,
      emailVerified
    });

    res.json({
      success: true,
      message: 'User updated successfully',
      data: {
        id: user.id,
        rut: user.rut,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        emailVerified: user.emailVerified
      }
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

    const whereClause: Record<string, unknown> = { id };
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
    const { page = '1', limit = '10', status = '', search = '' } = req.query as Record<string, string>;
    const organizationId = req.user.organizationId;
    const userRole = req.user.role;

    const whereClause: Record<string, unknown> = {};
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

    if (start < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Start date must be in the future'
      });
    }

    // Validate options
    if (!options || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'At least 2 options are required'
      });
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
      organizationId,

    });

    // Create options
    const electionOptions = await Promise.all(
      options.map((option, index) => 
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
    const { title, description, startDate, endDate, category, maxVotesPerUser, isPublic, status } = req.body;
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

    // Prevent editing elections that have already started
    if (election.status === 'active' || election.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot edit elections that have already started'
      });
    }

    await election.update({
      title,
      description,
      startDate,
      endDate,
      category,
      maxVotesPerUser,
      isPublic,
      status
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

    const whereClause: Record<string, unknown> = { id };
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