import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

export type ElectionStatus = 'scheduled' | 'active' | 'completed' | 'cancelled';
export type ElectionCategory = 'board_members' | 'policy' | 'budget' | 'leadership' | 'other';

export interface ElectionAttributes {
  id: string;
  organizationId: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  status: ElectionStatus;
  category: ElectionCategory;
  maxVotesPerUser: number;
  isPublic: boolean;
}

export type ElectionCreationAttributes = Omit<ElectionAttributes, 'id'> & { status?: ElectionStatus };

export class Election extends Model<ElectionAttributes, ElectionCreationAttributes>
  implements ElectionAttributes {
  declare id: string;
  declare organizationId: string;
  declare title: string;
  declare description: string;
  declare startDate: Date;
  declare endDate: Date;
  declare status: ElectionStatus;
  declare category: ElectionCategory;
  declare maxVotesPerUser: number;
  declare isPublic: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // Helper method to check if election is currently active
  public isActive(): boolean {
    const now = new Date();
    return this.status === 'active' && now >= this.startDate && now <= this.endDate;
  }

  // Helper method to check if election has ended
  public hasEnded(): boolean {
    return new Date() > this.endDate;
  }

  // Helper method to check if election has started
  public hasStarted(): boolean {
    return new Date() >= this.startDate;
  }
}

Election.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  organizationId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'organizations',
      key: 'id',
    },
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [3, 200],
    },
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      isAfterStartDate(value: Date) {
        if (value <= this.startDate) {
          throw new Error('End date must be after start date');
        }
      },
    },
  },
  status: {
    type: DataTypes.ENUM('scheduled', 'active', 'completed', 'cancelled'),
    defaultValue: 'scheduled',
    allowNull: false,
  },
  category: {
    type: DataTypes.ENUM('board_members', 'policy', 'budget', 'leadership', 'other'),
    allowNull: false,
  },
  maxVotesPerUser: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    validate: {
      min: 1,
      max: 10,
    },
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  sequelize,
  modelName: 'Election',
  tableName: 'elections',
  timestamps: true,
  indexes: [
    { fields: ['organizationId'] },
    { fields: ['status'] },
    { fields: ['startDate', 'endDate'] },
  ],
});

export default Election;