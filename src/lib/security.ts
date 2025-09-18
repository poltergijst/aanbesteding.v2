// Security utilities voor de aanbestedingsmanagement applicatie

// Input sanitization
export function sanitizeHtml(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .replace(/`/g, '&#x60;')
    .replace(/=/g, '&#x3D;');
}

// SQL injection prevention
export function sanitizeSqlInput(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  // Remove dangerous SQL characters and keywords
  return input
    .replace(/[';--]/g, '')
    .replace(/\b(DROP|DELETE|INSERT|UPDATE|CREATE|ALTER|EXEC|EXECUTE|UNION|SELECT)\b/gi, '')
    .trim();
}

// Path traversal prevention
export function sanitizeFilePath(path: string): string {
  if (typeof path !== 'string') {
    return '';
  }
  return path
    .replace(/\.\./g, '')
    .replace(/[<>:"|?*]/g, '')
    .replace(/^[\/\\]+/, '')
    .trim();
}

// File validation
export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateFile(file: File): FileValidationResult {
  // Toegestane MIME types
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];

  // Toegestane extensies
  const allowedExtensions = ['.pdf', '.doc', '.docx', '.txt'];
  
  // Max file size (5MB) - Reduced for security
  const maxSize = 5 * 1024 * 1024;

  // Check for null bytes (security risk)
  if (file.name.includes('\0')) {
    return {
      isValid: false,
      error: 'Bestandsnaam bevat ongeldige karakters.'
    };
  }

  // MIME type check
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `Bestandstype niet toegestaan. Alleen PDF, Word en TXT bestanden zijn toegestaan.`
    };
  }

  // Extension check
  const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  if (!allowedExtensions.includes(extension)) {
    return {
      isValid: false,
      error: `Bestandsextensie ${extension} is niet toegestaan.`
    };
  }

  // Size check
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `Bestand is te groot. Maximum grootte is 5MB.`
    };
  }

  // Filename validation (prevent path traversal)
  if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
    return {
      isValid: false,
      error: 'Ongeldige bestandsnaam.'
    };
  }
  
  // Additional filename security checks
  if (file.name.length > 255) {
    return {
      isValid: false,
      error: 'Bestandsnaam te lang.'
    };
  }
  
  // Check for suspicious file names
  const suspiciousPatterns = [
    /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i, 
    /[<>:"|?*]/,
    /\.(exe|bat|cmd|scr|pif|com|vbs|js|jar|app|deb|rpm)$/i,
    /^\.+$/
  ];
  if (suspiciousPatterns.some(pattern => pattern.test(file.name))) {
    return {
      isValid: false,
      error: 'Ongeldige bestandsnaam gedetecteerd.'
    };
  }

  return { isValid: true };
}

// Rate limiting (client-side basic implementation)
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number = 5, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  isAllowed(key: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    
    // Remove old requests outside the window
    const validRequests = requests.filter(time => now - time < this.windowMs);
    
    if (validRequests.length >= this.maxRequests) {
      return false;
    }

    validRequests.push(now);
    this.requests.set(key, validRequests);
    return true;
  }
}

export const apiRateLimiter = new RateLimiter(5, 60000); // 5 requests per minute

// Secure API call wrapper
export async function secureApiCall(
  url: string, 
  options: RequestInit,
  timeout: number = 30000
): Promise<Response> {
  // Validate URL to prevent SSRF
  try {
    const urlObj = new URL(url);
    const allowedHosts = ['localhost', '127.0.0.1', 'api.openai.com'];
    if (!allowedHosts.some(host => urlObj.hostname === host || urlObj.hostname.endsWith(`.${host}`))) {
      throw new Error('Niet-toegestane host in URL');
    }
  } catch (error) {
    throw new Error('Ongeldige URL');
  }

  // Rate limiting check
  if (!apiRateLimiter.isAllowed('api-calls')) {
    throw new Error('Te veel API calls. Probeer het later opnieuw.');
  }

  // Timeout wrapper
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        ...options.headers,
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block'
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }

    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('API call timeout');
    }
    throw error;
  }
}

// User input validation
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateKvKNumber(kvk: string): boolean {
  // Nederlandse KvK nummer validatie (8 cijfers)
  const kvkRegex = /^\d{8}$/;
  return kvkRegex.test(kvk.replace(/\s/g, ''));
}

export function validatePhoneNumber(phone: string): boolean {
  // Nederlandse telefoonnummer validatie
  const phoneRegex = /^(\+31|0)[1-9]\d{8}$/;
  return phoneRegex.test(phone.replace(/[\s-]/g, ''));
}

// Audit logging interface
export interface AuditLog {
  timestamp: Date;
  userId?: string;
  action: string;
  resource: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
}

export function createAuditLog(
  action: string,
  resource: string,
  details?: any
): AuditLog {
  return {
    timestamp: new Date(),
    action,
    resource,
    details,
    // In een echte implementatie zou je deze waarden uit de request halen
    ipAddress: 'client-side-unknown',
    userAgent: navigator.userAgent
  };
}

// Content Security Policy helpers
export function generateCSPNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Error sanitization (prevent information leakage)
export function sanitizeError(error: Error): string {
  // In productie, log de volledige error maar toon alleen generieke berichten
  console.error('Application error:', error);
  
  // Prevent internal details from reaching the user
  const sensitivePatterns = [
    /API/i, /database/i, /sql/i, /password/i, /token/i, /key/i,
    /internal/i, /server/i, /connection/i, /authentication/i,
    /supabase/i, /openai/i, /weaviate/i
  ];
  
  if (sensitivePatterns.some(pattern => pattern.test(error.message))) {
    return 'Er is een technische fout opgetreden. Probeer het later opnieuw.';
  }
  
  // Sanitize the error message before returning
  return sanitizeHtml(error.message.substring(0, 200));
}

// Content Security Policy validation
export function validateCSP(nonce: string): boolean {
  return /^[a-zA-Z0-9+/]{22}==$/.test(nonce);
}

// Session token validation
export function validateSessionToken(token: string): boolean {
  if (!token || typeof token !== 'string') return false;
  // Basic JWT structure validation
  const parts = token.split('.');
  return parts.length === 3 && parts.every(part => part.length > 0);
}