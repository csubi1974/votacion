import { sequelize } from '../config/database.js';
import { User } from '../models/User.js';
import speakeasy from 'speakeasy';

async function setKnown2FASecret() {
    try {
        await sequelize.authenticate();

        const user = await User.findOne({ where: { rut: '14.871.735-4' } });
        if (!user) {
            console.error('User not found');
            process.exit(1);
        }

        // Generate a known secret
        const secret = speakeasy.generateSecret({
            name: 'Voting Platform (Admin)',
        });

        console.log('Setting known secret:', secret.base32);

        user.twoFactorEnabled = true;
        user.twoFactorSecret = secret.base32;
        await user.save();

        console.log('✅ Admin user updated with known 2FA secret.');
        console.log('Secret (base32):', secret.base32);

        // Generate a current token to verify
        const token = speakeasy.totp({
            secret: secret.base32,
            encoding: 'base32'
        });
        console.log('Current valid token:', token);

    } catch (e) {
        console.error('ERROR:', e);
        process.exit(1);
    } finally {
        await sequelize.close();
        process.exit(0);
    }
}

setKnown2FASecret();
