import { sequelize } from '../config/database.js';
import { User } from '../models/User.js';
import { Organization } from '../models/Organization.js';

async function checkTestUsers() {
    try {
        await sequelize.authenticate();

        const users = await User.findAll({
            where: {
                rut: ['11.111.111-1', '22.222.222-2', '33.333.333-3']
            }
        });

        console.log('\n📋 USUARIOS DE PRUEBA CREADOS:\n');
        console.log('═'.repeat(70));

        for (const user of users) {
            const org = await Organization.findByPk(user.organizationId);

            console.log(`\n${user.role.toUpperCase()}: ${user.fullName}`);
            console.log(`  RUT: ${user.rut}`);
            console.log(`  Email: ${user.email}`);
            console.log(`  Organización: ${org?.name || 'N/A'}`);
            console.log(`  Contraseña: Admin123!`);
        }

        console.log('\n' + '═'.repeat(70));
        console.log('\n✅ Todos los usuarios están listos para usar\n');

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkTestUsers();
