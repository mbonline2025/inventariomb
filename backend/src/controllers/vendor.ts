import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { prisma } from '../utils/database';
import { createVendorSchema } from '../utils/validation';
import logger from '../utils/logger';

export class VendorController {
  async getAll(req: AuthenticatedRequest, res: Response) {
    try {
      const vendors = await prisma.vendor.findMany({
        include: {
          _count: {
            select: {
              hardwareItems: true,
              licenses: true,
            }
          }
        },
        orderBy: { name: 'asc' },
      });

      res.json(vendors);
    } catch (error) {
      logger.error('Erro ao buscar fornecedores:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async getById(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;

      const vendor = await prisma.vendor.findUnique({
        where: { id },
        include: {
          hardwareItems: {
            select: {
              id: true,
              assetTag: true,
              type: true,
              brand: true,
              model: true,
              status: true,
            }
          },
          licenses: {
            include: {
              software: {
                select: {
                  name: true,
                  version: true,
                }
              }
            }
          },
        },
      });

      if (!vendor) {
        return res.status(404).json({ error: 'Fornecedor não encontrado' });
      }

      res.json(vendor);
    } catch (error) {
      logger.error('Erro ao buscar fornecedor por ID:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async create(req: AuthenticatedRequest, res: Response) {
    try {
      const validatedData = createVendorSchema.parse(req.body);

      const vendor = await prisma.vendor.create({
        data: validatedData,
      });

      res.status(201).json(vendor);
    } catch (error) {
      logger.error('Erro ao criar fornecedor:', error);
      res.status(400).json({ error: 'Dados inválidos' });
    }
  }

  async update(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const validatedData = createVendorSchema.partial().parse(req.body);

      const existingVendor = await prisma.vendor.findUnique({
        where: { id }
      });

      if (!existingVendor) {
        return res.status(404).json({ error: 'Fornecedor não encontrado' });
      }

      const vendor = await prisma.vendor.update({
        where: { id },
        data: validatedData,
      });

      res.json(vendor);
    } catch (error) {
      logger.error('Erro ao atualizar fornecedor:', error);
      res.status(400).json({ error: 'Dados inválidos' });
    }
  }

  async delete(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;

      const existingVendor = await prisma.vendor.findUnique({
        where: { id }
      });

      if (!existingVendor) {
        return res.status(404).json({ error: 'Fornecedor não encontrado' });
      }

      await prisma.vendor.delete({
        where: { id }
      });

      res.json({ message: 'Fornecedor excluído com sucesso' });
    } catch (error) {
      logger.error('Erro ao excluir fornecedor:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}

