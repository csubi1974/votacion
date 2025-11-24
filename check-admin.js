import { User } from './api/models/index.js';
import { connectDatabase } from './api/config/database.js';
import bcrypt from 'bcryptjs';

async function checkAndFixAdmin() {
    try {
        await connectDatabase();

        const rut = '4.067.326-1';
        const user = await User.findOne({ where: { rut } });

        if (!user) {
            console.log('❌ Admin user not found');
            return;
        }

        console.log('✅ Found user:', {
            id: user.id,
            rut: user.rut,
            email: user.email,
            fullName: user.fullName,
            role: user.role
        });

        // Test password
        const testPassword = 'Admin123!';
        const isValid = await bcrypt.compare(testPassword, user.passwordHash);

        if (isValid) {
            console.log('✅ Password is correct');
        } else {
            console.log('❌ Password is incorrect, resetting...');
            const newHash = await bcrypt.hash(testPassword, 10);
            await user.update({ passwordHash: newHash });
            console.log('✅ Password reset to Admin123!');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkAndFixAdmin();
