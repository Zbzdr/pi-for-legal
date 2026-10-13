# Changelog

## Unreleased

- DOCX redline 改为映射可用通用文档能力，由模型规划实现；保留确认、matter 内备份和验证契约，移除 maintained suite 的固定替换引擎和 Python bootstrap。
- 将上游 leave-tracker agent 的 knowhow 映射为随包参考材料，恢复按需休假登记与只读检查；缺少依据的期限保持 pending，写入需确认，不安装或承诺自动调度/提醒。
- 上游导入保留 Pi 的休假路由/存储/确认包装，刷新参考材料，并校验 checkout 与 reviewed revision 一致且干净，避免错误来源标注。
- 每次 agent turn、matter 状态/操作和内置 write/edit 调用都重新核对当前分支绑定与磁盘索引；其他 session 关闭 matter 后，不再沿用旧缓存授权写入。
- 在关闭、移除或移动索引记录、配置失效及恢复旧 session/分支时阻止旧 matter 写入，并提示重新绑定或修复工作区。
- 使用项目内 `matter-operation.lock` 保护多个 Pi 进程对索引和 session 关联表的读改写；竞争调用返回可重试错误，异常退出遗留锁需人工核实后清理。
- 将工具失败标记为 `isError: true`，并增加跨 session、分支恢复、索引损坏、锁竞争及独立进程并发的回归测试。

## 0.5.1 — 2026-08-26

- 明确 setup 和 matter 初始化只能使用当前会话中用户明确提供并授权的内容；不从历史 session、无关文件、其他项目或主目录配置补全信息。
- 将 matter 创建定义为 intake 和目录初始化步骤；生成的 matter 文件会标记用户输入和文件为待核实参考，不自动视为事实、法律结论、期限、适用法或已批准政策。
- 记录用户明确提供的 matter 请求和文件路径，便于后续核查来源。

## 0.5.0 — 2026-08-25

- 将默认可见法律工作区从 `legal-workbench/` 上移到项目根目录的 `matters/` 和 `logs/`。
- 保留 `.pi/legal-workbench/` 作为 Pi 专用配置、状态和 matter metadata 目录。
- 将 legal workbench 配置 schema 升至 4；旧的可见目录布局不自动迁移或删除。
- setup 不再为根目录模式创建额外的 `README.md` 或可见 `legal-workbench/` 包装目录。

## 0.4.1 — 2026-08-25

- 统一系统记录日期为 Unix `bash date +%Y-%m-%d` 返回的短格式，并新增 `legal_time` 工具。
- 区分事件发生日期与记录日期；无法确认的事件日期保留为 `unknown`，不再默认填写 today、session 日期或文件修改日期。
- 将 matter 创建/关闭记录改为上游风格的 append-only Markdown history 条目，并标注 `System record`。
- 将 chronology 输出路径统一到 matter 的 `outputs/chronology.md`。
- 在 README 中说明当前支持 macOS/Linux Unix 环境，Windows/PowerShell 暂不支持。

## 0.4.0 — 2026-08-24

- 统一通用工作区命名：项目级 profile 使用 Pi 原生的 `AGENTS.md`，matter 使用 `matters/<slug>/matter.md`、`history.md`、`notes.md` 和 `outputs/`。
- 移除自动创建的 `practice/`、`sources/`、`research/` 和 `work-product/` matter 目录；playbook learning 改用 `logs/learning/`。
- 将 legal workbench 配置 schema 升至 3。旧配置不自动迁移，需要备份后重新运行 setup。
- 更新领域 Skill 的 matter 输出路径和导入脚本，避免后续同步重新生成旧目录。

## 0.3.0 — 2026-08-19

- 新增项目级 legal workspace 初始化：`.pi/` 只保存可复用状态，matter 数据、研究和工作产品保存在可见目录。
- 新增 core extension，在新 session 首轮执行 metadata-only matter 匹配，并通过 `legal_matter_session` 创建或绑定事务。
- 保留 Pi 默认 session 存储方式，仅在 matter README 中记录关联 session ID。
- 为内置 write/edit 增加 active-matter 路径护栏，并保留已有 `.pi/settings.json` 和 `APPEND_SYSTEM.md` 内容。
- 收敛为唯一维护和发布的 `@zbzdr/pi-legal-suite`；原 core/领域包停止更新并在 suite 发布后标记 deprecated。

## 0.2.0 — 2026-08-13

- 将法律研究和领域工作流调整为多法域口径，保留上游涉及美国、英国、EEA/EU 和跨境事项的内容。
- Setup 加入可确认、可逐项修改的 quick defaults。
- 新增成交偏差记录和 playbook 更新提案工作流。
- 新增项目级 DOCX tracked redline：自动备份源文件，使用独立 Python 虚拟环境和固定版本的 `python-docx`、`lxml`。
- 使用 Pi 的渐进披露机制加载内部 worker，并统一各领域的 matter 存储路径。
- 增加 Skill 引用、安装组合、RPC、行为测试和 DOCX 输出验证。

## 0.1.0 — 2026-08-11

- 首次公开发布。
- 提供 core、commercial、privacy、regulatory、AI governance、employment、corporate、litigation、IP、product 和 all-in-one suite 包。
