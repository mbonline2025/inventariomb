import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '../utils/database';
import logger from '../utils/logger';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export class GeminiService {
  private model = genAI.getGenerativeModel({ model: 'gemini-pro' });

  async generateInventoryResponse(message: string): Promise<string> {
    try {
      // Buscar dados do inventário para contexto
      const context = await this.getInventoryContext();
      
      const prompt = `
        Você é um assistente especializado em inventário de TI da empresa MB Consultoria.
        
        Contexto atual do inventário:
        ${context}
        
        Pergunta do usuário: ${message}
        
        Responda de forma clara e objetiva, focando nos dados do inventário. 
        Se a pergunta não for relacionada ao inventário, informe que você só pode ajudar com questões de inventário de TI.
        Mantenha a resposta em português brasileiro.
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      logger.error('Erro no serviço Gemini:', error);
      return 'Desculpe, não foi possível processar sua solicitação no momento. Tente novamente mais tarde.';
    }
  }

  private async getInventoryContext(): Promise<string> {
    try {
      // Buscar estatísticas básicas
      const totalHardware = await prisma.hardwareItem.count();
      const hardwareByStatus = await prisma.hardwareItem.groupBy({
        by: ['status'],
        _count: true,
      });
      
      const totalLicenses = await prisma.license.count();
      const licensesExpiring = await prisma.license.count({
        where: {
          endDate: {
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
          }
        }
      });

      const maintenanceOpen = await prisma.maintenance.count({
        where: {
          status: {
            in: ['ABERTA', 'EM_ANDAMENTO']
          }
        }
      });

      const topVendors = await prisma.vendor.findMany({
        include: {
          _count: {
            select: {
              hardwareItems: true,
              licenses: true,
            }
          }
        },
        orderBy: {
          hardwareItems: {
            _count: 'desc'
          }
        },
        take: 5,
      });

      return `
        Total de equipamentos: ${totalHardware}
        Equipamentos por status: ${hardwareByStatus.map(s => `${s.status}: ${s._count}`).join(', ')}
        Total de licenças: ${totalLicenses}
        Licenças expirando em 30 dias: ${licensesExpiring}
        Manutenções abertas: ${maintenanceOpen}
        Principais fornecedores: ${topVendors.map(v => `${v.name} (${v._count.hardwareItems + v._count.licenses} itens)`).join(', ')}
      `;
    } catch (error) {
      logger.error('Erro ao buscar contexto do inventário:', error);
      return 'Dados do inventário não disponíveis no momento.';
    }
  }
}

