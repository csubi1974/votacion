import { sequelize } from '../config/database.js';
import { User } from '../models/User.js';
import { Organization } from '../models/Organization.js';

async function listTestUsers() {
    try {
        console.log('🔄 Conectando a la base de datos...');
        await sequelize.authenticate();
        console.log('✅ Conexión establecida\n');

        const testRuts = ['11.111.111-1', '22.222.222-2', '33.333.333-3'];

        console.log('📋 Usuarios de Prueba:\n');
        console.log('═'.repeat(80));

        for (const rut of testRuts) {
            const user = await User.findOne({
                where: { rut },
            });

            if (user) {
                const org = await Organization.findByPk(user.organizationId);
                console.log(`\n✅ ${user.fullName}`);
                console.log(`   RUT: ${user.rut}`);
                console.log(`   Email: ${user.email}`);
                console.log(`   Rol: ${user.role}`);
                console.log(`   Organización: ${org?.name || 'N/A'}`);
                console.log(`   Email Verificado: ${user.emailVerified ? 'Sí' : 'No'}`);
                console.log(`   2FA Habilitado: ${user.twoFactorEnabled ? 'Sí' : 'No'}`);
            } else {
                console.log(`\n❌ No encontrado: ${rut}`);
            }
        }

        console.log('\n' + '═'.repeat(80));
        console.log('\n💡 Credenciales para login:\n');
        console.log('SUPER ADMIN:');
        console.log('  RUT: 11.111.111-1');
        console.log('  Contraseña: Admin123!\n');
        console.log('ADMIN:');
        console.log('  RUT: 22.222.222-2');
        console.log('  Contraseña: Admin123!\n');
        console.log('VOTANTE:');
        console.log('  RUT: 33.333.333-3');
        console.log('  Contraseña: Admin123!\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

listTestUsers();
