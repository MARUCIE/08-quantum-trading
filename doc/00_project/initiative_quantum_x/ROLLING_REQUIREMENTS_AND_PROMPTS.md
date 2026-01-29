# ROLLING_REQUIREMENTS_AND_PROMPTS - quantum_x

## Requirements Ledger
| ID | Date | Requirement | Priority | Status | Source | Notes |
|---|---|---|---|---|---|---|
| REQ-001 | 2026-01-24 | 设计并规划 AI-native 量化交易系统，覆盖股票/期货/虚拟币 | P0 | Done | User | PDCA 文档基线完成 |
| REQ-002 | 2026-01-24 | 构建 SOTA 策略系统与未来跟单能力 | P0 | Done | User | 策略系统与跟单设计完成 |
| REQ-003 | 2026-01-24 | 选择推荐技术路线（NautilusTrader + Qlib） | P1 | Done | User | 作为参考栈与能力对标 |
| REQ-004 | 2026-01-24 | 输出 feature 级设计文档（数据/策略/执行/跟单） | P1 | Done | User | doc/10_features/* |
| REQ-005 | 2026-01-25 | 输出 component 级设计文档（核心组件） | P1 | Done | User | doc/20_components/* |
| REQ-006 | 2026-01-25 | 输出 MVP 实施计划与门禁 | P1 | Done | User | doc/00_project/initiative_quantum_x/EXECUTION_ROADMAP.md |
| REQ-007 | 2026-01-25 | 输出 MVP PoC 计划 | P1 | Done | User | doc/00_project/initiative_quantum_x/MVP_POC_PLAN.md |
| REQ-008 | 2026-01-25 | 输出 MVP 实施清单 | P1 | Done | User | doc/00_project/initiative_quantum_x/MVP_IMPLEMENTATION_BACKLOG.md |
| REQ-009 | 2026-01-25 | 输出统一契约规范 | P1 | Done | User | doc/20_components/contracts/design.md |
| REQ-010 | 2026-01-25 | 输出 MVP 里程碑与验证计划 | P1 | Done | User | doc/00_project/initiative_quantum_x/MVP_MILESTONE_PLAN.md |
| REQ-011 | 2026-01-25 | 输出 MVP 验证清单 | P1 | Done | User | doc/00_project/initiative_quantum_x/MVP_VERIFICATION_PLAN.md |
| REQ-012 | 2026-01-25 | 输出 API 配置指南与默认范围 | P1 | Done | User | doc/00_project/initiative_quantum_x/API_CONFIGURATION_GUIDE.md |
| REQ-013 | 2026-01-25 | 输出 Venue Adapter 组件设计 | P1 | Done | User | doc/20_components/venue_adapter/* |
| REQ-014 | 2026-01-28 | 新增模拟/真实账户模式与客户自有账户接入 | P0 | Done | User | T105-T109 完成，PRD/架构/体验地图/优化计划已更新 |
| REQ-015 | 2026-01-28 | 真实账户默认不激活，需显式激活后才能使用 | P0 | Done | User | T106-T108 实现执行隔离与显式激活 |
| REQ-016 | 2026-01-28 | UI/UX SOP：/accounts 间距基线对齐 + 单一主按钮 + 证据留存 | P1 | Done | User | ui-skills + web-interface-guidelines |
| REQ-017 | 2026-01-28 | Risk/Audit 集成：订单提交前风险校验 + 审计日志 | P0 | Done | User | T110 RiskChecker + AuditLogger 集成 |
| REQ-018 | 2026-01-28 | 账户流程 E2E 测试：表单/验证/切换/可访问性/移动端 | P1 | Done | User | T111 account-flows.spec.ts 65 测试 |
| REQ-019 | 2026-01-28 | 交付验证 SOP：Round 1 ai check + Round 2 UX Map 模拟 | P1 | Done | User | T112 419/419 E2E + 8 截图证据 |

## Prompt Library
### Strategy Research
- 目标: 生成可回测的策略假设与特征
- Prompt: “Provide a research plan for a multi-asset alpha strategy. Include hypotheses, features, validation, and risk controls.”

### Backtest Review
- 目标: 标准化回测评审
- Prompt: “Review the backtest report for bias, overfitting, and regime sensitivity. Suggest robustness checks.”

### Risk Policy Draft
- 目标: 形成风控规则模板
- Prompt: “Draft a risk policy for multi-asset strategies with limits, drawdown controls, and kill-switch criteria.”

### Copy-Trading Policy
- 目标: 形成跟单风险隔离与分配规则
- Prompt: “Design a copy-trading policy with signal versioning, allocation rules, and risk isolation for different client profiles.”

### Account Mode Review
- 目标: 评审模拟/实盘账户隔离与权限边界
- Prompt: “Review the account mode design for sim/real separation, consent boundaries, and audit requirements. List failure modes and required guards.”

### UI/UX Audit
- 目标: 对齐页面节奏与主按钮层级
- Prompt: “Audit the page for spacing baseline consistency and primary action hierarchy. List violations and minimal fixes.”

## Anti-Regression Q&A
| ID | Symptom | Root Cause | Fix | Verification | Prevention | Trigger |
|---|---|---|---|---|---|---|
| AR-001 | 回测收益显著高于实盘 | 数据延迟与滑点建模缺失 | 统一成交与滑点模型 | 以历史样本做回测-实盘偏差比对 | 强制回测模型与实盘一致 | "backtest_live_gap" |
| AR-002 | 回测表现突然异常好 | 数据泄漏或前视偏差 | 加入泄漏检测与时间切片验证 | Walk-forward 与时间切片审计 | 回测门禁强制泄漏检测 | "data_leakage" |
| AR-003 | 实盘策略表现快速衰减 | 模型漂移与市场结构变化 | 漂移检测与再训练触发器 | 监控漂移告警与再训练效果 | 建立漂移门禁与回退策略 | "model_drift" |
| AR-004 | 模拟订单进入实盘或反向混用 | 账户模式隔离缺失/校验不一致 | 增加环境标识与执行前硬校验 | 对 sim/real 下单路径做对照测试 | 在执行层强制校验 + 审计告警 | "account_mode_leak" |
| AR-005 | 提交模拟订单时报 ReferenceError | 多账户重构后 helper 未接入上下文变量 | refreshPrice 接受 context 并使用 adapter | TypeScript 编译 + 下单冒烟 | 添加 no-undef lint + 单测覆盖 submitPaperOrder | "adapter is not defined" |
| AR-006 | 单页出现多个主按钮或节奏不一致 | 页面未遵循间距基线与按钮层级规范 | 统一 `space-y-6` 并降级次级按钮 | UI/UX 审计 + Playwright evidence | 在 SOP 中加入 UI audit checklist | "multiple_primary_actions" |

## References
- Lean (QuantConnect) engine
- Qlib research platform
- NautilusTrader event-driven engine
- Freqtrade / Hummingbot for crypto execution
- vn.py for futures trading ecosystem
- Backtrader and vectorbt for research backtesting
