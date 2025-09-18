// Development API server for handling server-side endpoints
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { POST as embeddingsHandler } from './embeddings';
import { POST as llmAnalysisHandler } from './llm-analysis';

const app = express();
const port = 3001;

// Configure multer for file uploads
const upload = multer({ 
  limits: { 
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 2 // Max 2 files
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  next();
});

// Rate limiting middleware (basic implementation)
const rateLimitMap = new Map();
const rateLimit = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
  
  // Sanitize IP address
  const sanitizedIP = clientIP.replace(/[^0-9a-fA-F:.]/g, '');
  
  const now = Date.now();
  const windowMs = 60000; // 1 minute
  const maxRequests = 5;

  if (!rateLimitMap.has(sanitizedIP)) {
    rateLimitMap.set(sanitizedIP, []);
  }

  const requests = rateLimitMap.get(sanitizedIP);
  const validRequests = requests.filter((time: number) => now - time < windowMs);
  
  if (validRequests.length >= maxRequests) {
    console.warn(`Rate limit exceeded for IP: ${sanitizedIP}`);
    return res.status(429).json({ error: 'Too many requests' });
  }

  validRequests.push(now);
  rateLimitMap.set(sanitizedIP, validRequests);
  next();
};

// Apply rate limiting to all API routes
app.use('/api', rateLimit);

// API Routes
app.post('/api/embeddings', async (req, res) => {
  try {
    const request = new Request('http://localhost:3001/api/embeddings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    
    const response = await embeddingsHandler(request);
    const data = await response.json();
    
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Embeddings endpoint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/llm-analysis', upload.fields([
  { name: 'bestek', maxCount: 1 },
  { name: 'inschrijving', maxCount: 1 }
]), async (req, res) => {
  try {
    // Convert Express files to FormData for our handler
    const formData = new FormData();
    
    if (req.files && typeof req.files === 'object' && 'bestek' in req.files && 'inschrijving' in req.files) {
      const bestekFile = (req.files as any).bestek[0];
      const inschrijvingFile = (req.files as any).inschrijving[0];
      
      // Create File objects from multer files
      const bestekBlob = new Blob([bestekFile.buffer], { type: bestekFile.mimetype });
      const inschrijvingBlob = new Blob([inschrijvingFile.buffer], { type: inschrijvingFile.mimetype });
      
      formData.append('bestek', bestekBlob, bestekFile.originalname);
      formData.append('inschrijving', inschrijvingBlob, inschrijvingFile.originalname);
    }
    
    const request = new Request('http://localhost:3001/api/llm-analysis', {
      method: 'POST',
      body: formData
    });
    
    const response = await llmAnalysisHandler(request);
    const data = await response.json();
    
    res.status(response.status).json(data);
  } catch (error) {
    console.error('LLM Analysis endpoint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(port, () => {
  console.log(`🔒 Secure API server running on http://localhost:${port}`);
  console.log('📋 Available endpoints:');
  console.log('  POST /api/embeddings - Generate text embeddings');
  console.log('  POST /api/llm-analysis - Analyze tender documents');
  console.log('  GET  /api/health - Health check');
});

export default app;