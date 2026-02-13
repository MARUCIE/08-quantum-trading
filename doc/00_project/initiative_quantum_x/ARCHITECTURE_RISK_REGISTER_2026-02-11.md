# ARCHITECTURE RISK REGISTER (2026-02-11)

- SOP: `1.4 架构圆桌 SOP`
- Run ID: `1-4-2bc405e8`
- Evidence: `outputs/sop-architecture-council/1-4-2bc405e8/reports/risk-register.md`

| ID | Severity | Likelihood | Description | Existing Controls | Gap | Mitigation | Owner | Priority |
|---|---|---|---|---|---|---|---|---|
| R-SEC-001 | Critical | High | WS subscription path has no auth handshake | WS connection lifecycle tracking | Channel authz missing | Token handshake + channel ACL | Security + Backend | P0 |
| R-SEC-002 | High | Medium | Critical write APIs lack centralized RBAC middleware | Rate limit + security headers | No uniform authz at BFF boundary | API authN/authZ middleware + RBAC matrix | Security + Backend | P0 |
| R-SEC-003 | High | Medium | Engineering tasks may execute without isolation and leak data via network/filesystem | Existing sandbox scripts | Lack of enforced quota/timeout metadata and capability drop | Sandbox-by-default + no-new-privileges + cap-drop + per-run meta evidence | Security + DevEx | P0 |
| R-SRE-001 | High | Medium | API + WS + upstream loop share one process failure domain | Health/ready endpoints | Fault isolation weak | Dual-plane deployment path + bulkhead | SRE + Architect | P1 |
| R-SRE-002 | Medium | High | In-memory limiter inconsistent under horizontal scale | Process-local limiter | Multi-instance drift | Shared limiter backend | SRE | P1 |
| R-OBS-001 | Medium | Medium | Metrics not tied to SLO/error budgets | `/metrics` + Prometheus config | No SLO policy/alerts | RED + SLO burn-rate alerts | SRE | P1 |
| R-AUD-001 | Medium | Medium | Audit hash chain not externally anchored | Local hash-chain audit log | Weak non-repudiation proof | Periodic immutable anchoring | Security + Compliance | P2 |
| R-SEC-004 | High | Medium | WS query token 可能在日志/浏览器工具链暴露 | WS token handshake + ACL | token transport leakage surface | 短时效 scoped WS session token + 缩短有效期 | Security + Backend | P1 |
| R-REL-003 | Critical | High | 审计日志单文件过大导致启动读取失败（`ERR_STRING_TOO_LONG`） | 审计日志写入与hash链 | 启动阶段缺少有界读取与轮转 | 分片存储 + size/time rotation + bounded startup scan | SRE + Backend | P0 |
| R-OBS-002 | High | Medium | 降级路径缺少 error-budget burn 信号，容量退化不可见 | fallback + metrics 基础能力 | 无降级计数器和 burn-rate 视图 | 增加 degradation counters + SLO dashboard | SRE | P1 |
| R-ARCH-002 | Medium | Medium | 路由清单与架构文档计数存在漂移 | 手工维护 route 表 | 无自动同步机制 | CI 自动生成 route inventory 并回写 managed block | Architect + Frontend | P2 |
| R-QA-002 | High | Medium | 前端质量报告持续出现 hydration page error | 现有 e2e 与质量扫描 | 缺少针对性 route 级稳定性回归 | deterministic data 渲染强化 + route-specific tests | Frontend + QA | P1 |
