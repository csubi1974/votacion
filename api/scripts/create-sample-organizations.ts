import { sequelize } from '../config/database.js';
import { Organization } from '../models/Organization.js';

const sampleOrganizations = [
    {
        name: 'Corporación Empresarial del Norte',
        rut: '76.123.456-7',
        address: 'Av. Libertador Bernardo O\'Higgins 1234, Santiago',
        phone: '+56 2 2345 6789',
        email: 'contacto@corporacionnorte.cl',
        website: 'https://www.corporacionnorte.cl',
    },
    {
        name: 'Asociación de Comerciantes del Centro',
        rut: '76.234.567-8',
        address: 'Paseo Ahumada 567, Santiago Centro',
        phone: '+56 2 2456 7890',
        email: 'info@comerciantescentro.cl',
        website: 'https://www.comerciantescentro.cl',
    },
    {
        name: 'Fundación Educativa Futuro',
        rut: '76.345.678-9',
        address: 'Av. Providencia 2890, Providencia',
        phone: '+56 2 2567 8901',
        email: 'contacto@fundacionfuturo.cl',
        website: 'https://www.fundacionfuturo.cl',
    },
    {
        name: 'Sindicato de Trabajadores Mineros',
        rut: '76.456.789-0',
        address: 'Calle Matta 456, Copiapó',
        phone: '+56 52 2678 9012',
        email: 'secretaria@sindicatominero.cl',
        website: 'https://www.sindicatominero.cl',
    },
    {
        name: 'Cooperativa Agrícola del Sur',
        rut: '76.567.890-1',
        address: 'Camino Rural Km 12, Temuco',
        phone: '+56 45 2789 0123',
        email: 'administracion@coopagrisur.cl',
        website: 'https://www.coopagrisur.cl',
    },
    {
        name: 'Club Deportivo Los Leones',
        rut: '76.678.901-2',
        address: 'Av. Las Condes 9876, Las Condes',
        phone: '+56 2 2890 1234',
        email: 'socios@clubleones.cl',
        website: 'https://www.clubleones.cl',
    },
    {
        name: 'Junta de Vecinos Villa Esperanza',
        rut: '76.789.012-3',
        address: 'Pasaje Los Aromos 234, Maipú',
        phone: '+56 2 2901 2345',
        email: 'junta@villaesperanza.cl',
        website: null,
    },
    {
        name: 'Cámara de Comercio Regional',
        rut: '76.890.123-4',
        address: 'Calle Comercio 1111, Valparaíso',
        phone: '+56 32 2012 3456',
        email: 'presidencia@camaracomercio.cl',
        website: 'https://www.camaracomercio.cl',
    },
    {
        name: 'Organización de Artesanos Unidos',
        rut: '76.901.234-5',
        address: 'Feria Artesanal Local 45, Valdivia',
        phone: '+56 63 2123 4567',
        email: 'artesanos@artesanosunidos.cl',
        website: 'https://www.artesanosunidos.cl',
    },
    {
        name: 'Asociación de Profesionales Independientes',
        rut: '76.012.345-6',
        address: 'Av. Apoquindo 4567, Las Condes',
        phone: '+56 2 2234 5678',
        email: 'contacto@profesionalesindep.cl',
        website: 'https://www.profesionalesindep.cl',
    },
];

async function createSampleOrganizations() {
    try {
        console.log('🔄 Conectando a la base de datos...');
        await sequelize.authenticate();
        console.log('✅ Conexión establecida');

        console.log('\n🔄 Creando organizaciones de prueba...\n');

        for (const orgData of sampleOrganizations) {
            // Verificar si ya existe
            const existing = await Organization.findOne({
                where: { rut: orgData.rut },
            });

            if (existing) {
                console.log(`⏭️  Ya existe: ${orgData.name} (${orgData.rut})`);
                continue;
            }

            const org = await Organization.create(orgData);
            console.log(`✅ Creada: ${org.name} (${org.rut})`);
        }

        console.log('\n✅ Proceso completado');
        console.log(`\n📊 Total de organizaciones en la base de datos: ${await Organization.count()}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

createSampleOrganizations();
