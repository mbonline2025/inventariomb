import { Request, Response } from 'express';
import { prisma } from '../utils/database';
import { hashPassword, comparePassword, generateTokens, verifyRefreshToken } from '../utils/auth';
import { registerSchema, loginSchema } from '../utils/validation';
import { AuthenticatedRequest } from '../types';
import logger from '../utils/logger';

export class AuthController {
  async register(req: Request, res: Response) {
    try {
      const validatedData = registerSchema.parse(req.body);
      
      // Verificar se o usuário já existe
      const existingUser = await prisma.user.findUnique({
        where: { email: validatedData.email }
      });

      if (existingUser) {
        return res.status(400).json({ error: 'Email já está em uso' });
      }

      // Hash da senha
      const passwordHash = await hashPassword(validatedData.password);

      // Criar usuário
      const user = await prisma.user.create({
        data: {
          name: validatedData.name,
          email: validatedData.email,
          passwordHash,
          role: validatedData.role || 'COLABORADOR',
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        }
      });

      // Gerar tokens
      const tokens = generateTokens({
        id: user.id,
        email: user.email,
        role: user.role,
      });

      // Configurar cookies
      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
      });

      res.status(201).json({
        user,
        accessToken: tokens.accessToken,
      });
    } catch (error) {
      logger.error('Erro no registro:', error);
      res.status(400).json({ error: 'Dados inválidos' });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const validatedData = loginSchema.parse(req.body);

      // Buscar usuário
      const user = await prisma.user.findUnique({
        where: { email: validatedData.email }
      });

      if (!user) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }

      // Verificar senha
      const isValidPassword = await comparePassword(validatedData.password, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }

      // Gerar tokens
      const tokens = generateTokens({
        id: user.id,
        email: user.email,
        role: user.role,
      });

      // Configurar cookies
      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
      });

      res.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        accessToken: tokens.accessToken,
      });
    } catch (error) {
      logger.error('Erro no login:', error);
      res.status(400).json({ error: 'Dados inválidos' });
    }
  }

  async refresh(req: Request, res: Response) {
    try {
      const refreshToken = req.cookies.refreshToken;

      if (!refreshToken) {
        return res.status(401).json({ error: 'Refresh token não encontrado' });
      }

      const decoded = verifyRefreshToken(refreshToken);
      
      // Buscar usuário atualizado
      const user = await prisma.user.findUnique({
        where: { id: decoded.id }
      });

      if (!user) {
        return res.status(401).json({ error: 'Usuário não encontrado' });
      }

      // Gerar novos tokens
      const tokens = generateTokens({
        id: user.id,
        email: user.email,
        role: user.role,
      });

      // Configurar novo cookie
      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
      });

      res.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        accessToken: tokens.accessToken,
      });
    } catch (error) {
      logger.error('Erro no refresh:', error);
      res.status(401).json({ error: 'Refresh token inválido' });
    }
  }

  async me(req: AuthenticatedRequest, res: Response) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        }
      });

      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      res.json(user);
    } catch (error) {
      logger.error('Erro ao buscar usuário:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async logout(req: Request, res: Response) {
    res.clearCookie('refreshToken');
    res.json({ message: 'Logout realizado com sucesso' });
  }
}

