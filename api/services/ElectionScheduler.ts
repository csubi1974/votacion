import { Election } from '../models/Election.js';
import { Op } from 'sequelize';

export class ElectionScheduler {
    /**
     * Updates the status of elections based on their start and end dates.
     * - Scheduled elections with startDate <= now become Active
     * - Active elections with endDate <= now become Completed
     */
    static async updateElectionStatuses(): Promise<void> {
        const now = new Date();

        try {
            // Activate scheduled elections that should have started
            await Election.update(
                { status: 'active' },
                {
                    where: {
                        status: 'scheduled',
                        startDate: { [Op.lte]: now },
                        endDate: { [Op.gt]: now } // Ensure it hasn't ended yet
                    }
                }
            );

            // Complete active elections that have ended
            await Election.update(
                { status: 'completed' },
                {
                    where: {
                        status: 'active',
                        endDate: { [Op.lte]: now }
                    }
                }
            );

            // Handle edge case: Scheduled elections that already ended (skipped active)
            await Election.update(
                { status: 'completed' },
                {
                    where: {
                        status: 'scheduled',
                        endDate: { [Op.lte]: now }
                    }
                }
            );

        } catch (error) {
            console.error('Error updating election statuses:', error);
        }
    }
}
