# Changelog

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
