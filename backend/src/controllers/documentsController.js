// Entrada/saída HTTP das rotas de documentos: valida o contexto e traduz o
// resultado dos services em status, headers e JSON.

const fs = require('fs');
const config = require('../config/env');
const documentsService = require('../services/documentsService');

function buildErrorBody(code, message) {
  return { error: { code, message } };
}

function getOwnerOrRespond(res) {
  if (!config.ownerId) {
    res
      .status(503)
      .json(buildErrorBody('OWNER_NOT_CONFIGURED', 'O servidor não possui um usuário configurado.'));
    return null;
  }
  return config.ownerId;
}

function handleServiceError(error, res) {
  if (error instanceof documentsService.DocumentServiceError) {
    res.status(error.status).json(buildErrorBody(error.code, error.message));
    return;
  }
  res.status(500).json(buildErrorBody('STORAGE_ERROR', 'Erro inesperado ao processar o documento.'));
}

function upload(req, res) {
  const owner = getOwnerOrRespond(res);
  if (!owner) return;

  try {
    const document = documentsService.registerUpload({ file: req.file, owner });
    res.status(201).json(document);
  } catch (error) {
    handleServiceError(error, res);
  }
}

function list(req, res) {
  const owner = getOwnerOrRespond(res);
  if (!owner) return;

  try {
    const documents = documentsService.listDocuments(owner);
    res.status(200).json({ documents });
  } catch (error) {
    handleServiceError(error, res);
  }
}

function download(req, res) {
  const owner = getOwnerOrRespond(res);
  if (!owner) return;

  try {
    const { document, filePath } = documentsService.getDocumentForDownload(req.params.id, owner);

    res.status(200);
    res.type(document.mimeType);
    res.attachment(document.originalName);

    const stream = fs.createReadStream(filePath);
    stream.on('error', () => {
      if (!res.headersSent) {
        res.status(500).json(buildErrorBody('STORAGE_ERROR', 'Falha ao ler o arquivo do documento.'));
      }
    });
    stream.pipe(res);
  } catch (error) {
    handleServiceError(error, res);
  }
}

module.exports = { upload, list, download };
