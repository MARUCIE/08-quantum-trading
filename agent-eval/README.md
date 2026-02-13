# Agent Eval System

本目录用于落盘智能体评估资产（任务 + 评分器 + 过程记录 + 结果状态）。

## 快速开始

```bash
ai agent-eval /path/to/project init --owner "Your Name"
```

## 目录结构

- `AGENT_EVAL_PLAN.md`: 评估计划
- `tasks/*.json`: 任务定义
- `graders/*.json`: 评分器定义
- `runs/<run_id>/`: 每次评估的记录与结果

## 关键原则

- Transcript 必须可审计、可复现
- Outcome 必须来自环境真实状态
- Grader 必须清晰可执行

---

猪哥云（四川）网络科技有限公司 | 合规网 www.hegui.com
猪哥云-数据产品部-Maurice | maurice_wen@proton.me
2025 猪哥云-灵阙企业级智能体平台
