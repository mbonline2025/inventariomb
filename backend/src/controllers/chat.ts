import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { GeminiService } from '../services/gemini';
import { chatSchema } from '../utils/validation';
import logger from '../utils/logger';

export class ChatController {
  private geminiService = new GeminiService();

  async ask(req: AuthenticatedRequest, res: Response) {
    try {
      const validatedData = chatSchema.parse(req.body);

      const response = await this.geminiService.generateInventoryResponse(validatedData.message);

      res.json({
        response,
        timestamp: new Date(),
      });
    } catch (error) {
      logger.error('Erro no chat:', error);
      res.status(400).json({ error: 'Não foi possível processar sua mensagem' });
    }
  }

  async getSuggestions(req: AuthenticatedRequest, res: Response) {
    try {
      const suggestions = [
        'Resumo geral do inventário',
        'Equipamentos em manutenção',
        'Licenças expirando em 30 dias',
        'Equipamentos sem responsável',
        'Status dos equipamentos por departamento',
        'Fornecedores com mais equipamentos',
        'Equipamentos por tipo',
        'Manutenções pendentes',
      ];

      res.json(suggestions);
    } catch (error) {
      logger.error('Erro ao buscar sugestões:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}

