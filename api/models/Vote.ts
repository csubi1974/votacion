import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

export interface VoteAttributes {
  id: string;
  userId: string;
  electionId: string;
  selectedOptionId: string;
  verificationHash: string;
  ipAddress: string;
  userAgent: string;
}

export type VoteCreationAttributes = Omit<VoteAttributes, 'id'>;

export class Vote extends Model<VoteAttributes, VoteCreationAttributes> 
  implements VoteAttributes {
  declare id: string;
  declare userId: string;
  declare electionId: string;
  declare selectedOptionId: string;
  declare verificationHash: string;
  declare ipAddress: string;
  declare userAgent: string;
  declare readonly createdAt: Date;
}

Vote.init({
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
  electionId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'elections',
      key: 'id',
    },
  },
  selectedOptionId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'election_options',
      key: 'id',
    },
  },
  verificationHash: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  userAgent: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  sequelize,
  modelName: 'Vote',
  tableName: 'votes',
  timestamps: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['electionId'] },
    { fields: ['selectedOptionId'] },
    { fields: ['verificationHash'] },
    { fields: ['createdAt'] },
    { 
      fields: ['userId', 'electionId'], 
      unique: true,
      name: 'unique_user_election_vote'
    },
  ],
});

export default Vote;