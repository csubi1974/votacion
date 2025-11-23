import { User } from '../models/User.js';
import { sequelize } from '../config/database.js';

async function makeUserAdmin(rut: string) {
    try {
        await sequelize.authenticate();
        console.log('Database connected');

        const user = await User.findOne({ where: { rut } });

        if (!user) {
            console.log(`User with RUT ${rut} not found`);
            return;
        }

        await user.update({ role: 'admin' });
        console.log(`✅ User ${user.fullName} (${user.email}) is now an ADMIN`);
        console.log(`Role: ${user.role}`);

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

// Usar el RUT del usuario
makeUserAdmin('12.714.710-8');
