import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
}

export interface HardwareFilters extends PaginationQuery {
  status?: string;
  type?: string;
  responsibleUserId?: string;
  departmentId?: string;
  vendorId?: string;
}

export interface LicenseFilters extends PaginationQuery {
  softwareId?: string;
  vendorId?: string;
  expiringIn?: string; // days
}

export interface DashboardStats {
  totalAssets: number;
  assetsByStatus: Record<string, number>;
  itemsInMaintenance: number;
  licensesExpiring: {
    in30Days: number;
    in60Days: number;
    in90Days: number;
  };
  topVendors: Array<{
    name: string;
    count: number;
  }>;
}

export interface ChatRequest {
  message: string;
  context?: string;
}

export interface ChatResponse {
  response: string;
  timestamp: Date;
}

