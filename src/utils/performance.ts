// Performance monitoring utilities
export class PerformanceMonitor {
  private static measurements = new Map<string, number>();

  static startMeasurement(key: string): void {
    this.measurements.set(key, performance.now());
  }

  static endMeasurement(key: string): number {
    const startTime = this.measurements.get(key);
    if (!startTime) return 0;
    
    const duration = performance.now() - startTime;
    this.measurements.delete(key);
    return Math.round(duration);
  }

  static measureAsync<T>(key: string, fn: () => Promise<T>): Promise<T> {
    this.startMeasurement(key);
    return fn().finally(() => {
      const duration = this.endMeasurement(key);
      console.log(`${key} took ${duration}ms`);
    });
  }
}

// URL validation utility
export function isValidUrl(url: string): boolean {
  try {
    const testUrl = url.startsWith('http') ? url : `https://${url}`;
    new URL(testUrl);
    return true;
  } catch {
    return false;
  }
}

// Memoization utility for expensive operations
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  getKey?: (...args: Parameters<T>) => string
): T {
  const cache = new Map();
  
  return ((...args: Parameters<T>) => {
    const key = getKey ? getKey(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = fn(...args);
    cache.set(key, result);
    
    // Clean cache if it gets too large
    if (cache.size > 100) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
    
    return result;
  }) as T;
}