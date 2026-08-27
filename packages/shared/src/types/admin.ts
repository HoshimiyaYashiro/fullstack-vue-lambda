export interface SystemMetricsDto {
  totalUsers: number;
  activeUsers: number;
  lambdaInvocations: number;
  systemHealth: 'healthy' | 'degraded' | 'critical';
  uptimeSeconds: number;
}

export interface AuditLogDto {
  id: string;
  actorId: string;
  actorEmail: string;
  action: string;
  resource: string;
  ipAddress: string;
  timestamp: string;
}
