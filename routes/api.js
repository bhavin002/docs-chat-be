const express = require('express');
const { authenticate } = require('../middleware/authMiddleware');
const { upsertData, chatWithDocument } = require('../controller/chatController.js');
const { register, login } = require('../controller/authController.js');
const { uploadPreSignedUrl, getPresignedUrl } = require('../controller/fileController.js');
const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/upload-signed-urls', authenticate, uploadPreSignedUrl);
router.post("/get-signed-url", authenticate, getPresignedUrl);
router.post('/upload', authenticate, upsertData);
router.post('/chat', authenticate, chatWithDocument);

module.exports = router;
