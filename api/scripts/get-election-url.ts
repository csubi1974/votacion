import { sequelize } from '../config/database.js';
import { Election } from '../models/Election.js';

async function getElectionId() {
    try {
        await sequelize.authenticate();

        const election = await Election.findOne({
            where: { title: 'Elección de Directiva 2025' }
        });

        if (!election) {
            console.error('Election not found.');
            process.exit(1);
        }

        console.log('Election ID:', election.id);
        console.log('Title:', election.title);
        console.log('Status:', election.status);
        console.log('\n📍 URL para ver resultados:');
        console.log(`http://localhost:5173/admin/elections/${election.id}/results`);

    } catch (e) {
        console.error('ERROR:', e);
        process.exit(1);
    } finally {
        await sequelize.close();
        process.exit(0);
    }
}

getElectionId();
