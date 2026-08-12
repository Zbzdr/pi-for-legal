# @zbzdr/pi-commercial-legal

美国商业合同工作流，包含合同路由、vendor/service agreement、NDA、SaaS、修订历史和续期追踪。

推荐与 `@zbzdr/pi-legal-core` 一起安装：

```bash
pi install -l npm:@zbzdr/pi-legal-core@0.1.0
pi install -l npm:@zbzdr/pi-commercial-legal@0.1.0
```

本地开发：

```bash
pi install -l /absolute/path/to/pi-for-legal/packages/pi-legal-core
pi install -l /absolute/path/to/pi-for-legal/packages/pi-commercial-legal
```

只安装本包仍会暴露六个商业合同 skills，但不会提供共享 setup、法律研究、matter 和升级 skills。

推荐保留 `-l` 进行项目本地安装。用户全局安装属于次要支持模式，且不要与项目级 suite 混装。
