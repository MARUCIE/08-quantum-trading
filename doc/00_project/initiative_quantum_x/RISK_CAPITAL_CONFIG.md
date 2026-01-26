# RISK_CAPITAL_CONFIG - quantum_x

## 风险管理框架

### 风控层级
```
┌─────────────────────────────────────────────────────────────┐
│                     风控层级架构                             │
├─────────────────────────────────────────────────────────────┤
│  L1: 账户级风控                                              │
│  - 总资金上限 / 最大回撤 / 日亏损限额                         │
├─────────────────────────────────────────────────────────────┤
│  L2: 策略级风控                                              │
│  - 策略资金占比 / 策略回撤熔断 / 策略相关性                   │
├─────────────────────────────────────────────────────────────┤
│  L3: 交易级风控                                              │
│  - 单笔仓位 / 止损止盈 / 滑点保护                            │
├─────────────────────────────────────────────────────────────┤
│  L4: 系统级风控                                              │
│  - 熔断机制 / 异常检测 / 人工介入                            │
└─────────────────────────────────────────────────────────────┘
```

---

## L1: 账户级风控参数

### 资金限额
| 参数 | MVP 默认值 | 说明 |
|------|-----------|------|
| MAX_ACCOUNT_VALUE | $10,000 | 最大账户价值（模拟盘） |
| INITIAL_CAPITAL | $10,000 | 初始资金 |
| MAX_LEVERAGE | 3x | 最大杠杆（含合约） |
| MARGIN_CALL_THRESHOLD | 50% | 追加保证金阈值 |

### 回撤控制
| 参数 | MVP 默认值 | 触发动作 |
|------|-----------|----------|
| MAX_DRAWDOWN_PCT | 20% | 全部平仓 + 暂停交易 |
| DAILY_LOSS_LIMIT_PCT | 5% | 当日暂停交易 |
| WEEKLY_LOSS_LIMIT_PCT | 10% | 本周暂停 + 人工评审 |

### 风控代码
```typescript
interface AccountRiskConfig {
  maxAccountValue: number;
  initialCapital: number;
  maxLeverage: number;
  marginCallThreshold: number;
  maxDrawdownPct: number;
  dailyLossLimitPct: number;
  weeklyLossLimitPct: number;
}

const MVP_ACCOUNT_RISK: AccountRiskConfig = {
  maxAccountValue: 10000,
  initialCapital: 10000,
  maxLeverage: 3,
  marginCallThreshold: 0.5,
  maxDrawdownPct: 0.2,
  dailyLossLimitPct: 0.05,
  weeklyLossLimitPct: 0.1,
};
```

---

## L2: 策略级风控参数

### 资金分配
| 策略类型 | 资金占比 | 最大回撤 | 相关性限制 |
|----------|---------|---------|-----------|
| 趋势跟踪 | 30% | 15% | < 0.5 |
| 均值回归 | 25% | 10% | < 0.5 |
| 动量策略 | 25% | 12% | < 0.6 |
| 套利策略 | 20% | 5% | < 0.3 |

### 策略熔断
| 条件 | 动作 |
|------|------|
| 策略回撤 > 阈值 | 平仓 + 暂停 24h |
| 连续亏损 >= 5 笔 | 减仓 50% |
| 胜率 < 30%（近 20 笔） | 人工评审 |

### 风控代码
```typescript
interface StrategyRiskConfig {
  strategyId: string;
  maxCapitalPct: number;
  maxDrawdownPct: number;
  maxCorrelation: number;
  consecutiveLossLimit: number;
  minWinRate: number;
  cooldownHours: number;
}

const MVP_STRATEGY_RISK: Record<string, StrategyRiskConfig> = {
  trend_following: {
    strategyId: 'trend_following',
    maxCapitalPct: 0.3,
    maxDrawdownPct: 0.15,
    maxCorrelation: 0.5,
    consecutiveLossLimit: 5,
    minWinRate: 0.3,
    cooldownHours: 24,
  },
  mean_reversion: {
    strategyId: 'mean_reversion',
    maxCapitalPct: 0.25,
    maxDrawdownPct: 0.1,
    maxCorrelation: 0.5,
    consecutiveLossLimit: 5,
    minWinRate: 0.35,
    cooldownHours: 24,
  },
  momentum: {
    strategyId: 'momentum',
    maxCapitalPct: 0.25,
    maxDrawdownPct: 0.12,
    maxCorrelation: 0.6,
    consecutiveLossLimit: 5,
    minWinRate: 0.3,
    cooldownHours: 24,
  },
  arbitrage: {
    strategyId: 'arbitrage',
    maxCapitalPct: 0.2,
    maxDrawdownPct: 0.05,
    maxCorrelation: 0.3,
    consecutiveLossLimit: 3,
    minWinRate: 0.5,
    cooldownHours: 12,
  },
};
```

---

## L3: 交易级风控参数

### 仓位控制
| 参数 | MVP 默认值 | 说明 |
|------|-----------|------|
| MAX_POSITION_PCT | 10% | 单一标的最大仓位 |
| MAX_ORDER_PCT | 5% | 单笔订单最大金额 |
| MIN_ORDER_VALUE | $10 | 最小订单金额 |
| MAX_OPEN_POSITIONS | 10 | 最大持仓数量 |

### 止损止盈
| 参数 | MVP 默认值 | 说明 |
|------|-----------|------|
| DEFAULT_STOP_LOSS_PCT | 2% | 默认止损比例 |
| DEFAULT_TAKE_PROFIT_PCT | 6% | 默认止盈比例（1:3 风险回报） |
| TRAILING_STOP_PCT | 1.5% | 移动止损比例 |
| MAX_SLIPPAGE_PCT | 0.5% | 最大滑点容忍 |

### 执行保护
| 参数 | MVP 默认值 | 说明 |
|------|-----------|------|
| ORDER_TIMEOUT_SEC | 30 | 订单超时时间 |
| MAX_RETRIES | 3 | 最大重试次数 |
| RETRY_DELAY_MS | 1000 | 重试间隔 |
| PRICE_DEVIATION_LIMIT | 1% | 价格偏离限制 |

### 风控代码
```typescript
interface TradeRiskConfig {
  maxPositionPct: number;
  maxOrderPct: number;
  minOrderValue: number;
  maxOpenPositions: number;
  defaultStopLossPct: number;
  defaultTakeProfitPct: number;
  trailingStopPct: number;
  maxSlippagePct: number;
  orderTimeoutSec: number;
  maxRetries: number;
  retryDelayMs: number;
  priceDeviationLimit: number;
}

const MVP_TRADE_RISK: TradeRiskConfig = {
  maxPositionPct: 0.1,
  maxOrderPct: 0.05,
  minOrderValue: 10,
  maxOpenPositions: 10,
  defaultStopLossPct: 0.02,
  defaultTakeProfitPct: 0.06,
  trailingStopPct: 0.015,
  maxSlippagePct: 0.005,
  orderTimeoutSec: 30,
  maxRetries: 3,
  retryDelayMs: 1000,
  priceDeviationLimit: 0.01,
};
```

---

## L4: 系统级风控

### 熔断机制
| 触发条件 | 动作 | 恢复条件 |
|----------|------|----------|
| 系统延迟 > 5s | 暂停新订单 | 延迟恢复 < 1s |
| API 错误率 > 10% | 暂停交易 | 错误率 < 1% |
| 价格闪崩 > 5% | 暂停 + 通知 | 人工确认 |
| 未知异常 | 紧急平仓 | 人工重启 |

### 异常检测
| 检测项 | 阈值 | 动作 |
|--------|------|------|
| 价格突变 | > 3 sigma | 忽略信号 |
| 成交量异常 | > 5x 平均 | 减仓 50% |
| 持仓偏离 | > 10% | 重新同步 |
| 余额不符 | 任何差异 | 暂停 + 审计 |

### 人工介入
| 场景 | 通知方式 | 超时处理 |
|------|----------|----------|
| 回撤超限 | 钉钉/微信 | 自动平仓 |
| 连续亏损 | 邮件 | 暂停策略 |
| 系统异常 | 短信 | 紧急平仓 |

---

## 资金分配方案

### 初始分配（$10,000 模拟盘）
```
总资金: $10,000
├── 趋势跟踪: $3,000 (30%)
├── 均值回归: $2,500 (25%)
├── 动量策略: $2,500 (25%)
├── 套利策略: $2,000 (20%)
└── 现金储备: 动态调整
```

### 再平衡规则
| 条件 | 动作 |
|------|------|
| 偏离 > 5% | 月末再平衡 |
| 策略暂停 | 资金回收至现金 |
| 新策略上线 | 从现金分配 |

---

## 风控检查清单

### 事前检查（Pre-trade）
- [ ] 账户余额充足
- [ ] 未触发日/周亏损限额
- [ ] 仓位限制未超
- [ ] 价格在合理范围
- [ ] 市场流动性充足

### 事中监控（In-trade）
- [ ] 订单状态正常
- [ ] 滑点在阈值内
- [ ] 成交价格合理
- [ ] 持仓同步正确

### 事后审计（Post-trade）
- [ ] 成交记录完整
- [ ] 盈亏计算正确
- [ ] 风控指标更新
- [ ] 审计日志写入

---

## Changelog
- 2026-01-26: 初始化风控与资金分配配置
