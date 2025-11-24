import { sequelize } from '../config/database.js';
import { User } from '../models/User.js';
import { Organization } from '../models/Organization.js';
import bcrypt from 'bcryptjs';

const testUsers = [
    {
        rut: '11.111.111-1',
        email: 'superadmin@votapp.cl',
        fullName: 'Super Administrador',
        role: 'super_admin' as const,
        password: 'Admin123!',
    },
    {
        rut: '22.222.222-2',
        email: 'admin@votapp.cl',
        fullName: 'Administrador',
        role: 'admin' as const,
        password: 'Admin123!',
    },
    {
        rut: '33.333.333-3',
        email: 'votante@votapp.cl',
        fullName: 'Votante de Prueba',
        role: 'voter' as const,
        password: 'Admin123!',
    },
];

async function createOrUpdateTestUsers() {
    try {
        console.log('🔄 Conectando a la base de datos...');
        await sequelize.authenticate();
        console.log('✅ Conexión establecida\n');

        // Obtener la primera organización disponible
        const organization = await Organization.findOne();

        if (!organization) {
            console.error('❌ No hay organizaciones en la base de datos');
            console.log('💡 Ejecuta primero: npx tsx api/scripts/create-sample-organizations.ts');
            process.exit(1);
        }

        console.log(`📋 Usando organización: ${organization.name}\n`);
        console.log('🔄 Creando/Actualizando usuarios de prueba...\n');

        for (const userData of testUsers) {
            // Buscar si el usuario ya existe por RUT o email
            const existingUser = await User.findOne({
                where: {
                    rut: userData.rut,
                },
            });

            // Hash de la contraseña
            const passwordHash = await bcrypt.hash(userData.password, 10);

            if (existingUser) {
                // Actualizar usuario existente
                await existingUser.update({
                    email: userData.email,
                    fullName: userData.fullName,
                    role: userData.role,
                    passwordHash,
                    emailVerified: true,
                    organizationId: organization.id,
                });

                console.log(`✅ ACTUALIZADO: ${userData.fullName}`);
                console.log(`   RUT: ${userData.rut}`);
                console.log(`   Email: ${userData.email}`);
                console.log(`   Rol: ${userData.role}`);
                console.log(`   Contraseña: ${userData.password}`);
                console.log(`   Organización: ${organization.name}\n`);
            } else {
                // Crear nuevo usuario
                const newUser = await User.create({
                    rut: userData.rut,
                    email: userData.email,
                    fullName: userData.fullName,
                    role: userData.role,
                    passwordHash,
                    emailVerified: true,
                    organizationId: organization.id,
                });

                console.log(`✅ CREADO: ${userData.fullName}`);
                console.log(`   RUT: ${userData.rut}`);
                console.log(`   Email: ${userData.email}`);
                console.log(`   Rol: ${userData.role}`);
                console.log(`   Contraseña: ${userData.password}`);
                console.log(`   Organización: ${organization.name}\n`);
            }
        }

        console.log('═'.repeat(60));
        console.log('\n✅ Proceso completado exitosamente\n');
        console.log('📝 Credenciales de acceso:\n');

        testUsers.forEach(user => {
            console.log(`${user.role.toUpperCase()}:`);
            console.log(`  RUT: ${user.rut}`);
            console.log(`  Contraseña: ${user.password}\n`);
        });

        console.log('═'.repeat(60));

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

createOrUpdateTestUsers();
