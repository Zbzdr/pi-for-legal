# @zbzdr/pi-commercial-legal

商业合同工作流，包含合同路由、vendor/service agreement、NDA、SaaS、轻量 DOCX tracked redline、修订历史和续期追踪。

DOCX redline 首次使用会在当前项目的 `.pi/legal-workbench/venvs/docx-redline/` 创建虚拟环境，并在用户确认后安装固定版本的 `python-docx` 和 `lxml`。该环境不会写入系统或用户全局 Python。

推荐与 `@zbzdr/pi-legal-core` 一起安装：

```bash
pi install -l npm:@zbzdr/pi-legal-core@0.2.0
pi install -l npm:@zbzdr/pi-commercial-legal@0.2.0
```

本地开发：

```bash
pi install -l /absolute/path/to/pi-for-legal/packages/pi-legal-core
pi install -l /absolute/path/to/pi-for-legal/packages/pi-commercial-legal
```

只安装本包仍会暴露七个商业合同 skills，但不会提供共享 setup、法律研究、matter、playbook 学习和升级 skills。

推荐保留 `-l` 进行项目本地安装。用户全局安装属于次要支持模式，且不要与项目级 suite 混装。
