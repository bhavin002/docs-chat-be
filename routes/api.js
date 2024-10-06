const express = require('express');
const { upsertData, chatWithDocument } = require('../controller/api');
const router = express.Router();


router.post('/upload', upsertData);
router.post('/chat', chatWithDocument);

module.exports = router;
