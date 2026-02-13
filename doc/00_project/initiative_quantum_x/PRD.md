# PRD - AI 量化交易系统（quantum_x）

## 背景与目标
本项目旨在搭建一个 AI-native 量化交易系统，覆盖股票、期货、虚拟币等多资产市场，形成可持续迭代的策略系统与统一风控执行链路，并为未来客户跟单提供可审计、可控、可扩展的系统能力。

## 方案选择（推荐落地）
- 核心执行/回测引擎：NautilusTrader（Python-native，event-driven，backtest/live parity）
- 研究与模型管线：Qlib（AI 研究与量化研发工作流）
- 参考生态（能力对标，非强依赖）：Lean、vn.py、Freqtrade、Hummingbot、Backtrader、vectorbt
- 统一契约优先：以统一的数据/特征/信号/订单/成交契约为准，框架仅作为能力参考

## 用户画像
- 量化研究员：需要高效研究、可复现实验、快速迭代策略
- 交易/风控：需要稳定执行、风险可控、可审计的策略运行
- 运营/合规：需要可追溯的策略版本、变更记录与权限体系
- 客户/跟单用户（未来）：需要稳定信号、透明风险、可控复制

## 范围定义
### In Scope
- 多资产数据接入与特征生成（股票/期货/虚拟币）
- 策略系统（多策略/多模型/多周期，含 AI 训练与评估）
- 回测/仿真/实盘一体化执行
- 风控与组合管理
- 监控告警、审计追踪、策略版本管理
- 账户模式管理（模拟/实盘）与客户自有账户接入
- 跟单与信号分发的系统能力设计

### Out of Scope
- 直接承诺收益或对外投资建议
- 未获得授权的账户接入与交易
- 平台托管客户资金或代持资产
- 未经验证的自动化资金管理

## MVP 假设与门禁（待确认）
- 假设：MVP 默认模拟盘为主，实盘需显式授权与风控门禁
- 假设：先聚焦单一资产域以快速验证（默认：虚拟币现货/永续）
- 假设：MVP 使用公开/免费数据源，付费数据后置
- 假设：仅内部使用，不开放客户跟单
- 门禁：资产优先级、合规地区、数据预算、交易通道、风险限额必须在进入实盘前确认

## 账户模式（Sim / Real）
- 模拟账户：用于策略验证与风控演练，默认启用
- 真实账户：客户自有账户接入，必须显式授权与权限范围控制；默认未激活，需手动激活后可交易
- 强隔离：模拟与实盘的订单链路、风控与审计完全隔离
- 真实账户优先接入（Derivatives）：Binance / OKX / Bybit

## SOTA 策略系统设计
### 策略类型覆盖
- 趋势、均值回归、统计套利、事件驱动、做市、因子/ML/RL、跨市场套利

### 研究到生产的统一流水线
1. 数据版本化与质量校验
2. 特征工程与特征版本管理
3. 模型训练与评估（含 walk-forward）
4. 回测与成本/滑点/冲击建模
5. 风控门禁与策略评审
6. 仿真/模拟盘
7. 小资金实盘
8. 放量与跟单分发
9. 运行监控与事后归因分析

### 策略评审门禁（关键控制点）
- 数据泄漏检测与样本外验证
- 交易成本与冲击敏感性分析
- 压力测试与极端行情回放
- 回测/实盘偏差阈值

## 跟单与信号分发（未来能力）
- 信号版本管理与订阅策略
- 不同风险偏好账户的复制规则与仓位约束
- 跟单执行隔离与异常熔断
- 信号审计、变更记录与披露规则

## AI 研发管线
- 数据版本化 → 特征工程 → 训练/验证 → 回测 → 模拟盘 → 小资金实盘 → 放量与跟单
- 训练与推理隔离，保证研究与生产一致性

## 成功指标（不承诺收益，仅用于内部评估）
- 研究指标：信息比率、夏普、最大回撤、交易成本占比
- 工程指标：回测/实盘偏差、订单延迟、系统可用性
- 运营指标：策略上线周期、回滚耗时、风控命中率

## 合规与风险
- 账户权限、资金安全、日志可追溯
- 严格区分研究、模拟、实盘环境
- 对外跟单需满足地区合规要求与风控披露

## 依赖与约束
- 数据源合法合规接入
- 交易通道与券商/交易所的协议限制
- 模型训练与回测的计算资源预算
- 市场数据上游不可用时，API 需降级为 200 + 空数据/缓存，避免 5xx 并提供可用空态
- 真实 API 验收必须走可达的真实行情供应商：默认 `binance`；受限网络下可切换 `MARKET_DATA_PROVIDER=blockchain_info`（BTC ticker）用于端到端验收与 fixtures 采集（禁止用 mock 替代）。
- WS 上游实时流默认 opt-in：`ENABLE_WEBSOCKET=true` 才会连接上游行情 WS；默认关闭以避免受限网络/地区导致的 451/连接失败影响主路径（基线以 REST 可用为准）。
- 本地 E2E 稳定性：可通过 `RATE_LIMIT_WINDOW_MS` / `RATE_LIMIT_MAX_REQUESTS` 调优避免 429 flake；生产阈值需按容量与 SLO 回归合理值。

## 里程碑（高层）
- M1: 研究与回测底座完成
- M2: 统一风控与实盘执行链路
- M3: 多策略编排与监控
- M4: 跟单系统能力设计完成

## 架构治理结论（SOP 1.4 / 2026-02-11）

### 决策摘要（ADR）
- ADR-AX-001：采用 `Dual-Plane, Single-Repo` 演进路径（Control Plane / Stream Plane）。
- ADR-AX-002：统一 REST + WS 安全边界（关键写 API authN/authZ + WS token handshake + channel ACL）。
- ADR-AX-003：SLO-first 可观测性契约（SLO + 错误预算 + correlation id 全链路追踪）。

### 风险优先级
- P0：WS 无认证订阅链路；关键写 API 缺统一 RBAC。
- P1：API/WS 共进程故障域耦合；进程内限流在横向扩展下不一致；指标未绑定错误预算。

### 证据
- `outputs/sop-architecture-council/1-4-2bc405e8/reports/architecture-council-report.md`
- `doc/00_project/initiative_quantum_x/ARCHITECTURE_ADR_2026-02-11.md`
- `doc/00_project/initiative_quantum_x/ARCHITECTURE_RISK_REGISTER_2026-02-11.md`

## 全局沙盒化基线（SOP 1.11 / 2026-02-11）

### 目标
- 为关键工程任务启用沙盒执行，降低命令执行攻击面与误操作影响半径。
- 当前基线 Run: `1-11-7012f820`

### 约束
- 默认离线执行（`network=none`）；
- 工作区只读挂载，仅 `outputs/tmp` 可写；
- profile 级资源配额与超时策略必须生效并可审计。
- 容器最小权限：`no-new-privileges` + `cap-drop ALL`。

### 配置与实现
- 策略配置：`configs/sandbox/sandbox_policy.yaml`
- 任务映射：`configs/sandbox/key_task_profiles.yaml`
- 策略文档：`scripts/sandbox/POLICY.md`
- 本地隔离执行器：`scripts/sandbox/run_local_sandbox.sh`
- 云沙盒探测：`scripts/sandbox/run_cloud_sandbox.sh`

### 证据
- `outputs/sop-global-sandbox/1-11-7012f820/reports/precheck_summary.md`
- `outputs/sop-global-sandbox/1-11-7012f820/reports/resource_quota_timeout_policy.md`
- `outputs/sop-global-sandbox/1-11-7012f820/reports/sandbox_execution_evidence.md`
- `doc/00_project/initiative_quantum_x/SANDBOX_SECURITY_STATEMENT.md`

## 前端质量验证状态（PDCA-3）

| 验证项 | 状态 | 结果 |
|---|---|---|
| Next.js Build | PASS | 50 routes generated, 0 errors |
| TypeScript | PASS | 编译成功，无类型错误 |
| Unit Tests | PASS | 275/275 tests pass |
| Test Coverage | 9 files | trading, ws, hooks, stores |
| Console Errors | PASS | Playwright E2E 验证无关键错误 |
| Performance | PASS | Playwright 页面加载 <10s |
| E2E Tests | PASS | 308/308 tests pass (100%) |

**验证日期**: 2026-01-28
**状态**: 前端验证完成，所有 E2E 测试通过（5 浏览器 x 单测覆盖所有页面）

## 多 Persona 真实流程验证（SOP 3.6 / 2026-02-11）

### 验证目标
- 对齐 UX Map 的真实客户流程（而非单页可达性），覆盖研究、交易执行、运营合规三类用户。

### 覆盖范围
- Persona A（Quant Researcher）：`/strategies` -> `/model-backtest`
- Persona B（Execution Trader）：`/accounts` -> `/trading` -> `/risk`
- Persona C（Ops & Compliance）：`/api-keys` -> `/audit`

### 结果
- 基线运行（默认环境）：`0/3` 通过（入口上下文不稳定，命中非目标服务）
- 修复后复测（串行）：`3/3` 通过
- 修复后复测（并行/Council 风格）：`3/3` 通过
- 全浏览器矩阵复测（chromium/firefox/webkit/mobile）：`15/15` 通过
- 最终成功率：`100.0% (15/15)`

### 修复动作（与产品需求相关）
- 测试运行时入口标准化：Playwright `baseURL`/`webServer.command` 可参数化，确保命中目标环境。
- 流程脚本稳定化：去除易脆弱断言与外部数据强依赖路径，保留真实用户可感知结果断言。

### 验证证据
- `outputs/sop-persona-real-flow/run-20260211-221036/reports/persona_scripts.md`
- `outputs/sop-persona-real-flow/run-20260211-221036/reports/execution_summary.md`
- `outputs/sop-persona-real-flow/run-20260211-221036/logs/playwright_persona_chromium.log`
- `outputs/sop-persona-real-flow/run-20260211-221036/logs/playwright_persona_chromium_parallel_rerun.log`
- `outputs/sop-persona-real-flow/run-20260211-221036/logs/playwright_persona_all_projects_rerun.log`
- `outputs/sop-persona-real-flow/run-20260211-221036/screenshots/`

## UI/UX 优化 SOP（2026-01-28）
- 目标页面：`/accounts`
- 发现问题：页面节奏与全站基线不一致（`space-y-8` vs `space-y-6`）；存在两个默认主按钮
- 修复完成：统一页面节奏为 `space-y-6`；保留单一主按钮，将“Link real”降级为次级按钮
- 验收方式：network/console/performance/visual regression 四项验证 + 证据截图

## API 契约与鉴权同步（SOP 1.6 / 2026-02-12）

### 需求
- 统一 API/WS 鉴权模型与权限边界，消除“文档口径与运行行为不一致”。
- 对前后端入口进行契约级同步（schema + config + callers + tests）。

### 交付结果
- REST 端：集中 request guard + route-level permission mapping。
- WS 端：token handshake + channel ACL。
- Contract：OpenAPI security schemes + breaking changes 标注 + error schema 标准化。
- Callers：前端 API client 与直连 fetch 页面统一 auth header 注入。

### Breaking Changes（生效）
1. 非 public REST 端点默认要求 API key。
2. WS 连接默认要求 token 并执行 channel ACL。
3. 错误返回统一为 `{message, code, status}`。

### 验收
- Round 1: `ai check` PASS（`/Users/mauricewen/AI-tools/outputs/check/20260211-160128-e1d8a290`）
- Round 2: UX smoke PASS（`frontend/e2e/navigation.spec.ts` 10/10）

### 证据
- `outputs/1.6/1-6-f056f6f5/reports/final_report.md`

## 多角色头脑风暴结论（SOP 1.3 / 2026-02-11）

### 竞品与定位更新
- 竞品参照结论：TradingView（图表与内容入口）、Binance（实时交易深度）、QuantConnect/Lean（研究到执行一致性）、Bloomberg（专业工作流）。
- 产品定位更新：`专业交易工作流 + 合规可审计` 双引擎，而非仅控制台功能堆叠。
- 交付导向：把既有“强内核能力”补上“公开发现入口”，形成可持续增长漏斗。

### 增长与合规并行策略（新增）
1. 入口分层：公开可索引面（Public Surface）与登录后交易面（Authenticated App Surface）分离。
2. 内容策略：关键词优先“能力说明/合规信任”，避免收益承诺类表述。
3. 转化链路：公开页 -> 注册 -> 账户激活 -> 首次模拟交易，形成完整可观测漏斗。

### 站点地图与索引策略（产品口径）
- 公开索引（规划）：`/`, `/features/*`, `/docs/*`, `/security`, `/pricing`, `/about`
- 交易控制台（noindex）：`/trading`, `/risk`, `/accounts`, `/api-keys`, `/audit` 及系统配置相关路径
- 原则：对搜索引擎暴露“能力与信任”，对交易操作保持“授权后可见”。

### 新增产品指标（North Star + Guardrail）
- `indexable_pages_count`：公开可索引页面数量
- `organic_to_signup_rate`：自然流量注册转化率
- `signup_to_activation_rate`：注册到账户激活转化率
- `compliance_disclaimer_coverage`：公开页合规声明覆盖率（目标 100%）

### 证据
- `outputs/1.3/1-3-915e27e6/reports/council_role_outputs.md`
- `outputs/1.3/1-3-915e27e6/reports/conflicts_consistency_decisions.md`
- `outputs/1.3/1-3-915e27e6/reports/seo_sitemap_keywords.md`

### 实施状态（SOP 1.3 Continue / 2026-02-11）
- 已落地 public SEO surface 首批页面：`/about`、`/pricing`、`/security`、`/features/*`、`/docs/*`。
- 已落地 `sitemap.xml` 与 `robots.txt` 自动生成，并使用单一清单管理 public 路由。
- app surface 默认 noindex，public 页面显式 override 为 index/follow。
- 验证：frontend build PASS + UX smoke PASS。

### 增量实施状态（SOP 1.3 Continue v2 / 2026-02-12）
- `features/*` 与 `docs/*` 页面已全部切换到 shared metadata builder（含 canonical/OG/twitter/robots）。
- 上述页面已补齐 `WebPage` JSON-LD，structured data 输出路径统一。
- 新增 SEO runtime 回归测试：`frontend/src/lib/seo/seo-runtime.test.ts`，持续守护 public routes 与 sitemap/robots 一致性。
- 验证：vitest PASS + frontend build PASS + UX smoke PASS + `ai check` PASS。

### 实施证据
- `outputs/1.3/1-3-826a518f/reports/seo_implementation_report.md`
- `outputs/1.3/1-3-826a518f/logs/frontend_build.log`
- `outputs/1.3/1-3-826a518f/logs/ux_round2_navigation.log`
- `outputs/1.3/1-3-a7270c8c/reports/seo_runtime_v2_report.md`
- `outputs/1.3/1-3-a7270c8c/logs/vitest_seo_runtime.log`
- `outputs/1.3/1-3-a7270c8c/logs/playwright_navigation.log`

### 一致性回归复核（SOP 3.2 Recheck / 2026-02-12）
- 在 SOP 1.6 之后执行前后端一致性回归（Run `3-2-6fef5bcb`）。
- 结果：路由契约、配置入口、运行态鉴权（HTTP+WS）均通过，未发现新增不一致项。
- 证据：`outputs/3.2/3-2-6fef5bcb/reports/final_report.md`。

## PRD 增量（SOP 3.6 Continue / 2026-02-12）

### 需求补充
- FE-API-CONTRACT-01：关键业务页（`/api-keys`、`/audit`、`/backtest`）必须通过统一 API SDK（`apiClient`）访问后端，禁止页面内重复拼接 API URL 与鉴权头。
- QA-JOURNEY-GATE-01：CI `chromium` 必须包含 persona real-flow smoke（`e2e/persona-real-flow.spec.ts`）作为发布前守门。

### 验收标准
- 页面代码不再依赖 `buildApiUrl/getApiAuthHeaders/normalizeApiBaseUrl` 组合。
- CI 工作流存在独立 `persona real-flow smoke` 执行步骤。
- Round1 `ai check` PASS，Round2 UX navigation smoke PASS。

### 证据
- `outputs/3.6/3-6-4beb69e2/reports/issue-remediation.md`
- `outputs/3.6/3-6-4beb69e2/reports/final_report.md`

#### 回归复跑补充（2026-02-12, run `3-6-62df5dbf`）

- 目的：对 persona real-flow 进行一次基线回归确认，验证 CI smoke 守门脚本在当前基线仍可用。
- 结果：persona real-flow（chromium）`3/3 PASS`。
- 证据：
  - `outputs/3.6/3-6-62df5dbf/reports/step2_personas_and_scripts.md`
  - `outputs/3.6/3-6-62df5dbf/logs/step3_persona_real_flow_e2e.log`
  - `outputs/3.6/3-6-62df5dbf/screenshots/persona_real_flow/`
  - `outputs/3.6/3-6-62df5dbf/reports/step4_summary_and_doc_updates.md`

## PRD 增量（SOP 3.2 Continue / 2026-02-12）

### 需求补充
- FE-AI-INTERNAL-CONTRACT-01：前端内部 AI 路由（`/api/ai/*`）调用必须走统一 helper（`frontend/src/lib/ai/http.ts`），禁止在 hooks 中分散实现路径拼装与错误解析。
- FE-AI-INTERNAL-CONTRACT-02：stream 模式下若服务端返回 chunk error，前端必须显式抛错并反馈到 hook error 状态。

### 验收标准
- `frontend/src/lib/ai/hooks.ts` 不再直接拼写多处 `/api/ai/*` raw fetch。
- 新增 helper 单测并通过。
- Round1 `ai check` PASS，Round2 UX navigation smoke PASS。

### 证据
- `outputs/3.2/3-2-d2852a9b/reports/ai-internal-api-consistency.md`
- `outputs/3.2/3-2-d2852a9b/reports/verification.md`

## PRD 增量（SOP 3.2 Continue Provider HTTP / 2026-02-12）

### 需求补充
- FE-AI-PROVIDER-CONTRACT-01：Google/Poe provider 网络调用必须走统一 HTTP helper（timeout + http/network error 归一化）。
- FE-AI-PROVIDER-CONTRACT-02：provider 超时错误必须返回 `<provider>_timeout`，并标记 `retryable=true`。

### 验收标准
- `frontend/src/lib/ai/providers/google.ts` 与 `poe.ts` 不再重复实现 HTTP 错误解析。
- 新增 provider helper 单测并通过。
- Round1 `ai check` PASS，Round2 UX smoke PASS。

### 证据
- `outputs/3.2/3-2-082c2e98/reports/provider-http-normalization.md`
- `outputs/3.2/3-2-082c2e98/reports/verification.md`

## SOP 1.1 一键全量交付（2026-02-12）

### 需求增量
- 执行长任务版一键全量交付流程（planning-with-files + ralph loop + 双轮验收 + Task Closeout）。
- 以“可审计证据优先”完成前后端一致性复核、UX Map 人工模拟与交付收尾。

### 验收口径
- SOP 1.1 八步骤全部落盘并闭环。
- Round1 `ai check` + Round2 UX Map 模拟均通过。
- deliverable/rolling ledger/PDCA 四文档口径一致。

## SOP 1.1 一键全量交付增量（run `1-1-461afeb6`, 2026-02-12）

### 需求补充
- 执行长任务版全量交付闭环：`planning-with-files -> ralph loop(12) -> 双轮验收 -> Task Closeout`。
- 所有校验与决策证据统一沉淀到 `outputs/1.1/1-1-461afeb6/`。

### 验收标准
- SOP 1.1 八步骤状态完整可追溯。
- Round1 `ai check` PASS；Round2 UX Map 人工模拟 PASS。
- deliverable、Rolling Ledger、PDCA 四文档口径一致。

### 证据
- `outputs/1.1/1-1-461afeb6/reports/precheck_arch_route_summary.md`
- `outputs/1.1/1-1-461afeb6/logs/planning-files-read.log`

## SOP 1.1 一键全量交付收口（run `1-1-065abd2c`, 2026-02-12）

### 验收结果
- SOP 1.1 八步骤已完成并完成关单。
- Round1: `ai check` PASS（`outputs/1.1/1-1-065abd2c/logs/ai_check_round1_final.log`）。
- Round2: UX Map 人工模拟 PASS（`navigation + persona + full-loop`, `16/16`）。
- Frontend/Backend consistency checks 均有证据落盘。

### 增量修复
- E2E 诊断增强：`frontend/e2e/persona-real-flow.spec.ts` 改为响应驱动断言，避免失败时仅超时无上下文。
- Hydration 风险治理：`frontend/src/lib/mock-data.ts` 使用 deterministic seed，降低 SSR/CSR 随机数据不一致风险。

### 证据
- `outputs/1.1/1-1-065abd2c/logs/playwright_ux_round2_isolated_fixed.log`
- `outputs/1.1/1-1-065abd2c/logs/frontend_quality_scan.log`
- `outputs/1.1/1-1-065abd2c/reports/frontend_quality/network_console_performance_visual.json`
- `outputs/1.1/1-1-065abd2c/logs/backend_contract_tests_final.log`

## SOP 1.1 增量复核（run `1-1-10f2b0dc`, 2026-02-12）

### 需求补充
- 基于 `SOP 3.1` 的修复结果，执行一轮新的全量交付长任务闭环，确保残留风险在项目级交付口径下完成收口。
- 本轮重点确认：
  - Trading 首屏 hydration 风险收敛（`React #418` 不再出现）。
  - AuditLogger 大文件启动加载风险收敛（无 `ERR_STRING_TOO_LONG`）。

### 验收标准
- SOP 1.1 八步骤完成并关单。
- Round1 `ai check` PASS；Round2 UX Map 人工模拟 PASS。
- frontend quality 报告在非生产验证环境下 `console/page/request` 三项均为零错误。
- 后端契约与鉴权测试通过，route/openapi parity 报告无新增不一致。

### 证据
- `outputs/1.1/1-1-10f2b0dc/`

## SOP 3.7 功能闭环复核（run `3-7-7d7d416f`, 2026-02-12）

### 需求补充
- 对当前实现执行“入口-系统-契约-验证”四层闭环完整性检查并形成可追溯证据。

### 验收标准
- 入口闭环：UI/按钮/CLI/配置入口可达。
- 系统闭环：前端->后端->持久化->结果回显链路可验证，错误路径可追踪。
- 契约闭环：schema/错误码/权限模型一致，契约测试通过。
- 验证闭环：E2E + 回归门禁通过，deliverable 更新。

### 证据
- `outputs/3.7/3-7-7d7d416f/reports/final_report.md`

## SOP 1.1 全量交付执行（run `1-1-70defaf7`, 2026-02-12）

### 需求补充
- 按长任务标准重新执行一键全量交付闭环：`planning-with-files -> ralph loop -> plan-first -> dual-round verification -> closeout`。
- 本轮聚焦“交付口径一致性复核”，不新增业务需求。

### 验收标准
- SOP 1.1 八步骤全部完成并关单；
- Round1 `ai check` PASS；Round2 UX Map 人工模拟 PASS；
- 前端质量与后端契约一致性验证证据完整；
- deliverable/rolling ledger/PDCA 四文档口径一致。

### 证据
- `outputs/1.1/1-1-70defaf7/reports/plan_first.md`
- `outputs/1.1/1-1-70defaf7/reports/final_report.md`

## SOP 4.1 项目级全链路回归（run `4-1-873e9072`, 2026-02-12）

### 需求补充
- 以 `UX Map` 为基线执行 `navigation + persona-real-flow + full-loop-closure` 三套核心路径回归，验证“入口 -> 任务 -> 结果”链路在当前基线持续可用。
- 对同类风险执行扩散扫描：`integration_process_lifecycle_drift` 与上游超时噪音对主路径可用性的影响。

### 阶段结果（Step 3/4）
- 核心路径回归：`16/16 PASS`。
- 阻断项扫描：无新增 product blocker / contract blocker。
- 运行态记录：后端出现 Binance upstream timeout 告警，但被既有 fallback 吸收，未影响用户关键路径断言。

### 证据
- `outputs/4.1/4-1-873e9072/reports/step3_ux_core_path.md`
- `outputs/4.1/4-1-873e9072/reports/step4_blocker_scan.md`
- `outputs/4.1/4-1-873e9072/logs/step3-ux-core.log`
- `outputs/4.1/4-1-873e9072/logs/step3-backend-inline.log`

## SOP 1.1 Full Delivery Increment (2026-02-12, run `1-1-c1a3a846`)

### Requirement Delta
- 在当前基线执行一轮长任务全量交付闭环（planning-with-files + ralph-loop + dual-round verification + task closeout）。
- 验证目标：在鉴权收口后的系统状态下，核心 UX 旅程与契约链路仍可稳定通过。

### Acceptance Delta
- Round 1 `ai check` PASS。
- Round 2 UX Map 回归 PASS（`full-loop + persona`）。
- deliverable / notes / task_plan / rolling ledger 同步更新并可审计。

### Evidence Root
- `outputs/1.1/1-1-c1a3a846/`
