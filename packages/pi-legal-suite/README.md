# @zbzdr/pi-legal-suite

Claude for Legal 在 Pi 上的独立移植，也是本项目推荐的 all-in-one 包。它把多法域法律研究、合同审查，以及 privacy、regulatory、AI governance、employment、corporate、litigation、IP 和 product 工作流放进一个 workspace-first 的 Pi package。

## Quick start

当前支持带有 `bash` 与 Unix `date` 的 macOS/Linux。Markdown 文档 Git 还需要 Git 与 Pi 1.1 或更新版本（Node.js 22.19+）；Windows/PowerShell 暂不支持。

0.5.0 起，默认可见目录为项目根目录下的 `matters/` 和 `logs/`；旧的 `legal-workbench/` 可见目录不会自动迁移。

```bash
pi install -l npm:@zbzdr/pi-legal-suite
```

安装后在 Pi 中运行：

```text
/skill:legal-setup
```

按提示完成 setup 后，重新加载或重启 Pi，在新 session 中描述任务；根据提示选择或创建事务，然后开始研究、审查或起草工作。

## Markdown 文档 Git（开发中，尚未发布 npm）

用 `/skill:legal-document-edit` 起草、微调和更换章节起草逻辑。首次 workspace setup 一并确认本地 Git 范围和提交身份；以后绑定的 matter 按需自动建立独立仓库，不重复询问每次 commit，也不建立共享整个工作区的 Git 仓库。旧版/手动模式仍支持每 matter 单独纳入。

普通微调直接修改当前文件，不必每回合开分支或 worktree。实质起草前记录该文件/章节的原文位置；已经按 a 逻辑提交后改用 b 逻辑，先从 Git 查原文与历史，再重拟该章节，而非在 a 的结构上叠加，除非明确要求沿用 a。**起草参考不等于 Git 父提交**：b 仍能增量提交在最新版之后，保留其他章节的最新修改。worktree 仅用于真正并行的方案，位于 `<matter>/outputs/revisions/<proposal>/`。

现有 extension 在原生工具、codemode 内嵌调用及 shell/脚本工具完成后固定实际 Markdown 差异。说明结合真实 diff 与本轮用户要求；摘要失败使用明确机械记录。模型判断内容不确定时是否需要先问，确定时直接落稿自动 commit；草案检查点不等于批准立场或发送。保留旧方案及人工/暂存修改，不自动 push。生命周期记录 `matter.md`/`history.md`、结构化台账、配置/日志和二进制不在文档 Git 范围内。

DOCX 仅在明确要求时交付，默认按字、词、短语、句子的顺序采用最小修改；无损 Markdown/DOCX 同步暂缓。一次 shell/脚本调用算一次事务，内部中间保存及任意外部编辑器写入不逐次提交。

本功能尚未发布 npm；可审查开发 checkout 后，本地安装其 `packages/pi-legal-suite`。已有 schema-4 工作区保持原来路径，可用新版 legal-setup 初始化脚本增量加入 Git 设置并刷新托管 `.pi/APPEND_SYSTEM.md`，不覆盖已填写的 profile 和 matter 文件。Git 历史会保留已删除的敏感内容；setup 授权和远端共享应分别确认。

## Setup 后会发生什么

- 项目根目录会有 Pi 自动加载的 `AGENTS.md`，用于保存法律实践 profile；
- `.pi/APPEND_SYSTEM.md` 会追加法律工作区的固定规则，并保留原有项目规则；
- 项目根目录的 `matters/` 和 `logs/` 会被初始化，但不会自动创建具体 matter；可见的 `legal-workbench/` 包装目录不再创建；
- 新 session 会先询问复用或创建 matter，之后的资料和输出放在对应 matter 的 `outputs/` 下；Pi 原始 session 仍使用默认位置。
- 确需日历日期时使用普通 Unix `date` 命令，不再提供专用时间工具；记录日期和 Git 时间均不证明底层法律事件日期。

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

- 89 个 Agent Skills 和一个项目级 extension，没有运行时 npm 依赖；DOCX redline 优先委托当前可用的通用文档能力，不强制使用随包引擎或固定 Python 环境；
- 保留上游覆盖的美国、英国、EEA/EU 和跨境工作流，所有实质输出均是供律师复核的工作稿；
- 不内置 MCP、web access、邮件、Slack、todo 或其他 extensions；
- 休假登记和检查按需执行，上游 agent knowhow 随包提供；台账在授权 matter 内，期限依赖现行来源核验，不提供后台调度或自动提醒；
- 没有可靠外部来源时会保留验证标签；实质法律结论仍需充分核实。
- 业务日期与记录日期分开处理：事件日期只能来自用户、源文件或已验证来源；无法确定时保留 `unknown`，不会用文件修改时间或当前日期替代。

setup 后，`.pi/legal-workbench/` 只保存 Pi 配置、status、matter index 等内部状态；项目根目录的 `AGENTS.md` 保存实践 profile，matter 资料、下载内容、研究记录和工作产品保存在 `matters/<slug>/` 下。每个 matter 使用 `matter.md`、`history.md`、`notes.md` 和 `outputs/`。原始 Pi sessions 使用默认存储位置，`matter.md` 记录绑定的 session ID。

后续计划包括更深入的 CN 及其他法域本地化、完整 DOCX/redline，以及一个项目级整合 MCP、web access、todo 和交互能力的独立工作台包。

## 来源与许可

本包基于 Anthropic 的 [claude-for-legal](https://github.com/anthropics/claude-for-legal) revision `4a6c651899c97cc9140580363c73e0eb17379c2b` 修改并适配到 Pi。上游材料和本包按 Apache-2.0 分发，详见随包提供的 `LICENSE` 和 `NOTICE`。

本项目与 Anthropic 没有从属或背书关系。所有输出均需合格律师复核。
