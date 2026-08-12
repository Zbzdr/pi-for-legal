# @zbzdr/pi-legal-core

共享的 Pi 法律基础包，包含：

- 项目级法律实践 profile setup/customize；
- 美国法律研究与来源审查；
- matter 隔离；
- 升级说明；
- 业务摘要与人工复核规则。

项目级安装：

```bash
pi install -l npm:@zbzdr/pi-legal-core@0.1.0
```

本地开发：

```bash
pi install -l /absolute/path/to/pi-for-legal/packages/pi-legal-core
```

安装后先运行 `/skill:legal-setup`。本包不内置 MCP、web access 或其他 extensions。

推荐保留 `-l` 进行项目本地安装。无 `-l` 的用户全局安装会让本包出现在该用户的所有 Pi 项目中；每个项目仍需单独 setup，且不要再与项目级 suite 重复安装。
