# Agent Evaluation Plan

> 面向智能体评估的统一计划文件，包含任务、评分器、记录与结果要求。

## Meta

- Owner: Maurice
- LastUpdated: 2026-02-13 09:56:37
- ModuleDir: agent-eval

## 评估对象

- Agent / Tool:
- Version:
- Target Environment:

## 任务（Task）

要求：任务是具体可执行的测试用例，包含输入与可验证的输出。

示例：
- "帮用户订一张从上海到北京的机票"
- "根据输入 CSV 生成合规风控报告"

## 评分器（Grader）

至少覆盖以下三类：

- 代码评分器（tests/exit_code/file_exists）
- 模型评分器（质量/语气/覆盖面）
- 人工评分器（专家审核）

## 记录（Transcript）

记录内容必须包含：

- 用户输入
- 工具调用与参数
- stdout / stderr
- 关键中间结果

## 结果（Outcome）

结果必须反映环境真实状态，例如：

- 目标文件是否存在
- 数据库是否新增记录
- API 是否返回预期数据

## 计划清单

| ID | Task | Graders | Evidence | Status |
|---|---|---|---|---|
| T-001 | Define tasks | exit_code | tasks/*.json | todo |
| T-002 | Define graders | file_exists | graders/*.json | todo |
| T-003 | Run eval | transcript + outcome | runs/<run_id> | todo |

