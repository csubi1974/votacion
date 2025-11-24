import { Vote } from '../models/Vote.js';
import { Election } from '../models/Election.js';
import { ElectionOption } from '../models/ElectionOption.js';
import { Op } from 'sequelize';

export interface VoteData {
  electionId: string;
  optionIds: string[];
  userId: string;
  organizationId: string;
  ipAddress: string;
  userAgent: string;
}

export class VotingService {

  async getAvailableElections(userId: string, organizationId: string): Promise<Election[]> {
    const now = new Date();

    return await Election.findAll({
      where: {
        organizationId,
        status: 'active',
        startDate: { [Op.lte]: now },
        endDate: { [Op.gte]: now }
      },
      include: [
        {
          model: ElectionOption,
          as: 'options',
          required: false
        }
      ],
      order: [['endDate', 'ASC']]
    });
  }

  async getCompletedElections(organizationId: string): Promise<Election[]> {
    return await Election.findAll({
      where: {
        organizationId,
        [Op.or]: [
          { status: 'completed' },
          { endDate: { [Op.lt]: new Date() } }
        ]
      },
      include: [
        {
          model: ElectionOption,
          as: 'options',
          required: false
        }
      ],
      order: [['endDate', 'DESC']]
    });
  }

  async getElectionDetails(electionId: string, userId: string, organizationId: string): Promise<Election | null> {
    const election = await Election.findOne({
      where: {
        id: electionId,
        organizationId,
        status: 'active',
        startDate: { [Op.lte]: new Date() },
        endDate: { [Op.gte]: new Date() }
      },
      include: [
        {
          model: ElectionOption,
          as: 'options',
          required: false,
          order: [['orderIndex', 'ASC']]
        }
      ]
    });

    return election;
  }

  async hasUserVoted(electionId: string, userId: string): Promise<boolean> {
    const existingVote = await Vote.findOne({
      where: {
        electionId,
        userId
      }
    });

    return !!existingVote;
  }

  async validateVote(data: VoteData): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Check if election exists and is active
    const election = await Election.findOne({
      where: {
        id: data.electionId,
        organizationId: data.organizationId,
        status: 'active',
        startDate: { [Op.lte]: new Date() },
        endDate: { [Op.gte]: new Date() }
      }
    });

    if (!election) {
      errors.push('Elección no encontrada o no está activa');
      return { valid: false, errors };
    }

    // Check if election requires voter registry (padrón)
    if (election.requiresVoterRegistry) {
      const VoterRegistryService = (await import('./VoterRegistryService.js')).default;
      const isInRegistry = await VoterRegistryService.isUserInRegistry(data.electionId, data.userId);

      if (!isInRegistry) {
        errors.push('No estás habilitado para votar en esta elección (no estás en el padrón electoral)');
        return { valid: false, errors };
      }
    }

    // Check if user has already voted
    const hasVoted = await this.hasUserVoted(data.electionId, data.userId);
    if (hasVoted) {
      errors.push('Ya has votado en esta elección');
    }

    // Validate number of options selected
    if (data.optionIds.length === 0) {
      errors.push('Debes seleccionar al menos una opción');
    }

    if (data.optionIds.length > election.maxVotesPerUser) {
      errors.push(`No puedes votar por más de ${election.maxVotesPerUser} opciones`);
    }

    // Validate that all selected options belong to this election
    const options = await ElectionOption.findAll({
      where: {
        id: { [Op.in]: data.optionIds },
        electionId: data.electionId
      }
    });

    if (options.length !== data.optionIds.length) {
      errors.push('Algunas opciones seleccionadas no son válidas');
    }

    return { valid: errors.length === 0, errors };
  }

  async castVote(data: VoteData): Promise<Vote[]> {
    const validation = await this.validateVote(data);
    if (!validation.valid) {
      throw new Error(validation.errors.join(', '));
    }

    // Create votes for each selected option
    const { createHash } = await import('crypto');

    const votes = await Promise.all(
      data.optionIds.map(selectedOptionId => {
        const timestamp = new Date().toISOString();
        const hashInput = `${data.userId}-${data.electionId}-${selectedOptionId}-${timestamp}-${Math.random()}`;
        const verificationHash = createHash('sha256').update(hashInput).digest('hex');

        return Vote.create({
          electionId: data.electionId,
          selectedOptionId,
          userId: data.userId,
          verificationHash,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent
        });
      })
    );

    // Mark as voted in registry if election requires it
    const election = await Election.findByPk(data.electionId);
    if (election?.requiresVoterRegistry) {
      const VoterRegistryService = (await import('./VoterRegistryService.js')).default;
      await VoterRegistryService.markAsVoted(data.electionId, data.userId);
    }

    return votes;
  }

  async getUserVotingHistory(userId: string): Promise<Vote[]> {
    return await Vote.findAll({
      where: {
        userId
      },
      include: [
        {
          model: Election,
          as: 'election',
          attributes: ['id', 'title', 'description', 'startDate', 'endDate']
        },
        {
          model: ElectionOption,
          as: 'selectedOption',
          attributes: ['id', 'text']
        }
      ],
      order: [['createdAt', 'DESC']]
    });
  }

  async getElectionResults(electionId: string, organizationId: string): Promise<{
    election: Election;
    results: Array<{
      optionId: number;
      text: string;
      votes: number;
      percentage: number;
    }>;
    totalVotes: number;
  }> {
    const election = await Election.findOne({
      where: {
        id: electionId,
        organizationId
      },
      include: [
        {
          model: ElectionOption,
          as: 'options',
          required: false,
          include: [{
            model: Vote,
            as: 'votes',
            required: false
          }]
        }
      ]
    });

    if (!election) {
      throw new Error('Election not found');
    }

    const electionWithOptions = election as Election & { options?: (ElectionOption & { votes?: Vote[] })[] };
    const options = electionWithOptions.options || [];
    const total = options.reduce((sum, opt) => sum + ((opt.votes || []).length), 0);
    const results = options.map((option) => ({
      optionId: option.id as unknown as number,
      text: option.text,
      votes: (option.votes || []).length,
      percentage: total > 0 ? (((option.votes || []).length / total) * 100) : 0,
    }));

    const totalVotes = results.reduce((sum, result) => sum + result.votes, 0);

    return {
      election,
      results,
      totalVotes
    };
  }
}