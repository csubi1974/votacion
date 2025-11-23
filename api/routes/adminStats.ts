import express, { Request, Response } from 'express';
import { User } from '../models/User.js';
import { Election } from '../models/Election.js';
import { ElectionOption } from '../models/ElectionOption.js';
import { Vote } from '../models/Vote.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { Op } from 'sequelize';
import { sequelize } from '../config/database.js';

const router = express.Router();

type AdminUser = { id: string; organizationId: string; role: 'voter' | 'admin' | 'super_admin' };
type AdminRequest = Request & { user: AdminUser };

// Get participation stats
router.get('/participation', authenticateToken, requireRole(['admin', 'super_admin']), async (req: AdminRequest, res: Response) => {
    try {
        const organizationId = req.user.organizationId;
        const userRole = req.user.role;
        const { period = '24h' } = req.query; // 24h, 7d, 30d

        const whereClause: Record<string, unknown> = {};
        if (userRole !== 'super_admin') {
            whereClause.organizationId = organizationId;
        }

        // Calculate date range
        const now = new Date();
        const startDate = new Date();
        if (period === '7d') startDate.setDate(now.getDate() - 7);
        else if (period === '30d') startDate.setDate(now.getDate() - 30);
        else startDate.setHours(now.getHours() - 24);

        // Get votes grouped by time
        // Note: SQLite specific date formatting
        const votes = await Vote.findAll({
            attributes: [
                [sequelize.fn('strftime', '%Y-%m-%d %H:00', sequelize.col('Vote.createdAt')), 'time'],
                [sequelize.fn('count', sequelize.col('Vote.id')), 'count']
            ],
            include: [{
                model: Election,
                as: 'election',
                where: whereClause,
                attributes: []
            }],
            where: {
                createdAt: { [Op.gte]: startDate }
            },
            group: ['time'],
            order: [['time', 'ASC']],
            raw: true
        });

        res.json({
            success: true,
            data: votes
        });
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to load participation stats'
        });
    }
});

// Export full report
router.get('/export', authenticateToken, requireRole(['admin', 'super_admin']), async (req: AdminRequest, res: Response) => {
    try {
        const organizationId = req.user.organizationId;
        const userRole = req.user.role;

        const whereClause: Record<string, unknown> = {};
        if (userRole !== 'super_admin') {
            whereClause.organizationId = organizationId;
        }

        // Get comprehensive stats
        const [
            totalUsers,
            totalElections,
            totalVotes,
            elections
        ] = await Promise.all([
            User.count({ where: whereClause }),
            Election.count({ where: whereClause }),
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
                include: [
                    {
                        model: ElectionOption,
                        as: 'options',
                        include: [{
                            model: Vote,
                            as: 'votes',
                            attributes: ['id']
                        }]
                    },
                    {
                        model: Vote,
                        as: 'votes',
                        attributes: ['createdAt']
                    }
                ],
                order: [['createdAt', 'DESC']]
            })
        ]);

        // Format data for report
        const reportData = {
            generatedAt: new Date(),
            summary: {
                totalUsers,
                totalElections,
                totalVotes,
                participationRate: totalUsers > 0 ? ((totalVotes / totalUsers) * 100).toFixed(2) + '%' : '0%'
            },
            elections: elections.map(e => ({
                id: e.id,
                title: e.title,
                status: e.status,
                startDate: e.startDate,
                endDate: e.endDate,
                totalVotes: e.votes?.length || 0,
                options: e.options?.map(o => ({
                    text: o.text,
                    votes: o.votes?.length || 0
                }))
            }))
        };

        res.json({
            success: true,
            data: reportData
        });

    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate report'
        });
    }
});

export default router;
