import { supabase } from "@/features/core/integrations/supabase/client";
import { WebhookLog } from "../types";

/**
 * Envia um webhook assíncrono para a URL cadastrada (N8N)
 * e registra a auditoria na tabela `webhook_logs` do Supabase.
 */
export async function dispatchWebhook(
  eventType: string,
  payload: any,
): Promise<Omit<WebhookLog, "id" | "created_at">> {
  const start = performance.now();

  // 1. Busca a URL de destino configurada para o N8N nas configurações de integração
  let webhookUrl = "http://localhost:5678/webhook/comamor-vestuario"; // Fallback padrão
  let environment: "development" | "production" = "development";

  try {
    const { data: n8nSettings } = (await supabase
      .from("integration_settings" as any)
      .select("webhook_url, mode")
      .eq("provider", "n8n")
      .maybeSingle()) as any;

    if (n8nSettings?.webhook_url) {
      webhookUrl = n8nSettings.webhook_url;
      environment = n8nSettings.mode as any;
    }
  } catch (err) {
    console.warn(
      "Não foi possível carregar a URL do webhook do banco de dados. Usando fallback padrão.",
      err,
    );
  }

  // 2. Monta o envelope padronizado de metadados
  const webhookBody = {
    event: eventType,
    timestamp: new Date().toISOString(),
    environment,
    data: payload,
  };

  let statusCode: number | null = null;
  let responseBody = "";
  let status: "success" | "failed" = "failed";

  try {
    // 3. Efetua o disparo HTTP
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Source": "comamor-vestuario-dev",
      },
      body: JSON.stringify(webhookBody),
    });

    statusCode = response.status;
    responseBody = await response.text();

    if (response.ok) {
      status = "success";
    } else {
      status = "failed";
    }
  } catch (error: any) {
    console.error("Erro ao despachar webhook:", error);
    status = "failed";
    responseBody =
      error?.message ||
      "Erro de Conexão/CORS. Verifique se o servidor do N8N está ativo e aceita requisições.";
    statusCode = 0; // 0 indica falha de rede/CORS
  }

  const durationMs = Math.round(performance.now() - start);

  // 4. Registra a tentativa de envio na tabela de logs do Supabase
  try {
    await supabase.from("webhook_logs" as any).insert({
      event_type: eventType,
      payload: webhookBody,
      webhook_url: webhookUrl,
      status_code: statusCode,
      response_body: responseBody.substring(0, 1000), // Previne estourar limites de texto
      duration_ms: durationMs,
      status,
    });
  } catch (dbErr) {
    console.error("Falha ao salvar log de webhook no Supabase:", dbErr);
  }

  return {
    event_type: eventType,
    payload: webhookBody,
    webhook_url: webhookUrl,
    status_code: statusCode,
    response_body: responseBody,
    duration_ms: durationMs,
    status,
  };
}
