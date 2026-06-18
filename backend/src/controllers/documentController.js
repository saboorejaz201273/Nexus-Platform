const Document = require('../models/Document');
const path = require('path');
const fs = require('fs');

// Upload Document
exports.uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const document = await Document.create({
      title: req.body.title || req.file.originalname,
      fileName: req.file.originalname,
      filePath: req.file.filename,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      uploadedBy: req.user.id,
    });

    res.status(201).json(document);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get All Documents
exports.getDocuments = async (req, res) => {
  try {
    const documents = await Document.find()
      .populate('uploadedBy', 'name email role')
      .populate('signedBy', 'name email role')
      .sort({ createdAt: -1 });

    res.status(200).json(documents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Download/View Document
exports.downloadDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const filePath = path.join(__dirname, '../../uploads', document.filePath);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found on server' });
    }

    res.sendFile(filePath);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Sign Document (e-signature)
exports.signDocument = async (req, res) => {
  try {
    const { signature } = req.body;

    const document = await Document.findByIdAndUpdate(
      req.params.id,
      {
        signature,
        signedBy: req.user.id,
        signedAt: new Date(),
        status: 'signed'
      },
      { new: true }
    ).populate('uploadedBy', 'name email role')
     .populate('signedBy', 'name email role');

    res.status(200).json(document);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete Document
exports.deleteDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const filePath = path.join(__dirname, '../../uploads', document.filePath);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await Document.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Document deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update Status
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const document = await Document.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    res.status(200).json(document);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};