# PLATFORM_OPTIMIZATION_PLAN - quantum_x

## 优化目标
- 低延迟与高可用的执行链路
- 回测与实盘一致性提升
- 成本可控、弹性扩展
- 模型与策略的稳定性与可解释性

## 优化计划
| 领域 | 当前风险 | 优化动作 | 指标 | 优先级 |
|---|---|---|---|---|
| 数据质量 | 数据缺口与脏数据 | 数据校验与回填策略 | 缺失率、异常率 | P0 |
| 回测性能 | 大规模回测耗时长 | 向量化/分布式回测 | 单次回测耗时 | P1 |
| 执行延迟 | 延迟不稳定 | 订单链路优化与监控 | 99p 延迟 | P0 |
| 风控一致性 | 策略绕过风控 | 统一风控入口 | 风控命中率 | P0 |
| 成本控制 | 训练算力成本高 | 训练调度与缓存 | 单实验成本 | P1 |
| 模型漂移 | 绩效随市场变化衰减 | 漂移检测与再训练门禁 | 漂移告警率 | P1 |
| 策略鲁棒性 | 过拟合与幸存者偏差 | Walk-forward 与压力测试 | 稳健性分数 | P0 |
| 账户接入 | 模拟/实盘混用风险 | 账户模式隔离、权限控制与显式激活 | 误单率、隔离违规数 | P0 |
| 凭据安全 | 凭据泄露与滥用 | 凭据加密存储与最小权限 | 凭据泄露事件 | P0 |
| 全局沙盒化 | 命令执行越权与横向影响 | 关键任务 sandbox-by-default（离线网络 + 只读文件系统 + 资源配额） | 沙盒覆盖率、越权写入次数 | P0 |
| UI/UX 一致性 | 页面节奏与层级不一致 | 统一间距基线与单主按钮原则 | 任务完成率、误触率 | P1 |
| 增长与 SEO 漏斗 | 控制台路径不可索引，缺少公开获客入口 | 建立 public surface + sitemap + app noindex + 转化事件埋点 | organic_to_signup_rate、signup_to_activation_rate | P1 |
| 市场数据可用性 | 上游不可用导致 5xx | 缓存 + 空数据降级 | 5xx=0 | P0 |
| WS 安全边界 | 实时订阅链路可被未授权访问 | token handshake + channel ACL + 审计字段 | 未授权订阅数=0 | P0 |
| 故障域耦合 | API/WS/上游连接单进程耦合 | Dual-Plane 演进（控制平面/流平面） | 故障影响面、恢复时长 | P1 |
| 可观测性契约 | 有指标无 SLO/错误预算 | SLO-first（RED + error budget + correlation id） | SLO 达成率、告警噪音率 | P0 |

## 最近执行证据（SOP 1.11）
- Run ID: `1-11-7012f820`
- 沙盒策略预检：`outputs/sop-global-sandbox/1-11-7012f820/reports/precheck_summary.md`
- 配额与超时策略：`outputs/sop-global-sandbox/1-11-7012f820/reports/resource_quota_timeout_policy.md`
- 实际执行证据：`outputs/sop-global-sandbox/1-11-7012f820/reports/sandbox_execution_evidence.md`

## 监控与度量
- 回测/实盘偏差
- 交易成本与滑点
- 系统可用性与错误率
- 模型漂移与策略失效频率

## SOP 1.6 执行进展（2026-02-12）

| 领域 | 计划动作 | 当前状态 | 证据 |
|---|---|---|---|
| API 契约 | OpenAPI 安全方案与错误结构统一 | Done | `backend/docs/openapi.yaml` |
| 鉴权边界 | REST 集中 request guard + 路由权限映射 | Done | `backend/src/api/auth-policy.ts` |
| WS 安全 | token handshake + channel ACL | Done | `backend/src/ws/server.ts` |
| 调用方一致性 | 前端 HTTP/WS 统一 token 注入 | Done | `frontend/src/lib/api/client.ts`, `frontend/src/lib/ws/client.ts` |
| 回归验证 | 契约测试 + ai check + UX smoke | Done | `outputs/1.6/1-6-f056f6f5/reports/verification.md` |

## SOP 1.3 执行进展（2026-02-11）

| 领域 | 计划动作 | 当前状态 | 证据 |
|---|---|---|---|
| 竞品定位 | PM 输出竞品矩阵与定位更新 | Done | `outputs/1.3/1-3-915e27e6/reports/council_role_outputs.md` |
| 体验链路 | UX Map 增加“发现与评估”阶段 | Done | `doc/00_project/initiative_quantum_x/USER_EXPERIENCE_MAP.md` |
| SEO 策略 | sitemap/noindex/关键词策略 | Done | `outputs/1.3/1-3-915e27e6/reports/seo_sitemap_keywords.md` |
| 冲突收敛 | 冲突清单与决策记录 | Done | `outputs/1.3/1-3-915e27e6/reports/conflicts_consistency_decisions.md` |

## SOP 1.3 Continue 执行进展（2026-02-11）

| 领域 | 计划动作 | 当前状态 | 证据 |
|---|---|---|---|
| SEO Runtime | sitemap/robots 生成 | Done | `frontend/src/app/sitemap.ts`, `frontend/src/app/robots.ts` |
| Route Governance | public routes 单一清单 | Done | `frontend/src/lib/seo/public-routes.ts` |
| Public Surface | about/pricing/security/features/docs 页面首批上线 | Done | `outputs/1.3/1-3-826a518f/reports/seo_implementation_report.md` |
| Regression | build + UX navigation smoke | Done | `outputs/1.3/1-3-826a518f/logs/frontend_build.log`, `outputs/1.3/1-3-826a518f/logs/ux_round2_navigation.log` |
| SEO Runtime v2 | features/docs 元数据 + JSON-LD 全量收口 | Done | `outputs/1.3/1-3-a7270c8c/reports/seo_runtime_v2_report.md` |
| Regression Guard | public-routes/sitemap/robots 一致性单测 | Done | `outputs/1.3/1-3-a7270c8c/logs/vitest_seo_runtime.log` |

## SOP 3.2 Recheck（2026-02-12）
- 回归项：entrypoint/config/contract/runtime auth。
- 结果：全部 PASS；当前“API 契约 + 鉴权边界”优化动作已闭环。
- 证据：`outputs/3.2/3-2-6fef5bcb/reports/final_report.md`。

## SOP 3.6 Continue 执行进展（2026-02-12）

| 领域 | 计划动作 | 当前状态 | 证据 |
|---|---|---|---|
| 调用一致性 | 关键业务页统一 API SDK 调用 | Done | `frontend/src/app/api-keys/page.tsx`, `frontend/src/app/audit/page.tsx`, `frontend/src/app/backtest/page.tsx` |
| Journey 守门 | CI 增加 persona chromium smoke | Done | `.github/workflows/ci.yml` |
| 回归验证 | persona + navigation + ai check | Done | `outputs/3.6/3-6-4beb69e2/reports/final_report.md` |

## SOP 3.2 Continue 执行进展（AI Internal API, 2026-02-12）

| 领域 | 计划动作 | 当前状态 | 证据 |
|---|---|---|---|
| 前端一致性 | 内部 AI 路由请求 helper 化与错误口径统一 | Done | `frontend/src/lib/ai/http.ts`, `frontend/src/lib/ai/hooks.ts` |
| 测试守门 | helper 单测 + 静态检查 | Done | `outputs/3.2/3-2-d2852a9b/reports/verification.md` |

## SOP 3.2 Continue 执行进展（Provider HTTP, 2026-02-12）

| 领域 | 计划动作 | 当前状态 | 证据 |
|---|---|---|---|
| Provider 一致性 | Google/Poe 统一 provider HTTP helper | Done | `frontend/src/lib/ai/providers/http.ts`, `google.ts`, `poe.ts` |
| 测试守门 | helper 单测 + 静态检查 | Done | `outputs/3.2/3-2-082c2e98/reports/verification.md` |

## SOP 1.1 执行进展（run `1-1-461afeb6`, 2026-02-12）

| 领域 | 计划动作 | 当前状态 | 证据 |
|---|---|---|---|
| planning-with-files | 读取 task_plan/notes/deliverable + checklist 校验 | Done | `outputs/1.1/1-1-461afeb6/logs/planning-files-read.log` |
| ralph-loop | 启用 12 轮上限与 completion promise | Done | `.codex/ralph-loop.local.md` |
| plan-first | 先定义目标/约束/验收/测试计划 | Done | `doc/00_project/initiative_08_quantum_trading/task_plan.md` |
| doc-first sync | 先更新 PDCA + Rolling 再执行验证 | Done | `doc/00_project/initiative_quantum_x/*.md` |
| 验证门禁 | ai check + UX round2 + FE/BE consistency checks | Superseded | run `1-1-461afeb6` 保留历史证据，canonical run 见下方 `1-1-065abd2c` |

## SOP 1.1 执行进展（2026-02-12）

| 领域 | 计划动作 | 当前状态 | 证据 |
|---|---|---|---|
| Planning Gate | planning-with-files + plan-first | Done | `outputs/1.1/1-1-065abd2c/reports/plan_first.md` |
| Ralph Loop | max-iterations=12, completion-promise=DONE | Done | `.codex/ralph-loop.local.md` |
| Delivery Hygiene | SOP run 状态与 rolling ledger 唯一化 | Done | `outputs/1.3/1-3-a7270c8c/logs/sop_6_7_cleanup.log`, `outputs/1.3/1-3-a7270c8c/logs/ledger_id_uniqueness.log` |

## SOP 1.1 执行进展（run `1-1-70defaf7`, 2026-02-12）

| 领域 | 计划动作 | 当前状态 | 证据 |
|---|---|---|---|
| Planning Gate | planning-with-files + checklist + plan-first | Done | `outputs/1.1/1-1-70defaf7/reports/plan_first.md` |
| Ralph Loop | max-iterations=12 + promise=DONE | Done | `outputs/1.1/1-1-70defaf7/logs/ralph_loop_init.log` |
| Doc-First Sync | PRD/Architecture/UX/Optimization/Rolling 先更新 | Done | `doc/00_project/initiative_quantum_x/*.md` |
| Validation Gate | ai check + UX round2 + FE/BE consistency | In Progress | `outputs/1.1/1-1-70defaf7/logs/` |
| Task Closeout | deliverable + rolling + tri-end consistency | Pending | `doc/00_project/initiative_08_quantum_trading/deliverable.md` |

## SOP 1.1 收口验证进展（run `1-1-065abd2c`, 2026-02-12）

| 领域 | 计划动作 | 当前状态 | 证据 |
|---|---|---|---|
| Round1 Gate | `ai check` 双轮复验 | Done | `outputs/1.1/1-1-065abd2c/logs/ai_check_round1_final.log` |
| UX Round2 | navigation + persona + full-loop | Done | `outputs/1.1/1-1-065abd2c/logs/playwright_ux_round2_isolated_fixed.log` |
| Frontend Quality | network/console/performance/visual 扫描 | Done | `outputs/1.1/1-1-065abd2c/reports/frontend_quality/network_console_performance_visual.json` |
| Backend Contract | typecheck + contract/auth tests | Done | `outputs/1.1/1-1-065abd2c/logs/backend_contract_tests_final.log` |

## SOP 1.1 执行进展（run `1-1-10f2b0dc`, 2026-02-12）

| 领域 | 计划动作 | 当前状态 | 证据 |
|---|---|---|---|
| Planning Gate | planning-with-files + checklist + plan-first | Done | `outputs/1.1/1-1-10f2b0dc/logs/planning-files-read.log` |
| Ralph Loop | max-iterations=12 + promise=DONE | Done | `outputs/1.1/1-1-10f2b0dc/logs/ralph-loop-init.log` |
| Doc-First Sync | PRD/Architecture/UX/Optimization/Rolling 先更新 | Done | `outputs/1.1/1-1-10f2b0dc/reports/docsync_step5.md` |
| Validation Gate | ai check + UX round2 + FE/BE consistency | Done | `outputs/1.1/1-1-10f2b0dc/reports/verification.md` |
| Task Closeout | deliverable + rolling + tri-end consistency | Done | `outputs/1.1/1-1-10f2b0dc/reports/final_report.md` |

## SOP 3.7 执行进展（run `3-7-7d7d416f`, 2026-02-12）

| 领域 | 计划动作 | 当前状态 | 证据 |
|---|---|---|---|
| Planning Gate | planning-with-files read + evidence init | Done | `outputs/3.7/3-7-7d7d416f/logs/planning-files-read.log` |
| Entrypoint Closure | UI/CLI/config 入口可达性复核 | Done | `outputs/3.7/3-7-7d7d416f/reports/step2_entrypoint_closure.md` |
| System Closure | full-loop 集成链路与错误路径追踪 | Done | `outputs/3.7/3-7-7d7d416f/reports/step3_system_closure.md` |
| Contract Closure | schema/auth/error contract 一致性复核 | Done | `outputs/3.7/3-7-7d7d416f/reports/step4_contract_closure.md` |
| Verification Gate | E2E + ai check + deliverable 更新 | Done | `outputs/3.7/3-7-7d7d416f/reports/verification.md` |

## SOP 4.1 执行进展（run `4-1-873e9072`, 2026-02-12）

| 领域 | 计划动作 | 当前状态 | 证据 |
|---|---|---|---|
| UX 回归主路径 | 按 UX Map 执行 navigation/persona/full-loop 三套回归 | Done | `outputs/4.1/4-1-873e9072/reports/step3_ux_core_path.md` |
| 同类问题扩散扫描 | 扫描 lifecycle drift 与 upstream timeout 对主路径影响 | Done | `outputs/4.1/4-1-873e9072/reports/step4_blocker_scan.md` |
| 双轮门禁 | Round1 `ai check` + Round2 UX Map 复核 | In Progress | `outputs/4.1/4-1-873e9072/logs/` |

## SOP 1.1 Verification Stability Optimization (2026-02-12, run `1-1-c1a3a846`)

| 领域 | 动作 | 状态 | 证据 |
|---|---|---|---|
| UX 回归稳定性 | 前端验收从 `next dev` 切换到 `build + start` 运行模式，减少编译期抖动导致的假失败 | Done | `outputs/1.1/1-1-c1a3a846/logs/step4_frontend_build.log` |
| 鉴权一致性 | Playwright 全局注入 API key，确保契约收紧后仍可稳定执行集成回归 | Done | `frontend/playwright.config.ts` |
| 证据治理 | 所有 Step 证据统一落盘 `outputs/1.1/1-1-c1a3a846/` | In Progress | `outputs/1.1/1-1-c1a3a846/` |
