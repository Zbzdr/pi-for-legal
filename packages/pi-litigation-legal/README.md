# @zbzdr/pi-litigation-legal

争议事项、传票、保全、时间线、诉求图、函件、特权日志与案件组合。这是一个纯 Pi Agent Skills package，不内置 MCP、connector、extension 或运行时依赖。

## 安装

推荐安装到当前项目（`-l`），并同时安装共享 setup、profile、法律研究与 matter 能力：

```bash
pi install -l npm:@zbzdr/pi-legal-core@0.2.0
pi install -l npm:@zbzdr/pi-litigation-legal@0.2.0
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

首次使用先运行 `/skill:legal-setup`。本包保留上游工作流覆盖的美国、英国、EEA/EU 及跨境法律框架；处理任何法域时均应识别适用法、使用相应权威来源，并标明未完成的核实。所有实质输出均需合格律师复核。
