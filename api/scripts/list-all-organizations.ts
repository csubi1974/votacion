import { sequelize } from '../config/database.js';
import { Organization } from '../models/Organization.js';

async function listOrganizations() {
    try {
        console.log('🔄 Conectando a la base de datos...');
        await sequelize.authenticate();
        console.log('✅ Conexión establecida\n');

        const organizations = await Organization.findAll({
            order: [['name', 'ASC']],
        });

        console.log(`📊 Total de organizaciones: ${organizations.length}\n`);
        console.log('═'.repeat(80));

        organizations.forEach((org, index) => {
            console.log(`\n${index + 1}. ${org.name}`);
            console.log(`   ID: ${org.id}`);
            console.log(`   RUT: ${org.rut}`);
            console.log(`   Email: ${org.email || 'N/A'}`);
            console.log(`   Teléfono: ${org.phone || 'N/A'}`);
            console.log(`   Dirección: ${org.address || 'N/A'}`);
            console.log(`   Sitio web: ${org.website || 'N/A'}`);
        });

        console.log('\n' + '═'.repeat(80));

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

listOrganizations();
