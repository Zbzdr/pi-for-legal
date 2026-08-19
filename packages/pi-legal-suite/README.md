# @zbzdr/pi-legal-suite

Claude for Legal 在 Pi 上的独立移植，也是本项目推荐的 all-in-one 包。它把多法域法律研究、合同审查，以及 privacy、regulatory、AI governance、employment、corporate、litigation、IP 和 product 工作流放进一个 workspace-first 的 Pi package。

## Quick start

```bash
pi install -l npm:@zbzdr/pi-legal-suite
```

安装后在 Pi 中运行：

```text
/skill:legal-setup
```

按提示完成 setup 后，重新加载或重启 Pi，在新 session 中描述任务；根据提示选择或创建事务，然后开始研究、审查或起草工作。

然后直接描述任务，或显式调用：

```text
/skill:legal-research 研究一个跨法域问题并起草 memo
/skill:legal-contract-review review ./contracts/vendor-msa.pdf
/skill:legal-docx-redline ./contracts/inbound-nda.docx
/skill:legal-privacy-dpa-review review ./contracts/dpa.pdf
/skill:legal-product-launch-review review ./launch/new-feature.md
/skill:legal-playbook-learning capture
/skill:legal-customize
```

`-l` 表示安装到当前项目，推荐保留。当前只维护这一套 suite；它包含一个项目级 extension，负责首次 session 的 matter 选择、绑定和写入路径护栏。

## 更新

在项目目录中运行：

```bash
pi update npm:@zbzdr/pi-legal-suite
```

然后在 Pi 中输入 `/reload`，或重新启动 Pi。带版本号的安装会锁定版本；如已安装 `@0.3.0`，请用新版本号再次执行 `pi install -l`。

## 当前边界

- 88 个 Agent Skills 和一个项目级 extension，没有运行时 npm 依赖；DOCX redline 首次使用会在项目内建立独立 Python 虚拟环境；
- 保留上游覆盖的美国、英国、EEA/EU 和跨境工作流，所有实质输出均是供律师复核的工作稿；
- 不内置 MCP、web access、邮件、Slack、todo 或其他 extensions；
- 没有可靠外部来源时会保留验证标签；实质法律结论仍需充分核实。

setup 后，`.pi/legal-workbench/` 只保存 profile、status、matter index 等可复用状态；matter 资料、下载内容、研究记录和工作产品保存在可见的 `legal-workbench/matters/<slug>/` 下。原始 Pi sessions 使用默认存储位置，matter README 记录绑定的 session ID。

曾使用开发中的 `legal-workbench/sessions` 设置时，再运行一次 `/skill:legal-setup` 即可恢复 Pi 默认 session 位置。迁移不会移动或删除已有 session 文件。

此前的 core 和领域包停止维护。npm 上已有版本会保留并标记为 deprecated，仓库内对应目录仅作历史快照；它们不再参与测试、打包或发布。

后续计划包括更深入的 CN 及其他法域本地化、完整 DOCX/redline，以及一个项目级整合 MCP、web access、todo 和交互能力的独立工作台包。

## 来源与许可

本包基于 Anthropic 的 [claude-for-legal](https://github.com/anthropics/claude-for-legal) revision `4a6c651889c97cc9140580363c73e0eb17379c2b` 修改并适配到 Pi。上游材料和本包按 Apache-2.0 分发，详见随包提供的 `LICENSE` 和 `NOTICE`。

本项目与 Anthropic 没有从属或背书关系。所有输出均需合格律师复核。
