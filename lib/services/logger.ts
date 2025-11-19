/**
 * API Logger for tracking requests and generating analytics
 */

interface LogEntry {
  timestamp: Date;
  method: string;
  url: string;
  duration: number;
  status: 'success' | 'error';
}

interface LogStats {
  total: number;
  success: number;
  error: number;
  successRate: number;
  avgDuration: number;
}

export class ApiLogger {
  private static logs: LogEntry[] = [];
  private static readonly MAX_LOGS = 100;

  /**
   * Log a request
   */
  static log(entry: Omit<LogEntry, 'timestamp'>): void {
    this.logs.push({
      timestamp: new Date(),
      ...entry,
    });

    // Keep only last MAX_LOGS entries
    if (this.logs.length > this.MAX_LOGS) {
      this.logs.shift();
    }
  }

  /**
   * Get all logged entries
   */
  static getLogs(): ReadonlyArray<LogEntry> {
    return this.logs;
  }

  /**
   * Get statistics about API requests
   */
  static getStats(): LogStats {
    const total = this.logs.length;

    if (total === 0) {
      return {
        total: 0,
        success: 0,
        error: 0,
        successRate: 0,
        avgDuration: 0,
      };
    }

    const success = this.logs.filter((l) => l.status === 'success').length;
    const error = this.logs.filter((l) => l.status === 'error').length;
    const totalDuration = this.logs.reduce((sum, l) => sum + l.duration, 0);
    const avgDuration = totalDuration / total;
    const successRate = (success / total) * 100;

    return {
      total,
      success,
      error,
      successRate,
      avgDuration,
    };
  }

  /**
   * Clear all logs
   */
  static clear(): void {
    this.logs = [];
  }

  /**
   * Get recent errors
   */
  static getRecentErrors(limit = 10): ReadonlyArray<LogEntry> {
    return this.logs
      .filter((l) => l.status === 'error')
      .slice(-limit);
  }
}
