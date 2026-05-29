import {
  Presentation,
  PresentationFile,
  row,
  column,
  grid,
  layers,
  panel,
  text,
  shape,
  rule,
  fill,
  hug,
  fixed,
  wrap,
  grow,
  fr,
  auto,
} from '@oai/artifact-tool';
import { writeFile } from 'node:fs/promises';

const W = 1920;
const H = 1080;

const palette = {
  ink: '#102033',
  muted: '#617084',
  faint: '#D8E2EB',
  paper: '#F6FBFD',
  sea: '#0E7490',
  deep: '#0F2F43',
  cyan: '#22D3EE',
  mint: '#2DD4BF',
  coral: '#F9735B',
  amber: '#F4B740',
  navy: '#0B1827',
  white: '#FFFFFF',
  slate: '#E8F1F5',
  lavender: '#7C6CF2',
};

const font = 'PingFang SC';
const mono = 'Menlo';

const presentation = Presentation.create({
  slideSize: { width: W, height: H },
});

async function saveWebBlob(blob, path) {
  const arrayBuffer = await blob.arrayBuffer();
  await writeFile(path, Buffer.from(arrayBuffer));
}

function addSlide(root, bg = palette.paper) {
  const slide = presentation.slides.add();
  slide.background.fill = bg;
  slide.compose(root, {
    frame: { left: 0, top: 0, width: W, height: H },
    baseUnit: 8,
  });
  return slide;
}

function t(value, options = {}) {
  return text(value, {
    width: options.width ?? fill,
    height: options.height ?? hug,
    name: options.name,
    style: {
      fontFamily: font,
      fontSize: options.size ?? 30,
      bold: options.bold ?? false,
      color: options.color ?? palette.ink,
      lineHeight: options.lineHeight ?? 1.15,
      ...options.style,
    },
    columnSpan: options.columnSpan,
    rowSpan: options.rowSpan,
  });
}

function label(value, color = palette.sea) {
  return t(value, {
    width: fill,
    size: 20,
    bold: true,
    color,
    style: { letterSpacing: 1.2 },
  });
}

function titleBlock(kicker, title, subtitle, tone = 'light') {
  const light = tone === 'dark';
  return column(
    { name: 'title-block', width: fill, height: hug, gap: 18 },
    [
      label(kicker, light ? palette.cyan : palette.sea),
      t(title, {
        size: 62,
        bold: true,
        color: light ? palette.white : palette.ink,
        lineHeight: 1.03,
      }),
      subtitle
        ? t(subtitle, {
            width: wrap(1280),
            size: 28,
            color: light ? '#C9E5EF' : palette.muted,
            lineHeight: 1.3,
          })
        : rule({ width: fixed(1), stroke: 'transparent', weight: 1 }),
    ],
  );
}

function pill(textValue, color, fillColor = '#FFFFFF') {
  return panel(
    {
      width: hug,
      height: hug,
      padding: { x: 20, y: 10 },
      fill: fillColor,
      line: { style: 'solid', width: 1, fill: color },
      borderRadius: 'rounded-full',
    },
    t(textValue, { width: hug, size: 22, bold: true, color }),
  );
}

function stepNumber(n, color = palette.coral) {
  return panel(
    {
      width: fixed(74),
      height: fixed(74),
      padding: 0,
      fill: color,
      line: { style: 'solid', width: 0, fill: color },
      borderRadius: 'rounded-full',
      align: 'center',
      justify: 'center',
    },
    t(String(n), { width: hug, size: 34, bold: true, color: palette.white }),
  );
}

function openBullet(textValue, color = palette.coral) {
  return row(
    { width: fill, height: hug, gap: 18, align: 'start' },
    [
      shape({
        geometry: 'ellipse',
        width: fixed(14),
        height: fixed(14),
        fill: color,
        line: { style: 'solid', width: 0, fill: color },
      }),
      t(textValue, { width: fill, size: 28, color: palette.ink, lineHeight: 1.2 }),
    ],
  );
}

function miniCard(title, body, color = palette.sea) {
  return panel(
    {
      width: fill,
      height: fill,
      padding: { x: 28, y: 24 },
      fill: '#FFFFFF',
      line: { style: 'solid', width: 1.5, fill: '#D5E4EC' },
      borderRadius: 'rounded-lg',
    },
    column(
      { width: fill, height: fill, gap: 14 },
      [
        row(
          { width: fill, height: hug, gap: 12, align: 'center' },
          [
            shape({
              geometry: 'ellipse',
              width: fixed(16),
              height: fixed(16),
              fill: color,
              line: { style: 'solid', width: 0, fill: color },
            }),
            t(title, { size: 28, bold: true, color }),
          ],
        ),
        t(body, { size: 23, color: palette.ink, lineHeight: 1.3 }),
      ],
    ),
  );
}

function timelineItem(time, title, body, color) {
  return row(
    { width: fill, height: hug, gap: 22, align: 'start' },
    [
      panel(
        {
          width: fixed(120),
          height: fixed(56),
          padding: { x: 0, y: 0 },
          fill: color,
          line: { style: 'solid', width: 0, fill: color },
          borderRadius: 'rounded-full',
          align: 'center',
          justify: 'center',
        },
        t(time, { width: hug, size: 21, bold: true, color: palette.white }),
      ),
      column(
        { width: fill, height: hug, gap: 6 },
        [
          t(title, { size: 28, bold: true, color: palette.ink }),
          t(body, { size: 22, color: palette.muted, lineHeight: 1.25 }),
        ],
      ),
    ],
  );
}

function sectionSlide(index, title, subtitle, accent = palette.sea) {
  return addSlide(
    layers(
      { width: fill, height: fill },
      [
        shape({ width: fill, height: fill, fill: palette.navy, line: { style: 'solid', width: 0, fill: palette.navy } }),
        grid(
          { width: fill, height: fill, columns: [fr(1), fr(1.05)], padding: { x: 96, y: 84 }, columnGap: 48 },
          [
            column(
              { width: fill, height: fill, gap: 28, justify: 'center' },
              [
                label(`SECTION ${index}`, accent),
                t(title, { size: 76, bold: true, color: palette.white, lineHeight: 1.02 }),
                t(subtitle, { size: 30, color: '#C7DBE5', lineHeight: 1.3 }),
              ],
            ),
            column(
              { width: fill, height: fill, justify: 'center', align: 'center' },
              [
                shape({
                  geometry: 'ellipse',
                  width: fixed(440),
                  height: fixed(440),
                  fill: accent,
                  line: { style: 'solid', width: 0, fill: accent },
                }),
                t(index, {
                  width: hug,
                  size: 150,
                  bold: true,
                  color: palette.navy,
                }),
              ],
            ),
          ],
        ),
      ],
    ),
    palette.navy,
  );
}

// 1 Cover
addSlide(
  layers(
    { width: fill, height: fill },
    [
      shape({ width: fill, height: fill, fill: palette.deep, line: { style: 'solid', width: 0, fill: palette.deep } }),
      grid(
        { width: fill, height: fill, columns: [fr(1.25), fr(0.75)], padding: { x: 96, y: 78 }, columnGap: 64 },
        [
          column(
            { width: fill, height: fill, justify: 'center', gap: 28 },
            [
              label('AI CLUB / SAILER V2', palette.cyan),
              t('用 AI 共建\n2.5D 帆船训练模拟器', {
                size: 82,
                bold: true,
                color: palette.white,
                lineHeight: 1.02,
              }),
              t('80 分钟启动课：从真实帆船到工程系统，再到 Codex 可执行需求', {
                width: wrap(1040),
                size: 30,
                color: '#C9E5EF',
                lineHeight: 1.32,
              }),
              row(
                { width: fill, height: hug, gap: 16 },
                [
                  pill('观察', palette.cyan, '#0E3F55'),
                  pill('抽象', palette.mint, '#0E3F55'),
                  pill('判断', palette.amber, '#0E3F55'),
                  pill('驾驭 AI', palette.coral, '#0E3F55'),
                ],
              ),
            ],
          ),
          column(
            { width: fill, height: fill, justify: 'center', align: 'center', gap: 28 },
            [
              layers(
                { width: fixed(520), height: fixed(520), alignItems: 'center', justifyItems: 'center' },
                [
                  shape({ geometry: 'ellipse', width: fixed(520), height: fixed(520), fill: '#113D52', line: { style: 'solid', width: 2, fill: '#2C6B7E' } }),
                  shape({ geometry: 'ellipse', width: fixed(360), height: fixed(360), fill: '#15566E', line: { style: 'solid', width: 0, fill: '#15566E' } }),
                  t('V1 → V2', { width: hug, size: 68, bold: true, color: palette.white }),
                ],
              ),
              t('AI 可以帮我们造船，\n但我们必须先知道什么样的船是对的。', {
                width: wrap(520),
                size: 29,
                bold: true,
                color: '#FFFFFF',
                lineHeight: 1.25,
              }),
            ],
          ),
        ],
      ),
    ],
  ),
  palette.deep,
);

// 2 Not code first
addSlide(
  grid(
    { width: fill, height: fill, columns: [fr(0.95), fr(1.05)], padding: { x: 86, y: 76 }, columnGap: 66 },
    [
      column(
        { width: fill, height: fill, justify: 'center', gap: 24 },
        [
          titleBlock('TODAY', '今天不是写代码课', '而是定义问题、建立判断、组织 AI 协作的项目启动课。'),
          rule({ width: fixed(260), stroke: palette.coral, weight: 6 }),
          t('代码可以交给 AI 加速，但方向、真实感、教学价值和验收标准必须由人定义。', {
            size: 34,
            bold: true,
            color: palette.ink,
            lineHeight: 1.25,
          }),
        ],
      ),
      column(
        { width: fill, height: fill, justify: 'center', gap: 22 },
        [
          miniCard('不是：大家围观一个 prompt', '那样学生只是观众，项目容易变成老师和 AI 的表演。', palette.coral),
          miniCard('而是：大家负责高质量判断', '帆船学生提供真实经验，VEX 学生拆系统，记录组转需求，Codex 统一实现。', palette.sea),
          miniCard('最后：用结果反过来验收 AI', 'AI 生成的东西不等于真实、专业、好用。我们要能审查它。', palette.lavender),
        ],
      ),
    ],
  ),
);

// 3 Human roles
addSlide(
  column(
    { width: fill, height: fill, padding: { x: 84, y: 70 }, gap: 34 },
    [
      titleBlock('AI ERA', '人在 AI 协作链条中的 6 个角色', '这节课不是让学生被 AI 替代，而是练习如何驾驭 AI。'),
      grid(
        { width: fill, height: fill, columns: [fr(1), fr(1), fr(1)], rows: [fr(1), fr(1)], columnGap: 24, rowGap: 24 },
        [
          miniCard('观察者', '先看真实帆船发生了什么，而不是先问 AI。', palette.sea),
          miniCard('抽象者', '把复杂世界拆成环境、帆、船体、舵、稳向板、人。', palette.mint),
          miniCard('提问者', '把模糊愿望变成 AI 能执行的高质量 prompt。', palette.amber),
          miniCard('判断者', '判断 AI 方案是否真实、专业、值得做。', palette.coral),
          miniCard('验收者', '定义什么叫完成，什么叫改好了。', palette.lavender),
          miniCard('价值定义者', '决定项目为什么值得做，而不是只追求酷。', '#0EA5E9'),
        ],
      ),
    ],
  ),
);

// 4 route
addSlide(
  grid(
    { width: fill, height: fill, columns: [fr(0.85), fr(1.15)], padding: { x: 84, y: 70 }, columnGap: 58 },
    [
      column(
        { width: fill, height: fill, justify: 'center', gap: 20 },
        [
          titleBlock('80 MIN', '课堂路线图', '先建立自己的判断，再审查 V1，最后把讨论变成 V2 的需求。'),
          t('顺序很重要：先看 V1 会被锚定；先分析现实，学生会成为评审者。', {
            size: 30,
            bold: true,
            color: palette.sea,
            lineHeight: 1.25,
          }),
        ],
      ),
      column(
        { width: fill, height: fill, justify: 'center', gap: 18 },
        [
          timelineItem('00-10', '开场与 AI 时代人的角色', '为什么 AI 会写代码后，人仍然更关键。', palette.deep),
          timelineItem('10-23', '真实帆船因素头脑风暴', '先不看 V1，从真实世界列因素。', palette.sea),
          timelineItem('23-38', '抽象成系统', '把因素归类成输入、状态、输出。', palette.mint),
          timelineItem('38-48', '展示并试玩 V1', '用刚才的系统图审查原型。', palette.amber),
          timelineItem('48-69', '评审 V1，定义 V2', '投票选最高价值的 2-3 个方向。', palette.coral),
          timelineItem('69-80', '豆包总结 -> Codex 需求', '现场校正会议纪要，形成课后执行框架。', palette.lavender),
        ],
      ),
    ],
  ),
);

sectionSlide('1', '先不看 V1', '从真实帆船出发，建立自己的观察和判断。', palette.cyan);

// 6 questions
addSlide(
  grid(
    { width: fill, height: fill, columns: [fr(1), fr(1)], padding: { x: 84, y: 70 }, columnGap: 60 },
    [
      column(
        { width: fill, height: fill, justify: 'center', gap: 26 },
        [
          titleBlock('REALITY FIRST', '真实帆船到底发生了什么？', '不要急着做功能，先把真实现象说出来。'),
          row(
            { width: fill, height: hug, gap: 12 },
            [
              pill('先不用 AI', palette.coral, '#FFF3EF'),
              pill('先不用代码', palette.sea, '#E8F7FB'),
              pill('先说观察', palette.mint, '#E8FBF5'),
            ],
          ),
        ],
      ),
      column(
        { width: fill, height: fill, justify: 'center', gap: 20 },
        [
          openBullet('船为什么会动？为什么会慢？'),
          openBullet('为什么能逆风前进，但不能直接顶风？', palette.sea),
          openBullet('为什么会侧滑？稳向板到底做了什么？', palette.mint),
          openBullet('为什么会横倾？人坐的位置为什么重要？', palette.amber),
          openBullet('风变了之后，船手应该调整什么？', palette.lavender),
        ],
      ),
    ],
  ),
);

// 7 factors map
addSlide(
  column(
    { width: fill, height: fill, padding: { x: 78, y: 62 }, gap: 28 },
    [
      titleBlock('BRAINSTORM', '把真实因素摊开', '这一页是课堂白板：先求多，再归类。'),
      grid(
        { width: fill, height: fill, columns: [fr(1), fr(1), fr(1), fr(1)], rows: [fr(1), fr(1)], columnGap: 20, rowGap: 20 },
        [
          miniCard('风', '真风、视风、风速、风向、阵风、风摆', palette.cyan),
          miniCard('水', '水流、浪、相对水流、侧向抗力', palette.sea),
          miniCard('帆', '帆角、帆形、攻角、升力、阻力、飘帆、失速', palette.amber),
          miniCard('水下翼面', '舵、稳向板、侧向力、转向力矩、阻力', palette.mint),
          miniCard('船体', '质量、惯性、航向、速度、侧滑、船体阻力', palette.lavender),
          miniCard('人', '重心、压舷、扶正力矩、翻船风险', palette.coral),
          miniCard('显示', 'HUD、力箭头、横倾仪、帆形图、侧滑轨迹', '#0EA5E9'),
          miniCard('教学', '任务、评分、提示、回放、训练目标', '#64748B'),
        ],
      ),
    ],
  ),
);

// 8 systems
addSlide(
  column(
    { width: fill, height: fill, padding: { x: 84, y: 66 }, gap: 28 },
    [
      titleBlock('ABSTRACTION', '从因素到系统', '工程不是把世界全搬进电脑，而是选择足够解释核心现象的模型。'),
      grid(
        { width: fill, height: fill, columns: [fr(1), auto, fr(1), auto, fr(1)], rows: [fr(1), fr(1), fr(1)], columnGap: 18, rowGap: 16, alignItems: 'center' },
        [
          miniCard('环境系统', '真风、水流、阵风', palette.cyan),
          t('→', { width: hug, size: 46, bold: true, color: palette.muted }),
          miniCard('视风 / 帆系统', '攻角、帆状态、推力、横倾力', palette.amber),
          t('→', { width: hug, size: 46, bold: true, color: palette.muted }),
          miniCard('船体状态', '速度、航向、侧滑、横倾', palette.sea),
          miniCard('水下翼面', '舵、稳向板、阻力、力矩', palette.mint),
          t('→', { width: hug, size: 46, bold: true, color: palette.muted }),
          miniCard('船员系统', '重心、压舷、扶正力矩', palette.coral),
          t('→', { width: hug, size: 46, bold: true, color: palette.muted }),
          miniCard('刚体积分', '把力和力矩变成下一帧状态', palette.lavender),
          miniCard('Telemetry', '每一帧输出可解释数据', '#0EA5E9'),
          t('→', { width: hug, size: 46, bold: true, color: palette.muted }),
          miniCard('诊断 UI', 'HUD、横倾、帆形、稳向板', '#64748B'),
          t('→', { width: hug, size: 46, bold: true, color: palette.muted }),
          miniCard('教学任务', '评分、提示、下节课验收', palette.deep),
        ],
      ),
    ],
  ),
);

// 9 group task
addSlide(
  column(
    { width: fill, height: fill, padding: { x: 82, y: 68 }, gap: 30 },
    [
      titleBlock('TEAM WORK', '临时分组：不是分工写代码，而是分工判断', '每组负责把一个真实系统变成输入、处理、输出。'),
      grid(
        { width: fill, height: fill, columns: [fr(1), fr(1)], rows: [fr(1), fr(1)], columnGap: 24, rowGap: 24 },
        [
          miniCard('A 组：风和帆', '输入：真风、船速、帆角\n输出：视风、攻角、帆状态、推力、横倾力', palette.amber),
          miniCard('B 组：船体 / 舵 / 稳向板', '输入：船速、舵角、板位、侧滑\n输出：转向、阻力、侧向力、leeway', palette.mint),
          miniCard('C 组：横倾 / 人重心', '输入：侧向力、风速、人位置\n输出：横倾角、扶正力矩、翻船风险', palette.coral),
          miniCard('D 组：HUD / 教学体验', '输入：telemetry 和任务目标\n输出：学生能看懂的仪表、提示、评分', palette.sea),
        ],
      ),
    ],
  ),
);

sectionSlide('2', '现在再看 V1', 'V1 不是答案，而是我们用来审查 AI 产物的原型。', palette.amber);

// 11 V1 review
addSlide(
  grid(
    { width: fill, height: fill, columns: [fr(0.95), fr(1.05)], padding: { x: 86, y: 70 }, columnGap: 60 },
    [
      column(
        { width: fill, height: fill, justify: 'center', gap: 24 },
        [
          titleBlock('V1 REVIEW', '试玩不是为了夸它', '而是用真实系统检查：哪些对，哪些假，哪些看不懂。'),
          t('V1 是 AI 快速生成能力的证明，也是不足的证据。', {
            size: 34,
            bold: true,
            color: palette.coral,
            lineHeight: 1.2,
          }),
        ],
      ),
      column(
        { width: fill, height: fill, justify: 'center', gap: 22 },
        [
          row({ width: fill, height: hug, gap: 16 }, [stepNumber(1, palette.sea), t('哪些地方已经有价值，可以保留？', { size: 31, bold: true })]),
          row({ width: fill, height: hug, gap: 16 }, [stepNumber(2, palette.amber), t('哪些物理现象不真实，需要修改？', { size: 31, bold: true })]),
          row({ width: fill, height: hug, gap: 16 }, [stepNumber(3, palette.coral), t('哪些核心信息没有显示，需要重做？', { size: 31, bold: true })]),
          row({ width: fill, height: hug, gap: 16 }, [stepNumber(4, palette.lavender), t('哪些想法能迁移到 V2？', { size: 31, bold: true })]),
        ],
      ),
    ],
  ),
);

// 12 review rubric
addSlide(
  column(
    { width: fill, height: fill, padding: { x: 84, y: 66 }, gap: 30 },
    [
      titleBlock('RUBRIC', '把意见变成可执行判断', '不要只说“更真实”。要说清楚哪里不对、应该怎样、如何验收。'),
      grid(
        { width: fill, height: fill, columns: [fr(1), fr(1), fr(1)], columnGap: 24 },
        [
          miniCard('保留', '已经帮助理解或操作的部分：主视图、风/水粒子、基础 HUD、力箭头、地图。', palette.sea),
          miniCard('修改', '有价值但不够专业的部分：指标命名、风向表达、操控反馈、力箭头含义。', palette.amber),
          miniCard('重做', '会限制 V2 的部分：物理核心、状态结构、telemetry、专业诊断面板。', palette.coral),
        ],
      ),
      panel(
        {
          width: fill,
          height: hug,
          padding: { x: 28, y: 22 },
          fill: '#EAF7FB',
          line: { style: 'solid', width: 0, fill: '#EAF7FB' },
          borderRadius: 'rounded-lg',
        },
        t('表达模板：当前问题 → 真实情况 → V2 应该怎么模拟/显示 → 怎么判断它改好了', {
          size: 30,
          bold: true,
          color: palette.deep,
        }),
      ),
    ],
  ),
);

// 13 priority
addSlide(
  grid(
    { width: fill, height: fill, columns: [fr(1), fr(1)], padding: { x: 84, y: 70 }, columnGap: 62 },
    [
      column(
        { width: fill, height: fill, justify: 'center', gap: 24 },
        [
          titleBlock('PRIORITY', '定义 V2 第一轮目标', '投票不是选最酷的功能，而是选最能提升真实感、解释力和学习价值的功能。'),
          t('建议第一轮只选 2-3 个方向，避免项目一开始失控。', {
            size: 32,
            bold: true,
            color: palette.sea,
          }),
        ],
      ),
      column(
        { width: fill, height: fill, justify: 'center', gap: 20 },
        [
          miniCard('候选 1：视风 + 帆攻角', '解释为什么船快了，风像从更前面来；为什么帆太松/太紧都慢。', palette.amber),
          miniCard('候选 2：横倾和平衡面板', '解释风力、人重心、扶正力矩和翻船风险。', palette.coral),
          miniCard('候选 3：稳向板 / 舵 / 侧滑', '解释为什么板能抗侧滑，大舵角为什么拖慢船。', palette.mint),
          row(
            { width: fill, height: hug, gap: 12 },
            [
              pill('真实感 1-5', palette.sea, '#E8F7FB'),
              pill('教学价值 1-5', palette.amber, '#FFF8E7'),
              pill('实现风险 1-5', palette.coral, '#FFF3EF'),
            ],
          ),
        ],
      ),
    ],
  ),
);

sectionSlide('3', '从会议到代码', '豆包记录讨论，老师提炼需求，Codex 统一实现，下节课集体验收。', palette.mint);

// 15 workflow
addSlide(
  column(
    { width: fill, height: fill, padding: { x: 84, y: 66 }, gap: 30 },
    [
      titleBlock('AI WORKFLOW', '豆包不是产品负责人，Codex 不是领域专家', 'AI 分别负责记录和实现；判断权、优先级和验收权在课堂共同体。'),
      grid(
        { width: fill, height: fill, columns: [fr(1), auto, fr(1), auto, fr(1), auto, fr(1), auto, fr(1)], columnGap: 14, alignItems: 'center' },
        [
          miniCard('课堂讨论', '观察、建模、争论、投票', palette.sea),
          t('→', { width: hug, size: 42, bold: true, color: palette.muted }),
          miniCard('豆包记录', '转写、会议纪要、观点归类', palette.amber),
          t('→', { width: hug, size: 42, bold: true, color: palette.muted }),
          miniCard('老师筛选', '删空话、修概念、定优先级', palette.coral),
          t('→', { width: hug, size: 42, bold: true, color: palette.muted }),
          miniCard('Codex 执行', '设计结构、写代码、写测试', palette.lavender),
          t('→', { width: hug, size: 42, bold: true, color: palette.muted }),
          miniCard('下节验收', '真实吗？清楚吗？值得继续吗？', palette.mint),
        ],
      ),
    ],
  ),
);

// 16 prompt template
addSlide(
  grid(
    { width: fill, height: fill, columns: [fr(0.86), fr(1.14)], padding: { x: 84, y: 68 }, columnGap: 54 },
    [
      column(
        { width: fill, height: fill, justify: 'center', gap: 26 },
        [
          titleBlock('PROMPT', '高质量需求 prompt', '把大家的讨论整理成 AI 能执行、也能被人验收的任务。'),
          t('好 prompt 不是“帮我优化”，而是有背景、目标、边界和验收标准。', {
            size: 31,
            bold: true,
            color: palette.coral,
            lineHeight: 1.25,
          }),
        ],
      ),
      panel(
        {
          width: fill,
          height: fill,
          padding: { x: 34, y: 30 },
          fill: '#0B1827',
          line: { style: 'solid', width: 0, fill: '#0B1827' },
          borderRadius: 'rounded-lg',
        },
        column(
          { width: fill, height: fill, gap: 14 },
          [
            t('背景：我们正在构建 Sailer V2，一个 2.5D 帆船教学模拟器。', { size: 23, color: '#E6F3F8', lineHeight: 1.25 }),
            t('本轮目标：实现 / 设计 XXX。', { size: 23, color: '#E6F3F8' }),
            t('当前问题：V1 中 XXX 不真实 / 不清楚。', { size: 23, color: '#E6F3F8' }),
            t('需求：1. ...  2. ...  3. ...', { size: 23, color: '#E6F3F8' }),
            t('验收标准：风变大时...；人移动时...；测试应覆盖...', { size: 23, color: '#E6F3F8', lineHeight: 1.25 }),
            t('限制：不做完整 3D；不使用 Unity；物理核心与渲染分离；优先输出 telemetry。', { size: 23, color: palette.cyan, bold: true, lineHeight: 1.25 }),
          ],
        ),
      ),
    ],
  ),
);

// 17 close
addSlide(
  layers(
    { width: fill, height: fill },
    [
      shape({ width: fill, height: fill, fill: palette.deep, line: { style: 'solid', width: 0, fill: palette.deep } }),
      column(
        { width: fill, height: fill, padding: { x: 112, y: 90 }, justify: 'center', gap: 38 },
        [
          label('CLOSING', palette.cyan),
          t('以后不会被 AI 替代的人，\n不一定是写代码最快的人。', {
            size: 78,
            bold: true,
            color: palette.white,
            lineHeight: 1.08,
          }),
          rule({ width: fixed(320), stroke: palette.coral, weight: 7 }),
          t('而是能发现真实问题、提出好问题、判断好答案，并组织 AI 和人一起完成复杂创造的人。', {
            width: wrap(1320),
            size: 36,
            bold: true,
            color: '#C9E5EF',
            lineHeight: 1.28,
          }),
          row(
            { width: fill, height: hug, gap: 18 },
            [
              pill('观察真实', palette.cyan, '#0E3F55'),
              pill('抽象系统', palette.mint, '#0E3F55'),
              pill('定义需求', palette.amber, '#0E3F55'),
              pill('验收 AI', palette.coral, '#0E3F55'),
            ],
          ),
        ],
      ),
    ],
  ),
  palette.deep,
);

// Export deck and slide previews.
const outPptx = 'output/sailer-v2-kickoff-lesson.pptx';
const pptxBlob = await PresentationFile.exportPptx(presentation);
await pptxBlob.save(outPptx);

for (let i = 0; i < presentation.slides.count; i += 1) {
  const slide = presentation.slides.getItem(i);
  const pngBlob = await slide.export({ format: 'png', scale: 1 });
  await saveWebBlob(pngBlob, `scratch/previews/slide-${String(i + 1).padStart(2, '0')}.png`);
  const layout = await slide.export({ format: 'layout' });
  await writeFile(`scratch/previews/slide-${String(i + 1).padStart(2, '0')}.layout.json`, JSON.stringify(layout, null, 2));
}

console.log(`Wrote ${outPptx}`);
console.log(`Rendered ${presentation.slides.count} slide previews`);
