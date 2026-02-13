# SYSTEM_ARCHITECTURE - quantum_x

<!-- AI-TOOLS-MANAGED:PROJECT_DIR START -->
- PROJECT_DIR: /Users/mauricewen/Projects/08-quantum-trading
<!-- AI-TOOLS-MANAGED:PROJECT_DIR END -->

## 系统边界
- 研究与生产分离：研究/回测/模拟/实盘四个环境
- 策略研发、执行、风控与监控解耦
- 外部依赖：数据源、交易通道、风控与合规要求
- 账户模式强隔离：模拟账户与真实账户执行链路分离、权限与审计隔离

## 架构总览
```mermaid
flowchart TB
  subgraph Frontend["Frontend (Next.js 15 + shadcn/ui)"]
    UI[Trading Dashboard]
    Charts[TradingView Charts]
    WS[WebSocket Client]
  end

  subgraph API["API Gateway (BFF)"]
    REST[REST API]
    WSS[WebSocket Server]
    Auth[Auth Service]
    Account[Account Service]
  end

  subgraph Data
    MD[Market Data Ingest]
    FD[Fundamental Data]
    Alt[Alt Data]
    Norm[Normalization]
    Lake[Data Lake]
    Feature[Feature Store]
  end

  subgraph Research
    Lab[Research Studio]
    Orchestrator[Research Orchestrator]
    Train[Model Training]
    Eval[Backtest Engine]
    Registry[Model Registry]
  end

  subgraph Strategy
    Catalog[Strategy Catalog]
    Composer[Strategy Composer]
    Signal[Signal Engine]
    Portfolio[Portfolio Optimizer]
  end

  subgraph Execution
    Risk[Risk Engine]
    OMS[Order Manager]
    EnvGate[Environment Gate]
    Router[Execution Router]
    Venue[Venue Adapters]
  end

  subgraph Copy
    SignalBus[Signal Bus]
    Copy[Copy Trading Service]
    Alloc[Allocation Rules]
  end

  subgraph Ops
    Monitor[Monitoring]
    Audit[Audit Log]
    Config[Config/Secret]
    Governance[Approval & Versioning]
    Vault[Credential Vault]
  end

  UI --> REST
  Charts --> REST
  WS --> WSS
  REST --> Auth
  REST --> Account
  WSS --> Auth

  REST --> Strategy
  REST --> Execution
  Account --> EnvGate
  REST --> Research
  WSS --> Signal
  WSS --> OMS
  WSS --> Monitor

  MD --> Norm --> Lake --> Feature
  FD --> Norm
  Alt --> Norm

  Feature --> Lab --> Orchestrator --> Train --> Registry
  Registry --> Eval --> Catalog

  Catalog --> Composer --> Signal --> Portfolio --> Risk --> OMS --> EnvGate --> Router --> Venue

  Signal --> SignalBus --> Copy --> Alloc --> OMS

  OMS --> Audit
  Risk --> Audit
  Monitor --> Audit
  Account --> Audit
  Router --> Monitor
  Config --> Research
  Config --> Strategy
  Config --> Execution
  Governance --> Catalog
  Governance --> Registry
  Vault --> Account
```

## Frontend 层（新增）

### 技术栈
- **Framework**: Next.js 15 (App Router, RSC, Streaming SSR)
- **UI Components**: shadcn/ui + Tailwind CSS 4
- **Charting**: TradingView Lightweight Charts
- **State**: Zustand (client) + TanStack Query (server)
- **Real-time**: Native WebSocket with auto-reconnect

### 页面结构（59 Routes）

#### Public SEO Surface
| 路由 | 功能 | 索引策略 |
|------|------|--------|
| `/about` | 平台介绍 | index |
| `/pricing` | 定价说明 | index |
| `/security` | 安全与合规说明 | index |
| `/features` | 功能总览 | index |
| `/features/strategy-system` | 策略系统能力页 | index |
| `/features/risk-and-audit` | 风控与审计能力页 | index |
| `/features/account-modes` | 账户模式能力页 | index |
| `/features/research-pipeline` | 研究流水线能力页 | index |
| `/docs` | 文档导航页 | index |
| `/docs/architecture` | 架构文档页 | index |
| `/docs/api-contract` | API 契约文档页 | index |

#### Core / Dashboard
| 路由 | 功能 | 数据源 |
|------|------|--------|
| `/` | Dashboard / Portfolio overview | REST + WS |
| `/portfolio-analytics` | Portfolio analytics & metrics | REST |
| `/allocation` | Asset allocation view | REST |
| `/pnl-calendar` | P&L calendar heatmap | REST |
| `/attribution` | Performance attribution | REST |

#### Trading
| 路由 | 功能 | 数据源 |
|------|------|--------|
| `/trading` | Live trading view | REST + WS |
| `/orderbook` | Order book depth | WS |
| `/signals` | Trading signals | REST + WS |
| `/watchlist` | Watchlist management | REST |
| `/scanner` | Market scanner | REST + WS |

#### Strategies
| 路由 | 功能 | 数据源 |
|------|------|--------|
| `/strategies` | Strategy management | REST |
| `/backtest` | Backtest results | REST |
| `/model-backtest` | ML model backtesting | REST |
| `/optimizer` | Strategy optimizer | REST |
| `/strategy-generator` | AI strategy generator | REST |
| `/ml-models` | ML models management | REST |
| `/feature-importance` | Feature importance analysis | REST |

#### Risk Management
| 路由 | 功能 | 数据源 |
|------|------|--------|
| `/risk` | Risk monitoring dashboard | REST + WS |
| `/position-sizing` | Position sizing calculator | REST |
| `/correlation` | Correlation matrix | REST |
| `/smart-routing` | Smart order routing | REST |

#### Copy Trading
| 路由 | 功能 | 数据源 |
|------|------|--------|
| `/copy` | Copy trading hub | REST + WS |
| `/leaderboard` | Trader leaderboard | REST |
| `/compare` | Strategy comparison | REST |
| `/marketplace` | Strategy marketplace | REST |

#### Accounts
| 路由 | 功能 | 数据源 |
|------|------|--------|
| `/accounts` | Account management (sim/real, activation) | REST |

#### Analysis & Reports
| 路由 | 功能 | 数据源 |
|------|------|--------|
| `/journal` | Trading journal | REST |
| `/calendar` | Calendar view | REST |
| `/trade-stats` | Trade statistics | REST |
| `/arbitrage` | Arbitrage opportunities | REST + WS |
| `/mtf` | Multi-timeframe analysis | REST |
| `/replay` | Market replay | REST |

#### Infrastructure
| 路由 | 功能 | 数据源 |
|------|------|--------|
| `/exchanges` | Exchange connections | REST |
| `/exchange-compare` | Exchange comparison | REST |
| `/api-keys` | API key management | REST |
| `/config` | System configuration | REST |
| `/infrastructure` | Infrastructure status | REST + WS |
| `/monitoring` | System monitoring | REST + WS |
| `/audit` | Audit logs | REST |

#### Settings & Preferences
| 路由 | 功能 | 数据源 |
|------|------|--------|
| `/settings` | User settings | REST |
| `/preferences` | User preferences | REST |
| `/notifications` | Notification settings | REST |
| `/alerts` | Alert management | REST + WS |
| `/dashboard-builder` | Dashboard customization | REST |
| `/mobile` | Mobile-optimized view | REST + WS |

#### Authentication (Route Group: `(auth)`)
| 路由 | 功能 | 数据源 |
|------|------|--------|
| `/login` | User login | REST |
| `/register` | User registration | REST |
| `/forgot-password` | Password reset | REST |

### 性能目标
- LCP < 2.5s
- CLS < 0.1
- FID < 100ms
- Zero console errors

### UI/UX 优化 SOP（2026-01-29 更新）
- 目标范围：历史 48 页面（当前已扩展至 59 页面）
- 一致性约束：页面节奏统一为 `space-y-6`，避免局部页面偏离基线
- 双重 padding 修复：Layout 已提供 `p-4 md:p-6`，页面禁止重复添加 `p-6`
- 层级约束：单页仅保留一个主按钮，次级动作使用 outline 变体
- 验证结果：94/94 E2E 测试通过（M31 达成）

## 前后端入口与契约一致性（SOP 3.2 / last verified: 2026-02-13）

### Canonical Entrypoints
- Frontend HTTP 入口：`frontend/src/lib/api/client.ts`（`NEXT_PUBLIC_API_URL` 归一为 origin，endpoint 统一按 `/api/*` 组装）
- Frontend WS 入口：`frontend/src/lib/ws/client.ts`（默认 `ws://localhost:3002`，由 `NEXT_PUBLIC_WS_URL` 覆盖）
- Frontend 导航入口：`frontend/src/components/layout/sidebar.tsx` + `frontend/src/components/layout/mobile-nav.tsx`（系统入口补齐 `/api-keys` 与 `/audit`）
- Backend 入口：`backend/src/index.ts`（`API_PORT` + `WS_PORT` 双端口启动）
- Backend Route 入口：`backend/src/api/routes.ts`

### Canonical Config Contract
| Key | Canonical Value | 说明 |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://<host>:<port>` | 不带 `/api` 后缀，避免 `/api/api/*` |
| `NEXT_PUBLIC_WS_URL` | `ws://<host>:<port>` | 指向 WS 端口（默认 3002） |
| `API_PORT` | `3001` | HTTP API 监听端口 |
| `WS_PORT` | `3002` | WebSocket 监听端口 |
| `ENABLE_WEBSOCKET` | `true|false` (default `false`) | 控制是否启用 WS 上游实时行情流（BinanceWS）。关闭时仍提供 WS server + auth/acl + subscribe ack，但不推送上游实时数据 |
| `RATE_LIMIT_WINDOW_MS` | `60000` | API 限流窗口（毫秒），本地 E2E 可调优以避免 429 flake |
| `RATE_LIMIT_MAX_REQUESTS` | `100` | API 限流窗口内最大请求数（本地 E2E 可调高，例如 `2000`） |
| `BINANCE_SPOT_REST_BASE_URL` | `https://data-api.binance.vision` | Binance REST base override（受限网络/地区下用于保证行情可达） |

### HTTP Error Contract
- 错误返回统一为：`{ message: string, code: string, status: number, ...extras }`
- 统一收敛点：`backend/src/api/server.ts` 的 `sendJson()` → `normalizeErrorPayload()` 归一化逻辑
- 前端消费入口：`frontend/src/lib/api/client.ts`（按 `message/code/status` 解析）
- Auth-policy 直接输出 `{ message, code }`；routes.ts 输出 `{ error }` 由 normalizer 转为 `{ message, code: 'HTTP_XXX', status }`

### Route Inventory (2026-02-13 verified)
| Category | Count | Auth Level | Frontend Consumer |
|----------|-------|-----------|-------------------|
| Health/Metrics | 3 | public | N/A (infra) |
| Portfolio | 4 | read:account / write:positions | use-portfolio + trading-store |
| Orders | 3 | read:orders / write:orders | trading-store |
| Trades | 1 | read:trades | trading-store |
| Accounts | 5 | read:account / admin | use-accounts |
| Strategies | 6 | read:strategies / write:strategies | use-strategies |
| Market Data | 4 | read:market | use-market-data |
| Risk | 4 | read:risk | use-risk (3/4; /status unused) |
| Audit | 3 | read:audit | audit page (inline) |
| Backtest | 2 | read:backtest / write:backtest | backtest page (inline) |
| API Keys | 7 | read:keys / write:keys | api-keys page (inline) |
| **Total** | **42** | | |

### Regression Tests
- `openapi-sync.test.ts`: routes.ts <-> openapi.yaml parity (excludes non-API `/metrics`)
- `server.contract.test.ts`: error normalization contract
- `auth-policy.test.ts`: public/protected/permissions/fail-closed/mode bypass
- `seo-runtime.test.ts`: public route uniqueness, app-route non-leak, sitemap/robots parity
- `client.test.ts`: URL normalization, error parsing, auth header injection

## 关键模块说明
- 数据层：统一数据接入、质量校验、版本化与特征服务
- 研究层：AI 训练与验证、回测与实验可复现
- 策略层：策略目录、策略编排、信号聚合与元策略
- 执行层：风控、订单管理、执行通道与交易适配器
- 跟单层：信号分发、复制规则、风险隔离
- 运维层：监控告警、审计追踪、配置与密钥管理

## 关键约束
- 回测与实盘接口一致，保证策略迁移成本最小
- 风控规则强制在执行层落地
- 审计日志不可篡改与可追溯
- 市场数据上游不可用时返回 200 + 空数据/缓存，避免 5xx

## 增长入口与 SEO 分层（SOP 1.3 / 2026-02-11）

### Surface 分层模型
- Public SEO Surface（公开可索引）：用于能力表达、合规声明和注册转化承接。
- Authenticated App Surface（登录后控制台）：交易执行、风控、审计等敏感路径默认 noindex。
- 目标：在不放宽安全边界的前提下，让外部用户先“理解价值”再进入“高复杂操作面”。

### 规划站点地图（Public）
- `/`
- `/features/*`
- `/docs/*`
- `/security`
- `/pricing`
- `/about`

### 默认 noindex 路由（App）
- `/trading`, `/risk`, `/accounts`, `/api-keys`, `/audit`, `/settings`, `/monitoring`

### 相关系统职责
- Frontend Metadata 层：区分 public/app 路由的 index/noindex 策略。
- SEO 资产层：`sitemap.xml` + `robots.txt` + structured data（Organization/SoftwareApplication）。
- Analytics 事件层：跟踪 `public -> signup -> activation` 漏斗。

### 证据
- `outputs/1.3/1-3-915e27e6/reports/precheck_arch_route_summary.md`
- `outputs/1.3/1-3-915e27e6/reports/council_role_outputs.md`
- `outputs/1.3/1-3-915e27e6/reports/seo_sitemap_keywords.md`

### 实施状态（SOP 1.3 Continue / 2026-02-11）
- 已新增 SEO 入口清单源：`frontend/src/lib/seo/public-routes.ts`
- 已新增生成路由：`frontend/src/app/sitemap.ts`、`frontend/src/app/robots.ts`
- 已新增公开页面集合：`/about`、`/pricing`、`/security`、`/features/*`、`/docs/*`
- 根布局 metadata 默认 noindex；公开页面按需覆盖为 index/follow
- 已新增路由感知壳层：public/auth 路径不渲染交易控制台壳层（sidebar/header），app 路径保持原壳层

### 增量实施状态（SOP 1.3 Continue v2 / 2026-02-12）
- `features/*` 与 `docs/*` 页面统一接入 `buildPublicMetadata`（canonical + OG + twitter + robots）。
- 公开能力页补齐 `WebPage` JSON-LD 输出，结构化数据从页面硬编码转为 shared schema helper。
- 新增 SEO runtime 契约测试：`frontend/src/lib/seo/seo-runtime.test.ts`，验证 route registry 与 sitemap/robots 生成一致性。

### 实施证据
- `outputs/1.3/1-3-826a518f/reports/seo_implementation_report.md`
- `outputs/1.3/1-3-826a518f/logs/frontend_build.log`
- `outputs/1.3/1-3-a7270c8c/reports/seo_runtime_v2_report.md`
- `outputs/1.3/1-3-a7270c8c/logs/vitest_seo_runtime.log`

## 架构圆桌结论（SOP 1.4 / 2026-02-11）

### Roundtable 输入
- SOP Run: `1-4-052e10d2`
- Council 证据：`outputs/1.4/1-4-052e10d2/reports/architecture-council-report.md`
- 执行报告：`outputs/1.4/1-4-052e10d2/reports/execution-report.md`
- ADR 文档：`doc/00_project/initiative_quantum_x/ARCHITECTURE_ADR_2026-02-11.md`
- 风险清单文档：`outputs/1.4/1-4-052e10d2/reports/risk-register.md`

### 结构化预检摘要
- 项目关键入口文件：`frontend/src/lib/api/client.ts` / `frontend/src/lib/ws/client.ts` / `backend/src/index.ts` / `backend/src/api/server.ts` / `backend/src/api/routes.ts`
- 前端页面路由：48（见 `SYSTEM_ARCHITECTURE.md` 路由表）
- 后端已注册 API：42（`backend/src/api/routes.ts`）
- 历史上下文检索：onecontext/aline 本次 0 命中（`outputs/1.4/1-4-052e10d2/logs/onecontext-broad.log`）

### 三角色共识（Architect / Security / SRE）
- Architect：采用“Dual-Plane, Single-Repo”演进策略，逻辑上分离 Control Plane 与 Stream Plane，代码上先强化 bounded context 边界。
- Security：统一 BFF 安全边界，对关键写接口和 WS 订阅链路补齐 authN/authZ 与 channel ACL。
- SRE：在现有 metrics 基础上补充 SLO-first 可观测性契约，并推动 API/WS 故障域解耦与容量策略化。

### ADR 决策摘要
| ADR | 决策 | 状态 |
|---|---|---|
| ADR-AX-001 | Dual-Plane, Single-Repo 演进路径 | Accepted |
| ADR-AX-002 | BFF + WS 安全边界统一（鉴权+授权） | Accepted |
| ADR-AX-003 | SLO-first 可观测性契约（含 correlation id） | Accepted |

### 风险清单（Top）
| Risk ID | 优先级 | 描述 | 缓解方向 |
|---|---|---|---|
| R-SEC-001 | P0 | WS 订阅无认证 | token handshake + channel ACL |
| R-SEC-002 | P0 | 关键写 API 缺统一 RBAC | API 网关 auth middleware |
| R-SRE-001 | P1 | API/WS 共进程故障域耦合 | 双平面部署演进 |
| R-SRE-002 | P1 | 内存限流在横向扩展下不一致 | 共享限流后端 |
| R-OBS-001 | P1 | 指标未绑定 SLO/错误预算 | RED/SLO 仪表盘+告警 |

### 可观测性与容量建议（下一迭代）
- 定义 SLO：API 可用性 `>=99.9%`、关键接口 p95 `<200ms`、WS 新鲜度与重连时间预算。
- 增加 correlation id：REST -> Audit -> WS 全链路可追踪。
- 对 WS 广播链路增加背压与订阅上限策略，防止高频 symbol 风暴。
- 为扩展预留 shared state（限流/订阅）方案，减少多实例行为漂移。

### Council Refresh（SOP 1.4 / 2026-02-12）
- SOP Run: `1-4-037ae7e8`
- Precheck: `outputs/1.4/1-4-037ae7e8/reports/precheck_arch_route_summary.md`
- Council 输出：`outputs/1.4/1-4-037ae7e8/reports/architecture-council-report.md`
- ADR 摘要：`outputs/1.4/1-4-037ae7e8/reports/adr-summary.md`
- 风险清单：`outputs/1.4/1-4-037ae7e8/reports/risk-register.md`

#### 增量结论
- Architect：继续保持 dual-surface/dual-plane 方向，但要求 route inventory 自动生成并回写文档，避免路由规模与架构文档漂移。
- Security：WS query token 存在泄露面，建议迁移为短时效、最小权限的 WS 会话令牌。
- SRE：审计日志启动阶段存在大文件读入风险，需分片 + 轮转 + 启动期有界扫描。

#### 新增 ADR
| ADR | 决策 | 状态 |
|---|---|---|
| ADR-AX-004 | 审计日志分片与轮转（有界启动扫描） | Accepted |
| ADR-AX-005 | WS 鉴权传输加固（短时效 scoped session token） | Accepted |
| ADR-AX-006 | 前端质量扫描作为发布守门 | Accepted |

#### 新增风险（Refresh）
| Risk ID | 优先级 | 描述 | 缓解方向 |
|---|---|---|---|
| R-REL-003 | P0 | 审计日志过大导致启动读取失败 | 分片存储 + 轮转 + bounded read |
| R-SEC-003 | P1 | WS query token 暴露风险 | 短时效 WS session token + 缩短令牌生命周期 |
| R-OBS-002 | P1 | 降级路径缺少 SLO burn 信号 | 增加 degradation counter 与 error-budget 仪表盘 |
| R-ARCH-002 | P2 | 路由清单与文档存在漂移 | CI 生成 route inventory 并同步 managed block |
| R-QA-002 | P1 | 前端质量报告持续出现 hydration page error | deterministic data 渲染强化 + route 级回归测试 |

## 全局沙盒化策略（SOP 1.11 / 2026-02-11）

### 输入与证据
- SOP Run: `1-11-7012f820`
- 证据目录：`outputs/sop-global-sandbox/1-11-7012f820/`
- 安全说明：`doc/00_project/initiative_quantum_x/SANDBOX_SECURITY_STATEMENT.md`

### 沙盒执行边界
- 本地隔离：`scripts/sandbox/run_local_sandbox.sh`（Docker 沙盒，默认 rootfs 只读）
- 云沙盒探测：`scripts/sandbox/run_cloud_sandbox.sh`（daytona -> modal -> local fallback）
- 策略配置：`configs/sandbox/sandbox_policy.yaml` + `scripts/sandbox/POLICY.md`
- 任务映射：`configs/sandbox/key_task_profiles.yaml`

### 强制约束
- 默认离线（`network=none`）执行关键任务；
- 工作区只读，写入仅允许 `outputs` 和 `tmp`；
- 按 profile 限制 CPU/内存/PIDs，超时触发 watchdog 终止并标准化返回码 `124`；
- 容器强制 `no-new-privileges` + `cap-drop ALL`；
- 每次执行写入 `*.meta`，记录资源配额、网络模式与挂载策略；
- 所有沙盒运行日志落盘到 `outputs/sop-global-sandbox/<run-id>/logs/`。

### 已验证证据（本次 run）
- 架构/入口结构化预检：`outputs/sop-global-sandbox/1-11-7012f820/reports/precheck_summary.md`
- 网络封锁探针：`outputs/sop-global-sandbox/1-11-7012f820/logs/20260211-231959_strict_offline.log`（`network_blocked`）
- 只读文件系统探针：`outputs/sop-global-sandbox/1-11-7012f820/logs/20260211-232028_strict_offline.log`（`Read-only file system`）
- 超时策略探针：`outputs/sop-global-sandbox/1-11-7012f820/logs/20260211-233416_strict_offline.log`（exit_code `124`）
- 离线构建任务探针：`outputs/sop-global-sandbox/1-11-7012f820/logs/20260211-232015_build_offline.log`（backend typecheck pass）
- 云沙盒探测：`outputs/sop-global-sandbox/1-11-7012f820/logs/20260211-232037_cloud_probe.log`（provider unavailable, fallback local）

## API 契约与鉴权同步（SOP 1.6 / 2026-02-12）

### Run 信息
- SOP Run: `1-6-f056f6f5`
- 证据目录：`outputs/1.6/1-6-f056f6f5/`

### REST 安全边界（已落地）
- `ApiServer` 新增集中 request guard：`backend/src/api/server.ts`
- 策略映射：`backend/src/api/auth-policy.ts`
  - public: `GET /api/health`, `GET /api/ready`, `GET /metrics`
  - 其余 `/api/*` 按 route -> permission 映射执行鉴权
  - 未声明 `/api/*` 默认 `admin`（fail-closed）

### WS 安全边界（已落地）
- 连接鉴权：`backend/src/ws/server.ts`
  - 需要 `?token=<api_key>`（或 header fallback）
  - 校验 `read:ws` + IP whitelist
- 订阅 ACL：
  - `ticker/kline/trade/orderbook` -> `read:market`
  - `portfolio` -> `read:account`
  - `risk` -> `read:risk`

### 配置入口（canonical）
| Key | Scope | Canonical | 说明 |
|---|---|---|---|
| `API_AUTH_MODE` | backend | `required` \/ `off` | 默认 `required` |
| `API_STATIC_KEY` | backend | `<secret>` | 本地 bootstrap（生产建议空） |
| `NEXT_PUBLIC_API_KEY` | frontend | `<same-as-static-or-issued-key>` | 用于 HTTP/WS token 注入 |

### Contract 变更
- OpenAPI 已同步 security schemes（Bearer + X-API-Key）：`backend/docs/openapi.yaml`
- Error contract 统一为 `{message, code, status}`
- Breaking changes 已在 OpenAPI 中标记（2026-02-11）

### 证据
- `outputs/1.6/1-6-f056f6f5/reports/precheck_arch_route_summary.md`
- `outputs/1.6/1-6-f056f6f5/reports/api_contract_auth_sync.md`
- `outputs/1.6/1-6-f056f6f5/reports/verification.md`
- `outputs/1.6/1-6-f056f6f5/diff/api-contract-auth-sync.patch`

## 前后端一致性复核（SOP 3.2 Recheck / 2026-02-12）

- Run ID: `3-2-6fef5bcb`
- 目标：在 SOP 1.6 鉴权改造后，验证入口、契约、配置与运行时行为一致。

### 复核结论
- Route/OpenAPI 一致性：方法级比对 `42 == 42`，无缺失操作。
- 配置入口一致性：`API_AUTH_MODE`/`API_STATIC_KEY`/`NEXT_PUBLIC_API_KEY` 已在 `.env` 与 compose 中对齐。
- 运行时鉴权一致性：
  - HTTP：无 key `401`、坏 key `401`、只读 key 写操作 `403`。
  - WS：无 token/坏 token 拒绝，合法 token 订阅成功，`read:ws` 但无 `read:market` 被 `WS_FORBIDDEN` 拒绝。

### 证据
- `outputs/3.2/3-2-6fef5bcb/reports/final_report.md`
- `outputs/3.2/3-2-6fef5bcb/reports/runtime-auth-ws-check.md`

## 调用入口与旅程守门增量（SOP 3.6 Continue / 2026-02-12）

### Frontend Caller 收敛
- 调整页面：`/api-keys`、`/audit`、`/backtest`。
- 架构约束：业务页调用后端必须走 `frontend/src/lib/api/client.ts`（统一 URL 规范化 + auth header 注入 + 错误契约解析）。

### CI 守门增强
- `.github/workflows/ci.yml` 新增显式 `Persona Real-Flow Smoke (chromium)`。
- 目的：把多 persona 跨页面真实流程作为发布前强制门禁，而非仅依赖页面可达性测试。

### 证据
- `outputs/3.6/3-6-4beb69e2/reports/final_report.md`
- `outputs/3.6/3-6-4beb69e2/diff/followup-api-client-ci-persona.patch`

## Frontend Internal AI API Layer（SOP 3.2 Continue / 2026-02-12）

- 新增模块：`frontend/src/lib/ai/http.ts`
- 责任边界：
  - 只服务于 frontend internal routes（`/api/ai/*`）；
  - 提供统一路径规范化、错误提取与 JSON 请求封装；
  - 与 backend `apiClient` 分层，避免鉴权语义交叉污染。
- 证据：`outputs/3.2/3-2-d2852a9b/reports/ai-internal-api-consistency.md`

## AI Provider HTTP Adapter Layer（SOP 3.2 Continue / 2026-02-12）

- 新增模块：`frontend/src/lib/ai/providers/http.ts`
- 角色：
  - 为 provider 提供统一 timeout/network/http error 处理；
  - 输出统一 AIError 语义（`*_timeout`, `*_network_error`, `*_<status>`）；
  - 降低 provider 实现重复与漂移风险。
- 证据：`outputs/3.2/3-2-082c2e98/reports/provider-http-normalization.md`

## SOP 1.1 全量交付治理增量（2026-02-12）
- 引入 run 级证据目录规范：`outputs/1.1/1-1-065abd2c/{logs,reports,diff,screenshots,history}`。
- 强化“架构一致性验证”执行顺序：plan-first -> 前后端契约/入口复核 -> UX Map 模拟 -> closeout。
- 对误触发/悬挂 SOP run 执行状态收敛（running -> completed/failed），避免运行态漂移。

## SOP 1.1 全量交付治理增量（run `1-1-461afeb6`, 2026-02-12）
- Run 级证据目录规范：`outputs/1.1/1-1-461afeb6/{logs,reports,diff,screenshots,history}`。
- 预检流程固定顺序：`plan-first -> architecture/entrypoint inventory -> PDCA sync -> validation gates -> closeout`。
- SOP 运行态治理：对误触发/悬挂 run 执行状态收敛，避免 `running` 残留。

### 证据
- `outputs/1.1/1-1-461afeb6/reports/project-entrypoints-inventory.txt`
- `outputs/1.1/1-1-461afeb6/logs/sop-final-status.log`

## SOP 1.1 架构治理收口（run `1-1-065abd2c`, 2026-02-12）

- 验证链路固定为：`plan-first -> FE/BE entrypoint+contract -> UX Map round2 -> closeout`。
- 新增前端质量守门测试：`frontend/e2e/frontend-quality.spec.ts`，统一产出 network/console/performance/visual 报告与截图。
- 修复 mock 数据层 hydration 风险：`frontend/src/lib/mock-data.ts` 改为 seed-deterministic 生成，减少 SSR/CSR 非确定性差异。
- 证据目录：`outputs/1.1/1-1-065abd2c/{logs,reports,screenshots}`。

### 证据
- `outputs/1.1/1-1-065abd2c/logs/frontend_quality_scan.log`
- `outputs/1.1/1-1-065abd2c/reports/frontend_quality/network_console_performance_visual.json`
- `frontend/e2e/frontend-quality.spec.ts`

## SOP 1.1 架构治理增量（run `1-1-10f2b0dc`, 2026-02-12）

- 新一轮全量交付运行根目录：`outputs/1.1/1-1-10f2b0dc/{logs,reports,diff,screenshots,history}`。
- 前端首屏确定性原则强化：`trading-store` 首屏 mock orderbook 改为 deterministic seeded 生成，避免 SSR/CSR 初始渲染分叉。
- 后端审计加载边界强化：`AuditLogger` 对超大日志文件采用 tail-load（有上限）而非全量读入，降低启动时内存与字符串溢出风险。
- 验证门禁延续 Pipeline：`plan-first -> UX round2 -> ai check -> FE/BE consistency -> closeout`。

### 证据
- `outputs/1.1/1-1-10f2b0dc/reports/`

## SOP 3.7 架构闭环复核（run `3-7-7d7d416f`, 2026-02-12）
- 入口层：UI route/button + CLI + config 入口统一可达性验证。
- 集成层：`full-loop-closure.spec.ts` 验证前端->后端->持久化->回显链路。
- 契约层：route/openapi parity 与 auth policy 合同测试共同守门。
- 验证层：`ai check` + e2e 回归完成最终闭环。

### 证据
- `outputs/3.7/3-7-7d7d416f/reports/step2_entrypoint_closure.md`
- `outputs/3.7/3-7-7d7d416f/reports/step3_system_closure.md`
- `outputs/3.7/3-7-7d7d416f/reports/step4_contract_closure.md`

## SOP 1.1 架构治理执行（run `1-1-70defaf7`, 2026-02-12）

- 运行根目录：`outputs/1.1/1-1-70defaf7/{logs,reports,diff,screenshots,history}`。
- 验证链路沿用：`plan-first -> doc-first sync -> ai check -> UX round2 -> FE/BE consistency -> closeout`。
- 本轮保持架构边界不变（不引入新组件、不变更系统分层），重点验证治理流程与证据闭环。

### 证据
- `outputs/1.1/1-1-70defaf7/logs/sop_step12_status.log`
- `outputs/1.1/1-1-70defaf7/reports/plan_first.md`

## SOP 4.1 全链路回归执行约束（run `4-1-873e9072`, 2026-02-12）

- 回归入口固定：`navigation.spec.ts`、`persona-real-flow.spec.ts`、`full-loop-closure.spec.ts`。
- 执行编排固定：inline orchestration（启动 backend -> 执行回归 -> 退出），避免跨命令后台进程漂移导致 `ECONNREFUSED`。
- 隔离端口：Backend `3441/3442`，frontend 由 Playwright webServer 管理。
- 鉴权策略：回归环境使用 `API_AUTH_MODE=off` 进行 UX 主路径验证；鉴权边界由 SOP 1.6 / 3.2 回归门禁保障。
- 当前 run 未引入新架构组件，保持既有分层边界，仅追加治理证据。

### 证据
- `outputs/4.1/4-1-873e9072/reports/step3_ux_core_path.md`
- `outputs/4.1/4-1-873e9072/reports/step4_blocker_scan.md`
- `outputs/4.1/4-1-873e9072/logs/step3-backend-inline.log`

## SOP 3.9 供应链安全持续监控（run `3-9-38510f7f`, 2026-02-12）

- 新增 CI `Supply Chain Security Gate`（`.github/workflows/ci.yml`）：
  - `npm audit --audit-level=high`（frontend/backend）
  - `lockfile-lint`（host allowlist: `npm`）
  - `detect-secrets scan`
  - Python 审计（`pip-audit` / `safety`，在存在 requirements 时执行）
  - 新增依赖 allowlist 校验（`scripts/ci/check-new-dependencies.mjs` + `configs/dependency-allowlist.json`）
- 高危漏洞处置：frontend `next` 从 `16.1.4` 升级到 `16.1.6`，high/critical 归零。
- 月度归档：`outputs/3.9-supply-chain/2026-02-12_3-9-38510f7f`。
- 架构边界保持不变；本次变更集中在“供应链安全门禁层”与“发布前审计流程”。

### 证据
- `outputs/3.9/3-9-38510f7f/reports/step2_dependency_audit_summary.md`
- `outputs/3.9/3-9-38510f7f/reports/step3_high_vuln_resolution.md`
- `outputs/3.9/3-9-38510f7f/reports/step4_ci_gate_summary.md`
- `outputs/3.9/3-9-38510f7f/reports/final_report.md`

## SOP 1.1 Architecture Governance Update (2026-02-12, run `1-1-c1a3a846`)

- 本轮不引入新系统组件，不调整层次边界。
- 验证链路执行策略：backend(隔离端口) + frontend(`build + start`) + Playwright reuseExistingServer。
- 目的：规避 `next dev` 首次编译抖动导致的非业务性 `net::ERR_ABORTED`，提高回归证据稳定性。
- 架构边界保持：`Frontend(Next.js)` -> `Backend API` -> `Store/Audit`。

## SOP 3.2 入口一致性补充校验（2026-02-12, run `3-2-b17821b0`）

### 结论
- Frontend 路由与导航入口：无缺失页面（href 全部可达）。
- Backend `/api/*` 与 OpenAPI `/api/*`：路径集合一致（对 backend `:param` 做 `{param}` 规范化后）。
- Error contract：frontend `ApiClientError` 与 backend `sendJson()` 规范化逻辑一致。

### 新增守门
- Backend OpenAPI sync contract test：`backend/src/api/openapi-sync.test.ts`

### 证据
- `outputs/3.2/3-2-b17821b0/reports/step2_entrypoint_consistency.md`
- `outputs/3.2/3-2-b17821b0/reports/step3_contract_alignment.md`
- `outputs/3.2/3-2-b17821b0/logs/step3_openapi_sync_test.log`
