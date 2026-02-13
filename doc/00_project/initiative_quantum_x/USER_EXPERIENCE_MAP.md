# USER_EXPERIENCE_MAP - quantum_x

<!-- AI-TOOLS-MANAGED:PROJECT_DIR START -->
- PROJECT_DIR: /Users/mauricewen/Projects/08-quantum-trading
<!-- AI-TOOLS-MANAGED:PROJECT_DIR END -->

## 角色与目标
- 量化研究员：快速实验、可复现研究、策略迭代
- 交易/风控：稳定执行、风险控制、异常可追踪
- 运营/合规：版本可审计、权限清晰、合规可验证
- 客户/跟单用户（未来）：透明风险、稳定信号、可控复制

## 用户旅程（高层）
| 阶段 | 触点 | 用户目标 | 系统能力 | 关键证据 |
|---|---|---|---|---|
| 发现与评估 | Public Site / Features / Docs | 理解平台能力边界与合规口径 | 公开能力页、风险披露、注册入口 | sitemap/SEO 报告 |
| 研究准备 | Data Hub / Feature Store | 数据可用、可追溯 | 数据版本与质量校验 | 数据报告 |
| 策略开发 | Research Studio | 快速验证策略 | 训练/回测/实验记录 | 实验日志 |
| 策略评审 | Strategy Registry | 可审计上线 | 版本控制与审批 | 审批记录 |
| 账户准备 | Accounts | 选择模拟/实盘并完成接入与激活 | 账户分离、权限与风控提示、显式激活 | 授权/接入记录 |
| 模拟交易 | Paper Trading | 风险可控试运行 | 统一执行链路 | 仿真报表 |
| 小资金实盘 | Execution Console | 稳定执行 | 风控约束、审计日志 | 实盘日志 |
| 放量与跟单 | Copy Trading Hub | 扩大规模 | 信号分发与复制规则 | 跟单报表 |
| 运营与审计 | Monitoring / Audit | 可追溯 | 监控告警与审计 | 审计记录 |

## 关键体验指标
- 策略从研究到实盘的迁移时间
- 回测与实盘偏差
- 风控触发与异常处理时长
- 跟单信号延迟与执行偏差
- 账户接入时长与授权完成率
- 模拟/实盘切换成功率
- 市场数据不可用时空态呈现成功率（5xx=0）
- 关键交易路径可用性（SLO >= 99.9%）
- 未授权订阅/越权操作拦截率（目标 100%）
- 关键任务沙盒执行覆盖率（目标 >= 90%）

## 多类型 Persona 真实流程验证（SOP 3.6 / 2026-02-11）

### Persona 脚本（Entry > Task > Result）
| Persona | Entry | Task | Result | 对齐旅程 |
|---|---|---|---|---|
| 量化研究员 | `/strategies` | 查看策略 -> 进入 `/model-backtest` -> 执行回测 | `Avg Test Accuracy` 可见 | 策略开发 -> 策略评审 |
| 执行交易员 | `/accounts` | 创建模拟账户 -> 进入 `/trading` -> 进入 `/risk` | 新账户可见，交易页/风控页可用 | 账户准备 -> 模拟交易 -> 小资金实盘 |
| 运营/合规 | `/api-keys` | 创建 API Key -> 确认密钥提示 -> 进入 `/audit` | 创建成功提示 + 审计页可用 | 运营与审计 |

### 非生产环境与结果
- 非生产环境：Backend `39011/39012` + Playwright 临时前端端口（`3010`、`38110`、`38121`）
- 首次执行：0/3 通过（端口冲突导致后端不可用）
- 修复后复测（串行）：3/3 通过
- 修复后复测（并行/Council 风格）：3/3 通过
- 全浏览器矩阵复测（chromium/firefox/webkit/mobile）：15/15 通过
- 最终成功率：100%（15/15）

### 证据
- `outputs/sop-persona-real-flow/run-20260211-221036/reports/persona_scripts.md`
- `outputs/sop-persona-real-flow/run-20260211-221036/reports/execution_summary.md`
- `outputs/sop-persona-real-flow/run-20260211-221036/logs/playwright_persona_all_projects_rerun.log`
- `outputs/sop-persona-real-flow/run-20260211-221036/screenshots/`

## UI/UX 规范合规状态（PDCA-2 审计）

| 检查项 | 状态 | 证据 |
|---|---|---|
| 视口高度 | PASS | `layout.tsx:44`, `sidebar.tsx:110` 使用 `h-dvh` |
| 8pt 间距体系 | PASS | `globals.css` 定义 `.space-section/group/item` |
| 页面级间距 | PASS | 所有 48 页使用 `space-y-6` 作为根容器 |
| 单一主按钮原则 | PASS | 每页仅一个默认变体 Button |
| 层级清晰 | PASS | PageHeader 组件强制一致层级 |
| 留白分组 | PASS | Card 使用内置 Header/Content 间距 |
| 无障碍 (a11y) | PASS | ARIA labels, role 属性, skip-link, focus-ring |
| 减少动画偏好 | PASS | `@media (prefers-reduced-motion: reduce)` |

**审计日期**: 2026-01-28
**结论**: 无需代码变更，UI/UX 已符合 ui-skills 和 web-interface-guidelines 规范

## UI/UX 优化 SOP（2026-01-28）
- 目标页面：`/accounts`
- 问题与修复：页面节奏对齐全站基线（`space-y-6`），主/次按钮层级明确（仅保留一个默认主按钮）
- 验证证据：network/console/performance/visual regression 结果 + 截图

## 架构圆桌对体验保障的影响（SOP 1.4 / 2026-02-11）

- 变更性质：非功能性增强（安全边界 + 可靠性 + 可观测性），不改变既有用户主路径。
- 体验影响映射：
  - 账户准备 -> 模拟/实盘：增加鉴权与授权一致性，降低误操作与越权风险；
  - 模拟/实盘执行：通过 SLO 与告警门限缩短故障发现与恢复时间；
  - 运营与审计：增强 REST/WS/Audit 关联追踪能力，提升问题定位效率。
- 证据：
  - `outputs/sop-architecture-council/1-4-2bc405e8/reports/architecture-council-report.md`
  - `doc/00_project/initiative_quantum_x/ARCHITECTURE_ADR_2026-02-11.md`

## 全局沙盒化对体验保障的影响（SOP 1.11 / 2026-02-11）

- 变更性质：非功能性增强（执行隔离 + 资源配额 + 网络最小权限），不改变既有交易业务流程。
- 体验影响映射：
  - 研究/运营类关键任务：默认离线沙盒，降低误操作影响半径；
  - 交付验证任务：通过只读工作区和超时策略减少卡死与污染风险；
  - 故障恢复：执行证据统一落盘，提升排障可审计性与可复现性。
- 证据：
  - `outputs/sop-global-sandbox/1-11-7012f820/reports/precheck_summary.md`
  - `outputs/sop-global-sandbox/1-11-7012f820/reports/sandbox_execution_evidence.md`
  - `doc/00_project/initiative_quantum_x/SANDBOX_SECURITY_STATEMENT.md`

## API 契约与鉴权同步对体验保障的影响（SOP 1.6 / 2026-02-12）

- 变更性质：功能与非功能混合（入口鉴权 + 契约标准化），对用户主路径有可见前置条件变更。
- 体验影响映射：
  - 账户准备 -> 交易/风控：调用 API 前必须具备有效 key（减少越权调用）。
  - 运营与审计：API key 生命周期页面（`/api-keys`）成为关键入口能力。
  - 实时体验：WS 订阅增加 token 与 ACL，未授权订阅将被明确拒绝并返回结构化错误。
- 体验指标补充：
  - 未授权请求拦截率（目标 100%）
  - 授权配置失败率（目标持续下降）
  - 鉴权错误可诊断率（message/code/status 完整性）
- 证据：
  - `outputs/1.6/1-6-f056f6f5/reports/precheck_arch_route_summary.md`
  - `outputs/1.6/1-6-f056f6f5/reports/verification.md`

## 多角色头脑风暴对体验链路的影响（SOP 1.3 / 2026-02-11）

- 变更性质：体验链路前置增强（从“登录后可用”扩展为“发现->评估->注册->激活->使用”）。
- 旅程补全：
  - 新增前置阶段“发现与评估”，承接公开流量并完成能力解释；
  - 控制台路径保持授权后可见，避免未登录用户被复杂交易界面阻断。
- 体验指标补充：
  - 公开页到注册转化率（organic_to_signup_rate）
  - 注册到账户激活转化率（signup_to_activation_rate）
  - 公开页合规声明覆盖率（目标 100%）
- 证据：
  - `outputs/1.3/1-3-915e27e6/reports/council_role_outputs.md`
  - `outputs/1.3/1-3-915e27e6/reports/conflicts_consistency_decisions.md`
  - `outputs/1.3/1-3-915e27e6/reports/seo_sitemap_keywords.md`

### 实施状态（SOP 1.3 Continue / 2026-02-11）
- 已上线 discoverability 入口：`/about`、`/pricing`、`/security`、`/features/*`、`/docs/*`。
- 搜索引擎策略：app 路由默认 noindex，公开页显式 index/follow。
- 证据：
  - `outputs/1.3/1-3-826a518f/reports/seo_implementation_report.md`
  - `outputs/1.3/1-3-826a518f/logs/frontend_build.log`

### 增量实施状态（SOP 1.3 Continue v2 / 2026-02-12）
- `features/*` 与 `docs/*` 公开能力页已补齐 shared metadata 与 JSON-LD，公开旅程信息表达口径一致。
- SEO runtime 回归用例已纳入（registry/sitemap/robots），降低“公开入口回归”对发现阶段体验的影响。
- 证据：
  - `outputs/1.3/1-3-a7270c8c/reports/seo_runtime_v2_report.md`
  - `outputs/1.3/1-3-a7270c8c/logs/vitest_seo_runtime.log`
  - `outputs/1.3/1-3-a7270c8c/logs/playwright_navigation.log`

## 一致性回归复核对体验的确认（SOP 3.2 Recheck / 2026-02-12）
- 结论：鉴权收口后关键入口体验未退化；未授权请求与越权订阅均被结构化拒绝。
- 体验保障：错误响应统一 `message/code/status`，前端可稳定展示可诊断错误。
- 证据：`outputs/3.2/3-2-6fef5bcb/reports/runtime-auth-ws-check.md`。

## Persona 流程守门增强（SOP 3.6 Continue / 2026-02-12）

- 变更性质：体验稳定性增强（调用一致性 + CI 真实流程守门），不改变业务链路顺序。
- 体验影响映射：
  - 运营与审计：`/api-keys`、`/audit` 请求入口统一到 `apiClient`，鉴权失败提示一致；
  - 研究与回测：`/backtest` 请求入口统一到 `apiClient`，减少环境变量口径偏差；
  - 多 persona 流程：CI 新增 chromium real-flow smoke，提前拦截跨页面 journey 回归。
- 验证结果：
  - persona real-flow（chromium）`3/3` PASS；
  - UX round2 navigation（chromium）`10/10` PASS。
- 证据：
  - `outputs/3.6/3-6-4beb69e2/reports/final_report.md`
  - `outputs/3.6/3-6-4beb69e2/logs/persona-e2e-chromium-isolated.log`
  - `outputs/3.6/3-6-4beb69e2/logs/ux-round2-navigation.log`

### SOP 3.6 回归复跑（2026-02-12, run `3-6-62df5dbf`）

- 目的：在当前基线对多 persona 真实流程进行一次回归确认，确保核心旅程未漂移。
- 结果：persona real-flow（chromium）`3/3 PASS`。
- 证据：
  - `outputs/3.6/3-6-62df5dbf/reports/step2_personas_and_scripts.md`
  - `outputs/3.6/3-6-62df5dbf/logs/step3_persona_real_flow_e2e.log`
  - `outputs/3.6/3-6-62df5dbf/screenshots/persona_real_flow/`
  - `outputs/3.6/3-6-62df5dbf/reports/step4_summary_and_doc_updates.md`

## AI 助手路径稳定性增强（SOP 3.2 Continue / 2026-02-12）

- 变更性质：前端内部调用一致性增强，不改变页面入口路径。
- 体验影响映射：
  - AI 聊天与分析场景错误反馈口径统一，失败时可更稳定地提示用户；
  - stream 响应中的服务端错误不再被吞掉，减少“卡住但无提示”体验。
- 证据：
  - `outputs/3.2/3-2-d2852a9b/reports/final_report.md`

## AI Provider 可用性稳定性增强（SOP 3.2 Continue / 2026-02-12）

- 变更性质：AI provider 侧稳定性增强，不改变用户路径。
- 体验影响映射：
  - AI 能力调用失败时错误反馈口径更一致；
  - 超时场景可被明确归类，便于前端和监控识别。
- 证据：
  - `outputs/3.2/3-2-082c2e98/reports/final_report.md`

## SOP 1.1 体验验证增量（2026-02-12）
- Round2 采用 UX Map 人工模拟脚本化执行（navigation + persona + full-loop）。
- 同类问题扫描策略：发现单点问题时，按同路径/同入口/同契约扩散检查并一并修复。
- 证据要求：测试日志、关键截图、问题与修复对照同时写入 notes.md。

## SOP 1.1 体验验证增量（run `1-1-461afeb6`, 2026-02-12）
- Round2 采用 UX Map 人工模拟脚本化执行：`navigation` + `persona` + `full-loop`。
- 同类问题扫描策略：命中问题后按同入口/同契约路径做扩散检查并落证据。
- 目标：确保“发现 -> 注册 -> 激活 -> 交易/审计”主路径在本轮无回归。

### 证据
- `outputs/1.1/1-1-461afeb6/logs/ux-round2-navigation.log`
- `outputs/1.1/1-1-461afeb6/logs/persona-real-flow.log`
- `outputs/1.1/1-1-461afeb6/logs/full-loop-closure.log`

## SOP 1.1 体验验证收口（run `1-1-065abd2c`, 2026-02-12）

- Round2 脚本：`navigation + persona + full-loop`（chromium）`16/16 PASS`。
- Persona 断言改造后，失败场景可直接暴露响应 payload，减少“超时但无根因”的定位成本。
- 前端质量扫描覆盖 6 条关键入口路径（`/`, `/trading`, `/strategies`, `/accounts`, `/api-keys`, `/audit`），截图与性能数据落盘。

### 证据
- `outputs/1.1/1-1-065abd2c/logs/playwright_ux_round2_isolated_fixed.log`
- `outputs/1.1/1-1-065abd2c/logs/frontend_quality_scan.log`
- `outputs/1.1/1-1-065abd2c/reports/frontend_quality/network_console_performance_visual.json`

## SOP 1.1 体验复核增量（run `1-1-10f2b0dc`, 2026-02-12）

- Round2 脚本沿用并复核：
  - `navigation.spec.ts`
  - `persona-real-flow.spec.ts`
  - `full-loop-closure.spec.ts`
- 体验收口目标：
  - 关键入口路径可达与流程成功率维持通过；
  - Trading 页面不再出现 hydration page error；
  - API/Audit 页面在受控测试环境下不产生非预期 console 异常。

### 证据
- `outputs/1.1/1-1-10f2b0dc/logs/`
- `outputs/1.1/1-1-10f2b0dc/screenshots/`

## SOP 3.7 体验闭环复核（run `3-7-7d7d416f`, 2026-02-12）
- 入口体验：`navigation.spec.ts` 验证关键页面与移动端导航入口可达。
- 任务体验：`full-loop-closure.spec.ts` 验证关键业务闭环与错误路径提示可追踪。
- 结果体验：所有回归用例通过并有截图/日志证据，保持“入口->任务->结果”链路连续。

### 证据
- `outputs/3.7/3-7-7d7d416f/logs/entrypoint-navigation.log`
- `outputs/3.7/3-7-7d7d416f/logs/system-full-loop.log`

## SOP 1.1 体验复核执行（run `1-1-70defaf7`, 2026-02-12）

- Round2 脚本计划：
  - `frontend/e2e/navigation.spec.ts`
  - `frontend/e2e/persona-real-flow.spec.ts`
  - `frontend/e2e/full-loop-closure.spec.ts`
- 同类问题扫描策略：若命中入口异常，则按同入口（`/trading`, `/accounts`, `/api-keys`, `/audit`）做扩散回归。
- 目标：保持“发现 -> 激活 -> 交易/审计”主路径可达性与流程成功率。

### 证据
- `outputs/1.1/1-1-70defaf7/logs/playwright_ux_round2.log`
- `outputs/1.1/1-1-70defaf7/reports/ux_map_simulation.md`

## SOP 4.1 UX Map 回归（run `4-1-873e9072`, 2026-02-12）

- 变更性质：体验验证治理增强，不改动用户旅程结构。
- 覆盖脚本：`navigation + persona-real-flow + full-loop-closure`（chromium）。
- 阶段结果（Step 3/4）：`16/16 PASS`，无新增 journey blocker。
- 同类问题扫描：未复现 `integration_process_lifecycle_drift`；上游 timeout 仅为非阻断噪音。

### 证据
- `outputs/4.1/4-1-873e9072/reports/step3_ux_core_path.md`
- `outputs/4.1/4-1-873e9072/reports/step4_blocker_scan.md`
- `outputs/4.1/4-1-873e9072/logs/step3-ux-core.log`

## SOP 1.1 UX Validation Update (2026-02-12, run `1-1-c1a3a846`)

- 核验旅程：
  - Quant Researcher: `/strategies -> /model-backtest`
  - Execution Trader: `/accounts -> /trading -> /risk`
  - Ops & Compliance: `/api-keys -> /audit`
- 核验结果：Round 2 回归通过（见 `outputs/1.1/1-1-c1a3a846/reports/step4_ux_round2.md`）。

## SOP 3.6 多类型客户真实流程复测（run `3-6-fb667615`, 2026-02-13）

- 变更性质：体验验证（无代码变更），在 SOP 3.2 re-audit 之后确认 persona 主路径无回归。
- 环境：Backend `39011/39012` + Frontend webpack mode port `3000` + `API_STATIC_KEY`。
- Persona 矩阵结果：

| Persona | chromium | firefox | webkit | Mobile Chrome | Mobile Safari |
|---|---|---|---|---|---|
| 量化研究员 | PASS | PASS | PASS | PASS | PASS |
| 执行交易员 | PASS | PASS | PASS | PASS | PASS |
| 运营/合规 | PASS | PASS | PASS | PASS | PASS |

- 成功率：**15/15 (100%)**
- Full-loop-closure（chromium）：**3/3 PASS**
- 证据：56 screenshots captured。
- 非 persona 已知问题：Settings/Alerts 需浏览器会话 token（auth-guard 重定向）；Mobile drawer CSS 动画不稳定。分类：pre-existing，非回归。
- 证据路径：
  - `outputs/3.6/3-6-fb667615/screenshots/` (56 PNGs)
  - `outputs/3.6/3-6-fb667615/logs/persona-chromium.log`
