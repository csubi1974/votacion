import { sequelize } from '../config/database.js';
import { Election } from '../models/Election.js';
import { ElectionOption } from '../models/ElectionOption.js';
import { User } from '../models/User.js';
import { v4 as uuidv4 } from 'uuid';

async function forceCreateElection() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        // Get the admin user
        const admin = await User.findOne({ where: { email: 'admin@voting-platform.com' } });
        if (!admin) {
            console.error('Admin user not found.');
            process.exit(1);
        }

        console.log(`Admin found: ${admin.email}`);
        console.log(`Organization ID: ${admin.organizationId}`);

        // Delete existing elections
        await Election.destroy({ where: {} });
        console.log('✅ Deleted all existing elections');

        // Create a test election
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 7);

        const election = await Election.create({
            title: 'Elección de Directiva 2025',
            description: 'Votación para elegir la nueva directiva de la organización para el período 2025-2026',
            startDate: startDate,
            endDate: endDate,
            status: 'active',
            category: 'leadership',
            maxVotesPerUser: 1,
            isPublic: true,
            organizationId: admin.organizationId,
        });

        console.log('✅ Election created:', election.id);

        // Create options
        const options = [
            {
                electionId: election.id,
                text: 'María González - Experiencia en gestión y liderazgo comunitario',
                orderIndex: 1,
            },
            {
                electionId: election.id,
                text: 'Juan Pérez - Especialista en finanzas y administración',
                orderIndex: 2,
            },
            {
                electionId: election.id,
                text: 'Ana Martínez - Abogada con enfoque en derechos ciudadanos',
                orderIndex: 3,
            },
        ];

        await ElectionOption.bulkCreate(options);
        console.log('✅ 3 options created');

        console.log('\n🎉 Test election created successfully!');
        console.log(`Title: ${election.title}`);
        console.log(`Organization ID: ${election.organizationId}`);
        console.log(`End date: ${endDate.toLocaleDateString()}`);

    } catch (e) {
        console.error('ERROR:', e);
        process.exit(1);
    } finally {
        await sequelize.close();
        process.exit(0);
    }
}

forceCreateElection();
