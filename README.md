# Sailer 2D Felice Edition

Felice 周末独立开发版本。这个仓库是从 Eric 的 `sailer-2d` 源项目复制出来的独立副本，用来让 Felice 在自己的电脑和 Trae 里安全实验。

重要边界：

- Felice 在这个仓库里修改，不会直接影响 Eric 电脑上的主项目。
- 这个版本可以大胆做真实感实验、HUD 改进、教学解释和小范围物理调整。
- 如果某个改动被 Eric 认可，再由 Eric 挑选合并回主 `sailer-2d` 或发布到 Hub。
- 不要提交 `node_modules`、`dist`、本地日志或个人隐私文件。

一个可直接在浏览器里玩的 2D 帆船训练模拟器，基于 `Vite + TypeScript + PixiJS`。

## 玩法

- `A / D` 转舵
- `↑ / ↓` 调整主帆收放
- `← / →` 调整压舷
- `W / S` 调整稳向板
- 鼠标滚轮或右侧缩放条缩放视角
- 左侧栏查看并调整风/水系统
- 右侧栏查看船只状态、受力叠加和地图
- 左右侧栏都支持收起，方便腾出更多操作视野

## 本地运行

```bash
npm install
npm run dev
```

如果要在局域网里给别人一起打开：

```bash
npm run dev:host
```

## 测试与构建

```bash
npm run typecheck
npm run test
npm run build
npm run preview
```

## Felice 周末开发流程

第一次下载：

```bash
git clone https://github.com/Eric8788/sailer-2d-felice.git
cd sailer-2d-felice
npm install
npm run dev
```

每天开始前先同步：

```bash
git pull
```

做一个新想法时建议开分支：

```bash
git checkout -b felice/weekend-realism
```

提交前检查：

```bash
npm run typecheck
npm run test
```

提交并上传：

```bash
git add .
git commit -m "feat: describe your realism change"
git push
```

Eric 主 Hub 静态发布版本使用主 `sailer-2d` 项目构建。Felice 这个仓库默认只用于独立开发和预览。

如果 Eric 要把认可的改动发布到 Hub，再在主项目中使用 Hub 子路径构建：

```bash
BASE_PATH=/projects/sailer-2d/ npm run build
```

构建产物复制到 `ai-club-hub/projects/sailer-2d/` 后，由 `https://hub.ericproject.xyz/projects/sailer-2d/index.html` 对外提供稳定入口。

## 项目亮点

- 左侧栏专注环境系统：真实风、视风、水流、侧滑
- 右侧栏专注船系统：航向、船速、横倾、操控状态、受力叠加、地图
- HUD 支持收放，主视野会自动避让，不再被面板硬压住
- 风流和水流粒子使用批量绘制，航迹使用对象池，运行更稳
- 纯函数物理 step 已拆分，便于继续添加阵风、波浪、失速等现实因素

## Felice AI Project

- [第一次一对一课文档](./docs/felice-lesson-01-realism-loop.md)：60 分钟共同查看稿，完成专业试玩到 AI 修改的第一次闭环
- [真实感评审工作流](./docs/felice-realism-review-workflow.md)：定义 Felice 作为 sailing realism reviewer 的协作方式
- [试玩反馈表](./docs/felice-playtest-feedback-form.md)：固定测试场景、反馈记录、交给 Codex 的任务卡

## 发布到 GitHub Pages

仓库已包含 `vite.config.ts` 和 Pages 工作流。推送到 GitHub 后：

1. 在仓库设置里启用 GitHub Pages，并选择 `GitHub Actions`
2. 推送到默认分支
3. Actions 完成后即可通过 Pages 地址在线游玩

## 后续适合继续扩展的现实因素

- 阵风与风摆
- 波浪和拍浪阻力
- 帆失速与重新充气
- 大舵角减速与舵效衰减
- tack / gybe 过程中的速度损失和惯性
