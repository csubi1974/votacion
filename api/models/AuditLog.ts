import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

export interface AuditLogAttributes {
  id: string;
  userId: string;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  ipAddress: string;
}

export type AuditLogCreationAttributes = Omit<AuditLogAttributes, 'id'>;

export class AuditLog extends Model<AuditLogAttributes, AuditLogCreationAttributes> 
  implements AuditLogAttributes {
  declare id: string;
  declare userId: string;
  declare action: string;
  declare resourceType: string;
  declare resourceId: string | null | undefined;
  declare oldValues: Record<string, unknown> | null | undefined;
  declare newValues: Record<string, unknown> | null | undefined;
  declare ipAddress: string;
  declare readonly createdAt: Date;
}

AuditLog.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  resourceType: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  resourceId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  oldValues: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  newValues: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  sequelize,
  modelName: 'AuditLog',
  tableName: 'audit_logs',
  timestamps: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['action'] },
    { fields: ['resourceType', 'resourceId'] },
    { fields: ['createdAt'] },
  ],
});

export default AuditLog;