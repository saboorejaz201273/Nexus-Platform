const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const upload = require('../config/upload');
const {
  uploadDocument,
  getDocuments,
  downloadDocument,
  signDocument,
  deleteDocument,
  updateStatus
} = require('../controllers/documentController');

router.post('/upload', auth, upload.single('file'), uploadDocument);
router.get('/', auth, getDocuments);
router.get('/:id/download', auth, downloadDocument);
router.put('/:id/sign', auth, signDocument);
router.put('/:id/status', auth, updateStatus);
router.delete('/:id', auth, deleteDocument);

module.exports = router;