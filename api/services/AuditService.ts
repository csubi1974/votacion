import { AuditLog } from '../models/AuditLog.js';
import { User } from '../models/User.js';
import { Op, Sequelize } from 'sequelize';

export interface AuditLogData {
  userId: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  ipAddress: string;
}

interface UserSummary {
  id: string;
  fullName: string;
  email: string;
  role: string;
}

interface AuditLogItem {
  id: string;
  user?: UserSummary;
  action: string;
  resourceType: string;
  resourceId?: string;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  ipAddress: string;
  createdAt: Date;
}

export class AuditService {
  async logActivity(data: AuditLogData): Promise<void> {
    try {
      await AuditLog.create({
        userId: data.userId,
        action: data.action,
        resourceType: data.resourceType,
        resourceId: data.resourceId,
        oldValues: data.oldValues,
        newValues: data.newValues,
        ipAddress: data.ipAddress,
      });
    } catch (error) {
      console.error('Error logging audit activity:', error);
      // Don't throw error to avoid breaking the main operation
    }
  }

  async getAuditLogs(filters: {
    userId?: string;
    action?: string;
    resourceType?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{ logs: AuditLogItem[]; total: number }> {
    try {
      const where: Record<string, unknown> = {};

      if (filters.userId) {
        where.userId = filters.userId;
      }

      if (filters.action) {
        where.action = filters.action;
      }

      if (filters.resourceType) {
        where.resourceType = filters.resourceType;
      }

      if (filters.startDate || filters.endDate) {
        where.createdAt = {};
        if (filters.startDate) {
          where.createdAt[Op.gte] = filters.startDate;
        }
        if (filters.endDate) {
          where.createdAt[Op.lte] = filters.endDate;
        }
      }

      const limit = filters.limit || 50;
      const offset = filters.offset || 0;

      const { count, rows } = await AuditLog.findAndCountAll({
        where,
        include: [
          {
            model: User,
            attributes: ['id', 'fullName', 'email', 'role'],
          },
        ],
        order: [['createdAt', 'DESC']],
        limit,
        offset,
      });

      const logs: AuditLogItem[] = rows.map(log => {
        const lg = log as unknown as { user?: User };
        const user: UserSummary | undefined = lg.user
          ? { id: lg.user.id, fullName: lg.user.fullName, email: lg.user.email, role: lg.user.role }
          : undefined;
        return {
          id: log.id,
          user,
          action: log.action,
          resourceType: log.resourceType,
          resourceId: log.resourceId,
          oldValues: log.oldValues as Record<string, unknown> | null,
          newValues: log.newValues as Record<string, unknown> | null,
          ipAddress: log.ipAddress,
          createdAt: log.createdAt,
        };
      });

      return { logs, total: count };
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      throw new Error('Error al obtener registros de auditoría');
    }
  }

  async getSecurityEvents(limit: number = 100): Promise<AuditLogItem[]> {
    try {
      const securityActions = [
        'LOGIN_FAILED',
        'LOGIN_SUCCESS',
        'LOGOUT',
        'PASSWORD_CHANGED',
        'PASSWORD_RESET_REQUESTED',
        'PASSWORD_RESET_COMPLETED',
        'ACCOUNT_LOCKED',
        'ACCOUNT_UNLOCKED',
        '2FA_ENABLED',
        '2FA_DISABLED',
        '2FA_VERIFICATION_FAILED',
        '2FA_VERIFICATION_SUCCESS',
        'VOTE_ATTEMPT',
        'VOTE_CAST',
        'VOTE_FAILED',
        'ELECTION_CREATED',
        'ELECTION_UPDATED',
        'ELECTION_DELETED',
        'USER_CREATED',
        'USER_UPDATED',
        'USER_DELETED',
        'ROLE_CHANGED',
        'PERMISSION_DENIED',
        'SUSPICIOUS_ACTIVITY',
        'RATE_LIMIT_EXCEEDED',
        'CSRF_VIOLATION',
        'XSS_ATTEMPT',
        'SQL_INJECTION_ATTEMPT',
      ];

      const logs = await AuditLog.findAll({
        where: {
          action: securityActions,
        },
        include: [
          {
            model: User,
            attributes: ['id', 'fullName', 'email', 'role'],
          },
        ],
        order: [['createdAt', 'DESC']],
        limit,
      });

      return logs.map(log => {
        const lg = log as unknown as { user?: User };
        const user: UserSummary | undefined = lg.user
          ? { id: lg.user.id, fullName: lg.user.fullName, email: lg.user.email, role: lg.user.role }
          : undefined;
        return {
          id: log.id,
          user,
          action: log.action,
          resourceType: log.resourceType,
          resourceId: log.resourceId,
          oldValues: log.oldValues as Record<string, unknown> | null,
          newValues: log.newValues as Record<string, unknown> | null,
          ipAddress: log.ipAddress,
          createdAt: log.createdAt,
        };
      });
    } catch (error) {
      console.error('Error fetching security events:', error);
      throw new Error('Error al obtener eventos de seguridad');
    }
  }

  async getUserActivity(userId: string, limit: number = 50): Promise<AuditLogItem[]> {
    try {
      const logs = await AuditLog.findAll({
        where: {
          userId,
        },
        order: [['createdAt', 'DESC']],
        limit,
      });

      return logs.map(log => ({
        id: log.id,
        action: log.action,
        resourceType: log.resourceType,
        resourceId: log.resourceId,
        oldValues: log.oldValues as Record<string, unknown> | null,
        newValues: log.newValues as Record<string, unknown> | null,
        ipAddress: log.ipAddress,
        createdAt: log.createdAt,
      }));
    } catch (error) {
      console.error('Error fetching user activity:', error);
      throw new Error('Error al obtener actividad del usuario');
    }
  }

  async getElectionAuditTrail(electionId: string): Promise<AuditLogItem[]> {
    try {
      const logs = await AuditLog.findAll({
        where: {
          resourceId: electionId,
          resourceType: 'election',
        },
        include: [
          {
            model: User,
            attributes: ['id', 'fullName', 'email', 'role'],
          },
        ],
        order: [['createdAt', 'DESC']],
      });

      return logs.map(log => {
        const lg = log as unknown as { user?: User };
        const user: UserSummary | undefined = lg.user
          ? { id: lg.user.id, fullName: lg.user.fullName, email: lg.user.email, role: lg.user.role }
          : undefined;
        return {
          id: log.id,
          user,
          action: log.action,
          resourceType: log.resourceType,
          resourceId: log.resourceId,
          oldValues: log.oldValues as Record<string, unknown> | null,
          newValues: log.newValues as Record<string, unknown> | null,
          ipAddress: log.ipAddress,
          createdAt: log.createdAt,
        };
      });
    } catch (error) {
      console.error('Error fetching election audit trail:', error);
      throw new Error('Error al obtener auditoría de elección');
    }
  }

  async getSuspiciousActivity(limit: number = 50): Promise<AuditLogItem[]> {
    try {
      const suspiciousActions = [
        'LOGIN_FAILED',
        'VOTE_FAILED',
        'PERMISSION_DENIED',
        'RATE_LIMIT_EXCEEDED',
        'CSRF_VIOLATION',
        'XSS_ATTEMPT',
        'SQL_INJECTION_ATTEMPT',
        'SUSPICIOUS_ACTIVITY',
      ];

      const logs = await AuditLog.findAll({
        where: {
          action: suspiciousActions,
        },
        include: [
          {
            model: User,
            attributes: ['id', 'fullName', 'email', 'role'],
          },
        ],
        order: [['createdAt', 'DESC']],
        limit,
      });

      return logs.map(log => {
        const lg = log as unknown as { user?: User };
        const user: UserSummary | undefined = lg.user
          ? { id: lg.user.id, fullName: lg.user.fullName, email: lg.user.email, role: lg.user.role }
          : undefined;
        return {
          id: log.id,
          user,
          action: log.action,
          resourceType: log.resourceType,
          resourceId: log.resourceId,
          oldValues: log.oldValues as Record<string, unknown> | null,
          newValues: log.newValues as Record<string, unknown> | null,
          ipAddress: log.ipAddress,
          createdAt: log.createdAt,
        };
      });
    } catch (error) {
      console.error('Error fetching suspicious activity:', error);
      throw new Error('Error al obtener actividad sospechosa');
    }
  }

  async generateAuditReport(startDate: Date, endDate: Date): Promise<{
    period: { start: Date; end: Date };
    summary: { totalActivities: number; securityEvents: number; suspiciousActivities: number; uniqueUsers: number };
    topActions: Array<{ action: string; count: number }>;
    topUsers: Array<{ user: UserSummary; activityCount: number }>;
    securityEvents: AuditLogItem[];
    suspiciousActivity: AuditLogItem[];
    recentActivity: AuditLogItem[];
  }> {
    try {
      const [allLogs, securityEvents, suspiciousActivity, userStats] = await Promise.all([
        this.getAuditLogs({
          startDate,
          endDate,
          limit: 1000,
        }),
        this.getSecurityEvents(100),
        this.getSuspiciousActivity(100),
        this.getUserStatistics(startDate, endDate),
      ]);

      return {
        period: {
          start: startDate,
          end: endDate,
        },
        summary: {
          totalActivities: allLogs.total,
          securityEvents: securityEvents.length,
          suspiciousActivities: suspiciousActivity.length,
          uniqueUsers: userStats.uniqueUsers,
        },
        topActions: this.getTopActions(allLogs.logs),
        topUsers: userStats.topUsers,
        securityEvents,
        suspiciousActivity,
        recentActivity: allLogs.logs.slice(0, 20),
      };
    } catch (error) {
      console.error('Error generating audit report:', error);
      throw new Error('Error al generar reporte de auditoría');
    }
  }

  private getTopActions(logs: AuditLogItem[]): Array<{ action: string; count: number }> {
    const actionCounts = logs.reduce((acc, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const entries = Object.entries(actionCounts) as Array<[string, number]>;
    return entries
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([action, count]) => ({ action, count }));
  }

  private async getUserStatistics(startDate: Date, endDate: Date): Promise<{ uniqueUsers: number; topUsers: Array<{ user: UserSummary; activityCount: number }> }> {
    try {
      const userActivity = await AuditLog.findAll({
        where: {
          createdAt: {
            [Op.between]: [startDate, endDate],
          },
        } as unknown,
        attributes: [
          'userId',
          [Sequelize.fn('COUNT', Sequelize.col('id')), 'activityCount'],
        ],
        group: ['userId'],
        order: [[Sequelize.fn('COUNT', Sequelize.col('id')), 'DESC']],
        limit: 10,
        include: [
          {
            model: User,
            attributes: ['id', 'fullName', 'email', 'role'],
          },
        ],
      });

      const uniqueUsers = await AuditLog.count({
        where: {
          createdAt: {
            [Op.between]: [startDate, endDate],
          },
        } as unknown,
        distinct: true,
        col: 'userId',
      });

      return {
        uniqueUsers,
        topUsers: userActivity.map((ua) => {
          const u = (ua as unknown as { user?: User }).user!;
          const countRaw = ua.get('activityCount') as unknown;
          const activityCount = typeof countRaw === 'string' ? parseInt(countRaw, 10) : Number(countRaw);
          return {
            user: { id: u.id, fullName: u.fullName, email: u.email, role: u.role },
            activityCount,
          };
        }),
      };
    } catch (error) {
      console.error('Error getting user statistics:', error);
      throw error;
    }
  }
}