import { sequelize } from '../config/database.js';
import { Election } from '../models/Election.js';

async function completeElection() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        // Find the active election
        const election = await Election.findOne({
            where: { title: 'Elección de Directiva 2025' }
        });

        if (!election) {
            console.error('Election not found.');
            process.exit(1);
        }

        console.log(`Found election: ${election.title}`);
        console.log(`Current status: ${election.status}`);

        // Update status to completed
        election.status = 'completed';
        await election.save();

        console.log('✅ Election marked as completed!');
        console.log('You can now view results and test exports.');

    } catch (e) {
        console.error('ERROR:', e);
        process.exit(1);
    } finally {
        await sequelize.close();
        process.exit(0);
    }
}

completeElection();
