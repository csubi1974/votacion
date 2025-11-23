import { connectDatabase } from './config/database.js';
import { sequelize } from './config/database.js';

const initializeDatabase = async () => {
  try {
    console.log('🚀 Starting database initialization...');

    // Connect to database
    const connected = await connectDatabase();
    if (!connected) {
      console.error('❌ Failed to connect to database');
      process.exit(1);
    }

    // Sync all models
    console.log('📊 Synchronizing database models...');
    await sequelize.sync({ force: false }); // Set to true only for development

    console.log('✅ Database initialization completed successfully!');

    // Log table creation status
    const tables = ['organizations', 'users', 'elections', 'election_options', 'votes', 'audit_logs', 'password_reset_tokens'];
    for (const table of tables) {
      console.log(`✅ Table '${table}' is ready`);
    }

  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
    console.log('🔒 Database connection closed');
  }
};

// Run initialization if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeDatabase();
}

export default initializeDatabase;