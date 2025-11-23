import { sequelize } from '../config/database.js';
import { Vote } from '../models/Vote.js';
import { User } from '../models/User.js';

async function clearUserVotes() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        // Get the admin user
        const admin = await User.findOne({ where: { email: 'admin@voting-platform.com' } });
        if (!admin) {
            console.error('Admin user not found.');
            process.exit(1);
        }

        // Delete all votes from this user
        const deletedCount = await Vote.destroy({
            where: { userId: admin.id }
        });

        console.log(`✅ Deleted ${deletedCount} vote(s) for user ${admin.email}`);
        console.log('You can now vote again!');

    } catch (e) {
        console.error('ERROR:', e);
        process.exit(1);
    } finally {
        await sequelize.close();
        process.exit(0);
    }
}

clearUserVotes();
