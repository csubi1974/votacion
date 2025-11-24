import { ElectionVoter, User, Election } from '../models/index.js';
import { Op } from 'sequelize';

interface VoterRegistryData {
    electionId: string;
    userId: string;
    addedBy: string;
    notes?: string;
}

interface BulkVoterData {
    rut: string;
    email?: string;
    fullName?: string;
}

class VoterRegistryService {
    // Add a single voter to election registry
    async addVoterToRegistry(data: VoterRegistryData): Promise<ElectionVoter> {
        // Check if already exists
        const existing = await ElectionVoter.findOne({
            where: {
                electionId: data.electionId,
                userId: data.userId,
            },
        });

        if (existing) {
            throw new Error('Voter already in registry for this election');
        }

        // Verify user exists
        const user = await User.findByPk(data.userId);
        if (!user) {
            throw new Error('User not found');
        }

        // Verify election exists
        const election = await Election.findByPk(data.electionId);
        if (!election) {
            throw new Error('Election not found');
        }

        return await ElectionVoter.create({
            electionId: data.electionId,
            userId: data.userId,
            addedBy: data.addedBy,
            notes: data.notes,
            isEligible: true,
            hasVoted: false,
        });
    }

    // Remove voter from registry
    async removeVoterFromRegistry(electionId: string, userId: string): Promise<boolean> {
        const deleted = await ElectionVoter.destroy({
            where: {
                electionId,
                userId,
            },
        });

        return deleted > 0;
    }

    // Get all voters for an election
    async getElectionVoters(electionId: string, includeVoted: boolean = true) {
        const where: any = { electionId };

        if (!includeVoted) {
            where.hasVoted = false;
        }

        return await ElectionVoter.findAll({
            where,
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'rut', 'email', 'fullName', 'role'],
                },
                {
                    model: User,
                    as: 'addedByUser',
                    attributes: ['id', 'fullName', 'email'],
                    required: false,
                },
            ],
            order: [['addedAt', 'DESC']],
        });
    }

    // Check if user is in election registry
    async isUserInRegistry(electionId: string, userId: string): Promise<boolean> {
        const record = await ElectionVoter.findOne({
            where: {
                electionId,
                userId,
                isEligible: true,
            },
        });

        return !!record;
    }

    // Mark user as voted
    async markAsVoted(electionId: string, userId: string): Promise<void> {
        await ElectionVoter.update(
            { hasVoted: true },
            {
                where: {
                    electionId,
                    userId,
                },
            }
        );
    }

    // Bulk add voters to registry
    async bulkAddVoters(
        electionId: string,
        voters: BulkVoterData[],
        addedBy: string,
        organizationId: string
    ): Promise<{ added: number; skipped: number; errors: string[] }> {
        const errors: string[] = [];
        let added = 0;
        let skipped = 0;

        // Verify election exists and belongs to organization
        const election = await Election.findOne({
            where: {
                id: electionId,
                organizationId,
            },
        });

        if (!election) {
            throw new Error('Election not found or does not belong to your organization');
        }

        for (const voterData of voters) {
            try {
                // Find user by RUT (primary) or email
                const user = await User.findOne({
                    where: {
                        [Op.or]: [
                            { rut: voterData.rut },
                            ...(voterData.email ? [{ email: voterData.email }] : []),
                        ],
                    },
                });

                if (!user) {
                    errors.push(`User not found: ${voterData.rut} ${voterData.email || ''}`);
                    skipped++;
                    continue;
                }

                // Check if already in registry
                const existing = await ElectionVoter.findOne({
                    where: {
                        electionId,
                        userId: user.id,
                    },
                });

                if (existing) {
                    skipped++;
                    continue;
                }

                // Add to registry
                await ElectionVoter.create({
                    electionId,
                    userId: user.id,
                    addedBy,
                    isEligible: true,
                    hasVoted: false,
                });

                added++;
            } catch (error) {
                errors.push(`Error processing ${voterData.rut}: ${error instanceof Error ? error.message : 'Unknown error'}`);
                skipped++;
            }
        }

        return { added, skipped, errors };
    }

    // Get registry statistics
    async getRegistryStats(electionId: string) {
        const [total, voted, eligible] = await Promise.all([
            ElectionVoter.count({ where: { electionId } }),
            ElectionVoter.count({ where: { electionId, hasVoted: true } }),
            ElectionVoter.count({ where: { electionId, isEligible: true } }),
        ]);

        return {
            total,
            voted,
            eligible,
            pending: eligible - voted,
            participationRate: eligible > 0 ? (voted / eligible) * 100 : 0,
        };
    }

    // Update voter eligibility
    async updateVoterEligibility(
        electionId: string,
        userId: string,
        isEligible: boolean
    ): Promise<void> {
        await ElectionVoter.update(
            { isEligible },
            {
                where: {
                    electionId,
                    userId,
                },
            }
        );
    }
}

export default new VoterRegistryService();
