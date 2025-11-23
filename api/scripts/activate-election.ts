import { sequelize } from '../config/database.js';
import { Election } from '../models/Election.js';

async function activateElection() {
    try {
        await sequelize.authenticate();

        const election = await Election.findOne({
            where: { title: 'Elección de Directiva 2025' }
        });

        if (!election) {
            console.error('Election not found.');
            process.exit(1);
        }

        election.status = 'active';
        await election.save();

        console.log(`✅ Election "${election.title}" is now ACTIVE.`);

    } catch (e) {
        console.error('ERROR:', e);
        process.exit(1);
    } finally {
        await sequelize.close();
        process.exit(0);
    }
}

activateElection();
