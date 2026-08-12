# @zbzdr/pi-employment-legal

招聘、解雇、用工分类、工资工时、休假、政策、调查与国际扩张。这是一个纯 Pi Agent Skills package，不内置 MCP、connector、extension 或运行时依赖。

## 安装

推荐安装到当前项目（`-l`），并同时安装共享 setup、profile、法律研究与 matter 能力：

```bash
pi install -l npm:@zbzdr/pi-legal-core@0.1.0
pi install -l npm:@zbzdr/pi-employment-legal@0.1.0
```

不带 `-l` 的用户全局安装属于次要支持模式，会让该 package 出现在该用户的所有 Pi 项目中；仍需在每个项目单独运行 setup，并避免与项目中重复安装 suite/领域包。

## Skills（17）

- `/skill:legal-employment-expansion-kickoff`
- `/skill:legal-employment-expansion-update`
- `/skill:legal-employment-handbook-updates`
- `/skill:legal-employment-hiring-review`
- `/skill:legal-employment-internal-investigation`
- `/skill:legal-employment-international-expansion`
- `/skill:legal-employment-investigation-add`
- `/skill:legal-employment-investigation-memo`
- `/skill:legal-employment-investigation-open`
- `/skill:legal-employment-investigation-query`
- `/skill:legal-employment-investigation-summary`
- `/skill:legal-employment-leave-tracker`
- `/skill:legal-employment-log-leave`
- `/skill:legal-employment-policy-drafting`
- `/skill:legal-employment-termination-review`
- `/skill:legal-employment-wage-hour-qa`
- `/skill:legal-employment-worker-classification`

首次使用先运行 `/skill:legal-setup`。本包以美国法工作流为起点；涉及其他法域时必须使用当前、可核验的权威来源，或明确限制为问题识别和研究计划。所有实质输出均需合格律师复核。
