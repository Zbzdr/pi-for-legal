# @zbzdr/pi-corporate-legal

M&A 尽调、交割、董事会、书面同意、实体合规与并购后整合。这是一个纯 Pi Agent Skills package，不内置 MCP、connector、extension 或运行时依赖。

## 安装

推荐安装到当前项目（`-l`），并同时安装共享 setup、profile、法律研究与 matter 能力：

```bash
pi install -l npm:@zbzdr/pi-legal-core@0.2.0
pi install -l npm:@zbzdr/pi-corporate-legal@0.2.0
```

不带 `-l` 的用户全局安装属于次要支持模式，会让该 package 出现在该用户的所有 Pi 项目中；仍需在每个项目单独运行 setup，并避免与项目中重复安装 suite/领域包。

## Skills（10）

- `/skill:legal-corporate-ai-tool-handoff`
- `/skill:legal-corporate-board-minutes`
- `/skill:legal-corporate-closing-checklist`
- `/skill:legal-corporate-deal-team-summary`
- `/skill:legal-corporate-diligence-issue-extraction`
- `/skill:legal-corporate-entity-compliance`
- `/skill:legal-corporate-integration-management`
- `/skill:legal-corporate-material-contract-schedule`
- `/skill:legal-corporate-tabular-review`
- `/skill:legal-corporate-written-consent`

首次使用先运行 `/skill:legal-setup`。本包保留上游工作流覆盖的美国、英国、EEA/EU 及跨境法律框架；处理任何法域时均应识别适用法、使用相应权威来源，并标明未完成的核实。所有实质输出均需合格律师复核。
