# @zbzdr/pi-legal-suite

Claude for Legal 在 Pi 上的独立移植，也是本项目推荐的 all-in-one 包。它把美国法法律研究、合同审查，以及 privacy、regulatory、AI governance、employment、corporate、litigation、IP 和 product 工作流放进一个 workspace-first 的 Pi package。

## Quick start

```bash
pi install -l npm:@zbzdr/pi-legal-suite
```

安装后在 Pi 中运行：

```text
/skill:legal-setup
```

然后直接描述任务，或显式调用：

```text
/skill:legal-research 研究一个美国法问题并起草 memo
/skill:legal-contract-review review ./contracts/vendor-msa.pdf
/skill:legal-nda-review review ./contracts/inbound-nda.docx
/skill:legal-privacy-dpa-review review ./contracts/dpa.pdf
/skill:legal-product-launch-review review ./launch/new-feature.md
/skill:legal-customize
```

`-l` 表示安装到当前项目，推荐保留。不要再同时安装 `@zbzdr/pi-legal-core` 或其他领域包，否则会出现重复 Skills。

## 更新

在项目目录中运行：

```bash
pi update npm:@zbzdr/pi-legal-suite
```

然后在 Pi 中输入 `/reload`，或重新启动 Pi。带版本号的安装会锁定版本；如已安装 `@0.1.0`，请用新版本号再次执行 `pi install -l`。

## 当前边界

- 86 个纯 Agent Skills，没有运行时 npm 依赖；
- 美国法优先，所有实质输出均是供律师复核的工作稿；
- 不内置 MCP、web access、邮件、Slack、todo 或其他 extensions；
- 没有可靠外部来源时会保留验证标签，不声称完成了 citator 或 currentness 检查。

后续计划包括 CN、UK、EEA 等法域模块、DOCX/redline，以及一个项目级整合 MCP、web access、todo 和交互能力的独立工作台包。

## 来源与许可

本包基于 Anthropic 的 [claude-for-legal](https://github.com/anthropics/claude-for-legal) revision `4a6c651889c97cc9140580363c73e0eb17379c2b` 修改并适配到 Pi。上游材料和本包按 Apache-2.0 分发，详见随包提供的 `LICENSE` 和 `NOTICE`。

本项目与 Anthropic 没有从属或背书关系。所有输出均需合格律师复核。
