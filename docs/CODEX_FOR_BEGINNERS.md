# Felice Codex 小白使用指南

> 目标：用 Codex 帮你修改 Sailer 2D Felice Edition。  
> 原则：你负责真实帆船判断，Codex 负责读代码、改代码、跑测试。

## 1. 第一次准备

先把项目下载到你的电脑：

```bash
git clone https://github.com/Eric8788/sailer-2d-felice.git
cd sailer-2d-felice
npm install
npm run dev
```

看到类似下面的地址后，用浏览器打开：

```text
http://localhost:5173/
```

如果 `npm install` 或 `npm run dev` 报错，先截图给 Eric，不要乱删文件。

## 2. 每次开始写代码前

进入项目文件夹：

```bash
cd sailer-2d-felice
```

先同步最新代码：

```bash
git pull
```

然后开一个自己的分支：

```bash
git checkout -b felice/weekend-realism
```

如果提示这个分支已经存在，就改一个新名字：

```bash
git checkout -b felice/weekend-realism-2
```

## 3. 在 Codex 里第一句话这样说

把下面整段复制给 Codex，然后把空白处填上你的真实观察。

```text
我们在修改 Sailer 2D Felice Edition。

项目路径是当前文件夹。
技术栈是 Vite + TypeScript + PixiJS + Vitest。

我的角色是帆船真实感评审者，不是专业程序员。
请你先阅读 README.md、docs/FELICE_WEEKEND_GUIDE.md、src/game/physics.ts、src/ui/dom.ts、src/types.ts 和 tests/physics.test.ts。

本轮只做一个小修改，不要重构整个项目。

我发现的问题是：

真实帆船应该是：

我希望你帮我修改：

验收标准：
1.
2.
3.

要求：
- 修改前先告诉我你准备改哪些文件。
- 如果改物理，请更新或新增测试。
- 修改后运行 npm run typecheck 和 npm run test。
- 最后用简单中文告诉我改了什么、怎么测试。
```

## 4. 最适合第一次让 Codex 做的任务

第一次不要让 Codex 大改。推荐选一个：

| 任务 | 推荐原因 |
|---|---|
| HUD 显示帆状态 | 最容易看见结果，风险低 |
| 迎风时掉速更明显 | 很适合体现真实感判断 |
| 大舵角增加速度代价 | 修改范围小，容易测试 |
| 稳向板抬起后侧滑更明显 | 帆船同学容易判断是否变好 |

不要第一次就说：

```text
重做整个游戏
做一个完全真实的物理引擎
把画面改成 3D
```

这些太大，Codex 容易改乱。

## 5. 一个可以直接用的示例 Prompt

如果你想先做 HUD 帆状态，可以复制这个：

```text
我们在修改 Sailer 2D Felice Edition。

请先阅读 README.md、docs/FELICE_WEEKEND_GUIDE.md、src/game/physics.ts、src/ui/dom.ts、src/types.ts 和 tests/physics.test.ts。

本轮只做一个小修改：在右侧船系统 HUD 里清楚显示当前帆状态。

背景：
物理里已经有 sailFlowState，状态包括 attached、luffing、stalled、backwinded。
现在试玩者不容易从界面上看出帆到底是在正常受力、飘帆、失速还是被反吹。

真实教学需求：
初学者需要马上看到帆状态，因为这能解释为什么船加速、掉速或换舷失败。

请帮我：
1. 在 HUD 里新增一个清楚的“帆状态 / Sail Flow”显示。
2. 把 attached、luffing、stalled、backwinded 显示成容易理解的中文+英文。
3. 不要大改 UI 布局。
4. 如果需要，请更新类型或测试。
5. 修改后运行 npm run typecheck 和 npm run test。

验收标准：
1. 页面上能看到当前帆状态。
2. 接近风眼或放帆太多时，状态能显示 luffing。
3. typecheck 和 test 都通过。
```

## 6. Codex 改完后你要做什么

Codex 说改完后，不要马上提交。先按顺序做：

1. 浏览器里重新试玩。
2. 试你刚才说的同一个场景。
3. 看结果是不是更接近真实帆船。
4. 运行检查：

```bash
npm run typecheck
npm run test
```

如果检查通过，再看改了哪些文件：

```bash
git status
git diff
```

看不懂 `git diff` 没关系，可以问 Codex：

```text
请用小白能懂的中文解释这次 git diff，每个文件改了什么，为什么改。
```

## 7. 怎么提交和上传

确认改动满意后：

```bash
git add .
git commit -m "feat: show sail flow state in HUD"
git push
```

如果 `git push` 失败，把错误信息截图给 Eric。

## 8. 你每次都要记录的 5 句话

写在你的笔记里，或者让 Codex 帮你整理：

```text
我发现的问题是：

真实帆船应该是：

我让 Codex 修改了：

修改后我复测看到：

下一轮还应该改：
```

这 5 句话就是 AI Project 展示材料，不要省略。

## 9. 遇到问题怎么问 Codex

如果看不懂报错：

```text
我看不懂这个报错。请先解释原因，不要立刻乱改。然后给我一个最小修复方案。
```

如果页面打不开：

```text
npm run dev 后页面打不开。请帮我检查可能原因，并一步一步告诉我怎么做。
```

如果改动太大：

```text
这次改动太大了。请停下来，只保留和本轮目标有关的最小修改。
```

如果测试失败：

```text
npm run test 失败了。请解释失败的测试在检查什么，再决定是代码错了还是测试需要更新。
```

## 10. 安全提醒

不要把这些东西发给 Codex 或提交到 GitHub：

- 账号密码
- GitHub token
- API key
- 学生隐私
- 学校敏感信息
- `.env` 文件

Codex 是你的工程助手，不是最终裁判。真实帆船像不像，最后由你判断。

