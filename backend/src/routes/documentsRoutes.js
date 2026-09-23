// Rotas de documentos: aplica o middleware do multer e delega ao controller.

const express = require('express');
const multer = require('multer');
const config = require('../config/env');
const fileStorageRepository = require('../repositories/fileStorageRepository');
const documentsController = require('../controllers/documentsController');

const upload = multer({
  storage: fileStorageRepository.diskStorage,
  limits: { fileSize: config.maxFileSizeBytes },
});

const router = express.Router();

router.post('/upload', (req, res, next) => {
  upload.single('file')(req, res, (error) => {
    if (error) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        res.status(413).json({
          error: {
            code: 'FILE_TOO_LARGE',
            message: 'O arquivo excede o tamanho máximo permitido.',
          },
        });
        return;
      }
      next(error);
      return;
    }
    documentsController.upload(req, res);
  });
});

router.get('/documents', documentsController.list);
router.get('/documents/:id/download', documentsController.download);

module.exports = router;
