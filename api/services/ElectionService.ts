import { Election, ElectionStatus, ElectionCategory, ElectionAttributes } from '../models/Election.js';
import { ElectionOption } from '../models/ElectionOption.js';
import { User } from '../models/User.js';
import { AuditService } from './AuditService.js';
import { AppError } from '../utils/AppError.js';

export interface ElectionData {
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  category: ElectionCategory;
  maxVotesPerUser?: number;
  isPublic?: boolean;
  options: Array<{
    title: string;
    description?: string;
    imageUrl?: string;
  }>;
}

export interface ElectionUpdateData extends Partial<ElectionData> {
  status?: ElectionStatus;
}

export interface ElectionWithOptions extends Election {
  options?: ElectionOption[];
}

export class ElectionService {
  private auditService: AuditService;

  constructor() {
    this.auditService = new AuditService();
  }

  async createElection(
    organizationId: string,
    userId: string,
    data: ElectionData
  ): Promise<ElectionWithOptions> {
    // Validar que el usuario tenga permisos
    const user = await User.findByPk(userId);
    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
      throw new AppError('No tiene permisos para crear elecciones', 403);
    }

    // Validar fechas
    if (data.startDate >= data.endDate) {
      throw new AppError('La fecha de fin debe ser posterior a la fecha de inicio', 400);
    }

    if (data.startDate < new Date()) {
      throw new AppError('La fecha de inicio debe ser futura', 400);
    }

    // Validar opciones
    if (!data.options || data.options.length < 2) {
      throw new AppError('Debe proporcionar al menos 2 opciones', 400);
    }

    const transaction = await Election.sequelize!.transaction();

    try {
      // Crear elección
      const election = await Election.create({
        organizationId,
        title: data.title,
        description: data.description,
        startDate: data.startDate,
        endDate: data.endDate,
        category: data.category,
        maxVotesPerUser: data.maxVotesPerUser || 1,
        isPublic: data.isPublic || false,
      }, { transaction });

      // Crear opciones
      const options = await Promise.all(
        data.options.map((option, index) =>
          ElectionOption.create({
            electionId: election.id,
            text: option.title,
            imageUrl: option.imageUrl || null,
            orderIndex: index,
          }, { transaction })
        )
      );

      await transaction.commit();

      // Registrar auditoría
      await this.auditService.logActivity({
        userId,
        action: 'ELECTION_CREATED',
        resourceType: 'Election',
        resourceId: election.id,
        oldValues: null,
        newValues: { title: election.title, optionsCount: options.length },
        ipAddress: '127.0.0.1',
      });

      const createdElection = await Election.findByPk(election.id, {
        include: [
          {
            model: ElectionOption,
            as: 'options',
            order: [['orderIndex', 'ASC']],
          },
        ],
      });

      return createdElection!;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async getElections(
    organizationId: string,
    userId: string,
    filters?: {
      status?: ElectionStatus;
      category?: string;
      startDateFrom?: Date;
      startDateTo?: Date;
    }
  ): Promise<ElectionWithOptions[]> {
    // Verificar acceso del usuario a la organización
    const user = await User.findByPk(userId);
    if (!user || user.organizationId !== organizationId) {
      throw new AppError('No tiene acceso a esta organización', 403);
    }

    const where: Record<string, unknown> = { organizationId };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.category) {
      where.category = filters.category;
    }

    if (filters?.startDateFrom || filters?.startDateTo) {
      where.startDate = {};
      if (filters.startDateFrom) {
        where.startDate[Op.gte] = filters.startDateFrom;
      }
      if (filters.startDateTo) {
        where.startDate[Op.lte] = filters.startDateTo;
      }
    }

    const elections = await Election.findAll({
      where,
      include: [
        {
          model: ElectionOption,
          as: 'options',
          order: [['orderIndex', 'ASC']],
        },
      ],
      order: [['startDate', 'ASC']],
    });

    return elections;
  }

  async getElectionById(
    organizationId: string,
    electionId: string,
    userId: string
  ): Promise<ElectionWithOptions> {
    // Verificar acceso del usuario
    const user = await User.findByPk(userId);
    if (!user || user.organizationId !== organizationId) {
      throw new AppError('No tiene acceso a esta organización', 403);
    }

    const election = await Election.findOne({
      where: { id: electionId, organizationId },
      include: [
        {
          model: ElectionOption,
          as: 'options',
          order: [['orderIndex', 'ASC']],
        },
      ],
    });

    if (!election) {
      throw new AppError('Elección no encontrada', 404);
    }

    return election;
  }

  async updateElection(
    organizationId: string,
    electionId: string,
    userId: string,
    data: ElectionUpdateData
  ): Promise<ElectionWithOptions> {
    // Verificar permisos
    const user = await User.findByPk(userId);
    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
      throw new AppError('No tiene permisos para actualizar elecciones', 403);
    }

    const election = await Election.findOne({
      where: { id: electionId, organizationId },
      include: ['options'],
    });

    if (!election) {
      throw new AppError('Elección no encontrada', 404);
    }

    // Validar reglas de negocio según el estado actual
    if (election.status === 'completed') {
      throw new AppError('No se puede modificar una elección completada', 400);
    }

    if (election.status === 'active' && data.startDate) {
      throw new AppError('No se puede modificar la fecha de inicio de una elección activa', 400);
    }

    if (data.endDate && data.endDate <= election.startDate) {
      throw new AppError('La fecha de fin debe ser posterior a la fecha de inicio', 400);
    }

    const transaction = await Election.sequelize!.transaction();

    try {
      // Actualizar elección
      const updateData: Partial<ElectionAttributes> = {};
      if (data.title) updateData.title = data.title;
      if (data.description) updateData.description = data.description;
      if (data.startDate) updateData.startDate = data.startDate;
      if (data.endDate) updateData.endDate = data.endDate;
      if (data.category) updateData.category = data.category;
      if (data.maxVotesPerUser) updateData.maxVotesPerUser = data.maxVotesPerUser;
      if (data.isPublic !== undefined) updateData.isPublic = data.isPublic;
      if (data.status) updateData.status = data.status;

      await election.update(updateData, { transaction });

      // Actualizar opciones si se proporcionan
      if (data.options && data.options.length > 0) {
        if (data.options.length < 2) {
          throw new AppError('Debe proporcionar al menos 2 opciones', 400);
        }

        // Eliminar opciones existentes
        await ElectionOption.destroy({
          where: { electionId },
          transaction,
        });

        // Crear nuevas opciones
        await Promise.all(
          data.options.map((option, index) =>
            ElectionOption.create({
              electionId,
              text: option.title,
              imageUrl: option.imageUrl || null,
              orderIndex: index,
            }, { transaction })
          )
        );
      }

      await transaction.commit();

      // Recargar elección con opciones actualizadas
      const updatedElection = await Election.findByPk(electionId, {
        include: [
          {
            model: ElectionOption,
            as: 'options',
            order: [['orderIndex', 'ASC']],
          },
        ],
      });

      // Registrar auditoría
      await this.auditService.logActivity({
        userId,
        action: 'ELECTION_UPDATED',
        resourceType: 'Election',
        resourceId: electionId,
        oldValues: null,
        newValues: updateData,
        ipAddress: '127.0.0.1', // This should be passed from the request
      });

      return updatedElection!;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async deleteElection(
    organizationId: string,
    electionId: string,
    userId: string
  ): Promise<void> {
    // Verificar permisos
    const user = await User.findByPk(userId);
    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
      throw new AppError('No tiene permisos para eliminar elecciones', 403);
    }

    const election = await Election.findOne({
      where: { id: electionId, organizationId },
    });

    if (!election) {
      throw new AppError('Elección no encontrada', 404);
    }

    // Solo se pueden eliminar elecciones programadas o canceladas
    if (election.status === 'active' || election.status === 'completed') {
      throw new AppError('No se puede eliminar una elección activa o completada', 400);
    }

    const transaction = await Election.sequelize!.transaction();

    try {
      // Eliminar opciones primero (por foreign key)
      await ElectionOption.destroy({
        where: { electionId },
        transaction,
      });

      // Eliminar elección
      await election.destroy({ transaction });

      await transaction.commit();

      // Registrar auditoría
      await this.auditService.logActivity({
        userId,
        action: 'ELECTION_DELETED',
        resourceType: 'Election',
        resourceId: electionId,
        oldValues: { title: election.title },
        newValues: null,
        ipAddress: '127.0.0.1', // This should be passed from the request
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async startElection(
    organizationId: string,
    electionId: string,
    userId: string
  ): Promise<Election> {
    const election = await this.getElectionById(organizationId, electionId, userId);

    if (election.status !== 'scheduled') {
      throw new AppError('Solo se pueden iniciar elecciones programadas', 400);
    }

    if (!election.hasStarted()) {
      throw new AppError('La elección aún no ha alcanzado su fecha de inicio', 400);
    }

    await election.update({ status: 'active' });

    // Registrar auditoría
    await this.auditService.logActivity({
      userId,
      action: 'ELECTION_STARTED',
      resourceType: 'Election',
      resourceId: electionId,
      oldValues: null,
      newValues: { title: election.title, status: 'active' },
      ipAddress: '127.0.0.1', // This should be passed from the request
    });

    return election;
  }

  async endElection(
    organizationId: string,
    electionId: string,
    userId: string
  ): Promise<Election> {
    const election = await this.getElectionById(organizationId, electionId, userId);

    if (election.status !== 'active') {
      throw new AppError('Solo se pueden finalizar elecciones activas', 400);
    }

    await election.update({ status: 'completed' });

    // Registrar auditoría
    await this.auditService.logActivity({
      userId,
      action: 'ELECTION_ENDED',
      resourceType: 'Election',
      resourceId: electionId,
      oldValues: null,
      newValues: { title: election.title, status: 'completed' },
      ipAddress: '127.0.0.1', // This should be passed from the request
    });

    return election;
  }
}

// Importar Op para las consultas
import { Op } from 'sequelize';