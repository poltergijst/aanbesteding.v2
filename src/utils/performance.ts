// Performance optimization utilities

// Debounce function for search inputs
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Throttle function for scroll events
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Memoization for expensive calculations
export function memoize<T extends (...args: any[]) => any>(
  func: T,
  getKey?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();
  
  return ((...args: Parameters<T>) => {
    const key = getKey ? getKey(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = func(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

// Lazy loading utility
export function createLazyComponent<T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>
) {
  return React.lazy(importFunc);
}

// Virtual scrolling helper
export function calculateVisibleItems(
  containerHeight: number,
  itemHeight: number,
  scrollTop: number,
  totalItems: number,
  overscan = 5
) {
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(totalItems - 1, startIndex + visibleCount + overscan * 2);
  
  return { startIndex, endIndex, visibleCount };
}

// Batch processing for large datasets
export async function processBatch<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  batchSize = 10,
  delay = 100
): Promise<R[]> {
  const results: R[] = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(processor));
    results.push(...batchResults);
    
    // Add delay between batches to prevent overwhelming the system
    if (i + batchSize < items.length) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return results;
}

// Image optimization
export function optimizeImageUrl(
  url: string,
  width?: number,
  height?: number,
  quality = 80
): string {
  if (!url) return '';
  
  // For external services like Pexels, add optimization parameters
  if (url.includes('pexels.com')) {
    const params = new URLSearchParams();
    if (width) params.set('w', width.toString());
    if (height) params.set('h', height.toString());
    params.set('auto', 'compress');
    params.set('cs', 'tinysrgb');
    
    return `${url}?${params.toString()}`;
  }
  
  return url;
}

// Memory usage monitoring
export function getMemoryUsage(): PerformanceMemory | null {
  if ('memory' in performance) {
    return (performance as any).memory;
  }
  return null;
}

// Performance timing
export class PerformanceTimer {
  private startTime: number;
  private marks: Map<string, number> = new Map();
  
  constructor(private name: string) {
    this.startTime = performance.now();
  }
  
  mark(label: string): void {
    this.marks.set(label, performance.now() - this.startTime);
  }
  
  measure(label: string): number {
    const time = performance.now() - this.startTime;
    this.marks.set(label, time);
    return time;
  }
  
  getResults(): Record<string, number> {
    return Object.fromEntries(this.marks);
  }
  
  log(): void {
    console.group(`Performance: ${this.name}`);
    this.marks.forEach((time, label) => {
      console.log(`${label}: ${time.toFixed(2)}ms`);
    });
    console.groupEnd();
  }
}