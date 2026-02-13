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
| REQ-020 | 2026-01-28 | 市场数据上游不可用时避免 5xx，返回空数据/缓存 | P1 | Done | User | network check + graceful fallback |
| REQ-021 | 2026-01-29 | 性能基线定义与优化：LCP < 2.5s, Performance > 80 | P1 | Done | User | T116-T130, PERFORMANCE_BASELINE.md |
| REQ-022 | 2026-01-29 | 动态导入重型组件：CandlestickChart, Sidebar 延迟加载 | P1 | Done | User | T121-T125, dynamic-candlestick-chart.tsx |
| REQ-023 | 2026-01-29 | Route-level Loading States：trading/backtest 骨架屏 | P1 | Done | User | T126-T130, loading.tsx |
| REQ-024 | 2026-01-29 | 生产模式性能验证：Performance 91, LCP 3.5s, TBT 44ms | P1 | Done | User | 目标 LCP 2.5s 需 Edge caching |
| REQ-025 | 2026-02-11 | 架构圆桌 SOP：Architect/Security/SRE 多视角产出 ADR 与风险清单，并同步 SYSTEM_ARCHITECTURE | P0 | Done | User | Run `1-4-2bc405e8`, evidence: `outputs/sop-architecture-council/1-4-2bc405e8/` |
| REQ-026 | 2026-02-11 | 全局沙盒化：关键任务启用 sandbox（网络/文件隔离 + 资源配额 + 超时策略）并同步架构与安全说明 | P0 | Done | User | Run `1-11-7012f820`, evidence: `outputs/sop-global-sandbox/1-11-7012f820/` |
| REQ-027 | 2026-02-11 | 全局沙盒化复核：按 SOP run `1-11-55189353` 重新验证入口预检、网络封锁、只读文件系统、超时策略与配额元数据 | P0 | Done | User | Historical evidence (legacy path): `outputs/1.11/1-11-55189353/`; current baseline: run `1-11-7012f820` |
| REQ-028 | 2026-02-11 | 功能闭环完整实现检查：入口/系统/契约/验证四类闭环检查并形成可审计证据，更新交付清单 | P0 | Done | User | Run `3-7-f72886eb`, evidence: `outputs/sop-full-loop/3-7-f72886eb/` |
| REQ-030 | 2026-02-11 | 多角色头脑风暴：PM/设计/SEO 并行输出竞品分析+PRD、UX Map、sitemap/关键词策略；收敛冲突并更新 PDCA 四文档 | P0 | Done | User | Run `1-3-915e27e6`, evidence: `outputs/1.3/1-3-915e27e6/` |
| REQ-031 | 2026-02-11 | 继续执行 SOP 1.3：将 SEO 策略落地为运行时实现（public 页面 + sitemap + robots + app 默认 noindex） | P0 | Done | User | Run `1-3-826a518f`, evidence: `outputs/1.3/1-3-826a518f/` |
| REQ-035 | 2026-02-12 | 继续执行 SOP 1.3 v2：补齐 public features/docs 页面 metadata+JSON-LD，并新增 SEO runtime 回归测试守门 | P0 | Done | User | Run `1-3-a7270c8c`, evidence: `outputs/1.3/1-3-a7270c8c/` |
| REQ-037 | 2026-02-12 | SOP 1.1 一键全量交付（长任务）：planning-with-files + ralph loop + plan-first + 双轮验收 + Task Closeout | P0 | Done | User | Canonical run `1-1-065abd2c`, evidence: `outputs/1.1/1-1-065abd2c/` |
| REQ-040 | 2026-02-12 | SOP 4.1 项目级全链路回归：按 UX Map 执行 navigation/persona/full-loop 三套回归，完成 blocker 扫描与双轮验收关单 | P0 | Done | User | Run `4-1-873e9072`, evidence `outputs/4.1/4-1-873e9072/` |
| REQ-045 | 2026-02-13 | 受限网络下支持真实行情 API fallback（`MARKET_DATA_PROVIDER=blockchain_info`），用于端到端验收与 fixtures 回放 | P1 | Done | User | SOP 3.3 run `3-3-74963f76`, evidence `outputs/3.3/3-3-74963f76/` |


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
- Prompt: "Audit the page for spacing baseline consistency and primary action hierarchy. List violations and minimal fixes."

### Performance Optimization
- 目标: 识别性能瓶颈并应用优化
- Prompt: "Run Lighthouse audit in production mode. Identify LCP/TBT bottlenecks. Apply dynamic imports for heavy components and add route-level loading states. Verify improvements with before/after metrics."

### SEO Runtime Regression
- 目标: 保证 public route registry 与 sitemap/robots/metadata 输出长期一致
- Prompt: "Apply shared SEO metadata + JSON-LD across all public pages and add regression tests to enforce public-routes, sitemap, and robots parity."

## Anti-Regression Q&A
| ID | Symptom | Root Cause | Fix | Verification | Prevention | Trigger |
|---|---|---|---|---|---|---|
| AR-001 | 回测收益显著高于实盘 | 数据延迟与滑点建模缺失 | 统一成交与滑点模型 | 以历史样本做回测-实盘偏差比对 | 强制回测模型与实盘一致 | "backtest_live_gap" |
| AR-002 | 回测表现突然异常好 | 数据泄漏或前视偏差 | 加入泄漏检测与时间切片验证 | Walk-forward 与时间切片审计 | 回测门禁强制泄漏检测 | "data_leakage" |
| AR-003 | 实盘策略表现快速衰减 | 模型漂移与市场结构变化 | 漂移检测与再训练触发器 | 监控漂移告警与再训练效果 | 建立漂移门禁与回退策略 | "model_drift" |
| AR-004 | 模拟订单进入实盘或反向混用 | 账户模式隔离缺失/校验不一致 | 增加环境标识与执行前硬校验 | 对 sim/real 下单路径做对照测试 | 在执行层强制校验 + 审计告警 | "account_mode_leak" |
| AR-005 | 提交模拟订单时报 ReferenceError | 多账户重构后 helper 未接入上下文变量 | refreshPrice 接受 context 并使用 adapter | TypeScript 编译 + 下单冒烟 | 添加 no-undef lint + 单测覆盖 submitPaperOrder | "adapter is not defined" |
| AR-006 | 单页出现多个主按钮或节奏不一致 | 页面未遵循间距基线与按钮层级规范 | 统一 `space-y-6` 并降级次级按钮 | UI/UX 审计 + Playwright evidence | 在 SOP 中加入 UI audit checklist | "multiple_primary_actions" |
| AR-007 | 市场数据接口返回 500 | 上游 Binance 451 导致未降级 | market endpoints 缓存/空数据降级 | `network-check.txt` 全部 200 | 上游不可用时返回 200 + 空数据 | "binance_451" |
| AR-008 | Lighthouse 开发模式分数偏低 | 开发模式禁用 tree-shaking/minification | 必须在生产模式 (npm run build && npm start) 测试性能 | Lighthouse prod mode score > 80 | 性能基准文档明确要求生产模式测试 | "dev_mode_performance" |
| AR-009 | LCP 超过 4s | 重型组件同步加载阻塞渲染 | 用 next/dynamic 延迟加载 Charts/Sidebar | Lighthouse LCP < 4s | 图表/侧边栏组件必须动态导入 | "lcp_timeout" |
| AR-010 | WS 通道可被未授权订阅 | WS 订阅链路无 token/ACL 守门 | 引入 token handshake + channel ACL + 审计 | 未授权订阅拦截率 100% | WS subscribe path 强制授权检查 | "ws_unauthorized_subscribe" |
| AR-011 | 关键脚本误写工作区或外联网络 | 任务未在隔离沙盒执行 | 默认启用离线只读沙盒 + 资源限额 + 超时守护 | 沙盒日志出现 `network_blocked` 与 `read-only file system` | 关键任务映射到 `configs/sandbox/key_task_profiles.yaml` | "sandbox_bypass" |
| AR-012 | E2E 导航/Persona 用例频繁因文案切换失败 | 断言依赖 i18n 文案与不稳定可见性，而非稳定入口属性 | 新增 `full-loop-closure.spec.ts` 以路由/契约优先断言，并保留旧用例作为 hardening backlog | Playwright full-loop closure `3/3` 通过 | E2E 关键路径优先使用 href/data-testid/契约字段，避免语言耦合 | "selector_i18n_flaky" |
| AR-018 | public SEO 页面有流量但 metadata/JSON-LD 不一致导致检索口径漂移 | 公开页各自维护 metadata，缺乏统一 helper 与回归测试 | 公共页面统一 `buildPublicMetadata` + schema helper，并新增 SEO runtime 回归测试 | `seo-runtime.test.ts` + `npm run build` + navigation smoke + `ai check` | Public SEO surface 新增页面必须同步更新 shared helper/route registry 并触发回归测试 | "seo_metadata_schema_drift" |
| AR-020 | 长任务执行后仅完成局部验证，导致交付口径不完整 | 缺少统一的 plan-first 与双轮验收收尾约束 | 固化 SOP 1.1：plan-first + Round1/Round2 + closeout 清单化 | `ai check` + UX Map round2 + deliverable/ledger 更新 | 长任务必须经过 SOP 1.1 或同等门禁流程 | "long_task_partial_closeout" |
| AR-021 | Trading 页面出现 React hydration `#418`（首屏渲染不稳定） | SSR/CSR 首屏 mock 数据使用非确定性随机值 | `mock-data` 改为 deterministic seed 生成 | frontend quality scan + route screenshot report | SSR 首屏 mock 数据禁止 `Math.random()` 直用 | "react_418_hydration_mismatch" |

## References
- Lean (QuantConnect) engine
- Qlib research platform
- NautilusTrader event-driven engine
- Freqtrade / Hummingbot for crypto execution
- vn.py for futures trading ecosystem
- Backtrader and vectorbt for research backtesting

## Rolling Update (2026-02-12)

### Requirements Delta
| ID | Date | Requirement | Priority | Status | Source | Notes |
|---|---|---|---|---|---|---|
| REQ-029 | 2026-02-12 | SOP 1.6：统一 API 契约与鉴权边界（REST + WS），同步调用方与契约测试，并标注 breaking changes | P0 | Done | User | Run `1-6-f056f6f5`, evidence `outputs/1.6/1-6-f056f6f5/` |
| REQ-032 | 2026-02-12 | SOP 3.2 Recheck：在 1.6 后执行前后端入口与契约一致性回归（含运行态 HTTP/WS 探针） | P0 | Done | User | Run `3-2-6fef5bcb`, all checks PASS |

Reference: SOP 1.3 / 1.3 Continue 的 canonical requirement 已登记于 Requirements Ledger（见对应条目）。

### Prompt Delta
| ID | Prompt | Purpose |
|---|---|---|
| PRM-029 | "Align REST and WebSocket auth boundaries with route-level ACL, then synchronize OpenAPI + caller headers + contract tests." | 前后端契约与鉴权同步标准动作 |
| PRM-030 | "Run a PM/Designer/SEO council brainstorm, produce conflict-resolved decisions, and sync PRD/UX/Architecture/Optimization docs." | 多角色脑暴与文档一致性同步 |
| PRM-031 | "Implement SEO public surface runtime artifacts (public pages, sitemap, robots, app noindex default) with verifiable logs." | 脑暴结论到工程实现的标准动作 |

### Anti-Regression Delta
| ID | Symptom | Root Cause | Fix | Verification | Prevention | Trigger |
|---|---|---|---|---|---|---|
| AR-013 | 非 public API 可匿名访问或 WS 频道越权订阅 | 缺少集中式 auth guard 与 WS channel ACL | REST request guard + WS token handshake + channel ACL + Error contract 统一 | `backend` auth tests + `frontend` API/WS tests + `ai check` + UX smoke | 新增 route-permission 清单与 fail-closed admin fallback；OpenAPI 明确 breaking changes | "auth_boundary_drift" |
| AR-014 | 控制台路由被搜索引擎索引，公开获客页面不足 | 未区分 public surface 与 app surface 的索引策略 | 建立 sitemap + robots/noindex 分层，并补齐公开能力页 | sitemap/robots 检查 + 公开页元信息审计 | 维护路由分层白名单（public indexable vs app noindex） | "seo_surface_drift" |
| AR-015 | sitemap 与 robots 规则与公开页面清单不一致 | SEO 规则分散在多个文件，变更后未同步 | 引入 `public-routes.ts` 作为单一清单，sitemap/robots 统一从清单生成 | build 输出包含 `/sitemap.xml` 与 `/robots.txt` 且公开页可访问 | SEO 规则禁止散落硬编码，必须走清单源 | "seo_route_registry_drift" |

## Rolling Update (2026-02-12, SOP 3.6 Continue)

### Requirements Delta
| ID | Date | Requirement | Priority | Status | Source | Notes |
|---|---|---|---|---|---|---|
| REQ-033 | 2026-02-12 | 收敛关键业务页后端调用到统一 `apiClient`，并把 persona real-flow 纳入 CI chromium smoke | P0 | Done | User | Run `3-6-4beb69e2`, evidence `outputs/3.6/3-6-4beb69e2/` |

### Prompt Delta
| ID | Prompt | Purpose |
|---|---|---|
| PRM-032 | "Converge remaining critical frontend backend callers to apiClient and enforce persona real-flow smoke in CI chromium before release." | 契约一致性与真实流程守门增量 |

### Anti-Regression Delta
| ID | Symptom | Root Cause | Fix | Verification | Prevention | Trigger |
|---|---|---|---|---|---|---|
| AR-016 | Persona 流程在 CI 未被显式执行，回归只在本地暴露 | 缺少 journey-level smoke gate，且选择器对重复按钮不鲁棒 | CI 增加 persona chromium smoke；`Create Key` 选择器使用 `.first()` 去歧义 | persona e2e 3/3 + navigation 10/10 + `ai check` | 关键角色旅程必须作为 CI 显式步骤；避免 strict locator 歧义 | "persona_smoke_missing_in_ci" |

## Rolling Update (2026-02-12, SOP 3.2 Continue AI Internal API)

### Requirements Delta
| ID | Date | Requirement | Priority | Status | Source | Notes |
|---|---|---|---|---|---|---|
| REQ-034 | 2026-02-12 | 前端 `/api/ai/*` 调用统一 helper，hooks 错误处理收敛并补单测 | P1 | Done | User | Run `3-2-d2852a9b`, evidence `outputs/3.2/3-2-d2852a9b/` |

### Prompt Delta
| ID | Prompt | Purpose |
|---|---|---|
| PRM-033 | "Unify frontend internal /api/ai request path and error handling via shared helper, then verify with unit tests and ai check." | 前端内部 API 一致性收敛模板 |

### Anti-Regression Delta
| ID | Symptom | Root Cause | Fix | Verification | Prevention | Trigger |
|---|---|---|---|---|---|---|
| AR-017 | AI hooks 对同类 internal API 请求重复实现，错误处理口径不一致 | 路径和错误解析逻辑分散在 hooks 多处 raw fetch | 引入 `ai/http.ts` 并统一 `requestAiJson/extractAiErrorMessage` | `vitest` helper tests + `tsc` + `ai check` + UX smoke | internal `/api/ai/*` 请求禁止散落 raw fetch | "ai_internal_request_drift" |

## Rolling Update (2026-02-12, SOP 1.3 Continue v2)

### Requirements Delta
Reference: canonical requirement 已登记于 Requirements Ledger（id 035）。

### Prompt Delta
| ID | Prompt | Purpose |
|---|---|---|
| PRM-034 | "Standardize all public SEO pages on shared metadata/schema helpers and enforce route-registry parity with sitemap/robots regression tests." | SEO runtime 二次收口与守门模板 |

### Anti-Regression Delta
Reference: canonical anti-regression 已登记于 Anti-Regression Q&A（id 018）。

## Rolling Update (2026-02-12, SOP 3.2 Continue Provider HTTP)

### Requirements Delta
| ID | Date | Requirement | Priority | Status | Source | Notes |
|---|---|---|---|---|---|---|
| REQ-036 | 2026-02-12 | AI provider 层统一 timeout/http/network error 处理并补单测 | P1 | Done | User | Run `3-2-082c2e98`, evidence `outputs/3.2/3-2-082c2e98/` |

### Prompt Delta
| ID | Prompt | Purpose |
|---|---|---|
| PRM-035 | "Normalize provider-layer HTTP timeout/network/status errors via shared helper for Google/Poe, then verify with tests and ai check." | provider 层一致性收敛模板 |

### Anti-Regression Delta
| ID | Symptom | Root Cause | Fix | Verification | Prevention | Trigger |
|---|---|---|---|---|---|---|
| AR-019 | Google/Poe provider 错误语义不一致，超时被误归类 | provider 文件内网络逻辑重复，缺少统一 timeout 判定 | 新增 `providers/http.ts`，统一 `fetchWithTimeout/toProviderHttpError` | provider helper test + `tsc` + `ai check` + UX smoke | provider 网络层禁止复制粘贴 raw fetch 错误处理 | "provider_http_semantics_drift" |

## Rolling Update (2026-02-12, SOP 1.1 Full Delivery run `1-1-461afeb6`)

### Requirements Delta
| ID | Date | Requirement | Priority | Status | Source | Notes |
|---|---|---|---|---|---|---|
| REQ-037 | 2026-02-12 | 执行一键全量交付长任务闭环（planning-with-files + ralph loop + 双轮验收 + Task Closeout）并完成可审计收尾 | P0 | Superseded | User | Early run `1-1-461afeb6`; canonical completion on `1-1-065abd2c` |

### Prompt Delta
| ID | Prompt | Purpose |
|---|---|---|
| PRM-036 | "Execute SOP 1.1 full-delivery pipeline with plan-first, doc-first sync, dual-round verification, and task closeout artifacts." | 长任务全量交付标准模板 |

### Anti-Regression Delta
| ID | Symptom | Root Cause | Fix | Verification | Prevention | Trigger |
|---|---|---|---|---|---|---|
| AR-020 | SOP 长任务 run 出现重复创建或悬挂，导致审计台账与执行状态不一致 | 自动触发与手动触发并发，且未及时收敛 run 状态 | 选定 canonical run，重复 run 关单并写入状态证据 | `ai sop status` 无 running + closeout logs | 长任务仅允许一个 active canonical run，并在 kickoff 即记录 active_run_id | "sop_run_state_drift" |

## Rolling Update (2026-02-12, SOP 1.1 One-Click Full Delivery)

### Requirements Delta
Reference: canonical requirement 已登记于 Requirements Ledger（id 037，status Done）。

### Prompt Delta
| ID | Prompt | Purpose |
|---|---|---|
| PRM-036 | "Execute SOP 1.1 full-delivery pipeline with planning-with-files, ralph loop (max 12), plan-first, UX Map round2 simulation, and closeout evidence." | 长任务一键交付标准模板 |

### Anti-Regression Delta
Reference: canonical anti-regression 已登记于 Anti-Regression Q&A（id 020）。

## Rolling Update (2026-02-12, SOP 1.1 Completion run `1-1-065abd2c`)

### Requirements Delta
Reference: canonical requirement `REQ-037` 已完成（status `Done`）。

### Prompt Delta
Reference: canonical prompt `PRM-036` 已按 run `1-1-065abd2c` 执行闭环。

### Anti-Regression Delta
| ID | Symptom | Root Cause | Fix | Verification | Prevention | Trigger |
|---|---|---|---|---|---|---|
| AR-021 | Trading 页面 hydration mismatch 报错（React #418） | SSR/CSR 首屏使用非确定性随机 mock 数据 | 采用 deterministic seed mock 生成器 | `frontend-quality.spec.ts` + report JSON | SSR 首屏 mock 数据禁止 `Math.random()` 直用 | "react_418_hydration_mismatch" |

## Rolling Update (2026-02-12, SOP 1.1 Full Delivery run `1-1-10f2b0dc`)

### Requirements Delta
| ID | Date | Requirement | Priority | Status | Source | Notes |
|---|---|---|---|---|---|---|
| REQ-038 | 2026-02-12 | 复跑 SOP 1.1 全量交付闭环，将 3.1 修复纳入项目级交付与双轮验收证据 | P0 | Done | User | Canonical rerun `1-1-10f2b0dc`, evidence `outputs/1.1/1-1-10f2b0dc/` |

### Prompt Delta
| ID | Prompt | Purpose |
|---|---|---|
| PRM-037 | "Re-run SOP 1.1 full-delivery closure after 3.1 fixes; enforce doc-first sync, dual-round verification, and task closeout evidence." | 二次全量交付与修复收口模板 |

### Anti-Regression Delta
| ID | Symptom | Root Cause | Fix | Verification | Prevention | Trigger |
|---|---|---|---|---|---|---|
| AR-022 | AuditLogger 在大体积审计文件下启动读入风险导致潜在溢出错误 | 启动阶段直接整文件 `readFileSync` 读取 jsonl | 引入字节上限 tail-load 并忽略截断首行不完整记录 | `backend/src/risk/audit.test.ts` + backend 启动日志复核 | 审计日志加载必须限定最大读入窗口，禁止无界整文件读入 | "audit_tail_load_missing" |

## Rolling Update (2026-02-12, SOP 1.1 Completion run `1-1-10f2b0dc`)

### Requirements Delta
Reference: `REQ-038` 已完成（status `Done`）。

### Prompt Delta
Reference: `PRM-037` 已按 run `1-1-10f2b0dc` 完成执行与关单。

### Anti-Regression Delta
Reference: `AR-022` 已纳入本轮验证（backend audit tail-load tests + startup log scan）。

## Rolling Update (2026-02-12, SOP 3.7 Full-Loop Completeness run `3-7-7d7d416f`)

### Requirements Delta
| ID | Date | Requirement | Priority | Status | Source | Notes |
|---|---|---|---|---|---|---|
| REQ-039 | 2026-02-12 | 执行功能闭环完整实现检查（入口/系统/契约/验证四层闭环）并更新交付台账 | P0 | Done | User | Run `3-7-7d7d416f`, evidence `outputs/3.7/3-7-7d7d416f/` |

### Prompt Delta
| ID | Prompt | Purpose |
|---|---|---|
| PRM-038 | "Execute SOP 3.7 completeness watchdog: verify entrypoint/system/contract/verification closure and update deliverable." | 功能闭环完整性守门模板 |

### Anti-Regression Delta
| ID | Symptom | Root Cause | Fix | Verification | Prevention | Trigger |
|---|---|---|---|---|---|---|
| AR-023 | 闭环验证在跨命令执行时出现依赖进程生命周期漂移（偶发 `ECONNREFUSED`） | 测试依赖服务在多命令链路中非确定性退出 | 采用单脚本内联编排（启动依赖->执行测试->退出）固定依赖生命周期 | `outputs/3.7/3-7-7d7d416f/logs/system-full-loop.log` | 闭环类集成测试默认使用 inline orchestration，避免跨命令后台进程漂移 | "integration_process_lifecycle_drift" |

## Rolling Update (2026-02-12, SOP 1.1 Full Delivery run `1-1-70defaf7`)

### Requirements Delta
| ID | Date | Requirement | Priority | Status | Source | Notes |
|---|---|---|---|---|---|---|
| REQ-039 | 2026-02-12 | 再次执行 SOP 1.1 全量交付闭环，验证当前基线交付口径与证据一致性 | P0 | Done | User | Run `1-1-70defaf7`, evidence `outputs/1.1/1-1-70defaf7/` |

### Prompt Delta
| ID | Prompt | Purpose |
|---|---|---|
| PRM-038 | "Execute SOP 1.1 end-to-end on current baseline: plan-first, doc-first sync, dual-round verification, FE/BE consistency checks, and closeout evidence." | 基线一致性全量交付模板 |

### Anti-Regression Delta
| ID | Symptom | Root Cause | Fix | Verification | Prevention | Trigger |
|---|---|---|---|---|---|---|
| AR-023 | 长任务多次复跑时，run 证据与台账口径可能漂移 | 重复执行缺少统一 closeout 与 run-level证据锚点 | 每次复跑强制维护 canonical run 证据目录与 closeout 台账 | SOP status + ai check + deliverable/notes/task_plan 同步 | 长任务复跑必须明确 run_id，并在 closeout 时更新 Rolling Ledger 状态 | "full_delivery_rerun_drift" |

## Rolling Update (2026-02-12, SOP 1.1 Completion run `1-1-70defaf7`)

### Requirements Delta
Reference: `REQ-039` 已完成（status `Done`）。

### Prompt Delta
Reference: `PRM-038` 已按 run `1-1-70defaf7` 执行闭环（plan-first + dual-round verification + closeout）。

### Anti-Regression Delta
Reference: `AR-023` 已通过本轮复跑验证并保留触发器 `full_delivery_rerun_drift`。

## Rolling Update (2026-02-12, SOP 4.1 Full-Chain Regression run `4-1-873e9072`)

### Requirements Delta
| ID | Date | Requirement | Priority | Status | Source | Notes |
|---|---|---|---|---|---|---|
| REQ-040 | 2026-02-12 | SOP 4.1 项目级全链路回归：按 UX Map 执行 navigation/persona/full-loop 三套回归，完成 blocker 扫描与双轮验收关单 | P0 | Done | User | Run `4-1-873e9072`, evidence `outputs/4.1/4-1-873e9072/` |

### Prompt Delta
| ID | Prompt | Purpose |
|---|---|---|
| PRM-039 | "Execute SOP 4.1 project-level full-chain regression with UX-map core-path suite, blocker expansion scan, and dual-round verification closeout." | 项目级全链路回归守门模板 |

### Anti-Regression Delta
| ID | Symptom | Root Cause | Fix | Verification | Prevention | Trigger |
|---|---|---|---|---|---|---|
| AR-024 | 连续长任务交付后，核心旅程可用性存在隐性漂移风险（文档口径与运行态不一致） | 缺少统一 run-level 的 UX core-path 回归与 blocker 扩散扫描 | 固化 SOP 4.1：`navigation + persona + full-loop` + blocker scan + 双轮关单 | `step3_ux_core_path.md` + `step4_blocker_scan.md` + Step6 gate logs | 每次大规模交付后必须执行一次 4.1 run，并在 Rolling Ledger 更新状态 | "post_delivery_ux_core_path_drift" |

## Rolling Update (2026-02-12, SOP 3.9 Supply-Chain Monitoring run `3-9-38510f7f`)

### Requirements Delta
| ID | Date | Requirement | Priority | Status | Source | Notes |
|---|---|---|---|---|---|---|
| REQ-041 | 2026-02-12 | 执行供应链安全持续监控：完成依赖审计、处置 high/critical、落地 CI gate 与月度归档，并同步架构与台账 | P0 | Done | User | Run `3-9-38510f7f`, evidence `outputs/3.9/3-9-38510f7f/` |

### Prompt Delta
| ID | Prompt | Purpose |
|---|---|---|
| PRM-040 | "Execute SOP 3.9 supply-chain monitoring with npm/pip/secrets/lockfile audit, high-vuln remediation, CI gate, monthly archive, and doc sync." | 供应链安全监控标准模板 |

### Anti-Regression Delta
| ID | Symptom | Root Cause | Fix | Verification | Prevention | Trigger |
|---|---|---|---|---|---|---|
| AR-025 | 依赖升级后未形成持续门禁，易在后续提交重新引入高危漏洞 | 缺少 CI 层面的 supply-chain 守门与新增依赖 allowlist 审核 | 新增 `supply-chain-gate` job + `check-new-dependencies.mjs` + `dependency-allowlist.json` | `step4_ci_gate_summary.md` + post-fix `npm audit` | lockfile 变更必须通过审计，新增依赖必须命中 allowlist | "supply_chain_gate_missing" |

## Rolling Update (2026-02-12, SOP 5.3 Postmortem Gate run `5-3-15802d37`)

### Requirements Delta
| ID | Date | Requirement | Priority | Status | Source | Notes |
|---|---|---|---|---|---|---|
| REQ-042 | 2026-02-12 | 执行 Postmortem 自动化守门：pre-release trigger scan、post-release PM 更新、CI postmortem gate、证据归档与发布阻断口径固化 | P0 | Done | User | Run `5-3-15802d37`, evidence `outputs/5.3/5-3-15802d37/` |

### Prompt Delta
| ID | Prompt | Purpose |
|---|---|---|
| PRM-041 | "Execute SOP 5.3 postmortem gate: scan PM triggers against release range, update PM with machine-matchable triggers, enforce CI pre-merge gate." | 发布前防回归守门模板 |

### Anti-Regression Delta
| ID | Symptom | Root Cause | Fix | Verification | Prevention | Trigger |
|---|---|---|---|---|---|---|
| AR-026 | 发布流程中未执行 postmortem trigger 扫描，回归风险无法在 pre-merge 阶段阻断 | 缺少 postmortem-scan CI gate 与 release-range trigger 比对机制 | 新增 `scripts/ci/postmortem-scan.mjs` + `.github/workflows/ci.yml` `postmortem-gate` 并接入 lint/test 依赖链 | `step2_pre_release_scan.md` + `step4_ci_gate.md` + local scan PASS | 每次 pre-merge 必须通过 postmortem gate；新增 PM 必须包含可机器匹配 trigger | "postmortem_gate_missing" |

## Rolling Update (2026-02-12, SOP 1.1 Full Delivery run `1-1-c1a3a846`)

### Requirements Delta
| ID | Date | Requirement | Priority | Status | Source | Notes |
|---|---|---|---|---|---|---|
| REQ-043 | 2026-02-12 | 执行一键全量交付（长任务）闭环，完成 plan-first/doc-first/双轮验收/closeout 并更新全套台账 | P0 | Done | User | Run `1-1-c1a3a846`, evidence `outputs/1.1/1-1-c1a3a846/` |

### Prompt Delta
| ID | Prompt | Purpose |
|---|---|---|
| PRM-042 | "Execute SOP 1.1 one-click full-delivery on current baseline with queue-mode execution, plan-first/doc-first sync, dual-round gates, and closeout artifacts." | 新一轮全量交付执行模板 |

### Anti-Regression Delta
| ID | Symptom | Root Cause | Fix | Verification | Prevention | Trigger |
|---|---|---|---|---|---|---|
| AR-027 | UX 回归在 dev server 模式下出现编译期抖动导致的假失败（`net::ERR_ABORTED`） | `next dev` 首次编译与测试导航竞争，非业务错误放大 | 回归门禁切换到 `build + start` 稳定模式执行 | `step4_ux_round2.log` + rerun logs 对照 | UX gate 默认优先使用 production-like server 模式 | "ux_gate_devserver_flake" |

## Rolling Update (2026-02-12, SOP 1.1 Completion run `1-1-c1a3a846`)

### Requirements Delta
Reference: `REQ-043` 已完成（status `Done`）。

### Prompt Delta
Reference: `PRM-042` 已按 run `1-1-c1a3a846` 执行闭环（plan-first + doc-first + dual-round verification + closeout）。

### Anti-Regression Delta
Reference: `AR-027` 已纳入本轮验证并保留触发器 `ux_gate_devserver_flake`。

## Rolling Update (2026-02-12, SOP 5.1 Joint Acceptance run `5-1-b8b7b702`)

### Requirements Delta
| ID | Date | Requirement | Priority | Status | Source | Notes |
|---|---|---|---|---|---|---|
| REQ-044 | 2026-02-12 | 执行 SOP 5.1 联合验收与发布守门闭环：Step1-5 全完成、Round1 `ai check`、Round2 UX Map 真实流程复测并关单 | P0 | Done | User | Run `5-1-b8b7b702`, evidence `outputs/5.1/5-1-b8b7b702/` |

### Prompt Delta
| ID | Prompt | Purpose |
|---|---|---|
| PRM-043 | "Execute SOP 5.1 joint acceptance release gate in queue mode: planning-with-files read, PM/Tech/QA acceptance, Round1 ai check, Round2 UX Map replay, and closeout evidence." | 发布守门联合验收模板 |

### Anti-Regression Delta
| ID | Symptom | Root Cause | Fix | Verification | Prevention | Trigger |
|---|---|---|---|---|---|---|
| AR-028 | UX 回归在 `next dev`（Turbopack）下出现路由级假失败（`net::ERR_ABORTED`），导致发布守门误阻断 | dev server 编译抖动与测试导航并发导致非业务超时 | 回归门禁切换到 webpack server mode，并保留 route probe 证据链 | `step4_playwright.log` (16/16 PASS) + `step4_route_probe_webpack_clean.log` | 发布守门 Round2 默认记录 server mode；若 dev 模式不稳定需自动降级到 webpack/prod-like 模式复核 | "ux_round2_turbopack_route_flake" |

## Rolling Update (2026-02-13, SOP 3.3 Real API + Fixtures)

### Requirements Delta
| ID | Date | Requirement | Priority | Status | Source | Notes |
|---|---|---|---|---|---|---|
| REQ-045 | 2026-02-13 | 受限网络下支持真实行情 API：新增 `BINANCE_SPOT_REST_BASE_URL` 覆盖 REST base（推荐 `https://data-api.binance.vision`），并保留 `MARKET_DATA_PROVIDER=blockchain_info` 作为 BTC-only 真实兜底，用于验收与 fixtures 回放 | P1 | Done | User | Evidence: `outputs/3.3/3-3-74963f76/` |

### Prompt Delta
| ID | Prompt | Purpose |
|---|---|---|
| PRM-044 | "Capture real API request/response in non-prod, generate fixtures for replay/regression, and record an acceptance statement that mocks are not allowed (prefer `BINANCE_SPOT_REST_BASE_URL` override; fallback to `MARKET_DATA_PROVIDER=blockchain_info` if needed)." | 真实 API + fixtures + 禁 mock 的验收模板 |

### Anti-Regression Delta
| ID | Symptom | Root Cause | Fix | Verification | Prevention | Trigger |
|---|---|---|---|---|---|---|
| AR-029 | SOP 真实 API 验收在受限网络下出现连接超时/证书不匹配，导致核心链路失败或被迫改用 mock | Binance REST base 不可配置 + 运行时强依赖外部行情 | 新增 `BINANCE_SPOT_REST_BASE_URL` 覆盖 + SOP 3.3 证据链（capture + fixtures + statement）；保留 BTC-only `blockchain_info` 兜底 | `outputs/3.3/3-3-74963f76/reports/step2_real_api_summary.md` + `outputs/3.3/3-3-74963f76/reports/step3_fixtures_replay.md` | SOP 3.3 强制要求使用真实网络 API，且必须在证据中记录 provider/override 与请求响应 | "binance_rest_unreachable_no_override" |

## Rolling Update (2026-02-13, SOP 3.2 Frontend-Backend Consistency Re-audit)

### Requirements Delta
| ID | Date | Requirement | Priority | Status | Source | Notes |
|---|---|---|---|---|---|---|
| REQ-046 | 2026-02-13 | Full frontend-backend consistency re-audit: 42 backend routes vs auth-policy vs OpenAPI vs 25 frontend API calls vs 44 nav links vs 11 public routes; error/config contract verification | P1 | Done | User | Evidence in `notes.md` lines 13-60; SYSTEM_ARCHITECTURE.md Route Inventory table updated |

### Prompt Delta
| ID | Prompt | Purpose |
|---|---|---|
| PRM-045 | "Execute SOP 3.2 entrypoint consistency: cross-reference all backend routes, auth-policy, OpenAPI spec, frontend hooks/stores, sidebar nav, public-routes; verify error contract normalization pipeline; run contract tests + full suites; update SYSTEM_ARCHITECTURE.md route inventory." | Frontend-backend consistency audit template |

### Anti-Regression Delta
| ID | Symptom | Root Cause | Fix | Verification | Prevention | Trigger |
|---|---|---|---|---|---|---|
| AR-030 | Route drift between routes.ts and auth-policy.ts / OpenAPI / frontend | New endpoints added without updating all three contract surfaces | N/A (no drift found this audit) | 20/20 contract tests + 422/422 full suite | `openapi-sync.test.ts` enforces routes.ts <-> openapi.yaml parity; `auth-policy.test.ts` enforces fail-closed default | "route_drift_openapi_authpolicy" |

## Rolling Update (2026-02-13, SOP 3.6 Multi-Persona Real Flow Retest)

### Requirements Delta
| ID | Date | Requirement | Priority | Status | Source | Notes |
|---|---|---|---|---|---|---|
| REQ-047 | 2026-02-13 | Multi-persona real flow retest (post SOP 3.2 re-audit): 3 personas x 5 browsers = 15 tests + 3 full-loop-closure tests; all PASS in non-production (backend 39011/39012, webpack frontend, API_STATIC_KEY) | P1 | Done | User | Evidence: `outputs/3.6/3-6-fb667615/` |

### Prompt Delta
| ID | Prompt | Purpose |
|---|---|---|
| PRM-046 | "Execute SOP 3.6 multi-persona real flow: start backend on non-default ports, start frontend in webpack mode, configure API_STATIC_KEY, run persona-real-flow.spec.ts across 5-browser matrix, run full-loop-closure.spec.ts, capture screenshots as evidence." | Multi-persona real flow retest template |

### Anti-Regression Delta
| ID | Symptom | Root Cause | Fix | Verification | Prevention | Trigger |
|---|---|---|---|---|---|---|
| AR-031 | Persona E2E test 401 AUTH_REQUIRED on simulated account creation / API key creation | No API key configured in test environment; backend requires `Authorization: Bearer <key>` or `X-API-Key` header | Set `API_STATIC_KEY` on backend + `PLAYWRIGHT_API_KEY` / `NEXT_PUBLIC_API_KEY` on frontend/Playwright | 15/15 persona PASS + 3/3 full-loop PASS | E2E env setup must include API key triple (backend + frontend + Playwright); document in test README | "persona_e2e_401_auth_required_no_api_key" |



## Rolling Update (2026-02-13, SOP 4.1 Project Full-Chain Regression run `4-1-67d46392`)

### Requirements Delta
| ID | Date | Requirement | Priority | Status | Source | Notes |
|---|---|---|---|---|---|---|
| REQ-048 | 2026-02-13 | WS 上游实时行情流必须 opt-in：仅当 `ENABLE_WEBSOCKET=true` 才连接上游（避免受限网络/地区导致的 451 噪音影响主路径） | P1 | Done | SOP 4.1 | Evidence: `outputs/4.1/4-1-67d46392/reports/step4_blocker_scan.md` |
| REQ-049 | 2026-02-13 | 本地回归/E2E 稳定性：API rate-limit 必须可配置（`RATE_LIMIT_WINDOW_MS`/`RATE_LIMIT_MAX_REQUESTS`），避免并发回归触发 429 flake | P1 | Done | SOP 4.1 | Evidence: `outputs/4.1/4-1-67d46392/reports/step4_blocker_scan.md` |
| REQ-050 | 2026-02-13 | Frontend-quality 回归必须记录实际 404 response URL（用于诊断 console `Failed to load resource: 404`） | P2 | Done | SOP 4.1 | Evidence: `outputs/4.1/4-1-67d46392/reports/frontend_quality.json` |

### Prompt Delta
| ID | Prompt | Purpose |
|---|---|---|
| PRM-047 | "Execute SOP 4.1 project full-chain regression (UX Map + E2E): run core-path suites, scan blockers (429/451/404), remediate with config gates, sync PDCA docs, and preserve evidence under outputs/4.1/<run_id>." | 全链路回归 + 卡点治理模板 |

### Anti-Regression Delta
| ID | Symptom | Root Cause | Fix | Verification | Prevention | Trigger |
|---|---|---|---|---|---|---|
| AR-032 | Playwright persona / full-loop 在本地回归中偶发 429 失败 | rate-limit 默认阈值过低且未暴露为可调参数 | compose 暴露 `RATE_LIMIT_WINDOW_MS`/`RATE_LIMIT_MAX_REQUESTS` 并在本地回归提升到 `2000/min` | `outputs/4.1/4-1-67d46392/logs/step3_playwright_rerun.log` | 本地回归脚本默认设置高阈值；生产阈值另行按容量/SLO 回归 | "HTTP 429" |
| AR-033 | 后端 WS 订阅触发上游 BinanceWS 连接并在受限环境产生 451 噪音 | WS server 在任意 subscription 时无条件 connect upstream（忽略 `ENABLE_WEBSOCKET`） | `backend/src/ws/server.ts` 上游连接 gated by `ENABLE_WEBSOCKET` | `outputs/4.1/4-1-67d46392/logs/step4c_backend_logs_after_ws_journey.log` | upstream 默认关闭；仅在需要实时行情流时显式开启 | "Unexpected server response: 451" |
| AR-034 | FE quality scan 只看到 console 404，但无法定位具体资源 URL | 质量扫描未采集 404 response 详情 | `frontend-quality.spec.ts` 记录 `notFoundResponses`（url/method/resourceType） | `outputs/4.1/4-1-67d46392/reports/frontend_quality.json` | 保持 404 response 采集字段，防止回归诊断失明 | "Failed to load resource: the server responded with a status of 404" |

## Rolling Update (2026-02-13, SOP 5.1 Joint Acceptance rerun `5-1-7ca0f855`)

### Requirements Delta
| ID | Date | Requirement | Priority | Status | Source | Notes |
|---|---|---|---|---|---|---|
| REQ-051 | 2026-02-13 | 在关键回归治理（SOP 4.1）后必须复跑 SOP 5.1 联合验收与发布守门（Round1 `ai check` + Round2 UX Map） | P2 | Done | SOP 5.1 | Evidence: `outputs/5.1/5-1-7ca0f855/reports/final_report.md` |

### Prompt Delta
| ID | Prompt | Purpose |
|---|---|---|
| PRM-048 | "Execute SOP 5.1 joint acceptance release gate rerun after a major regression-fix run: planning read, PM/Tech/QA acceptance, Round1 ai check, Round2 UX Map replay with screenshots, and closeout evidence under outputs/5.1/<run_id>." | 联合验收/发布守门复跑模板 |

### Anti-Regression Delta
| ID | Symptom | Root Cause | Fix | Verification | Prevention | Trigger |
|---|---|---|---|---|---|---|
| AR-035 | UX Round2 full-loop-closure API 调用返回 404（误报） | 未显式设置 `FULL_LOOP_API_BASE`，默认指向 `127.0.0.1:3001` 与实际 compose 端口不一致 | Round2 gate 脚本强制注入 `FULL_LOOP_API_BASE=http://127.0.0.1:4008` | `outputs/5.1/5-1-7ca0f855/logs/step4_playwright_ux_round2.log` | 发布守门/回归脚本统一设置 FULL_LOOP_API_BASE 与 PLAYWRIGHT_BASE_URL | "FULL_LOOP_API_BASE" |
