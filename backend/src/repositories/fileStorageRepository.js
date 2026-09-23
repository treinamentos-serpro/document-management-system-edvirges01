// Repositório de arquivos: grava e localiza documentos em backend/storage (RNF-01, RNF-02).
// O nome físico gerado aqui nunca é exposto ao cliente.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');

const STORAGE_DIR = path.join(__dirname, '..', '..', 'storage');

fs.mkdirSync(STORAGE_DIR, { recursive: true });

function buildStorageName(originalName) {
  const extension = path.extname(originalName || '');
  return `${crypto.randomUUID()}${extension}`;
}

const diskStorage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, STORAGE_DIR);
  },
  filename: (req, file, callback) => {
    callback(null, buildStorageName(file.originalname));
  },
});

function resolveStoragePath(storageName) {
  return path.join(STORAGE_DIR, storageName);
}

function fileExists(storageName) {
  return fs.existsSync(resolveStoragePath(storageName));
}

function removeFile(storageName) {
  fs.rm(resolveStoragePath(storageName), { force: true }, () => {});
}

module.exports = {
  STORAGE_DIR,
  diskStorage,
  resolveStoragePath,
  fileExists,
  removeFile,
};
