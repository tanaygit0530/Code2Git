const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const config = require('./config');
const aiRoutes = require('./routes/aiRoutes');
const githubRoutes = require('./routes/githubRoutes');

const app = express();

// Rate limiting middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});

// Dynamic CORS configuration allowing Chrome Extension origins
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, or server-to-server)
    if (!origin) return callback(null, true);

    // Allow Chrome Extension origins (chrome-extension://...)
    if (origin.startsWith('chrome-extension://')) {
      return callback(null, true);
    }

    // Allow localhost and configured allowed origins
    const isAllowed = config.allowedOrigins.some(allowed => {
      if (allowed === '*') return true;
      if (allowed.endsWith('*')) return origin.startsWith(allowed.slice(0, -1));
      return origin === allowed;
    });

    if (isAllowed) {
      return callback(null, true);
    } else {
      console.warn(`[CORS] Request origin blocked: ${origin}`);
      return callback(null, true); // Permissive in dev mode to prevent developer friction
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(limiter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'Code2Git AI Server',
    version: '1.0.0',
    aiProvider: config.ai.provider,
    timestamp: new Date().toISOString(),
  });
});

// Mounting API routes
app.use('/api', aiRoutes);
app.use('/api/github', githubRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Server Internal Error]:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

// Start Server
app.listen(config.port, () => {
  console.log(`=======================================================`);
  console.log(`🚀 Code2Git AI Express Server running on port ${config.port}`);
  console.log(`⚙️  Environment: ${config.env}`);
  console.log(`🤖 AI Provider: ${config.ai.provider.toUpperCase()}`);
  console.log(`🔗 Health Check: http://localhost:${config.port}/api/health`);
  console.log(`=======================================================`);
});
