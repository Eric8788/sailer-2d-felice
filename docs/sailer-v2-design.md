# Sailer V2 2.5D 帆船模拟器设计文档

## 1. 决策结论

建议新建一个 V2 项目，而不是在当前代码上继续深改。

当前项目已经证明方向可行：浏览器能运行，有风、水、船、HUD、力箭头、地图和基础测试。它非常适合作为原型、课堂讨论对象和迁移参考。但如果目标是做一个足够真实、专业、可推广的 2.5D 帆船训练模拟器，最好从干净架构开始。

推荐目录：

```text
sailer-2d/          当前周末原型，保留
sailer-v2/          新项目，重新设计物理核心和专业 UI
```

如果不想开新仓库，也可以在当前仓库中新建 V2 目录，但从工程清晰度看，新项目更合适。

## 2. 产品目标

做一个面向帆船学生的 2.5D 训练模拟器，而不是普通航海游戏。

核心目标：

```text
让学生在 2D 俯视图中操控小帆船，同时通过专业仪表和诊断视图看到隐藏的风、水、帆、舵、稳向板、重心、横倾、侧滑和受力关系。
```

这个产品最重要的价值不是“画面像真船”，而是“比市面上很多帆船游戏更能解释为什么”。

## 3. 为什么做 2.5D

纯 2D 俯视图适合展示：

- 航向。
- 航迹。
- 风向。
- 水流。
- 浮标。
- 禁航区。
- VMG。
- 侧滑。
- 力箭头。
- 迎风/顺风/横风关系。

但纯 2D 不擅长展示：

- 船体左右横倾。
- 人的压舷效果。
- 稳向板抬起和放下。
- 舵和稳向板在水下产生的侧向力。
- 帆的弯曲、飘帆、失速、背风受力。
- 为什么船可以逆风之字形前进。

所以 V2 应该采用：

```text
主视图：2D 俯视航行图
辅助视图：2.5D 专业诊断面板
可选增强：一个固定角度的小 3D 船体预览窗
```

不建议一开始做完整 3D。完整 3D 会增加资产、镜头、性能、操作和调试复杂度，但并不会自动解决核心物理问题。

## 4. 技术路线

推荐技术栈：

```text
TypeScript
Vite
PixiJS：主 2D 航行画布
HTML / CSS / SVG / Canvas：专业仪表和诊断面板
Vitest：物理模型测试
Three.js：可选，用于小型 3D/2.5D 船体预览
```

不建议 Unity 作为 V2 主技术路线。

原因：

- Unity 不会自动提供真实帆船物理。
- 帆、舵、稳向板、水动力、横倾力矩仍然需要自己写。
- 浏览器项目更容易分享给学生。
- Web UI 更适合做大量教学仪表、图表和诊断面板。
- TypeScript 代码更容易让学生阅读，也更适合 AI 协作重构。

Unity 可以作为未来完整 3D 游戏阶段的候选，但不应该成为当前 2.5D 教学模拟器的主线。

## 5. V2 的核心原则

V2 应该是 telemetry-first，也就是“遥测数据优先”。

每一帧物理计算不应该只输出位置和速度，还应该输出可解释的数据。

不要只输出：

```text
boatPosition
boatHeading
boatSpeed
```

应该输出：

```text
boatPosition
boatHeading
velocityThroughWater
sideSlipVelocity
yawRate
heelAngle
heelRate
sailAngle
sailAngleOfAttack
sailFlowState
sailLift
sailDrag
driveForce
sideForce
centerboardLift
centerboardDrag
rudderLift
rudderDrag
rightingMoment
leewayAngle
capsizeRisk
```

如果模拟器不能解释为什么船加速、减速、转向、侧滑、横倾或翻船，那物理模型还不够好。

## 6. 内部单位系统

物理核心内部统一使用国际单位制。

```text
距离：meter
时间：second
质量：kg
力：newton
力矩：newton-meter
速度：m/s
角度：计算内部用 radian，显示层用 degree
```

HUD 显示时再转换：

```text
1 knot = 0.514444 m/s
1 m/s = 1.94384 knots
```

渲染缩放必须和物理单位分离。不能把画布像素比例混进物理模型里。

## 7. 主要系统拆分

### 7.1 环境系统

负责：

- 真风风速。
- 真风风向。
- 水流速度。
- 水流方向。
- 阵风。
- 风摆。
- 后续可扩展浪和空间风场。

输入：

```text
baseTws
baseTwd
currentSpeed
currentDirection
gustLevel
shiftLevel
boatPosition
time
```

输出：

```text
trueWindVector
currentVector
localWindAtBoat
localCurrentAtBoat
```

第一版只需要均匀风和均匀水流。阵风和风摆可以用低频噪声或随机缓变实现。

### 7.2 视风系统

负责计算船实际感受到的风。

输入：

```text
trueWindVector
boatVelocityThroughWater
boatHeading
```

输出：

```text
apparentWindVector
aws
awa
twa
```

教学意义：

学生可以看到船速变化后，视风角和视风速为什么会变化。这是理解帆角调整的关键。

### 7.3 帆系统

负责把视风和帆角转换成空气动力。

输入：

```text
apparentWindVector
boatHeading
sailAngle
sailTrim
optionalSailCamber
```

输出：

```text
sailAngleOfAttack
liftCoefficient
dragCoefficient
sailLift
sailDrag
driveForce
sideForce
heelingMoment
yawMoment
flowState
```

帆的气流状态：

```text
luffing      飘帆，帆太松或太接近风
attached     气流附着，效率较高
stalled      失速，帆太紧或攻角过大
backwinded   背风受力，常见于换舷或顶风错误状态
```

第一版不需要 CFD。可以用简化攻角曲线：

- 攻角小，升力小。
- 攻角进入合理区间，升力提升。
- 攻角过大，失速，升力下降，阻力上升。
- 帆太松，推力不足并出现飘帆提示。

### 7.4 船体系统

负责船体阻力和惯性。

输入：

```text
forwardVelocityThroughWater
sideVelocityThroughWater
heelAngle
boatConfig
```

输出：

```text
forwardDrag
sideDrag
heelDragPenalty
```

第一版模型：

- 前进方向二次阻力。
- 横向速度二次阻力。
- 横倾过大增加阻力。
- 可选软性的船速上限。

### 7.5 稳向板系统

负责水下抗侧滑能力。

输入：

```text
boatVelocityThroughWater
boatHeading
leewayAngle
centerboardDeployment
```

输出：

```text
centerboardLift
centerboardDrag
leewayReduction
centerboardEfficiency
```

教学意义：

学生应该能看到：

- 迎风时稳向板放下，侧滑减少。
- 顺风时稳向板可以抬起，减少阻力。
- 板太浅会明显侧滑。
- 板太深在某些航向下会拖慢船。

### 7.6 舵系统

负责转向力矩和舵阻力。

输入：

```text
boatVelocityThroughWater
rudderAngle
sideSlipAngle
```

输出：

```text
rudderSideForce
rudderDrag
yawMoment
rudderAuthority
rudderStallWarning
```

教学意义：

学生应该能理解：

- 船速低时舵效弱。
- 舵角过大不是更快转，而是更大阻力。
- 顺滑转向比猛打舵更快。

### 7.7 船员重心系统

负责压舷和扶正力矩。

输入：

```text
crewLateralPosition
heelAngle
boatConfig
```

输出：

```text
rightingMoment
capsizeRiskReduction
```

第一版只做左右移动。后续可以增加前后移动，用于解释船体 trim。

### 7.8 刚体积分系统

负责把所有力和力矩合成下一帧状态。

船体状态：

```text
position
heading
forwardVelocity
sideVelocity
yawRate
heelAngle
heelRate
capsized
```

输入：

```text
totalForwardForce
totalSideForce
totalYawMoment
totalRollMoment
dtSeconds
```

输出：

```text
nextBoatState
```

实现建议：

- 固定时间步长。
- 半隐式 Euler 即可。
- 物理不依赖渲染帧率。

## 8. 船型配置

不要把物理参数和渲染参数混在一个扁平对象里。

建议：

```ts
interface BoatConfig {
  id: string;
  displayName: string;
  physics: BoatPhysicsConfig;
  controls: BoatControlConfig;
  visuals: BoatVisualConfig;
}
```

物理参数示例：

```ts
interface BoatPhysicsConfig {
  hullLengthM: number;
  beamM: number;
  massKg: number;
  yawInertia: number;
  rollInertia: number;
  sailAreaM2: number;
  centerOfEffortHeightM: number;
  centerboardAreaM2: number;
  rudderAreaM2: number;
  maxRightingMomentNm: number;
  capsizeAngleRad: number;
}
```

第一艘船建议使用 ILCA / Laser-like 单人帆船。后续再加 420、Optimist、RS Feva 或其他船型。

## 9. 界面布局

### 9.1 主航行视图

主视图仍然是俯视图。

必须展示：

- 船体。
- 航向。
- 帆角。
- 舵角。
- 风场粒子。
- 水流粒子。
- 航迹。
- 侧滑轨迹。
- 禁航区。
- 力箭头。
- VMG 方向。
- 浮标和路线。

可以有几种模式：

```text
Clean Sailing Mode       干净驾驶模式
Physics Lab Mode         物理实验模式
Coach Mode               教练诊断模式
Race Practice Mode       竞赛训练模式
```

### 9.2 横倾和平衡面板

不要直接照搬飞机水平仪。更建议做一个“船尾视角横倾仪”。

显示：

```text
水面水平线
船体横截面
桅杆倾斜
人重心位置
横倾角
扶正力矩
翻船风险
```

状态：

```text
Flat / efficient         船体较平，效率高
Moderate heel            中等横倾
Overpowered              过载，需要放帆或压舷
Capsize imminent         即将翻船
Capsized                 已翻船
```

### 9.3 帆形和气流面板

显示一个帆的截面，而不是只显示俯视图中的帆线。

显示：

- 视风方向。
- 帆弦线。
- 帆弯曲。
- 攻角。
- 升力箭头。
- 阻力箭头。
- 帆两侧 telltales。
- 气流状态。

颜色建议：

```text
绿色：气流附着
黄色：飘帆/帆太松
红色：失速/帆太紧
紫色：背风受力
```

教练提示：

```text
Trim in
Ease sheet
Head up
Bear away
Hike harder
```

### 9.4 稳向板和舵面板

用侧视或水下剖面图。

显示：

- 船体侧面。
- 稳向板深度。
- 舵角。
- 水流方向。
- 稳向板侧向力。
- 稳向板阻力。
- 舵力。
- 舵阻力。
- 侧滑角。

教练提示：

```text
迎风时板位太浅，侧滑增加
顺风时板位过深，阻力偏大
舵角过大，速度损失明显
低速时舵效不足
```

### 9.5 视风几何面板

专门解释真风、船速、视风之间的关系。

显示：

- 真风向量。
- 船对水速度向量。
- 视风向量。
- TWA。
- AWA。
- TWS。
- AWS。

这个面板是解释“为什么船一快，风就像从更前面吹来”的关键。

### 9.6 专业 HUD

保留紧凑仪表信息：

```text
HDG    航向
STW    对水速度
SOG    对地速度
COG    对地航向
TWS    真风速
TWD    真风向
TWA    真风角
AWS    视风速
AWA    视风角
VMG    对目标/对风有效速度
LEEWAY 侧滑角
HEEL   横倾角
```

HUD 应该像训练仪表，而不是游戏装饰面板。

## 10. 操作设计

键盘：

```text
A / D          舵左 / 舵右
Up / Down      收帆 / 放帆
Left / Right   人重心左 / 右
W / S          稳向板上 / 下
R              重置
Space          暂停
1-4            切换可视化模式
```

鼠标/触屏：

- 拖动风向。
- 拖动水流方向。
- 调整风速。
- 调整水流。
- 调整阵风难度。
- 教师演示模式下可直接拖帆角、舵角和人重心。

## 11. 课程/关卡系统

V2 不应该只有自由航行。它应该内置训练任务。

任务结构：

```ts
interface Scenario {
  id: string;
  title: string;
  objective: string;
  initialEnvironment: EnvironmentState;
  initialBoatState: BoatState;
  target: ScenarioTarget;
  scoring: ScoringRule[];
  hints: CoachingHint[];
}
```

第一批任务：

1. 找到禁航区。
2. 近迎风航行，不要让帆失速。
3. 最大化迎风 VMG。
4. 稳向板和侧滑实验。
5. 大舵角阻力实验。
6. 强风横倾控制。
7. 换舷练习。
8. 顺风换舷练习。

## 12. 测试策略

物理核心必须有测试。否则调参会越来越玄学。

最低测试集：

- 船速变化会改变视风角。
- 禁航区内推力明显下降。
- 帆攻角过大会失速。
- 帆太松会飘帆。
- 稳向板放下会减少侧滑。
- 稳向板放下会增加一定阻力。
- 舵力随船速增加。
- 舵角过大会增加阻力。
- 压舷会减少横倾。
- 强风加错误压舷会提高翻船风险。
- 水流影响 SOG/COG，但不影响 STW。
- 固定时间步长下结果稳定。

## 13. 推荐项目结构

```text
sailer-v2/
  docs/
    design.md
    physics-model.md
    ui-model.md
    scenarios.md

  src/
    sim/
      units.ts
      vector.ts
      angles.ts
      environment.ts
      apparentWind.ts
      sailModel.ts
      hullModel.ts
      centerboardModel.ts
      rudderModel.ts
      crewModel.ts
      rigidBody.ts
      telemetry.ts
      stepSimulation.ts

    boats/
      ilca.ts
      index.ts

    scenarios/
      closeHauled.ts
      centerboardLeeway.ts
      strongWind.ts
      index.ts

    render/
      mainScene.ts
      boatSprite.ts
      forceVectors.ts
      windField.ts
      overlays.ts

    ui/
      hud.ts
      heelPanel.ts
      sailFlowPanel.ts
      foilPanel.ts
      windGeometryPanel.ts
      controls.ts

    app/
      input.ts
      store.ts
      loop.ts
      main.ts

  tests/
    apparentWind.test.ts
    sailModel.test.ts
    foilModel.test.ts
    rigidBody.test.ts
    scenarios.test.ts
```

## 14. 开发阶段

### Phase 1：干净物理核心

目标：

先不追求 UI，确保物理模型干净、可测试。

产出：

- 单位系统。
- 向量和角度工具。
- 环境模型。
- 视风模型。
- 帆模型。
- 船体阻力模型。
- 稳向板模型。
- 舵模型。
- 船员重心模型。
- 刚体积分。
- 物理测试。

完成标准：

```text
测试环境中，船能加速、转向、侧滑、横倾和翻船，并且每个现象都有遥测数据解释。
```

### Phase 2：基础可玩 2D 视图

目标：

把新物理核心接到 PixiJS。

产出：

- 俯视船体。
- 风/水粒子。
- 帆和舵渲染。
- 基础 HUD。
- 键盘操作。
- 重置和暂停。

完成标准：

```text
自由航行能玩，并且行为比 V1 更合理。
```

### Phase 3：专业诊断面板

目标：

把隐藏物理变成学生看得懂的图。

产出：

- 横倾和平衡面板。
- 帆形和气流面板。
- 稳向板/舵面板。
- 视风几何面板。
- 禁航区。
- 侧滑轨迹。
- 力分解。

完成标准：

```text
学生可以通过面板解释船为什么快、慢、侧滑、横倾、失速或翻船。
```

### Phase 4：训练任务

目标：

把模拟器变成课程产品。

产出：

- 场景系统。
- 5-8 个训练任务。
- 评分。
- 教练提示。
- 任务总结。

完成标准：

```text
学生能完成一个任务，并得到有意义的反馈。
```

### Phase 5：校准和展示

目标：

让它成为可以推广的 club 成果。

产出：

- 参数调校。
- UI 打磨。
- README。
- 演示流程。
- 在线部署。
- 项目介绍页。

完成标准：

```text
可以给其他帆船学生试玩，并能清楚解释它相比普通帆船游戏的教育价值。
```

## 15. 七个学生的分工建议

### 物理数学组

人员：

- 1 个 VEX 方向学生。
- 1 个帆船方向学生。

负责：

- 视风。
- 帆攻角。
- 升力/阻力曲线。
- 物理测试。

### 船体操控组

人员：

- 1 个 VEX 方向学生。
- 1 个帆船方向学生。

负责：

- 舵。
- 稳向板。
- 人重心。
- 横倾和翻船。
- 操控手感。

### 可视化组

人员：

- 1 个技术兴趣强的学生。
- 1 个帆船方向学生。

负责：

- 力箭头。
- 横倾面板。
- 帆形面板。
- 稳向板面板。
- HUD 专业化。

### 任务和产品组

人员：

- 1 个表达能力强或帆船理解强的学生主导。
- 全员提供反馈。

负责：

- 训练任务。
- 教练提示。
- README。
- 演示脚本。
- 用户测试记录。

老师角色：

- 产品负责人。
- 架构把关。
- 控制范围。
- 最终整合。

## 16. 前两次社团课建议

### 第一次：从真实帆船到系统拆分

流程：

1. 问学生：船为什么会动、慢、转、侧滑、横倾、翻船？
2. 把答案归类为环境、帆、船体、舵、稳向板、人、显示和任务。
3. 讲 abstraction：第一版不模拟世界全部，只保留解释核心现象的因素。
4. 展示当前 V1 原型。
5. 用刚才的系统图审查 V1：哪些有了，哪些是假模型，哪些不专业。
6. 分组。

产出：

- 系统图。
- V2 功能板。
- 分工。

### 第二次：定义接口和第一批任务

流程：

1. 每组定义自己系统的输入和输出。
2. 确定第一批可测任务。
3. 写第一批测试或伪代码。
4. 开始实现一个最小子系统。

产出：

- 第一批 V2 物理模块。
- 第一批遥测数据。

## 17. 成功标准

V2 成功的标志：

- 学生可以驾驶小帆船绕简单航线。
- 模拟器能清楚显示真风、视风和帆力。
- 帆角错误会产生可见、可解释的后果。
- 稳向板位置会明显影响侧滑和阻力。
- 大舵角会明显拖慢船。
- 人重心会影响横倾和翻船风险。
- UI 能解释逆风航行原理。
- 物理核心与渲染分离，并且有测试。

## 18. 最重要的规则

不要先追求视觉真实，要先追求解释真实。

优先级：

```text
概念正确
力和角度可读
遥测数据可靠
学生能理解
最后才是视觉酷炫
```

如果一个功能很好看，但不能帮助学生理解帆船原理，就先推迟。

