import { sequelize } from './api/config/database.js';
import './api/models/index.js';
import { AuditLog } from './api/models/AuditLog.js';

async function checkLogs() {
    try {
        await sequelize.authenticate();
        console.log('✅ Database connected\n');

        const logs = await AuditLog.findAll({
            limit: 20,
            order: [['createdAt', 'DESC']],
        });

        console.log(`📊 Total logs in database: ${logs.length}\n`);

        if (logs.length > 0) {
            console.log('Recent logs:');
            logs.forEach((log, index) => {
                const data = log.toJSON();
                console.log(`\n${index + 1}. ${data.action}`);
                console.log(`   User ID: ${data.userId}`);
                console.log(`   Resource: ${data.resourceType}`);
                console.log(`   Date: ${data.createdAt}`);
                console.log(`   IP: ${data.ipAddress}`);
            });
        } else {
            console.log('❌ No logs found in database');
        }

        await sequelize.close();
    } catch (error) {
        console.error('Error:', error);
    }
}

checkLogs();
