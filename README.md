# Pi for Legal

Pi for Legal 是 [Anthropic Claude for Legal](https://github.com/anthropics/claude-for-legal) 在 Pi 上的独立移植。本项目主要工作由ChatGPT5.6-sol完成。

项目默认采用 workspace-first：package 安装在当前项目，profile、matter 和工作材料也保存在项目目录中。外部检索和协作工具由用户按需配置。

## 它目前能做什么

- 多法域法律研究：识别适用法和权威层级，检查时效与后续处理，并输出带来源说明的 memo；
- 商业合同：路由并审查 MSA、SaaS、NDA、vendor agreement、修订和续期事项；
- 法务工作流：privacy、regulatory、AI governance、employment、corporate、litigation、IP 和 product；
- 项目级 setup、quick defaults、实践 profile、matter 隔离、playbook 学习、升级判断和业务摘要；
- 经确认后生成带自动备份的轻量 DOCX tracked redline；
- 在没有可靠外部来源时明确标记验证缺口，不把模型记忆包装成已完成的法律检索。

目前唯一维护和发布的 all-in-one 包包含 88 个 Skills 和一个项目级 extension，不内置 MCP、web access、邮件、Slack、todo 或其他 Pi extensions。

DOCX redline 首次使用时会在当前项目的 `.pi/legal-workbench/venvs/docx-redline/` 建立 Python 虚拟环境，并在用户确认后安装固定版本的 `python-docx` 和 `lxml`；不会改动系统 Python。

## Quick start

在需要使用法律工作流的项目目录里安装：

```bash
pi install -l npm:@zbzdr/pi-legal-suite
```

启动 Pi 后先运行：

```text
/skill:legal-setup
```

Setup 会询问实践类型、法域、审查偏好和数据目录，并在写入前展示准确路径。按提示完成 setup 后，重新加载或重启 Pi，在新 session 中描述任务；根据提示选择或创建事务，然后开始研究、审查或起草工作。

接下来可以直接描述任务，也可以显式调用 Skill：

```text
/skill:legal-research 比较纽约法与英格兰法下这个免责条款的可执行性
/skill:legal-contract-review review ./contracts/vendor-msa.pdf
/skill:legal-docx-redline ./contracts/inbound-nda.docx
/skill:legal-litigation-matter-intake
/skill:legal-playbook-learning capture
/skill:legal-customize
```

所有输出均为供法律工作者复核的工作稿，不构成法律意见。涉及现行法、判例有效性或监管状态时，应进行充分核实。

## 更新

在安装 package 的项目目录中运行：

```bash
pi update npm:@zbzdr/pi-legal-suite
```

也可以一次更新当前项目安装的全部 Pi packages：

```bash
pi update --extensions
```

（该命令会同时更新已经安装的其他 Pi packages，不会安装尚未安装的 package。）

更新完成后，在正在运行的 Pi 中输入 `/reload`，或重新启动 Pi。

带版本号的安装会锁定版本。例如 `npm:@zbzdr/pi-legal-suite@0.3.0` 不会被上述命令自动升级；需要改用新的版本号重新安装：

```bash
pi install -l npm:@zbzdr/pi-legal-suite@<new-version>
```

## 旧包迁移

法律领域现在统一包含在 suite 中，不再单独维护或发布 core/领域 package。此前安装旧包的用户应先用 `pi list` 确认来源，逐一通过 `pi remove -l <source>` 移除，再安装 suite。旧 npm 包不会 unpublish；已有版本会保留并标记为 deprecated，既不影响旧 lockfile，也能把新用户引导到 suite。仓库内的旧目录仅作历史快照，不进入 workspace、测试、打包或发布流程。

如果曾使用开发中的项目 session 目录方案，再运行一次 `/skill:legal-setup`。迁移脚本只会移除它原先写入的 `legal-workbench/sessions` 设置，使 Pi 恢复默认 session 位置；其他自定义 session 设置不会被改动，已有 session 文件也不会被移动或删除。

项目本地安装仍然优先。无 `-l` 的全局安装属于次要支持模式，会让 suite 出现在该用户的所有 Pi 项目中；setup、profile 和 matter 仍按当前 workspace 分开维护。

## 来源与许可

本项目基于 `claude-for-legal` revision `4a6c651889c97cc9140580363c73e0eb17379c2b` 适配。Skills、提示词和参考模板如含上游材料，均保留来源及修改说明；详细对应关系见 [docs/upstream-map.md](docs/upstream-map.md)。当前移植以 Markdown/JSON 工作流为主，没有打包上游的第三方插件或 MCP connector 实现。

上游材料由 Anthropic PBC 按 Apache License 2.0 提供，本项目同样采用 Apache-2.0。见 [LICENSE](LICENSE) 和 [NOTICE](NOTICE)。Pi for Legal 与 Anthropic 没有从属或背书关系；Claude、Anthropic 及第三方产品名称仍属于各自权利人。

## 未来更新路线图

- 优化工作区内按照session来隔离任务context的策略；
- 深化 CN 及其他法域的本地化资料、来源策略和专门模板；
- 从轻量精确替换扩展到复杂 DOCX redline、批注和格式保真；
- 实现法律检索 MCP的接入和配置，必要时依赖第三方 MCP adapter；
- 以单整合包的形式，把 MCP、web access、todo、ask-user-question 等常用能力组合起来；最终让用户在一个工作区里只安装一个包，就能完成主要法律任务。

以上功能将分阶段实现。
