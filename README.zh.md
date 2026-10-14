# Pi for Legal

> **其他语言 / Other languages**: [English](README.md)

Pi for Legal 是 [Anthropic Claude for Legal](https://github.com/anthropics/claude-for-legal) 在 Pi 上的独立移植。本项目主要工作由ChatGPT5.6-sol完成。

项目默认采用 workspace-first：package 安装在当前项目，实践 profile、matter 和工作材料也保存在项目目录中。外部检索和协作工具由用户按需配置。

## 它目前能做什么

- 多法域法律研究：识别适用法和权威层级，检查时效与后续处理，并输出带来源说明的 memo；
- 商业合同：路由并审查 MSA、SaaS、NDA、vendor agreement、修订和续期事项；
- 法务工作流：privacy、regulatory、AI governance、employment、corporate、litigation、IP 和 product；
- 项目级 setup、quick defaults、实践 profile、matter 隔离、playbook 学习、升级判断和业务摘要；
- 经确认后通过可用的通用文档能力生成 DOCX tracked redline，要求 matter 内备份和验证；
- 在没有可靠外部来源时明确标记验证缺口，不把模型记忆包装成已完成的法律检索。

目前唯一维护和发布的 all-in-one 包包含 89 个 Skills 和一个项目级 extension，不内置 MCP、web access、邮件、Slack、todo 或其他 Pi extensions。

`legal-employment-log-leave` 和 `legal-employment-leave-tracker` 支持按需登记、核验和检查受保护休假。上游 agent 的 knowhow 映射为随包参考材料，不要求运行独立 agent。台账保存在当前授权 matter 内，缺少依据的期限保持待核验；本包不安装定时器或提醒服务。需要自动化时，可在另行确认配置后由外部任务调用 Pi 的 CLI、RPC 或 SDK。

DOCX redline 按法律上游的委托方式工作：模型读取当前可用的通用 `docx` Skill 或等效能力，自主规划最小粒度修改，并遵守原文保护、备份和验证要求。本包不捆绑外部 Skill、强制的修订引擎或固定 Python 环境；缺少能力时提供经批准的本地实施方案或可供 Word 使用的修改表，不会静默安装依赖。

## Quick start

当前支持带有 `bash` 与 Unix `date` 的 macOS/Linux。Markdown 文档 Git 还需要 Git 与 Pi 1.1 或更新版本（Node.js 22.19+）；Windows/PowerShell 暂不支持。

在需要使用法律工作流的项目目录里安装：

```bash
pi install -l npm:@zbzdr/pi-legal-suite
```

启动 Pi 后先运行：

```text
/skill:legal-setup
```

Setup 会询问实践类型、法域、审查偏好和数据目录，并在写入前展示准确路径。

按提示完成 setup 后，重启 Pi，或在当前 Pi 中重新加载：

```text
/reload
```

然后可以在原 session 或新 session 中描述任务；根据提示选择或创建事务，然后开始研究、审查或起草工作。

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
- 每个新 session 首先询问复用或创建哪个 matter，之后的资料和输出放在对应 matter 的 `outputs/` 下；Pi 原始 session 仍使用默认位置。
- 确需日历日期时使用普通 Unix `date` 命令，不再提供专用时间工具；记录日期和 Git 时间均不证明底层法律事件日期。

从 0.5.0 起，默认可见目录已改为项目根目录下的 `matters/` 和 `logs/`；旧的 `legal-workbench/` 可见目录不会自动迁移。

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

带版本号的安装会锁定版本。例如 `npm:@zbzdr/pi-legal-suite@0.4.0` 不会被上述命令自动升级；需要改用新的版本号重新安装：

```bash
pi install -l npm:@zbzdr/pi-legal-suite@<new-version>
```

项目本地安装仍然优先。无 `-l` 的全局安装属于次要支持模式，会让 suite 出现在该用户的所有 Pi 项目中；setup、profile 和 matter 仍按当前 workspace 分开维护。

## 上游追踪

最近一次法律上游核对确认：与初次映射相比没有新提交或文件变更。可用独立上游 checkout 运行 `npm run track:upstream -- <checkout> --fetch` 再次检查；该命令只报告差异，不自动导入或合并。详见[审查流程](docs/upstream-sync.md)、[已记录的状态](docs/upstream-status.json)及[验证范围与结果](docs/verification-2026-10-13.md)。

## 来源与许可

本项目基于 `claude-for-legal` revision `4a6c651899c97cc9140580363c73e0eb17379c2b` 适配。Skills、提示词和参考模板如含上游材料，均保留来源及修改说明；详细对应关系见 [docs/upstream-map.md](docs/upstream-map.md)。当前移植以 Markdown/JSON 工作流为主，没有打包上游的第三方插件或 MCP connector 实现。

上游材料由 Anthropic PBC 按 Apache License 2.0 提供，本项目同样采用 Apache-2.0。见 [LICENSE](LICENSE) 和 [NOTICE](NOTICE)。Pi for Legal 与 Anthropic 没有从属或背书关系；Claude、Anthropic 及第三方产品名称仍属于各自权利人。

## 未来更新路线图

- 优化工作区内按照session来隔离任务context的策略；
- 深化 CN 及其他法域的本地化资料、来源策略和专门模板；
- 深化复杂 DOCX redline、批注和格式保真的能力映射与验证证据；
- 实现法律检索 MCP的接入和配置，必要时依赖第三方 MCP adapter；
- 以单整合包的形式，把 MCP、web access、todo、ask-user-question 等常用能力组合起来；最终让用户在一个工作区里只安装一个包，就能完成主要法律任务。

以上功能将分阶段实现。
