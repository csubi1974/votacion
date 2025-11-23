
import { sequelize } from '../config/database.js';
import { User } from '../models/User.js';
import { Election } from '../models/Election.js';
import { Vote } from '../models/Vote.js';
import { Op } from 'sequelize';

async function main() {
    try {
        await sequelize.authenticate();

        // Count total users
        const totalUsers = await User.count();

        // Count active elections
        const now = new Date();
        const activeElections = await Election.count({
            where: {
                startDate: { [Op.lte]: now },
                endDate: { [Op.gte]: now },
                status: 'active'
            }
        });

        // Count total votes
        const totalVotes = await Vote.count();

        console.log(JSON.stringify({
            totalUsers,
            activeElections,
            totalVotes
        }, null, 2));

    } catch (e) {
        console.error('ERROR', e);
        process.exit(1);
    } finally {
        await sequelize.close();
        process.exit(0);
    }
}

main();
