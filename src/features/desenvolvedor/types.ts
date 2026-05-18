// Tipos e Interfaces do módulo desenvolvedor

export interface IntegrationSettings {
  id?: string;
  provider: 'supabase' | 'melhor_envio' | 'mercado_pago' | 'n8n';
  mode: 'sandbox' | 'production';
  api_url: string | null;
  public_key: string | null;
  private_key: string | null;
  webhook_url: string | null;
  updated_at?: string;
  updated_by?: string | null;
}

export interface WebhookLog {
  id: string;
  event_type: string;
  payload: any;
  webhook_url: string;
  status_code: number | null;
  response_body: string | null;
  duration_ms: number | null;
  status: 'success' | 'failed';
  created_at: string;
}

export interface ApiHealthStatus {
  provider: 'supabase' | 'melhor_envio' | 'mercado_pago' | 'n8n';
  status: 'online' | 'offline' | 'warning' | 'loading';
  latencyMs?: number;
  message?: string;
  details?: any;
}
