// Regras de negócio do DMS: upload, listagem e download de documentos.

const crypto = require('crypto');
const documentsRepository = require('../repositories/documentsRepository');
const fileStorageRepository = require('../repositories/fileStorageRepository');

const DOCUMENT_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

class DocumentServiceError extends Error {
  constructor(code, message, status) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

function toPublicDocument(document) {
  const { storageName, ...publicDocument } = document;
  return publicDocument;
}

function isValidDocumentId(id) {
  return typeof id === 'string' && DOCUMENT_ID_PATTERN.test(id);
}

function registerUpload({ file, owner }) {
  if (!file) {
    throw new DocumentServiceError(
      'FILE_REQUIRED',
      'É necessário enviar um arquivo no campo "file".',
      400,
    );
  }

  const document = {
    id: crypto.randomUUID(),
    originalName: file.originalname,
    size: file.size,
    uploadedAt: new Date().toISOString(),
    owner,
    mimeType: file.mimetype || 'application/octet-stream',
    storageName: file.filename,
  };

  try {
    documentsRepository.create(document);
  } catch (error) {
    fileStorageRepository.removeFile(document.storageName);
    throw new DocumentServiceError(
      'STORAGE_ERROR',
      'Falha ao registrar os metadados do documento.',
      500,
    );
  }

  return toPublicDocument(document);
}

function listDocuments(owner) {
  return documentsRepository.listByOwner(owner).map(toPublicDocument);
}

function getDocumentForDownload(id, owner) {
  if (!isValidDocumentId(id)) {
    throw new DocumentServiceError(
      'INVALID_DOCUMENT_ID',
      'Identificador de documento inválido.',
      400,
    );
  }

  const document = documentsRepository.findByIdAndOwner(id, owner);
  if (!document || !fileStorageRepository.fileExists(document.storageName)) {
    // Mesmo status para documento inexistente e de outro usuário (RF-13).
    throw new DocumentServiceError('DOCUMENT_NOT_FOUND', 'Documento não encontrado.', 404);
  }

  return {
    document: toPublicDocument(document),
    filePath: fileStorageRepository.resolveStoragePath(document.storageName),
  };
}

module.exports = {
  DocumentServiceError,
  registerUpload,
  listDocuments,
  getDocumentForDownload,
};
