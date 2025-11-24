import { sequelize } from './api/config/database.js';
import { connectDatabase } from './api/config/database.js';

async function checkTables() {
    try {
        await connectDatabase();

        const [results] = await sequelize.query(
            "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"
        );

        console.log('\n📊 Tablas en la base de datos:\n');
        results.forEach((row, index) => {
            console.log(`${index + 1}. ${row.name}`);
        });

        console.log('\n');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkTables();
