const router = require('express').Router();
const chatbotController = require('../controller/chatbot');


router.post('/', chatbotController.chatbotResponse);    

module.exports = router;