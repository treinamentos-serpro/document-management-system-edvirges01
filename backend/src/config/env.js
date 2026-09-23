// Configuração do backend a partir de variáveis de ambiente (12-Factor App).
// A leitura ocorre uma única vez, na inicialização do módulo.

const DEFAULT_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MiB

function resolveOwnerId() {
  const value = process.env.DMS_OWNER_ID;
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function resolveMaxFileSizeBytes() {
  const rawValue = process.env.MAX_FILE_SIZE_BYTES;
  if (rawValue === undefined || rawValue === '') {
    return DEFAULT_MAX_FILE_SIZE_BYTES;
  }

  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    // RNF-05: valores inválidos devem ser rejeitados na inicialização do processo.
    throw new Error('MAX_FILE_SIZE_BYTES deve ser um número maior que zero.');
  }

  return parsed;
}

module.exports = {
  ownerId: resolveOwnerId(),
  maxFileSizeBytes: resolveMaxFileSizeBytes(),
};
