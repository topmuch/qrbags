/**
 * Logger structuré pour les métriques IA et services externes.
 *
 * Usage:
 *   logMetric('groq', 'generate_message', 245, true, { key: 'VOL26-ABC' });
 *   logMetric('wakit', 'send', 1200, false);
 */

interface MetricOptions {
  /** Clé métier supplémentaire (ex: référence bagage) */
  key?: string;
  /** Détails supplémentaires pour le debug */
  details?: string;
}

/**
 * Loggue une métrique structurée pour monitoring.
 * Format: [Service/Action] ✅/❌ Xms [key=...] [details=...]
 */
export function logMetric(
  service: 'groq' | 'wakit' | 'whatsapp' | 'suivi',
  action: string,
  latencyMs: number,
  success: boolean,
  options?: MetricOptions
): void {
  const icon = success ? '✅' : '❌';
  const keyPart = options?.key ? ` [key=${options.key}]` : '';
  const detailsPart = options?.details ? ` [${options.details}]` : '';

  console.log(
    `[${service}/${action}] ${icon} ${latencyMs}ms${keyPart}${detailsPart}`
  );
}
