# TODO

## 待做

- [x] yino-ai Skill 调优（prompt、参数、错误处理等）
- [ ] 界面开发（Agent First 方向的新 UI）
- [ ] 清理项目中残留的 MkSaaS 品牌引用

## Ideas（选做，非 MVP）

- [ ] Agent 套壳 SaaS：寻找按请求计费的 Agent 供应商（[思路笔记](notes/260319-1-Agent-套壳-SaaS-思路.md)）
- [ ] API 发现接口返回各能力的轮询耗时统计（p50 + p90），按模型/任务类型分，定时聚合更新，帮助 agent 设定合理的轮询超时
- [ ] Generation Comment/Title：生成任务加标注字段，Agent 可写入上下文信息
- [ ] Project：将多个 generation 关联为一个作品（轮询归并 + 语义关联）
- [ ] Preview API：结构化 Block + 模板渲染，让 Agent 生成可分享的作品预览（[思考笔记](notes/260319-3-从单次生成到完整作品：Project-和-Preview-设计思考.md)）

## 已完成（Agent First 方向，#37 起）

- [x] #37 清除 MV Agent Pipeline，保留 worker 和 generation 基础设施
- [x] #38 主页改版 + All-in-One OpenClaw Video Skill 规划
- [x] #39 主页 SEO 改版：AI Music Video Generator + 聊天式 CTA
- [x] #40 Agent API：生成能力 + 发现机制 + 双轨鉴权
- [x] #41 API Key 管理界面 + 删除 lab API
- [x] #42 Skill 托管迁移到 ClawHub，清除自托管 skill route
- [x] #43 yino-ai Skill + 文档清理 + Veo 3.1 更名
