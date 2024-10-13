const express = require('express');
const { authenticate } = require('../middleware/authMiddleware');
const { upsertData, chatWithDocument, getChatHistory } = require('../controller/chatController.js');
const { register, login } = require('../controller/authController.js');
const { uploadPreSignedUrl, getPresignedUrl, createDocument, getAllDocuments } = require('../controller/documentController.js');
const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/upload-signed-url', authenticate, uploadPreSignedUrl);
router.post("/create-document", authenticate, createDocument);
router.get("/all-documents", authenticate, getAllDocuments);
router.get("/get-signed-url/:documentId", authenticate, getPresignedUrl);
router.post('/upsert', authenticate, upsertData);
router.post('/chat', authenticate, chatWithDocument);
router.get("/chat-history/:documentId", authenticate, getChatHistory);

module.exports = router;
