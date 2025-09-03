import { useEffect } from 'react';
import { Platform } from 'react-native';

export class PerformanceMonitor {
  private static metrics: Map<string, number> = new Map();
  private static memoryUsage: number[] = [];

  // Start performance measurement
  static startMeasure(name: string): void {
    this.metrics.set(name, Date.now());
  }

  // End performance measurement
  static endMeasure(name: string): number {
    const startTime = this.metrics.get(name);
    if (!startTime) {
      console.warn(`No start time found for measurement: ${name}`);
      return 0;
    }

    const duration = Date.now() - startTime;
    this.metrics.delete(name);
    
    console.log(`⏱️ Performance: ${name} took ${duration}ms`);
    return duration;
  }

  // Monitor memory usage (web only)
  static monitorMemory(): void {
    if (Platform.OS === 'web' && 'memory' in performance) {
      const memory = (performance as any).memory;
      const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);
      
      this.memoryUsage.push(usedMB);
      
      // Keep only last 100 measurements
      if (this.memoryUsage.length > 100) {
        this.memoryUsage.shift();
      }
      
      console.log(`💾 Memory: ${usedMB}MB used`);
      
      // Warn if memory usage is high
      if (usedMB > 100) {
        console.warn(`⚠️ High memory usage: ${usedMB}MB`);
      }
    }
  }

  // Get performance report
  static getReport(): {
    averageMemory: number;
    maxMemory: number;
    currentMemory: number;
  } {
    const avgMemory = this.memoryUsage.length > 0 
      ? this.memoryUsage.reduce((a, b) => a + b, 0) / this.memoryUsage.length 
      : 0;
    
    const maxMemory = this.memoryUsage.length > 0 
      ? Math.max(...this.memoryUsage) 
      : 0;
    
    const currentMemory = this.memoryUsage.length > 0 
      ? this.memoryUsage[this.memoryUsage.length - 1] 
      : 0;

    return {
      averageMemory: Math.round(avgMemory),
      maxMemory,
      currentMemory,
    };
  }

  // Clear all metrics
  static clear(): void {
    this.metrics.clear();
    this.memoryUsage = [];
  }
}

// Hook for easy performance monitoring
export const usePerformanceMonitor = (componentName: string) => {
  useEffect(() => {
    PerformanceMonitor.startMeasure(`${componentName}_mount`);
    
    return () => {
      PerformanceMonitor.endMeasure(`${componentName}_mount`);
    };
  }, [componentName]);

  useEffect(() => {
    const interval = setInterval(() => {
      PerformanceMonitor.monitorMemory();
    }, 5000); // Monitor every 5 seconds

    return () => clearInterval(interval);
  }, []);
};