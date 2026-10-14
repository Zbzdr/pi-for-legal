# DeepSeek 真实对话验收与 push 前复测

## 已经测过什么

原来的 52 个自动测试使用真实 Git、Pi SDK/codemode 事件，但起草文本是固定输入，摘要模型为桩。这次另行运行真实模型、真实用户对话，不以模型自述作为唯一证据；检查实际 Markdown、Git 版本、公开工具事件和无 Word/无远端状态。

- 模型：`deepseek/deepseek-flash`，本地配置名 **DeepSeek V4.1 Flash**。
- 实际 thinking：`high`（启动请求 medium，运行时报告 high；这里记录实际值）。
- 一个虚构 SaaS 采购工作稿，连续 8 个用户请求；并非 8 个真实客户案件。
- 使用临时工作区与测试 Git 身份，禁用 MCP、外部项目资源及上下文发现；仅显式加载开发版 suite 和内置 codemode。
- 不调用公司真实政策、客户材料或法律检索；没有修改工程分支/提交/push。
- 主流程结果：**8/8 通过**；之前另做过 1 轮微调 smoke，也通过。
- 主流程请求耗时合计约 **66 秒**。Pi 估算费用 **$0.019104732**，仅为运行时价格表估计，不是服务商账单核对结果。

## 请求与观察结果

| 请求 | 文件/Git/工具中观察到的结果 |
|---|---|
| 三个月 → 十二个月，其他字不动 | 同一工作稿精确替换，自动初始化并提交；无 enable/begin 审批或 worktree |
| 十二个月 → 二十四个月 | 再次直接修改，产生新的增量 commit，仍为 main |
| a 逻辑：交付、验收、整改三阶段 | 模型在写入前调用 draft 记录本章原文；只新增三个阶段标题，四个原句保持不变 |
| 另改付款三十日 → 六十日 | 验收 a 稿保持不变，付款单独提交 |
| b 逻辑：甲方义务、供应商义务两块 | 先调用 history，实际返回 pre-a commit；不保留 a 的阶段标题，四个原句按主体重排；付款六十日、责任二十四个月均保留 |
| 在当前 b 稿上只加“一次性” | 精确插入三个字，去掉这三个字后与上一版逐字相同；未重拟或新开分支 |
| 按公司既定责任标准改，未配置则先问 | 读取 profile 后说明未配置，提出资料需求；未修改文件或新增 commit |
| 只读比较 a/b，不需要 Word | 能报告两种组织方式及实际保存位置；文件和 HEAD 不变，没有空提交或 DOCX |

本次所有实际编辑的提交说明均由真实模型生成，没有机械 fallback。例如：

```text
docs: 将责任限制期间从三个月改为十二个月
docs: 将交付验收章节按提交、验收、整改三阶段重排
docs: 交付验收章节改为按甲方义务与供应商义务两块组织
docs: 供应商提交交付物要求中增加“一次性”
```

## 最关键的原文/增量关系

实际版本：

```text
cd98fa23  原文：首次微调已完成，验收章尚未按 a 起草
79cb091c  a：验收章按时间阶段重排
1aaf1187  付款改为六十日
573396b6  b：验收章按主体义务重排
d923f239  在 b 上增加“一次性”
```

b 的 `history` 工具结果实际返回 `cd98fa23...`。b 的 Git parent 是付款已改完的 `1aaf1187...`，不是把整个文件恢复到原文版本。这既避免沿用 a 的结构，也没有回退其他章节。原 a 稿仍能由 Git 查阅。

人工复核 b 文本确认：只把原四句重新归组，五个/十个工作日期限不变；“一次性”是下一请求明确授权的额外修改，不是假装本来就存在。

## 反馈与限制

- **核心交互目前符合要求**：微调无需仪式，换逻辑查原文，明确续改沿当前稿，自动提交不等于采纳或发送。
- **体验有个小问题**：缺公司政策时虽然没有编造标准，但列了九项资料需求，还再次要求确认采购方立场；可优先改成先问有没有现成政策/条款库，再只追问缺口。此处记录观察，没有为了通过测试偷偷修改模型提示。
- 一个模型的一次八轮流程不是“以后每次都正确”的保证；不能证明模型内部思路，也没有测试实际 Word 修订、批注、排版或实体法律结论。
- 原文取回由公开工具结果与 SHA 验证，组织方式、其他章节、字符级微调由实际文件验证；不是只相信助手宣称“已保存/未回退”。
- 测试启动涉及模型服务请求；“不联网”在合同任务中指不做外部检索，并非声称模型 API 没有网络通信。
- 临时工作区保留，便于手动查看；CLI 不保存原始会话，报告保存必要的虚构任务输出、Git 结果和统计。

## 自己在 push 前复测

不需要 push、发布 npm 或全局安装开发包，在工程目录执行：

```bash
npm run check
npm test
npm run test:rpc
npm run test:package

# 真实模型验收，会消耗所选模型额度
npm run test:document-behavior -- --provider deepseek --model deepseek-flash

# 只试第一轮“改三个月为十二个月”
npm run test:document-behavior -- --provider deepseek --model deepseek-flash --max-turns 1
```

脚本直接加载当前工作树的 extension/Skills，输出临时工作区和 `report.json` 路径，失败返回非零退出码。它不属于默认 `npm test` 或 CI，不会意外调用付费模型。前提是本机 Pi 中已配置所选模型凭据；不要把 API key 写进命令或测试文件。

本次可检查的保留工作区：

```text
/private/var/folders/g9/gz4l4sc17tl_x0z8wfk576700000gn/T/pi-legal-live-acceptance-sfaeCR/workspace
```

保留报告在上一级 `report.json`。查看实际成果：

```bash
WORKSPACE=/private/var/folders/g9/gz4l4sc17tl_x0z8wfk576700000gn/T/pi-legal-live-acceptance-sfaeCR/workspace
git -C "$WORKSPACE/matters/demo-saas" log --oneline
git -C "$WORKSPACE/matters/demo-saas" show 79cb091c:outputs/contract.md
git -C "$WORKSPACE/matters/demo-saas" show 573396b6:outputs/contract.md
git -C "$WORKSPACE/matters/demo-saas" diff 1aaf1187 573396b6 -- outputs/contract.md
```

临时目录可能被系统清理；需要长期留存时，把生成的虚构工作区和报告复制到自选的测试目录。不要将实际客户数据纳入公开测试仓库。
