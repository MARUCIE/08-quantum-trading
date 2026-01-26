# DATA_VENDOR_CONFIG - quantum_x

## 数据供应商选择

### MVP 数据源配置

| 数据类型 | 供应商 | 端点 | 认证 | 限流 |
|----------|--------|------|------|------|
| 现货行情 | Binance | wss://stream.binance.com:9443 | 无需 | 5 req/s |
| 永续行情 | Binance | wss://fstream.binance.com | 无需 | 5 req/s |
| 历史 K 线 | Binance | GET /api/v3/klines | API Key | 1200 req/min |
| 账户信息 | Binance | GET /api/v3/account | API Key + Secret | 10 req/s |
| 下单接口 | Binance | POST /api/v3/order | API Key + Secret | 10 ord/s |

---

## Binance API 配置

### 环境变量
```bash
# .env.local (不提交到 Git)
BINANCE_API_KEY=your_api_key_here
BINANCE_API_SECRET=your_api_secret_here
BINANCE_TESTNET=true  # MVP 使用测试网

# Testnet endpoints
BINANCE_SPOT_TESTNET=https://testnet.binance.vision
BINANCE_FUTURES_TESTNET=https://testnet.binancefuture.com
```

### WebSocket 订阅格式
```json
{
  "method": "SUBSCRIBE",
  "params": [
    "btcusdt@kline_1m",
    "btcusdt@depth20@100ms",
    "btcusdt@trade"
  ],
  "id": 1
}
```

### K 线数据格式（标准化）
```typescript
interface Kline {
  symbol: string;           // "BTCUSDT"
  interval: string;         // "1m" | "5m" | "15m" | "1h" | "4h" | "1d"
  openTime: number;         // Unix timestamp ms
  open: string;             // "42000.00"
  high: string;             // "42100.00"
  low: string;              // "41900.00"
  close: string;            // "42050.00"
  volume: string;           // "1234.56"
  closeTime: number;        // Unix timestamp ms
  quoteVolume: string;      // "51234567.89"
  trades: number;           // 12345
  takerBuyBaseVolume: string;
  takerBuyQuoteVolume: string;
}
```

---

## 数据质量门禁

### 实时数据门禁
| 指标 | 阈值 | 动作 |
|------|------|------|
| 延迟 | > 1000ms | WARN |
| 延迟 | > 5000ms | ALERT + 降级 |
| 缺失 | 连续 3 条 | ALERT |
| 异常值 | 价格变化 > 10% | HOLD + 人工确认 |

### 历史数据门禁
| 指标 | 阈值 | 动作 |
|------|------|------|
| 缺失率 | > 1% | FAIL |
| 重复率 | > 0.1% | WARN |
| 时间乱序 | 任何 | FAIL |

---

## 数据接入契约

### 标准化输出格式
```typescript
// 统一 OHLCV 契约
interface OHLCVBar {
  timestamp: number;      // Unix ms
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  symbol: string;
  exchange: string;
  interval: string;
}

// 统一 Ticker 契约
interface Ticker {
  timestamp: number;
  symbol: string;
  exchange: string;
  bid: number;
  ask: number;
  bidSize: number;
  askSize: number;
  last: number;
  lastSize: number;
}

// 统一 Trade 契约
interface Trade {
  timestamp: number;
  symbol: string;
  exchange: string;
  price: number;
  quantity: number;
  side: 'buy' | 'sell';
  tradeId: string;
}
```

---

## 备选数据源（后续扩展）

| 供应商 | 用途 | 成本 | 优先级 |
|--------|------|------|--------|
| OKX | 备用交易所 | 免费 | P1 |
| Bybit | 备用交易所 | 免费 | P2 |
| CoinGecko | 价格参考 | 免费 | P2 |
| Glassnode | 链上数据 | $29/月 | P3 |
| Kaiko | 高频数据 | $500/月 | P4 |

---

## 数据存储规范

### 本地存储
```
data/
├── raw/                    # 原始数据
│   ├── binance/
│   │   ├── spot/
│   │   │   └── btcusdt/
│   │   │       └── kline_1m_20260126.parquet
│   │   └── futures/
│   └── metadata.json
├── processed/              # 处理后数据
│   ├── features/
│   └── signals/
└── cache/                  # 临时缓存
    └── websocket/
```

### 数据保留策略
| 数据类型 | 保留期 | 压缩 |
|----------|--------|------|
| Tick 数据 | 30 天 | Parquet + LZ4 |
| 分钟 K 线 | 1 年 | Parquet + ZSTD |
| 日线 | 永久 | Parquet + ZSTD |
| 特征 | 90 天 | Parquet |

---

## 安全要求

### API 密钥管理
- API Key 仅存储在 `.env.local`（gitignored）
- 生产环境使用 Secrets Manager
- API 权限仅开启「读取」+「现货交易」（禁止「提币」）
- IP 白名单限制

### 审计要求
- 所有 API 请求记录到审计日志
- 敏感操作（下单/撤单）需二次确认
- 异常请求触发告警

---

## 地理限制说明

Binance API 在部分地区受限（如中国大陆）。如遇 `Service unavailable from a restricted location` 错误，请：
1. 使用 VPN 连接到支持地区
2. 或切换到 OKX 等备选数据源

## Changelog
- 2026-01-26: 初始化数据供应商配置，Binance 作为 MVP 主数据源
- 2026-01-26: 添加地理限制说明，创建后端数据接入代码
