import { sequelize } from '../config/database.js';
import { Election } from '../models/Election.js';
import { ElectionOption } from '../models/ElectionOption.js';
import { Organization } from '../models/Organization.js';
import { v4 as uuidv4 } from 'uuid';

async function createTestElection() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        // Get the organization
        const org = await Organization.findOne();
        if (!org) {
            console.error('No organization found. Run init-db.ts first.');
            process.exit(1);
        }

        // Check if there are active elections
        const activeElections = await Election.count({
            where: { status: 'active' }
        });

        if (activeElections > 0) {
            console.log(`✅ Ya existen ${activeElections} elección(es) activa(s).`);
            process.exit(0);
        }

        console.log('Creating test election...');

        // Create a test election
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 7); // 7 days from now

        const election = await Election.create({
            id: uuidv4(),
            title: 'Elección de Directiva 2025',
            description: 'Votación para elegir la nueva directiva de la organización para el período 2025-2026',
            startDate: startDate,
            endDate: endDate,
            status: 'active',
            category: 'leadership',
            maxVotesPerUser: 1,
            isPublic: true,
            organizationId: org.id,
        } as any);

        console.log('✅ Election created:', election.id);

        // Create options
        const options = [
            {
                id: uuidv4(),
                electionId: election.id,
                title: 'María González',
                description: 'Experiencia en gestión y liderazgo comunitario',
                orderIndex: 1,
            },
            {
                id: uuidv4(),
                electionId: election.id,
                title: 'Juan Pérez',
                description: 'Especialista en finanzas y administración',
                orderIndex: 2,
            },
            {
                id: uuidv4(),
                electionId: election.id,
                title: 'Ana Martínez',
                description: 'Abogada con enfoque en derechos ciudadanos',
                orderIndex: 3,
            },
        ];

        await ElectionOption.bulkCreate(options);
        console.log('✅ 3 options created');

        console.log('\n🎉 Test election created successfully!');
        console.log(`Title: ${election.title}`);
        console.log(`End date: ${endDate.toLocaleDateString()}`);

    } catch (e) {
        console.error('ERROR:', e);
        process.exit(1);
    } finally {
        await sequelize.close();
        process.exit(0);
    }
}

createTestElection();
