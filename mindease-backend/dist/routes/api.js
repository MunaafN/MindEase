"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const huggingfaceService_1 = require("../utils/huggingfaceService");
const chatbot_1 = require("../rag/chatbot");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Get a positive quote
router.get('/quotes/positive', async (req, res) => {
    try {
        // Force generation of a new quote each time
        const quote = await (0, huggingfaceService_1.generatePositiveQuote)();
        // Add cache control headers to prevent browser caching
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.json(quote);
    }
    catch (error) {
        console.error('Error getting positive quote:', error);
        res.status(500).json({ error: 'Failed to generate quote' });
    }
});
// Generate AI review of mental health
router.post('/review/generate', auth_1.protect, async (req, res) => {
    try {
        const userData = req.body;
        const review = await (0, huggingfaceService_1.generateMentalHealthReview)(userData);
        res.json(review);
    }
    catch (error) {
        console.error('Error generating review:', error);
        res.status(500).json({ error: 'Failed to generate review' });
    }
});
// Process chatbot query
router.post('/chatbot/query', auth_1.protect, async (req, res) => {
    try {
        const { query } = req.body;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        if (!query) {
            return res.status(400).json({ error: 'Query is required' });
        }
        // Try RAG-enhanced chatbot first
        try {
            const response = await (0, chatbot_1.processChatbotQueryWithRAG)(query, userId);
            return res.json(response);
        }
        catch (ragError) {
            console.error('RAG chatbot error, falling back to basic chatbot:', ragError);
            // Fallback to basic chatbot if RAG fails
            const response = await (0, huggingfaceService_1.processChatbotQuery)(query);
            return res.json(response);
        }
    }
    catch (error) {
        console.error('Error processing chatbot query:', error);
        res.status(500).json({ error: 'Failed to process query' });
    }
});
// Generate mental health assessment
router.post('/assessment/generate', auth_1.protect, async (req, res) => {
    try {
        const { answers } = req.body;
        if (!answers || typeof answers !== 'object') {
            return res.status(400).json({ error: 'Valid answers object is required' });
        }
        const assessment = await (0, huggingfaceService_1.generateMentalHealthAssessment)(answers);
        res.json(assessment);
    }
    catch (error) {
        console.error('Error generating assessment:', error);
        res.status(500).json({ error: 'Failed to generate assessment' });
    }
});
// Get user's mental health history
router.get('/assessment/history', auth_1.protect, (req, res) => {
    // In a real app, fetch from database
    // For demo, return mock data
    res.json({
        assessments: [
            {
                id: '1',
                date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                score: '3.2',
                scoreLevel: 'moderate'
            },
            {
                id: '2',
                date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
                score: '3.5',
                scoreLevel: 'moderate'
            },
            {
                id: '3',
                date: new Date().toISOString(),
                score: '3.8',
                scoreLevel: 'high'
            }
        ]
    });
});
exports.default = router;
