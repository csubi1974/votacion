import { sequelize } from '../config/database.js';
import { Organization } from '../models/Organization.js';

async function listOrganizations() {
    try {
        await sequelize.authenticate();

        const orgs = await Organization.findAll();

        if (orgs.length === 0) {
            console.log('❌ No hay organizaciones en la base de datos.');
            console.log('\nCreando organización por defecto...');

            const newOrg = await Organization.create({
                name: 'Organización Principal',
                domain: 'principal.com',
                settings: {},
            } as any);

            console.log(`✅ Organización creada: ${newOrg.name} (ID: ${newOrg.id})`);
        } else {
            console.log(`✅ Organizaciones encontradas (${orgs.length}):\n`);
            orgs.forEach(org => {
                console.log(`  - ${org.name}`);
                console.log(`    ID: ${org.id}`);
                console.log(`    Domain: ${org.domain}`);
                console.log('');
            });
        }

    } catch (e) {
        console.error('ERROR:', e);
        process.exit(1);
    } finally {
        await sequelize.close();
        process.exit(0);
    }
}

listOrganizations();
