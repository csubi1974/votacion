import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

export interface ElectionOptionAttributes {
  id: string;
  electionId: string;
  text: string;
  imageUrl?: string | null;
  orderIndex: number;
}

export type ElectionOptionCreationAttributes = Omit<ElectionOptionAttributes, 'id'>;

export class ElectionOption extends Model<ElectionOptionAttributes, ElectionOptionCreationAttributes>
  implements ElectionOptionAttributes {
  declare id: string;
  declare electionId: string;
  declare text: string;
  declare imageUrl: string | null | undefined;
  declare orderIndex: number;
  declare readonly createdAt: Date;
}

ElectionOption.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  electionId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'elections',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  text: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [1, 500],
    },
  },
  imageUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isValidUrl(value: string) {
        if (!value || value === '') return;
        // Aceptar rutas relativas que empiecen con /
        if (value.startsWith('/')) return;
        // Validar URLs absolutas
        try {
          new URL(value);
        } catch {
          throw new Error('La URL de la imagen debe ser válida o una ruta relativa');
        }
      }
    },
  },
  orderIndex: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
  },
}, {
  sequelize,
  modelName: 'ElectionOption',
  tableName: 'election_options',
  timestamps: true,
  indexes: [
    { fields: ['electionId'] },
    { fields: ['electionId', 'orderIndex'] },
  ],
});

export default ElectionOption;