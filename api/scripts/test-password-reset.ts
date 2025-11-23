import { sequelize } from '../config/database.js';
import '../models/index.js';

async function testPasswordReset() {
    try {
        await sequelize.authenticate();
        console.log('✅ Database connected');

        // Sync models
        await sequelize.sync({ alter: true });
        console.log('✅ Models synchronized');

        console.log('\n📋 Password Reset System Test:');
        console.log('1. Navigate to: http://localhost:5173/login');
        console.log('2. Click on "¿Olvidaste tu contraseña?"');
        console.log('3. Enter your email: admin@voting-platform.com');
        console.log('4. Check the console for the reset URL');
        console.log('5. Copy the URL and paste it in your browser');
        console.log('6. Enter your new password');
        console.log('7. Login with the new password\n');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await sequelize.close();
    }
}

testPasswordReset();
