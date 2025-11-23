import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

export type UserRole = 'voter' | 'admin' | 'super_admin';

export interface UserAttributes {
  id: string;
  rut: string;
  email: string;
  passwordHash: string;
  fullName: string;
  role: UserRole;
  organizationId: string;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string | null;
  failedLoginAttempts: number;
  lockedUntil?: Date | null;
}

export type UserCreationAttributes = Omit<UserAttributes, 'id' | 'emailVerified' | 'twoFactorEnabled' | 'failedLoginAttempts'>;

export class User extends Model<UserAttributes, UserCreationAttributes> 
  implements UserAttributes {
  declare id: string;
  declare rut: string;
  declare email: string;
  declare passwordHash: string;
  declare fullName: string;
  declare role: UserRole;
  declare organizationId: string;
  declare emailVerified: boolean;
  declare twoFactorEnabled: boolean;
  declare twoFactorSecret: string | null | undefined;
  declare failedLoginAttempts: number;
  declare lockedUntil: Date | null | undefined;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // Helper method to check if account is locked
  public isLocked(): boolean {
    return !!(this.lockedUntil && this.lockedUntil > new Date());
  }

  // Helper method to increment failed login attempts
  public incrementFailedAttempts(): void {
    this.failedLoginAttempts += 1;
    if (this.failedLoginAttempts >= 5) {
      this.lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // Lock for 15 minutes
    }
  }

  // Helper method to reset failed login attempts
  public resetFailedAttempts(): void {
    this.failedLoginAttempts = 0;
    this.lockedUntil = null;
  }
}

User.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  rut: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      len: [8, 12],
    },
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  passwordHash: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  fullName: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [3, 100],
    },
  },
  role: {
    type: DataTypes.ENUM('voter', 'admin', 'super_admin'),
    defaultValue: 'voter',
    allowNull: false,
  },
  organizationId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'organizations',
      key: 'id',
    },
  },
  emailVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  twoFactorEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  twoFactorSecret: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  failedLoginAttempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  lockedUntil: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  sequelize,
  modelName: 'User',
  tableName: 'users',
  timestamps: true,
  indexes: [
    { fields: ['rut'] },
    { fields: ['email'] },
    { fields: ['organizationId'] },
    { fields: ['role'] },
  ],
});

export default User;