import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

export interface PasswordResetTokenAttributes {
    id: string;
    userId: string;
    token: string;
    expiresAt: Date;
    used: boolean;
}

export type PasswordResetTokenCreationAttributes = Omit<PasswordResetTokenAttributes, 'id' | 'used'>;

export class PasswordResetToken extends Model<PasswordResetTokenAttributes, PasswordResetTokenCreationAttributes>
    implements PasswordResetTokenAttributes {
    declare id: string;
    declare userId: string;
    declare token: string;
    declare expiresAt: Date;
    declare used: boolean;
    declare readonly createdAt: Date;
    declare readonly updatedAt: Date;

    public isExpired(): boolean {
        return new Date() > this.expiresAt;
    }

    public isValid(): boolean {
        return !this.used && !this.isExpired();
    }
}

PasswordResetToken.init({
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
    token: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    used: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
    },
}, {
    sequelize,
    modelName: 'PasswordResetToken',
    tableName: 'password_reset_tokens',
    timestamps: true,
    indexes: [
        { fields: ['userId'] },
        { fields: ['token'] },
        { fields: ['expiresAt'] },
    ],
});

export default PasswordResetToken;
