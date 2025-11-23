import { sequelize } from '../config/database.js';
import { User } from '../models/User.js';

async function checkUsers() {
    try {
        await sequelize.authenticate();

        // Get all users with role 'voter'
        const voters = await User.findAll({
            where: { role: 'voter' },
            order: [['createdAt', 'DESC']],
            limit: 10,
        });

        console.log(`\n📊 Total de votantes en la base de datos: ${voters.length}\n`);

        if (voters.length > 0) {
            console.log('Últimos votantes creados:\n');
            voters.forEach((user, index) => {
                console.log(`${index + 1}. ${user.fullName}`);
                console.log(`   RUT: ${user.rut}`);
                console.log(`   Email: ${user.email}`);
                console.log(`   Creado: ${user.createdAt}`);
                console.log('');
            });
        }

    } catch (e) {
        console.error('ERROR:', e);
        process.exit(1);
    } finally {
        await sequelize.close();
        process.exit(0);
    }
}

checkUsers();
