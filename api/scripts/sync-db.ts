import { connectDatabase, sequelize } from '../config/database.js';
import '../models/index.js';

async function syncDatabase() {
    try {
        console.log('🔄 Connecting to database...');
        await connectDatabase();

        console.log('🔄 Synchronizing database schema...');
        await sequelize.sync({ alter: true });

        console.log('✅ Database synchronized successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error synchronizing database:', error);
        process.exit(1);
    }
}

syncDatabase();
