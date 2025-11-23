import { sequelize } from '../config/database.js';
import { User } from '../models/User.js';
import { Organization } from '../models/Organization.js';
import { hashPassword } from '../utils/security.js';
import { v4 as uuidv4 } from 'uuid';

async function main() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        // 1. Asegurar que existe una organización
        let org = await Organization.findOne();
        if (!org) {
            console.log('Creating default organization...');
            org = await Organization.create({
                id: uuidv4(),
                name: 'Default Organization',
                rut: '11.111.111-1', // Fake RUT
                email: 'admin@default.com'
            });
        }
        console.log(`Organization ID: ${org.id}`);

        // 2. Crear o actualizar Admin
        const email = 'admin@voting-platform.com';
        const password = 'Admin123!';
        const rut = '4.067.326-1';

        let user = await User.findOne({ where: { email } });

        if (user) {
            console.log('Updating existing admin...');
            user.passwordHash = await hashPassword(password);
            user.rut = rut; // Asegurar RUT conocido
            user.role = 'super_admin';
            await user.save();
        } else {
            console.log('Creating new admin...');
            user = await User.create({
                id: uuidv4(),
                email,
                rut,
                passwordHash: await hashPassword(password),
                fullName: 'System Administrator',
                role: 'super_admin',
                organizationId: org.id,
                emailVerified: true
            });
        }

        console.log('\n✅ ADMIN USER READY:');
        console.log(`Email: ${email}`);
        console.log(`RUT: ${rut}`);
        console.log(`Password: ${password}`);

    } catch (e) {
        console.error('ERROR:', e);
        process.exit(1);
    } finally {
        await sequelize.close();
        process.exit(0);
    }
}

main();
