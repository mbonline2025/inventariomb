import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { prisma } from '../utils/database';
import { updateUserSchema } from '../utils/validation';
import { hashPassword } from '../utils/auth';
import logger from '../utils/logger';

export class UserController {
  async getAll(req: AuthenticatedRequest, res: Response) {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              hardwareItems: true,
              allocations: true,
            }
          }
        },
        orderBy: { name: 'asc' },
      });

      res.json(users);
    } catch (error) {
      logger.error('Erro ao buscar usuários:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async getById(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;

      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
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
          allocations: {
            include: {
              hardwareItem: {
                select: {
                  assetTag: true,
                  type: true,
                  brand: true,
                  model: true,
                }
              }
            },
            orderBy: { checkoutDate: 'desc' }
          },
        },
      });

      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      res.json(user);
    } catch (error) {
      logger.error('Erro ao buscar usuário por ID:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async update(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const validatedData = updateUserSchema.parse(req.body);

      // Verificar se o usuário existe
      const existingUser = await prisma.user.findUnique({
        where: { id }
      });

      if (!existingUser) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      // Verificar se o email já está em uso (se estiver sendo alterado)
      if (validatedData.email && validatedData.email !== existingUser.email) {
        const duplicateEmail = await prisma.user.findUnique({
          where: { email: validatedData.email }
        });

        if (duplicateEmail) {
          return res.status(400).json({ error: 'Email já está em uso' });
        }
      }

      const user = await prisma.user.update({
        where: { id },
        data: validatedData,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        }
      });

      res.json(user);
    } catch (error) {
      logger.error('Erro ao atualizar usuário:', error);
      res.status(400).json({ error: 'Dados inválidos' });
    }
  }

  async delete(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;

      // Não permitir que o usuário delete a si mesmo
      if (id === req.user!.id) {
        return res.status(400).json({ error: 'Não é possível excluir sua própria conta' });
      }

      const existingUser = await prisma.user.findUnique({
        where: { id }
      });

      if (!existingUser) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      await prisma.user.delete({
        where: { id }
      });

      res.json({ message: 'Usuário excluído com sucesso' });
    } catch (error) {
      logger.error('Erro ao excluir usuário:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async changePassword(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { currentPassword, newPassword } = req.body;

      // Verificar se é o próprio usuário ou admin
      if (id !== req.user!.id && req.user!.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      const user = await prisma.user.findUnique({
        where: { id }
      });

      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      // Se não for admin, verificar senha atual
      if (req.user!.role !== 'ADMIN') {
        const { comparePassword } = await import('../utils/auth');
        const isValidPassword = await comparePassword(currentPassword, user.passwordHash);
        if (!isValidPassword) {
          return res.status(400).json({ error: 'Senha atual incorreta' });
        }
      }

      const passwordHash = await hashPassword(newPassword);

      await prisma.user.update({
        where: { id },
        data: { passwordHash }
      });

      res.json({ message: 'Senha alterada com sucesso' });
    } catch (error) {
      logger.error('Erro ao alterar senha:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}

