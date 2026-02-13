# ARCHITECTURE ADR - Council Roundtable (2026-02-11)

- SOP: `1.4 架构圆桌 SOP`
- Run ID: `1-4-052e10d2`
- Evidence: `outputs/1.4/1-4-052e10d2/reports/architecture-council-report.md`

## Context
- 当前系统已经具备 REST API、WebSocket、审计日志与 Prometheus 指标，但运行时仍为单进程耦合启动。
- 安全边界在 HTTP 层已有基础防护（CORS/Rate Limit/Security Headers），但 WS 订阅链路尚无显式认证授权。
- 指标已落地，但缺少 SLO/错误预算契约与跨信号（REST/WS/Audit）关联标识。

## ADR-AX-001: Dual-Plane, Single-Repo 演进路径
- Status: Accepted
- Decision:
  - 保持单仓库；
  - 在架构与模块边界上明确双平面：
    - Control Plane: REST + account/risk/order/audit；
    - Stream Plane: market ingest + WS fan-out。
- Rationale:
  - 兼顾当前交付速度与后续可扩展性，减少一次性拆分风险。
- Consequences:
  - 需要在现有代码中强化 bounded context 接口与依赖方向；
  - 后续可平滑演进为双部署单元。

## ADR-AX-002: BFF + WS 安全边界统一
- Status: Accepted
- Decision:
  - 为关键写接口与账户接口引入统一 authN/authZ middleware；
  - WS 连接引入 token handshake 与 channel ACL。
- Rationale:
  - 当前 WS 订阅无认证，风险优先级高。
- Consequences:
  - 需要前端 WS 客户端透传 token；
  - 需要 RBAC 规则矩阵与审计字段补齐。

## ADR-AX-003: SLO-first 可观测性契约
- Status: Accepted
- Decision:
  - 在现有 Prometheus 指标之上定义 SLO 与告警门限；
  - 增加 request/trace correlation id，贯通 REST -> Audit -> WS。
- Rationale:
  - 当前有指标但缺少 SLO 驱动的可靠性闭环。
- Consequences:
  - 增加中间件与日志字段标准化工作；
  - 增加 dashboard 与 alert rule 的治理成本。

## Risk Register (Snapshot)
| ID | Severity | Likelihood | Risk |
|---|---|---|---|
| R-SEC-001 | Critical | High | WS 订阅链路无认证 |
| R-SEC-002 | High | Medium | 关键写 API 缺统一 RBAC |
| R-SRE-001 | High | Medium | API/WS 与上游连接共进程，故障域耦合 |
| R-SRE-002 | Medium | High | 进程内限流无法支持横向扩展一致性 |
| R-OBS-001 | Medium | Medium | 指标未绑定 SLO/错误预算 |
| R-AUD-001 | Medium | Medium | 审计 hash 链未外部锚定 |

Reference: `outputs/1.4/1-4-052e10d2/reports/risk-register.md`

## Decision Owners
- Architect: boundary and evolution path
- Security: threat model and controls
- SRE: reliability and capacity policy

## Council Refresh (2026-02-12 / Run `1-4-037ae7e8`)
- Evidence: `outputs/1.4/1-4-037ae7e8/reports/adr-summary.md`

### ADR-AX-004: Audit Log Segmentation and Rotation
- Status: Accepted
- Decision:
  - 将单文件审计日志读取改为分片文件 + 索引元数据；
  - 启动阶段仅执行有界扫描，避免超大文件一次性读入。
- Rationale:
  - 已观测到启动阶段 `ERR_STRING_TOO_LONG` 风险，影响可用性。
- Consequences:
  - 需要补齐轮转策略与迁移脚本；
  - 可显著降低启动内存压力与恢复时间。

### ADR-AX-005: WS Auth Transport Hardening
- Status: Accepted
- Decision:
  - WS 握手从长期 query token 迁移到短时效 scoped session token；
  - 保持 channel ACL 权限模型不变。
- Rationale:
  - query token 在日志/浏览器工具链中暴露风险较高。
- Consequences:
  - 需要增加会话签发与刷新机制；
  - 需要更新前端 WS 客户端握手流程。

### ADR-AX-006: Frontend Quality Gate as Release Guard
- Status: Accepted
- Decision:
  - 将 route-level frontend quality 扫描（network/console/performance/visual）纳入发布守门。
- Rationale:
  - 能在回归前捕获 hydration/page error 等运行时缺陷。
- Consequences:
  - CI 时长增加；
  - 需维护稳定的质量报告产物与阈值口径。
