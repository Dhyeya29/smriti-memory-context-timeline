import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { requireAuth } from './server/auth';
import {
  generateMemoryConversationReply,
  generateStructuredMemorySummary,
  recoverUserContext,
  compareThenVsNow
} from './server/gemini';
import { createServer as createViteServer } from 'vite';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'Smriti AI Memory & Context Timeline',
      timestamp: new Date().toISOString()
    });
  });

  // Protected AI multi-turn memory conversation endpoint
  app.post('/api/memory/chat', requireAuth, async (req, res) => {
    try {
      const { history = [], message, title } = req.body;
      if (!message || typeof message !== 'string') {
        res.status(400).json({ error: 'Missing or invalid message text' });
        return;
      }

      const reply = await generateMemoryConversationReply(history, message, title);
      res.json({
        reply,
        authenticatedUid: req.user?.uid
      });
    } catch (err: any) {
      console.error('Error in /api/memory/chat:', err);
      res.status(500).json({ error: err.message || 'Failed to generate conversation response' });
    }
  });

  // Protected AI structured summary synthesis endpoint
  app.post('/api/memory/synthesize', requireAuth, async (req, res) => {
    try {
      const { history = [], notes } = req.body;
      if (!Array.isArray(history) || history.length === 0) {
        res.status(400).json({ error: 'Conversation history is required to synthesize memory' });
        return;
      }

      const summary = await generateStructuredMemorySummary(history, notes);
      res.json({
        summary,
        authenticatedUid: req.user?.uid
      });
    } catch (err: any) {
      console.error('Error in /api/memory/synthesize:', err);
      res.status(500).json({ error: err.message || 'Failed to synthesize memory summary' });
    }
  });

  // Protected Context Recovery query endpoint
  app.post('/api/context-recovery', requireAuth, async (req, res) => {
    try {
      const { query, memories = [] } = req.body;
      if (!query || typeof query !== 'string') {
        res.status(400).json({ error: 'A query question is required for context recovery' });
        return;
      }

      if (!Array.isArray(memories) || memories.length === 0) {
        res.status(400).json({
          error: 'No memories available for context recovery. Please record some memories first.'
        });
        return;
      }

      const recovery = await recoverUserContext(query, memories);
      res.json({
        recovery,
        authenticatedUid: req.user?.uid
      });
    } catch (err: any) {
      console.error('Error in /api/context-recovery:', err);
      res.status(500).json({ error: err.message || 'Failed to recover personal context' });
    }
  });

  // Protected Then vs Now comparative analysis endpoint
  app.post('/api/then-vs-now', requireAuth, async (req, res) => {
    try {
      const { thenMemory, nowMemory } = req.body;
      if (!thenMemory || !nowMemory) {
        res.status(400).json({ error: 'Both "Then" and "Now" memories are required for comparison' });
        return;
      }

      const comparison = await compareThenVsNow(thenMemory, nowMemory);
      res.json({
        comparison,
        authenticatedUid: req.user?.uid
      });
    } catch (err: any) {
      console.error('Error in /api/then-vs-now:', err);
      res.status(500).json({ error: err.message || 'Failed to generate Then vs Now comparison' });
    }
  });

  // Vite development middleware vs production static files
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Smriti Server] running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
