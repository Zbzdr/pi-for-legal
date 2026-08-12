# @zbzdr/pi-litigation-legal

争议事项、传票、保全、时间线、诉求图、函件、特权日志与案件组合。这是一个纯 Pi Agent Skills package，不内置 MCP、connector、extension 或运行时依赖。

## 安装

推荐安装到当前项目（`-l`），并同时安装共享 setup、profile、法律研究与 matter 能力：

```bash
pi install -l npm:@zbzdr/pi-legal-core@0.1.0
pi install -l npm:@zbzdr/pi-litigation-legal@0.1.0
```

不带 `-l` 的用户全局安装属于次要支持模式，会让该 package 出现在该用户的所有 Pi 项目中；仍需在每个项目单独运行 setup，并避免与项目中重复安装 suite/领域包。

## Skills（16）

- `/skill:legal-litigation-brief-section-drafter`
- `/skill:legal-litigation-chronology`
- `/skill:legal-litigation-claim-chart`
- `/skill:legal-litigation-demand-draft`
- `/skill:legal-litigation-demand-intake`
- `/skill:legal-litigation-demand-received`
- `/skill:legal-litigation-deposition-prep`
- `/skill:legal-litigation-legal-hold`
- `/skill:legal-litigation-matter-briefing`
- `/skill:legal-litigation-matter-close`
- `/skill:legal-litigation-matter-intake`
- `/skill:legal-litigation-matter-update`
- `/skill:legal-litigation-oc-status`
- `/skill:legal-litigation-portfolio-status`
- `/skill:legal-litigation-privilege-log-review`
- `/skill:legal-litigation-subpoena-triage`

首次使用先运行 `/skill:legal-setup`。本包以美国法工作流为起点；涉及其他法域时必须使用当前、可核验的权威来源，或明确限制为问题识别和研究计划。所有实质输出均需合格律师复核。
