/**
 * Data Storage
 *
 * Local file-based storage for market data.
 * Uses Parquet-compatible JSON format for MVP.
 */

import { existsSync, mkdirSync, writeFileSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import type { OHLCVBar, KlineInterval } from '../types/market';

const DATA_DIR = process.env.DATA_DIR || './data';

/** Storage path structure */
interface StoragePath {
  exchange: string;
  market: 'spot' | 'futures';
  symbol: string;
  interval: KlineInterval;
  date: string; // YYYYMMDD
}

export class DataStorage {
  private baseDir: string;

  constructor(baseDir: string = DATA_DIR) {
    this.baseDir = baseDir;
    this.ensureDir(baseDir);
    this.ensureDir(join(baseDir, 'raw'));
    this.ensureDir(join(baseDir, 'processed'));
    this.ensureDir(join(baseDir, 'cache'));
  }

  /**
   * Save klines to storage
   */
  saveKlines(klines: OHLCVBar[], path: StoragePath): string {
    const dir = this.getKlineDir(path);
    this.ensureDir(dir);

    const filename = `kline_${path.interval}_${path.date}.json`;
    const filepath = join(dir, filename);

    writeFileSync(filepath, JSON.stringify(klines, null, 2));
    return filepath;
  }

  /**
   * Load klines from storage
   */
  loadKlines(path: StoragePath): OHLCVBar[] | null {
    const dir = this.getKlineDir(path);
    const filename = `kline_${path.interval}_${path.date}.json`;
    const filepath = join(dir, filename);

    if (!existsSync(filepath)) {
      return null;
    }

    const content = readFileSync(filepath, 'utf-8');
    return JSON.parse(content) as OHLCVBar[];
  }

  /**
   * Load klines for a date range
   */
  loadKlinesRange(
    path: Omit<StoragePath, 'date'>,
    startDate: string,
    endDate: string
  ): OHLCVBar[] {
    const dir = this.getKlineDir({ ...path, date: '' });
    if (!existsSync(dir)) {
      return [];
    }

    const files = readdirSync(dir)
      .filter((f) => f.startsWith(`kline_${path.interval}_`))
      .filter((f) => {
        const dateMatch = f.match(/kline_\w+_(\d{8})\.json/);
        if (!dateMatch) return false;
        const fileDate = dateMatch[1];
        return fileDate >= startDate && fileDate <= endDate;
      })
      .sort();

    const allKlines: OHLCVBar[] = [];
    for (const file of files) {
      const content = readFileSync(join(dir, file), 'utf-8');
      const klines = JSON.parse(content) as OHLCVBar[];
      allKlines.push(...klines);
    }

    return allKlines.sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * List available dates for a symbol/interval
   */
  listAvailableDates(path: Omit<StoragePath, 'date'>): string[] {
    const dir = this.getKlineDir({ ...path, date: '' });
    if (!existsSync(dir)) {
      return [];
    }

    return readdirSync(dir)
      .filter((f) => f.startsWith(`kline_${path.interval}_`))
      .map((f) => {
        const match = f.match(/kline_\w+_(\d{8})\.json/);
        return match ? match[1] : null;
      })
      .filter((d): d is string => d !== null)
      .sort();
  }

  /**
   * Get storage statistics
   */
  getStats(): StorageStats {
    const stats: StorageStats = {
      totalFiles: 0,
      totalSize: 0,
      exchanges: [],
      symbols: [],
      dateRange: { start: '', end: '' },
    };

    const rawDir = join(this.baseDir, 'raw');
    if (!existsSync(rawDir)) {
      return stats;
    }

    const exchanges = readdirSync(rawDir).filter((f) =>
      existsSync(join(rawDir, f)) && readdirSync(join(rawDir, f)).length > 0
    );
    stats.exchanges = exchanges;

    // Count files and collect symbols
    const symbolSet = new Set<string>();
    const dates: string[] = [];

    for (const exchange of exchanges) {
      for (const market of ['spot', 'futures']) {
        const marketDir = join(rawDir, exchange, market);
        if (!existsSync(marketDir)) continue;

        const symbols = readdirSync(marketDir);
        symbols.forEach((s) => symbolSet.add(s));

        for (const symbol of symbols) {
          const symbolDir = join(marketDir, symbol);
          const files = readdirSync(symbolDir);
          stats.totalFiles += files.length;

          files.forEach((f) => {
            const match = f.match(/(\d{8})\.json/);
            if (match) dates.push(match[1]);
          });
        }
      }
    }

    stats.symbols = Array.from(symbolSet);
    if (dates.length > 0) {
      dates.sort();
      stats.dateRange = { start: dates[0], end: dates[dates.length - 1] };
    }

    return stats;
  }

  private getKlineDir(path: StoragePath | Omit<StoragePath, 'date'>): string {
    return join(
      this.baseDir,
      'raw',
      path.exchange,
      path.market,
      path.symbol.toLowerCase()
    );
  }

  private ensureDir(dir: string): void {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }
}

interface StorageStats {
  totalFiles: number;
  totalSize: number;
  exchanges: string[];
  symbols: string[];
  dateRange: { start: string; end: string };
}
