# values_sheet

用于以后更新数值和基础系统时快速定位。当前主要逻辑已经按目录拆到 `src/` 和 `styles/`，本表按“系统 -> 位置 -> 当前值/规则 -> 修改提示”整理。

## 技能总览

位置：`src/systems/ability.js` -> `SKILL_GROUPS`、技能触发函数

当前共有 16 组技能，每组有初级和高级版本。

| group | 初级 | 初级效果 | 高级 | 高级效果 |
| --- | --- | --- | --- | --- |
| `crit` | 必杀 | 暴击率 +15% | 高级必杀 | 暴击率 +30% |
| `sneak` | 偷袭 | 攻击时不会触发对方反击，无视目标10%防御 | 高级偷袭 | 攻击时不会触发对方反击，无视目标30%防御 |
| `combo` | 连击 | 攻击力降低25%，45%概率追加一次普通攻击，追加攻击不会触发对方反震 | 高级连击 | 攻击力降低15%，55%概率追加一次普通攻击，追加攻击不会触发对方反震 |
| `power` | 强力 | 攻击力 +12%，防御 -10% | 高级强力 | 攻击力 +22%，防御 -5% |
| `lifesteal` | 吸血 | 造成伤害的15%转化为生命 | 高级吸血 | 造成伤害的30%转化为生命 |
| `revive` | 神佑复生 | 死亡时20%概率复活，每场最多一次 | 高级神佑复生 | 死亡时35%概率复活，每场最多一次 |
| `lucky` | 幸运 | 受到暴击时，暴击伤害降低40% | 高级幸运 | 受到暴击时，暴击伤害降低60% |
| `parry` | 招架 | 本场第一次受到攻击完全免疫 | 高级招架 | 本场前两次受到攻击完全免疫 |
| `defense` | 防御 | 防御提高30%，攻击力降低10% | 高级防御 | 防御提高50%，攻击力降低10% |
| `regen` | 再生 | 每回合恢复最大生命3% | 高级再生 | 每回合恢复最大生命7% |
| `reflect` | 反震 | 受到攻击时，有35%概率反弹本次伤害的35%。反震为真实伤害，不触发吸血、反震、反击。 | 高级反震 | 受到攻击时，有35%概率反弹本次伤害的65%。反震为真实伤害，不触发吸血、反震、反击。 |
| `counter` | 反击 | 受到攻击时，有20%概率立即发动一次普通攻击。反击不会再次触发反击或连击。 | 高级反击 | 受到攻击时，有35%概率立即发动一次普通攻击。反击不会再次触发反击或连击。 |
| `agile` | 敏捷 | 速度提高20% | 高级敏捷 | 速度提高40% |
| `unyielding` | 不屈 | 生命低于50%时，造成伤害提高20% | 高级不屈 | 生命低于50%时，造成伤害提高40% |
| `poison` | 毒 | 攻击时有25%概率使目标中毒2回合 | 高级毒 | 攻击时有45%概率使目标中毒2回合，免疫中毒 |
| `flight` | 飞行 | 受到攻击时5%概率免疫本次攻击 | 高级飞行 | 受到攻击时15%概率免疫本次攻击；若本次攻击来自连击追加攻击，免疫率改为50% |

### 技能触发细节

位置：`src/systems/ability.js` -> `applyRegen`、`applyLifesteal`、`applyReflect`、`applyCounter`、`applyCombo`、`applyFlightEvasion`、`applyPoisonOnHit`、`applyPoisonTick`、`isDefeated`

| 技能 | 当前触发/计算 |
| --- | --- |
| 再生 | 每回合开始，若未满血且存活，恢复最大生命 3% / 7%，至少 1。 |
| 吸血 | 攻击造成伤害后，恢复伤害的 15% / 30%，至少 1，不超过最大生命。 |
| 幸运 | 受到暴击时，暴击伤害降低 40% / 60%；不再降低被暴击概率。 |
| 偷袭 | 攻击时不会触发对方反击，并无视目标 10% / 30% 防御。 |
| 反震 | 防守方受伤后，35% 概率反弹本次伤害的 35% / 65%；反震伤害为真实伤害，不触发吸血、反震、反击。 |
| 反击 | 防守方未死且通过 20% / 35% 概率后，立刻普通攻击一次；会受防御影响，可触发暴击、吸血、神佑等普通攻击效果，但不会再次触发反击或连击。 |
| 连击 | 攻击方未死且防守方未死，通过 45% / 55% 概率后追加一次普通攻击；追加攻击不会触发连击，也不会触发对方反震。 |
| 神佑复生 | 死亡时 20%/35% 概率复活，每场最多一次，恢复最大生命 35%，至少 1。 |
| 招架 | 若还有招架次数，直接免疫本次攻击并消耗 1 次，不造成伤害，不触发吸血、毒、毒污染、反震、反击；攻击方的连击判定仍可执行。 |
| 毒 | 攻击时 25% / 45% 概率使目标中毒 2 回合；高级毒额外免疫中毒。 |
| 中毒 | 每回合结束损失当前生命 10%，持续 2 回合，至少 1 点；不可叠加，再次中毒只刷新持续回合；中毒伤害不触发吸血、反震、反击、神佑、暴击。 |
| 毒污染 | 拥有吸血或高级吸血的单位攻击中毒目标后，100% 感染中毒。 |
| 飞行 | 受到每段攻击时单独判定；初级 5% 免疫本次攻击，高级普通段 15%，高级面对连击追加段 50%。免疫后不造成伤害，不触发吸血、毒、反震、反击；若是普通攻击段，攻击方的连击判定仍可执行。 |

## 入口文件

| 文件 | 用途 |
| --- | --- |
| `src/data/game-data.js` | 属性权重、角色池、头像池、随机工具、队伍生成。 |
| `src/systems/ability.js` | 技能定义、技能手牌、装备限制、入场属性修正、技能触发效果。 |
| `src/systems/battle-system.js` | BO3 流程、上场选择、单局模拟、攻击公式、战斗日志事件。 |
| `src/shared/shared-render.js` | 多个场景共用的头像、立绘、属性行、标签渲染。 |
| `src/scenes/start-scene.js` | 开始菜单 scene。 |
| `src/scenes/prep-scene.js` | 准备阶段 scene，包括队伍卡、技能分配面板。 |
| `src/scenes/battle-scene.js` | 战斗 scene，包括战斗页、回放、血条、日志、候补席。 |
| `src/game.js` | 游戏状态、启动新局、停止回放、全局点击事件分发。 |
| `styles/base.css` | 全局主题、通用按钮、通用标签、通用头像/属性/tooltip 样式。 |
| `styles/start-scene.css` | 开始菜单 scene 样式。 |
| `styles/prep-scene.css` | 准备阶段 scene 样式。 |
| `styles/battle-scene.css` | 战斗 scene 样式。 |
| `index.html` / `play.html` | 页面入口，按顺序加载拆分后的 CSS 和 JS 文件。两者当前内容相同。 |
| `server.js` | 本地静态文件服务器，默认端口 `5178`。 |
| `start-game.bat` | Windows 一键启动脚本，运行 `node server.js`。 |

## 角色池与基础属性

位置：`src/data/game-data.js` -> `STAT_WEIGHTS`、`POOLS`、`POOL_KEYS`

### 战力权重

`statPower = hp * 0.25 + atk * 3 + def * 3 + spd * 2`，最后四舍五入。

| 属性 | 权重 |
| --- | ---: |
| hp | 0.25 |
| atk | 3 |
| def | 3 |
| spd | 2 |

### 池子配置

| 池子 key | 显示名 | 战力预算 | hp | atk | def | spd | 定位 |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| `orange` | 橙色池 | 132-165 | 80-135 | 18-35 | 8-22 | 6-20 | 上限最高，波动最大。 |
| `purple` | 紫色池 | 112-140 | 70-105 | 15-28 | 7-18 | 7-18 | 稳定中高。 |
| `blue` | 蓝色池 | 90-115 | 55-85 | 10-22 | 4-14 | 5-16 | 低总值，高特化。 |

### 生成规则

位置：`src/data/game-data.js` -> `rollStats(pool)`

- 每个角色按池子的属性范围随机。
- 最多尝试 `700` 次。
- 命中池子的 `budget` 区间就直接采用。
- 如果 700 次都没命中，采用距离预算区间最近的一组属性。
- 每队当前固定 3 人，顺序来自 `POOL_KEYS = ["orange", "purple", "blue"]`。

修改提示：

- 想调稀有度强度：优先改 `POOLS.*.budget` 和 `POOLS.*.ranges`。
- 想改一队人数或池子顺序：改 `POOL_KEYS`，同时检查页面布局是否能容纳。
- 想让属性更容易贴近预算：提高 `rollStats` 的 `700`。

## 角色素材

位置：`src/data/game-data.js` -> `PLAYER1_AVATARS`、`PLAYER2_AVATARS`

| 阵营 | 当前数量 | 字段 |
| --- | ---: | --- |
| 玩家 | 8 | `name`、`src`、`battleSrc` |
| 电脑 | 8 | `name`、`src`、`battleSrc` |

说明：

- `src` 用于准备/卡片头像。
- `battleSrc` 用于战斗场景立绘。
- 开局会从对应阵营头像中随机抽 3 个，配给橙/紫/蓝三个池子。

## 技能发放与装备限制

位置：`src/systems/ability.js` -> `createSkillHand(owner)`、`SKILL_LIMITS`、`canAssignSkill(...)`

### 每方技能手牌

| 类型 | 数量 | 规则 |
| --- | ---: | --- |
| 高级技能 | 6 | 从 16 组技能中随机抽 6 组。 |
| 初级技能 | 12 | 从 16 组技能中随机抽 12 组。 |
| 总数 | 18 | 高级 + 初级合并后洗牌。 |

### 装备上限

| 池子 | 当前上限 |
| --- | --- |
| 橙色池 | 最多 2 高级 + 3 初级 |
| 紫色池 | 最多 1 高级 + 2 初级 |
| 蓝色池 | 3 初级，或 1 高级 + 1 初级 |

通用限制：

- 同一个角色不能同时装备同一 `group` 的初级和高级技能。
- 电脑会自动随机分配技能。
- 玩家可以手动分配，也可以点击随机分配。

## 战斗基础规则

位置：`src/systems/battle-system.js` -> `resolveBattle()`、`appendBattleMatch(...)`、`simulateBattle(...)`

| 系统 | 当前规则 |
| --- | --- |
| 赛制 | BO3，先赢 2 局获胜。 |
| 上场 | 每局玩家手动选 1 人，电脑从未上场角色中随机选 1 人。 |
| 已上场角色 | 同一轮 BO3 内不会再次上场。 |
| 单局上限 | 最多 12 回合。 |
| 出手顺序 | 速度高者先手；速度相同玩家先手。 |
| 每回合流程 | 双方先触发再生，然后先手攻击，若未击败则后手攻击，最后结算中毒。 |
| 12 回合未击败 | 比较剩余 hp；hp 相同则比较结算评分。 |

结算评分：

`score = hp + atk * 3 + def * 2 + spd * 2`

## 战斗属性修正

位置：`src/systems/ability.js` -> `createCombatant(...)`

| 技能 | 初级 | 高级 | 影响属性 |
| --- | ---: | ---: | --- |
| 强力 | atk * 1.12，def * 0.90 | atk * 1.22，def * 0.95 | 入场时计算 |
| 防御 | def * 1.30，atk * 0.90 | def * 1.50，atk * 0.90 | 入场时计算 |
| 敏捷 | spd * 1.20 | spd * 1.40 | 入场时计算 |
| 连击 | atk * 0.75 | atk * 0.85 | 入场时计算 |
| 招架 | 1 次免疫 | 2 次免疫 | 入场时记录次数 |

所有修正后的 `atk`、`def`、`spd` 都会四舍五入。

## 攻击公式

位置：`src/systems/battle-system.js` -> `performAttack(...)`

基础伤害：

`baseDamage = max(4, round(attacker.atk * 1.2 - effectiveDef * 0.9 + randomInt(-2, 2)))`

最终伤害：

`finalDamage = max(4, round(baseDamage * critMultiplier))`

说明：

- `baseDamage` 是普通攻击实际造成伤害的基础值。
- 最低 `4` 点伤害会继续触发普通攻击后续效果，例如吸血、反震、毒、反击/连击判定等。
- 不屈当前不是在最终伤害上额外相乘，而是在生命低于 50% 时动态提高攻击属性，再参与攻击公式。

保底：

- 基础伤害至少 `4`。
- 最终伤害至少 `4`。

当前参数：

| 参数 | 当前值 |
| --- | ---: |
| 攻击系数 | 1.2 |
| 防御减伤系数 | 0.9 |
| 随机浮动 | -2 到 +2 |
| 最低伤害 | 4 |
| 基础暴击率 | 5% |
| 暴击倍率 | 2.0 |
| 幸运暴击伤害降低 | 40% / 60% |
| 不屈触发线 | 当前 hp < 最大 hp * 0.5 |
| 偷袭无视防御 | 10% / 30% |

暴击率：

`critChance = 5 + 必杀加成`

暴击倍率：

`critMultiplier = 1 + (2.0 - 1) * (1 - 幸运暴击伤害降低)`

当前结果：

- 无幸运：`2.0`
- 幸运：`1.6`
- 高级幸运：`1.4`

## 战斗回放与节奏

位置：`battle-scene.js` -> `startBattleReplay()`

| 事件 | 延迟 |
| --- | ---: |
| 普通攻击事件 | 920ms |
| 技能事件 | 760ms |
| 其他文字事件 | 560ms |
| 单局结束后进入下一次选人 | 900ms |

## 样式与布局数值

位置：`styles/base.css`、`styles/start-scene.css`、`styles/prep-scene.css`、`styles/battle-scene.css`

常改位置：

| 系统 | 关键选择器 |
| --- | --- |
| 全局主题 | `base.css` -> `:root`、`body` |
| 开始页 | `styles/start-scene.css` -> `.start-screen`、`.title-block`、`.preview-row` |
| 队伍卡片 | `styles/prep-scene.css` -> `.enemy-card`、`.pet-card`；`styles/base.css` -> `.pet-art` |
| 技能分配 | `styles/prep-scene.css` -> `.skill-panel`、`.assign-card`、`.skill-pool`、`.skill-slot` |
| 战斗页 | `battle-scene.css` -> `.combat-screen`、`.combat-stage`、`.fighter`、`.combat-sidebar` |
| 移动端 | 各 scene CSS 内的 `@media (max-width: 1200px)`、`@media (max-width: 720px)` |

当前关键布局值：

| 项 | 当前值 |
| --- | --- |
| 页面最大宽度 | `1540px` |
| 本地战斗主布局 | `1fr 390px` |
| 技能面板布局 | `1fr 540px` |
| 桌面战斗舞台最小高度 | `590px` |
| 战斗角色宽度 | `clamp(110px, 9vw, 150px)` |
| 战斗角色高度 | `320px` |

## 本地运行

位置：`server.js`、`start-game.bat`

| 项 | 当前值 |
| --- | --- |
| 默认端口 | `5178` |
| 监听地址 | `127.0.0.1` |
| 环境变量覆盖 | `PORT` |
| 根路径 | `/` -> `index.html` |

运行：

```powershell
node server.js
```

或双击：

```text
start-game.bat
```

## 更新数值时的检查清单

1. 改角色强度：检查 `src/data/game-data.js` 里的 `POOLS`、`STAT_WEIGHTS`、`rollStats`。
2. 改技能效果：同时检查 `src/systems/ability.js` 里的 `SKILL_GROUPS` 描述和对应实现函数。
3. 改技能数量：检查 `src/systems/ability.js` 里的 `createSkillHand` 和 UI 上的数量文案。
4. 改装备规则：检查 `src/systems/ability.js` 里的 `SKILL_LIMITS` 和 `canAssignSkill`。
5. 改战斗节奏：检查 `src/systems/battle-system.js` 的 12 回合、`src/scenes/battle-scene.js` 的回放延迟。
6. 改伤害体验：检查 `src/systems/battle-system.js` 的攻击公式、暴击率、暴击倍率，以及 `src/systems/ability.js` 的反震/吸血/复活/中毒等联动。
7. 改队伍人数：检查 `src/data/game-data.js` 的 `POOL_KEYS`、头像抽取数量、`src/systems/battle-system.js` 的 BO3 上场逻辑、`styles/prep-scene.css` / `styles/battle-scene.css` 的卡片布局。
8. 改端口或部署方式：检查 `server.js`、`start-game.bat`、HTML 引用路径。
