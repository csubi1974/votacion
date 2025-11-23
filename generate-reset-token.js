import crypto from 'crypto';
import { sequelize } from './api/config/database.js';
import './api/models/index.js';
import { User } from './api/models/User.js';
import { PasswordResetToken } from './api/models/PasswordResetToken.js';

async function generateResetToken() {
    try {
        await sequelize.authenticate();
        console.log('✅ Database connected\n');

        // Find admin user
        const user = await User.findOne({ where: { email: 'admin@voting-platform.com' } });

        if (!user) {
            console.log('❌ User not found');
            process.exit(1);
        }

        console.log(`✅ Found user: ${user.email}\n`);

        // Generate token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        // Save to database
        await PasswordResetToken.create({
            userId: user.id,
            token: hashedToken,
            expiresAt,
        });

        const resetUrl = `http://localhost:5173/reset-password?token=${resetToken}`;

        console.log('🔐 PASSWORD RESET TOKEN GENERATED');
        console.log('================================');
        console.log(`\nReset URL:\n${resetUrl}`);
        console.log(`\nExpires at: ${expiresAt.toLocaleString()}`);
        console.log('\n📋 Copy the URL above and paste it in your browser\n');

        await sequelize.close();
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

generateResetToken();
