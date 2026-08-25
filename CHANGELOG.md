# Changelog

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
