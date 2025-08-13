import { z } from 'zod';

// Auth schemas
export const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  role: z.enum(['ADMIN', 'GESTOR', 'COLABORADOR']).optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

// User schemas
export const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  role: z.enum(['ADMIN', 'GESTOR', 'COLABORADOR']).optional(),
});

// Vendor schemas
export const createVendorSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  type: z.enum(['LOJA_FISICA', 'E_COMMERCE', 'MARKETPLACE', 'FABRICANTE']),
  cnpj: z.string().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

// Software schemas
export const createSoftwareSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  version: z.string().optional(),
  category: z.string().optional(),
  notes: z.string().optional(),
  vendorId: z.string().optional(),
});

// License schemas
export const createLicenseSchema = z.object({
  softwareId: z.string().min(1, 'Software é obrigatório'),
  key: z.string().min(1, 'Chave é obrigatória'),
  seatsTotal: z.number().min(1, 'Total de assentos deve ser pelo menos 1'),
  purchaseDate: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  renewalType: z.enum(['MENSAL', 'ANUAL', 'PERPETUA']).default('ANUAL'),
  cost: z.number().optional(),
  vendorId: z.string().optional(),
  notes: z.string().optional(),
});

// Hardware schemas
export const createHardwareSchema = z.object({
  assetTag: z.string().min(1, 'Tag do ativo é obrigatória'),
  type: z.enum(['LAPTOP', 'IMPRESSORA', 'MONITOR', 'PERIFERICO', 'REDE', 'OUTRO']),
  brand: z.string().optional(),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  purchaseDate: z.string().optional(),
  purchaseCost: z.number().optional(),
  vendorId: z.string().optional(),
  warrantyEndDate: z.string().optional(),
  status: z.enum(['EM_USO', 'EM_ESTOQUE', 'EM_MANUTENCAO', 'DESATIVADO', 'EMPRESTADO']).default('EM_ESTOQUE'),
  condition: z.enum(['NOVO', 'BOM', 'REGULAR', 'RUIM']).default('BOM'),
  location: z.string().optional(),
  responsibleUserId: z.string().optional(),
  departmentId: z.string().optional(),
  notes: z.string().optional(),
});

// Maintenance schemas
export const createMaintenanceSchema = z.object({
  hardwareItemId: z.string().min(1, 'Item de hardware é obrigatório'),
  startDate: z.string().min(1, 'Data de início é obrigatória'),
  endDate: z.string().optional(),
  provider: z.string().min(1, 'Provedor é obrigatório'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  cost: z.number().optional(),
  status: z.enum(['ABERTA', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA']).default('ABERTA'),
  notes: z.string().optional(),
});

// Allocation schemas
export const createAllocationSchema = z.object({
  hardwareItemId: z.string().min(1, 'Item de hardware é obrigatório'),
  assignedToUserId: z.string().optional(),
  assignedToDepartmentId: z.string().optional(),
  expectedReturnDate: z.string().optional(),
  notes: z.string().optional(),
});

// Chat schemas
export const chatSchema = z.object({
  message: z.string().min(1, 'Mensagem é obrigatória'),
  context: z.string().optional(),
});

