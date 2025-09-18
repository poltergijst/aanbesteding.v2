// Security utilities voor de aanbestedingsmanagement applicatie

// Input sanitization
export function sanitizeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
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
  const suspiciousPatterns = [/^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i, /[<>:"|?*]/];
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
  
  // Voorkom dat interne details naar de gebruiker gaan
  if (error.message.includes('API') || error.message.includes('database')) {
    return 'Er is een technische fout opgetreden. Probeer het later opnieuw.';
  }
  
  return error.message;
}