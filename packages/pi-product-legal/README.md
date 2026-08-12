# @zbzdr/pi-product-legal

产品发布、功能风险、营销声明和快速问题分流。这是一个纯 Pi Agent Skills package，不内置 MCP、connector、extension 或运行时依赖。

## 安装

推荐安装到当前项目（`-l`），并同时安装共享 setup、profile、法律研究与 matter 能力：

```bash
pi install -l npm:@zbzdr/pi-legal-core@0.1.0
pi install -l npm:@zbzdr/pi-product-legal@0.1.0
```

不带 `-l` 的用户全局安装属于次要支持模式，会让该 package 出现在该用户的所有 Pi 项目中；仍需在每个项目单独运行 setup，并避免与项目中重复安装 suite/领域包。

## Skills（4）

- `/skill:legal-product-feature-risk-assessment`
- `/skill:legal-product-launch-review`
- `/skill:legal-product-marketing-claims-review`
- `/skill:legal-product-problem-triage`

首次使用先运行 `/skill:legal-setup`。本包以美国法工作流为起点；涉及其他法域时必须使用当前、可核验的权威来源，或明确限制为问题识别和研究计划。所有实质输出均需合格律师复核。
