import { Response } from 'express';
import { AuthenticatedRequest, HardwareFilters } from '../types';
import { prisma } from '../utils/database';
import { createHardwareSchema } from '../utils/validation';
import logger from '../utils/logger';

export class HardwareController {
  async getAll(req: AuthenticatedRequest, res: Response) {
    try {
      const {
        page = '1',
        limit = '10',
        status,
        type,
        responsibleUserId,
        departmentId,
        vendorId,
      } = req.query as HardwareFilters;

      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const skip = (pageNum - 1) * limitNum;

      const where: any = {};
      if (status) where.status = status;
      if (type) where.type = type;
      if (responsibleUserId) where.responsibleUserId = responsibleUserId;
      if (departmentId) where.departmentId = departmentId;
      if (vendorId) where.vendorId = vendorId;

      const [items, total] = await Promise.all([
        prisma.hardwareItem.findMany({
          where,
          include: {
            vendor: true,
            responsibleUser: {
              select: { id: true, name: true, email: true }
            },
            department: true,
            _count: {
              select: {
                attachments: true,
                maintenances: true,
                allocations: true,
              }
            }
          },
          skip,
          take: limitNum,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.hardwareItem.count({ where }),
      ]);

      res.json({
        items,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      logger.error('Erro ao buscar hardware:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async getById(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;

      const item = await prisma.hardwareItem.findUnique({
        where: { id },
        include: {
          vendor: true,
          responsibleUser: {
            select: { id: true, name: true, email: true }
          },
          department: true,
          attachments: true,
          maintenances: {
            orderBy: { startDate: 'desc' }
          },
          allocations: {
            include: {
              assignedToUser: {
                select: { id: true, name: true, email: true }
              },
              assignedToDepartment: true,
            },
            orderBy: { checkoutDate: 'desc' }
          },
          softwareInstalls: {
            include: {
              software: true,
              license: true,
            }
          },
        },
      });

      if (!item) {
        return res.status(404).json({ error: 'Item não encontrado' });
      }

      res.json(item);
    } catch (error) {
      logger.error('Erro ao buscar hardware por ID:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async create(req: AuthenticatedRequest, res: Response) {
    try {
      const validatedData = createHardwareSchema.parse(req.body);

      // Verificar se assetTag já existe
      const existingItem = await prisma.hardwareItem.findUnique({
        where: { assetTag: validatedData.assetTag }
      });

      if (existingItem) {
        return res.status(400).json({ error: 'Tag do ativo já está em uso' });
      }

      const item = await prisma.hardwareItem.create({
        data: {
          ...validatedData,
          purchaseDate: validatedData.purchaseDate ? new Date(validatedData.purchaseDate) : null,
          warrantyEndDate: validatedData.warrantyEndDate ? new Date(validatedData.warrantyEndDate) : null,
        },
        include: {
          vendor: true,
          responsibleUser: {
            select: { id: true, name: true, email: true }
          },
          department: true,
        },
      });

      res.status(201).json(item);
    } catch (error) {
      logger.error('Erro ao criar hardware:', error);
      res.status(400).json({ error: 'Dados inválidos' });
    }
  }

  async update(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const validatedData = createHardwareSchema.partial().parse(req.body);

      // Verificar se o item existe
      const existingItem = await prisma.hardwareItem.findUnique({
        where: { id }
      });

      if (!existingItem) {
        return res.status(404).json({ error: 'Item não encontrado' });
      }

      // Verificar se assetTag já existe (se estiver sendo alterado)
      if (validatedData.assetTag && validatedData.assetTag !== existingItem.assetTag) {
        const duplicateTag = await prisma.hardwareItem.findUnique({
          where: { assetTag: validatedData.assetTag }
        });

        if (duplicateTag) {
          return res.status(400).json({ error: 'Tag do ativo já está em uso' });
        }
      }

      const item = await prisma.hardwareItem.update({
        where: { id },
        data: {
          ...validatedData,
          purchaseDate: validatedData.purchaseDate ? new Date(validatedData.purchaseDate) : undefined,
          warrantyEndDate: validatedData.warrantyEndDate ? new Date(validatedData.warrantyEndDate) : undefined,
        },
        include: {
          vendor: true,
          responsibleUser: {
            select: { id: true, name: true, email: true }
          },
          department: true,
        },
      });

      res.json(item);
    } catch (error) {
      logger.error('Erro ao atualizar hardware:', error);
      res.status(400).json({ error: 'Dados inválidos' });
    }
  }

  async delete(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;

      const existingItem = await prisma.hardwareItem.findUnique({
        where: { id }
      });

      if (!existingItem) {
        return res.status(404).json({ error: 'Item não encontrado' });
      }

      await prisma.hardwareItem.delete({
        where: { id }
      });

      res.json({ message: 'Item excluído com sucesso' });
    } catch (error) {
      logger.error('Erro ao excluir hardware:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}

