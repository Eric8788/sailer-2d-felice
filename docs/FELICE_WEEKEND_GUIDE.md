# Felice 周末独立开发指南

> 目标：让 Felice 在自己的电脑上用 Trae 独立修改 Sailer 2D Felice Edition。  
> 这个仓库是独立实验版本，不会直接改 Eric 的主 `sailer-2d` 源文件。

## 1. 第一次下载

在终端或 Trae 的 terminal 里运行：

```bash
git clone https://github.com/Eric8788/sailer-2d-felice.git
cd sailer-2d-felice
npm install
npm run dev
```

浏览器打开 terminal 里显示的本地地址，通常是：

```text
http://localhost:5173/
```

## 2. 每次开始前

先同步 Eric 推送的新内容：

```bash
git pull
```

如果 Trae 提示有冲突，先不要乱点，截图发给 Eric。

## 3. 推荐任务

周末优先做小而清楚的真实感改进，不要重写整个项目。

推荐从这些任务里选一个：

| 任务 | 适合度 | 说明 |
|---|---|---|
| HUD 显示帆状态 | 很适合 | 显示 `attached / luffing / stalled / backwinded` |
| 迎风掉速更明显 | 适合 | 接近风眼时更像真实 no-go zone |
| 大舵角速度代价 | 适合 | 长时间大舵角不应该免费转向 |
| 稳向板和侧滑 | 适合 | 抬起稳向板后侧滑应该更明显 |
| 横倾和压舷反馈 | 中等 | 强风下压对边/压错边差异更清楚 |

## 4. 给 Trae / AI 的 Prompt

可以直接复制：

```text
这是 Sailer 2D Felice Edition，一个 Vite + TypeScript + PixiJS + Vitest 的 2D 帆船模拟器。

我的角色是帆船真实感评审者。请帮我做一个小范围修改，不要重构整个项目。

我想改的问题：

当前模拟器表现：

真实帆船应该：

验收标准：
1.
2.
3.

要求：
- 先读 src/game/physics.ts、src/ui/dom.ts、src/types.ts 和 tests/physics.test.ts。
- 保持现有项目结构。
- 如果改物理，请补充或更新 Vitest 测试。
- 修改后需要能通过 npm run typecheck 和 npm run test。
```

## 5. 提交前检查

每次准备提交前运行：

```bash
npm run typecheck
npm run test
```

如果都通过，再提交：

```bash
git status
git add .
git commit -m "feat: improve sail realism feedback"
git push
```

## 6. 不要提交这些东西

- `node_modules`
- `dist`
- `.env`
- 账号密码、token、API key
- 和 Sailer 无关的大文件

## 7. 记录你的判断

每次改动都保留这 5 句话，之后可以直接放进 AI Project 展示：

```text
我发现的问题是：

真实帆船应该是：

我让 AI / Trae 修改了：

修改后我复测看到：

下一轮还应该改：
```

