#!/usr/bin/env node

/**
 * Standalone database initialization script
 */

import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

async function initializeDatabase() {
  try {
    console.log('🚀 Starting database initialization...');
    
    // Ensure data directory exists
    const dataDir = join(process.cwd(), 'data');
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true });
      console.log('📁 Created data directory');
    }

    // Import database connection and models
    const { sequelize } = await import('../config/database.js');
    const models = await import('../models/index.js');

    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Sync all models
    console.log('📊 Synchronizing database models...');
    await sequelize.sync({ force: false }); // Set to true only for development
    
    console.log('✅ Database initialization completed successfully!');
    
    // Log table creation status
    const tables = ['organizations', 'users', 'elections', 'election_options', 'votes', 'audit_logs'];
    for (const table of tables) {
      console.log(`✅ Table '${table}' is ready`);
    }
    
    // Ensure default organization exists
    const { Organization } = models;
    console.log('🏢 Ensuring default organization exists...');
    const [org, createdOrg] = await Organization.findOrCreate({
      where: { name: 'Demo Organization' },
      defaults: {
        name: 'Demo Organization',
        rut: '76.543.210-1',
        email: 'demo@voting-platform.com',
        isActive: true,
      }
    });
    if (createdOrg) {
      console.log('✅ Default organization created');
    } else {
      console.log('ℹ️ Default organization already exists');
    }
    
    // Create default super admin if none exists
    const { User } = models;
    const adminCount = await User.count({ where: { role: 'super_admin' } });
    
    if (adminCount === 0) {
      console.log('👑 Creating default super admin...');
      const { hashPassword } = await import('../utils/security.js');
      
      if (org) {
        const { generateRandomRut } = await import('../utils/rutValidator.js');
        const rut = generateRandomRut();
        const email = 'admin@voting-platform.com';
        const password = 'Admin123!';
        await User.create({
          rut,
          email,
          passwordHash: await hashPassword(password),
          fullName: 'System Administrator',
          role: 'super_admin',
          organizationId: org.getDataValue('id'),
          emailVerified: true,
        });
        console.log('✅ Default super admin created');
        console.log(`📝 Login credentials: ${email} / ${password}`);
        console.log(`🆔 RUT: ${rut}`);
      }
    } else {
      const { User } = models;
      const admin = await User.findOne({ where: { role: 'super_admin' } });
      if (admin) {
        console.log('ℹ️ Super admin already exists');
        console.log(`🆔 Existing RUT: ${admin.rut}`);
        console.log(`📧 Email: ${admin.email}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  } finally {
    // Import sequelize again to close connection
    try {
      const { sequelize } = await import('../config/database.js');
      await sequelize.close();
      console.log('🔒 Database connection closed');
    } catch (error) {
      console.error('Error closing database connection:', error);
    }
    process.exit(0);
  }
}

// Run initialization
initializeDatabase();