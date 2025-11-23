import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

export interface OrganizationAttributes {
  id: string;
  name: string;
  rut: string;
  email: string;
  isActive: boolean;
}

export type OrganizationCreationAttributes = Omit<OrganizationAttributes, 'id'>;

export class Organization extends Model<OrganizationAttributes, OrganizationCreationAttributes> 
  implements OrganizationAttributes {
  declare id: string;
  declare name: string;
  declare rut: string;
  declare email: string;
  declare isActive: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Organization.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [3, 100],
    },
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
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  sequelize,
  modelName: 'Organization',
  tableName: 'organizations',
  timestamps: true,
  indexes: [
    { fields: ['rut'] },
    { fields: ['email'] },
  ],
});

export default Organization;