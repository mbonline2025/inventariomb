import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { prisma } from '../utils/database';
import logger from '../utils/logger';

export const auditLog = (entityType: string) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      // Log da ação após a resposta ser enviada
      if (req.user && res.statusCode < 400) {
        const action = `${req.method} ${req.route?.path || req.path}`;
        const entityId = req.params.id || 'unknown';
        
        prisma.auditLog.create({
          data: {
            userId: req.user.id,
            entityType,
            entityId,
            action,
            oldValues: req.method === 'PUT' ? req.body.oldValues : null,
            newValues: req.method !== 'GET' ? req.body : null,
          }
        }).catch(error => {
          logger.error('Erro ao criar log de auditoria:', error);
        });
      }
      
      return originalSend.call(this, data);
    };
    
    next();
  };
};

