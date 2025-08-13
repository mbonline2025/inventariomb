// backend/src/controllers/dashboard.ts
import { Response } from 'express';
import { AuthenticatedRequest, DashboardStats } from '../types';
import { prisma } from '../utils/database';
import logger from '../utils/logger';

export class DashboardController {
  async getStats(req: AuthenticatedRequest, res: Response) {
    try {
      // rode contagens em paralelo onde fizer sentido
      const totalAssetsPromise = prisma.hardwareItem.count();

      const assetsByStatusPromise = prisma.hardwareItem.groupBy({
        by: ['status'],
        _count: { _all: true },
      });

      const itemsInMaintenancePromise = prisma.maintenance.count({
        where: {
          status: { in: ['ABERTA', 'EM_ANDAMENTO'] },
        },
      });

      // janelas de expiração
      const now = new Date();
      const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const in60Days = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
      const in90Days = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

      const licensesIn30Promise = prisma.license.count({
        where: { endDate: { gte: now, lte: in30Days } },
      });
      const licensesIn60Promise = prisma.license.count({
        where: { endDate: { gte: now, lte: in60Days } },
      });
      const licensesIn90Promise = prisma.license.count({
        where: { endDate: { gte: now, lte: in90Days } },
      });

      const topVendorsPromise = prisma.vendor.findMany({
        include: {
          _count: {
            select: {
              hardwareItems: true,
              licenses: true,
            },
          },
        },
        orderBy: [
          { hardwareItems: { _count: 'desc' } },
          { licenses: { _count: 'desc' } },
        ],
        take: 5,
      });

      const [
        totalAssets,
        assetsByStatusRaw,
        itemsInMaintenance,
        licensesIn30,
        licensesIn60,
        licensesIn90,
        topVendorsRaw,
      ] = await Promise.all([
        totalAssetsPromise,
        assetsByStatusPromise,
        itemsInMaintenancePromise,
        licensesIn30Promise,
        licensesIn60Promise,
        licensesIn90Promise,
        topVendorsPromise,
      ]);

      const assetsByStatus = assetsByStatusRaw.reduce<Record<string, number>>((acc, item) => {
        acc[item.status] = item._count._all;
        return acc;
      }, {});

      const topVendors = topVendorsRaw.map((vendor) => ({
        name: vendor.name,
        count: vendor._count.hardwareItems + vendor._count.licenses,
      }));

      const stats: DashboardStats = {
        totalAssets,
        assetsByStatus,
        itemsInMaintenance,
        licensesExpiring: {
          in30Days: licensesIn30,
          in60Days: licensesIn60,
          in90Days: licensesIn90,
        },
        topVendors,
      };

      res.json(stats);
    } catch (error) {
      logger.error('Erro ao buscar estatísticas do dashboard:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async getRecentActivity(req: AuthenticatedRequest, res: Response) {
    try {
      const recentLogs = await prisma.auditLog.findMany({
        include: {
          user: { select: { name: true, email: true } },
        },
        orderBy: { timestamp: 'desc' },
        take: 20,
      });

      res.json(recentLogs);
    } catch (error) {
      logger.error('Erro ao buscar atividade recente:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}
