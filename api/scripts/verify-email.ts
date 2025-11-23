import { User } from '../models/User.js';
import { sequelize } from '../config/database.js';

async function verifyUserEmail(rut: string) {
    try {
        await sequelize.authenticate();
        console.log('Database connected');

        const user = await User.findOne({ where: { rut } });

        if (!user) {
            console.log(`User with RUT ${rut} not found`);
            return;
        }

        await user.update({ emailVerified: true });
        console.log(`✅ Email verified for user: ${user.fullName} (${user.email})`);
        console.log('You can now login!');

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

// Usar el RUT del usuario
verifyUserEmail('12.714.710-8');
