import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database.js';

interface ElectionVoterAttributes {
    id: string;
    electionId: string;
    userId: string;
    isEligible: boolean;
    hasVoted: boolean;
    addedAt: Date;
    addedBy: string | null;
    notes: string | null;
}

interface ElectionVoterCreationAttributes extends Optional<ElectionVoterAttributes, 'id' | 'isEligible' | 'hasVoted' | 'addedAt' | 'addedBy' | 'notes'> { }

class ElectionVoter extends Model<ElectionVoterAttributes, ElectionVoterCreationAttributes> implements ElectionVoterAttributes {
    public id!: string;
    public electionId!: string;
    public userId!: string;
    public isEligible!: boolean;
    public hasVoted!: boolean;
    public addedAt!: Date;
    public addedBy!: string | null;
    public notes!: string | null;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

ElectionVoter.init(
    {
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
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id',
            },
            onDelete: 'CASCADE',
        },
        isEligible: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            allowNull: false,
        },
        hasVoted: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            allowNull: false,
        },
        addedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            allowNull: false,
        },
        addedBy: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
                model: 'users',
                key: 'id',
            },
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    },
    {
        sequelize,
        tableName: 'election_voters',
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['electionId', 'userId'],
            },
            {
                fields: ['electionId'],
            },
            {
                fields: ['userId'],
            },
            {
                fields: ['hasVoted'],
            },
        ],
    }
);

export default ElectionVoter;
