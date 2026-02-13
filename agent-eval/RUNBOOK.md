# Agent Eval Runbook

本手册说明如何运行评估、查看 Transcript 与 Outcome，并用评分器输出结论。

## 1) 初始化

```bash
ai agent-eval /path/to/project init --owner "Your Name"
```

## 2) 编辑任务与评分器

- `tasks/*.json`: 填写任务输入与执行命令
- `graders/*.json`: 定义评分器规则

## 3) 运行评估

```bash
ai agent-eval /path/to/project run
```

## 4) 查看结果

- Transcript: `agent-eval/runs/<run_id>/transcripts/*.jsonl`
- Outcome: `agent-eval/runs/<run_id>/outcomes/*.json`
- Grades: `agent-eval/runs/<run_id>/grades/*.json`
- Summary: `agent-eval/runs/<run_id>/summary.json`

## 5) 人工评分（可选）

人工评分器不会自动通过，请在 Grades 中补充：

- Reviewer
- Decision
- Evidence Path

---

猪哥云（四川）网络科技有限公司 | 合规网 www.hegui.com
猪哥云-数据产品部-Maurice | maurice_wen@proton.me
2025 猪哥云-灵阙企业级智能体平台
