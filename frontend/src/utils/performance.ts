// Performance monitoring and optimization utilities

import { lazy } from "react";

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  interactionTime: number;
  memoryUsage?: number;
  networkRequests: number;
  errorCount: number;
}

interface ComponentMetrics {
  componentName: string;
  renderCount: number;
  averageRenderTime: number;
  lastRenderTime: number;
  propsChanges: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    loadTime: 0,
    renderTime: 0,
    interactionTime: 0,
    networkRequests: 0,
    errorCount: 0,
  };

  private componentMetrics: Map<string, ComponentMetrics> = new Map();
  private observers: PerformanceObserver[] = [];

  constructor() {
    this.initializeObservers();
    this.trackPageLoad();
  }

  private initializeObservers() {
    // Track navigation timing
    if ("PerformanceObserver" in window) {
      try {
        const navObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (entry.entryType === "navigation") {
              const navEntry = entry as PerformanceNavigationTiming;
              this.metrics.loadTime =
                navEntry.loadEventEnd - navEntry.navigationStart;
            }
          });
        });
        navObserver.observe({ entryTypes: ["navigation"] });
        this.observers.push(navObserver);
      } catch (e) {
        console.warn("Navigation timing observer not supported");
      }

      // Track resource timing
      try {
        const resourceObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          this.metrics.networkRequests += entries.length;
        });
        resourceObserver.observe({ entryTypes: ["resource"] });
        this.observers.push(resourceObserver);
      } catch (e) {
        console.warn("Resource timing observer not supported");
      }

      // Track largest contentful paint
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          console.log("LCP:", lastEntry.startTime);
        });
        lcpObserver.observe({ entryTypes: ["largest-contentful-paint"] });
        this.observers.push(lcpObserver);
      } catch (e) {
        console.warn("LCP observer not supported");
      }

      // Track first input delay
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            this.metrics.interactionTime =
              entry.processingStart - entry.startTime;
          });
        });
        fidObserver.observe({ entryTypes: ["first-input"] });
        this.observers.push(fidObserver);
      } catch (e) {
        console.warn("FID observer not supported");
      }
    }
  }

  private trackPageLoad() {
    if (document.readyState === "complete") {
      this.recordLoadTime();
    } else {
      window.addEventListener("load", () => this.recordLoadTime());
    }
  }

  private recordLoadTime() {
    if (performance.timing) {
      const timing = performance.timing;
      this.metrics.loadTime = timing.loadEventEnd - timing.navigationStart;
    }
  }

  // Track component render performance
  trackComponentRender(componentName: string, renderTime: number) {
    const existing = this.componentMetrics.get(componentName);

    if (existing) {
      existing.renderCount++;
      existing.lastRenderTime = renderTime;
      existing.averageRenderTime =
        (existing.averageRenderTime * (existing.renderCount - 1) + renderTime) /
        existing.renderCount;
    } else {
      this.componentMetrics.set(componentName, {
        componentName,
        renderCount: 1,
        averageRenderTime: renderTime,
        lastRenderTime: renderTime,
        propsChanges: 0,
      });
    }
  }

  // Track props changes
  trackPropsChange(componentName: string) {
    const existing = this.componentMetrics.get(componentName);
    if (existing) {
      existing.propsChanges++;
    }
  }

  // Track errors
  trackError(error: Error) {
    this.metrics.errorCount++;
    console.error("Performance Monitor - Error tracked:", error);
  }

  // Get current metrics
  getMetrics(): PerformanceMetrics {
    // Update memory usage if available
    if ("memory" in performance) {
      this.metrics.memoryUsage = (performance as any).memory.usedJSHeapSize;
    }

    return { ...this.metrics };
  }

  // Get component metrics
  getComponentMetrics(): ComponentMetrics[] {
    return Array.from(this.componentMetrics.values());
  }

  // Get slow components
  getSlowComponents(threshold: number = 16): ComponentMetrics[] {
    return this.getComponentMetrics().filter(
      (metric) => metric.averageRenderTime > threshold
    );
  }

  // Generate performance report
  generateReport(): string {
    const metrics = this.getMetrics();
    const componentMetrics = this.getComponentMetrics();
    const slowComponents = this.getSlowComponents();

    return `
Performance Report
==================

Page Metrics:
- Load Time: ${metrics.loadTime}ms
- Render Time: ${metrics.renderTime}ms
- Interaction Time: ${metrics.interactionTime}ms
- Memory Usage: ${
      metrics.memoryUsage
        ? `${(metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB`
        : "N/A"
    }
- Network Requests: ${metrics.networkRequests}
- Error Count: ${metrics.errorCount}

Component Metrics:
${componentMetrics
  .map(
    (c) =>
      `- ${c.componentName}: ${
        c.renderCount
      } renders, avg ${c.averageRenderTime.toFixed(2)}ms`
  )
  .join("\n")}

Slow Components (>16ms):
${
  slowComponents
    .map((c) => `- ${c.componentName}: avg ${c.averageRenderTime.toFixed(2)}ms`)
    .join("\n") || "None"
}
    `.trim();
  }

  // Cleanup observers
  cleanup() {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers = [];
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor();

// React hook for component performance tracking
export const usePerformanceTracking = (componentName: string) => {
  const startTime = React.useRef<number>(0);

  React.useEffect(() => {
    startTime.current = performance.now();

    return () => {
      const renderTime = performance.now() - startTime.current;
      performanceMonitor.trackComponentRender(componentName, renderTime);
    };
  });

  const trackPropsChange = React.useCallback(() => {
    performanceMonitor.trackPropsChange(componentName);
  }, [componentName]);

  return { trackPropsChange };
};

// Performance tracking utility
export const trackComponentPerformance = (
  componentName: string,
  renderTime: number
) => {
  console.log(
    `🎯 Component ${componentName} rendered in ${renderTime.toFixed(2)}ms`
  );

  if (renderTime > 100) {
    console.warn(
      `⚠️ Slow render detected: ${componentName} took ${renderTime.toFixed(
        2
      )}ms`
    );
  }
};

// Utility functions
export const measureAsync = async <T>(
  operation: () => Promise<T>,
  label: string
): Promise<T> => {
  const start = performance.now();
  try {
    const result = await operation();
    const duration = performance.now() - start;
    console.log(`${label} took ${duration.toFixed(2)}ms`);
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    console.error(`${label} failed after ${duration.toFixed(2)}ms:`, error);
    throw error;
  }
};

export const measureSync = <T>(operation: () => T, label: string): T => {
  const start = performance.now();
  try {
    const result = operation();
    const duration = performance.now() - start;
    console.log(`${label} took ${duration.toFixed(2)}ms`);
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    console.error(`${label} failed after ${duration.toFixed(2)}ms:`, error);
    throw error;
  }
};

// Debounce utility for performance optimization
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Throttle utility for performance optimization
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Lazy loading utility
export const createLazyImport = <T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>
) => {
  return lazy(importFunc);
};

// Memory usage tracking
export const trackMemoryUsage = () => {
  if ("memory" in performance) {
    const memory = (performance as any).memory;
    return {
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize,
      limit: memory.jsHeapSizeLimit,
      percentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
    };
  }
  return null;
};

// Bundle size analyzer
export const analyzeBundleSize = () => {
  const scripts = Array.from(document.querySelectorAll("script[src]"));
  const styles = Array.from(
    document.querySelectorAll('link[rel="stylesheet"]')
  );

  return {
    scriptCount: scripts.length,
    styleCount: styles.length,
    scripts: scripts.map((script) => ({
      src: (script as HTMLScriptElement).src,
      async: (script as HTMLScriptElement).async,
      defer: (script as HTMLScriptElement).defer,
    })),
    styles: styles.map((style) => ({
      href: (style as HTMLLinkElement).href,
    })),
  };
};

export default performanceMonitor;
