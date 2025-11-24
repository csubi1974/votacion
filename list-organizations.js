import { Organization } from './api/models/index.js';
import { connectDatabase } from './api/config/database.js';

async function listOrganizations() {
    try {
        await connectDatabase();

        const organizations = await Organization.findAll({
            attributes: ['id', 'name', 'rut', 'active', 'createdAt']
        });

        console.log(`\n📊 Total de organizaciones: ${organizations.length}\n`);

        if (organizations.length === 0) {
            console.log('❌ No hay organizaciones en la base de datos\n');
            console.log('Creando organización demo...\n');

            const demoOrg = await Organization.create({
                name: 'Organización Demo',
                rut: '76.123.456-7',
                active: true
            });

            console.log('✅ Organización demo creada:');
            console.log(`   ID: ${demoOrg.id}`);
            console.log(`   Nombre: ${demoOrg.name}`);
            console.log(`   RUT: ${demoOrg.rut}`);
        } else {
            console.log('Organizaciones encontradas:\n');
            organizations.forEach((org, index) => {
                console.log(`${index + 1}. ${org.name}`);
                console.log(`   ID: ${org.id}`);
                console.log(`   RUT: ${org.rut}`);
                console.log(`   Activa: ${org.active ? 'Sí' : 'No'}`);
                console.log(`   Creada: ${org.createdAt}`);
                console.log('');
            });
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

listOrganizations();
