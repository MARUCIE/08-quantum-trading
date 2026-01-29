# API_CONFIGURATION_GUIDE - quantum_x

## 目标
- 提供 MVP 阶段的 API 配置规范
- 保证模拟盘模式下的安全与合规

## 基本原则
- 默认只允许 paper trading
- API 权限最小化（只读/交易分离）
- 密钥与配置分离（不得写入代码仓库）
- 真实账户必须显式授权与风控提示

## 必填配置
- Venue ID
- API Key / Secret / Passphrase
- Base URL
- Rate Limit / Timeout
- ACCOUNT_CREDENTIALS_KEY (AES-256-GCM, base64)

## 建议环境变量模板
```env
# account security
ACCOUNT_CREDENTIALS_KEY=base64-32-byte-key

# venue
VENUE_ID=example_exchange
VENUE_MODE=paper
VENUE_API_KEY=your_key
VENUE_API_SECRET=your_secret
VENUE_API_PASSPHRASE=your_passphrase
VENUE_BASE_URL=https://api.example.com
VENUE_RATE_LIMIT=10
VENUE_TIMEOUT_MS=3000

# derivatives (real accounts)
BINANCE_FUTURES_BASE_URL=https://fapi.binance.com
OKX_BASE_URL=https://www.okx.com
BYBIT_BASE_URL=https://api.bybit.com
BYBIT_ACCOUNT_TYPE=UNIFIED
OKX_TRADE_MODE=cross
BINANCE_RECV_WINDOW=5000
OKX_RECV_WINDOW=5000
BYBIT_RECV_WINDOW=5000

# data
DATA_SOURCE_ID=public_source
DATA_BASE_URL=https://data.example.com
DATA_RATE_LIMIT=5
```

## 校验清单
- 仅启用模拟盘接口
- API 权限最小化
- 超过阈值触发告警
- 真实账户接入前校验 API Key 权限与交易开关

## 安全与审计
- 密钥轮换记录
- 访问日志可追溯
- 配置变更审计
- 真实账户连接与交易操作必须记录 accountId 与 provider
