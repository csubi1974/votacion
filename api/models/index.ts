import Organization from './Organization.js';
import User from './User.js';
import Election from './Election.js';
import ElectionOption from './ElectionOption.js';
import Vote from './Vote.js';
import AuditLog from './AuditLog.js';
import PasswordResetToken from './PasswordResetToken.js';

// Define associations
Organization.hasMany(User, {
  foreignKey: 'organizationId',
  as: 'users',
  onDelete: 'CASCADE',
});

User.belongsTo(Organization, {
  foreignKey: 'organizationId',
  as: 'organization',
});

Organization.hasMany(Election, {
  foreignKey: 'organizationId',
  as: 'elections',
  onDelete: 'CASCADE',
});

Election.belongsTo(Organization, {
  foreignKey: 'organizationId',
  as: 'organization',
});

Election.hasMany(ElectionOption, {
  foreignKey: 'electionId',
  as: 'options',
  onDelete: 'CASCADE',
});

ElectionOption.belongsTo(Election, {
  foreignKey: 'electionId',
  as: 'election',
});

User.hasMany(Vote, {
  foreignKey: 'userId',
  as: 'votes',
  onDelete: 'CASCADE',
});

Vote.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

Election.hasMany(Vote, {
  foreignKey: 'electionId',
  as: 'votes',
  onDelete: 'CASCADE',
});

Vote.belongsTo(Election, {
  foreignKey: 'electionId',
  as: 'election',
});

ElectionOption.hasMany(Vote, {
  foreignKey: 'selectedOptionId',
  as: 'votes',
  onDelete: 'CASCADE',
});

Vote.belongsTo(ElectionOption, {
  foreignKey: 'selectedOptionId',
  as: 'selectedOption',
});

User.hasMany(AuditLog, {
  foreignKey: 'userId',
  as: 'auditLogs',
  onDelete: 'CASCADE',
});

AuditLog.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

User.hasMany(PasswordResetToken, {
  foreignKey: 'userId',
  as: 'passwordResetTokens',
  onDelete: 'CASCADE',
});

PasswordResetToken.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

export {
  Organization,
  User,
  Election,
  ElectionOption,
  Vote,
  AuditLog,
  PasswordResetToken,
};

export default {
  Organization,
  User,
  Election,
  ElectionOption,
  Vote,
  AuditLog,
  PasswordResetToken,
};