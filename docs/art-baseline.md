# 随机伙伴对决 美术基准

目标平台：itch.io HTML5 网页游戏  
目标版本：正式发布首版  
核心目标：让玩家在商店页 3 秒内理解“可爱伙伴 + 技能构筑 + 自动对战”，进游戏后能快速读懂角色、技能和战斗结果。

## 1. 美术定位

### 一句话方向

明亮幻想学院里的迷你伙伴策略对决。

### 关键词

- 可爱 chibi
- 轻竞技
- 魔法学院
- 伙伴收集感
- 技能构筑
- 清爽 UI
- 高可读战斗反馈

### 不做的方向

- 不做暗黑、厚重、写实 RPG
- 不做复杂二次元立绘抽卡页
- 不做像素风
- 不做低饱和复古桌游风
- 不做全屏粒子爆炸到遮挡信息

## 2. 视觉支柱

### 角色

角色是第一视觉主角。比例保持 chibi，头身比约 1.8 到 2.3 头身，轮廓清楚，大眼或大表情，武器/帽子/发型/尾巴等剪影要明显。

每个角色必须满足：

- 缩到 96px 仍能认出是谁
- 站在浅色背景和深色背景上都能读清轮廓
- 队伍里 6 个角色颜色和剪影不能互相太像
- 战斗姿势要比头像更有动作张力

### 场景

场景是“幻想学院竞技场”，不是野外冒险。背景要服务 UI 和角色，不抢主角。

场景关键词：

- 学院庭院
- 魔法竞技场
- 明亮天空
- 彩色旗帜
- 石板场地
- 柔和魔法光

### UI

UI 要像策略游戏工具，不像纯装饰画册。

要求：

- 按钮、技能槽、血条、面板边缘清晰
- 信息区使用浅色半透明面板
- 关键行动按钮高对比
- 技能图标必须比装饰更重要
- 战斗页优先保证血量、技能触发、胜负结果可读

## 3. 色彩基准

### 主色

- 粉红：用于玩家、标题强调、胜利氛围
- 天蓝：用于对手、冷静信息、次级按钮
- 金黄：用于高级、胜利、稀有感
- 紫色：用于魔法、Build、技能感

### 背景色

- 天空蓝
- 暖白
- 浅薰衣草
- 柔和石板灰

### 避免

- 大面积纯紫渐变
- 大面积暗蓝黑
- 大面积棕黄
- 过饱和霓虹色

## 4. 线条与渲染

推荐风格：

- 干净卡通线稿
- 柔和 cel shading
- 轻微边缘高光
- 适量环境光
- 透明背景角色 PNG/WebP

不要：

- 复杂厚涂写实
- 模糊油画笔触
- 过多纹理噪点
- 角色和背景同样复杂

## 5. 角色资产规格

首发先保持 6 个角色，不急着扩角色池。

每个角色生成顺序：

1. 头像：512x512，透明背景或简单圆形底
2. 战斗待机：960x640，透明背景
3. 攻击姿势：960x640 或 1536x1024，透明背景
4. 受击姿势：960x640，透明背景
5. 胜利姿势：960x640，透明背景
6. 失败/倒下姿势：960x640，透明背景

文件命名建议：

```text
assets/characters/{character-id}/avatar.png
assets/characters/{character-id}/idle.png
assets/characters/{character-id}/attack.png
assets/characters/{character-id}/hit.png
assets/characters/{character-id}/win.png
assets/characters/{character-id}/lose.png
```

现有角色 ID：

- gold-knight
- silver-mage
- flame-warrior
- pink-fox-mage
- brown-rogue
- blue-ninja

## 6. 技能图标基准

技能图标要“符号化”，不要画完整小场景。

规格：

- 原图：512x512
- 游戏内版本：256x256、128x128
- 背景形状统一为圆形徽章或圆角方形徽章
- 初级使用银边或浅色边
- 高级使用金边和更强高光

图标风格：

- 一个主体符号
- 少量魔法光
- 高对比轮廓
- 不放文字

## 7. 战斗特效基准

特效要表达事件，不要淹没角色。

优先级：

1. 普攻斩击
2. 暴击爆闪
3. 连击多段残影
4. 中毒气泡/雾
5. 复活光柱
6. 反击回旋斩
7. 反震护盾裂纹
8. 闪避残影
9. 招架盾光
10. 吸血红色回流
11. 再生绿色光点
12. 不屈金红气焰

规格：

- 透明背景
- 1024x1024 或 1536x1024
- 中心留空，避免挡住血条和角色脸
- 能被 CSS 缩放和镜像

## 8. itch.io 商店页资产规格

优先生成这些，因为它们直接影响点击率。

### 封面图

- 比例：315:250
- 推荐尺寸：630x500
- 内容：Logo + 3 到 4 个主角 + 战斗/Build 氛围
- 不要塞 UI 截图

### 社交分享图

- 尺寸：1200x630
- 内容：横版主视觉，左侧或中间放标题

### 页面头图

- 尺寸：1600x900 或 1920x1080
- 内容：学院竞技场 + 主要角色对峙

### 截图

至少 5 张：

1. 开始页
2. 选人页
3. Build 分配页
4. 战斗页
5. 结算/复盘页

## 9. Logo 基准

当前中文名：随机伙伴对决  
英文备用名：Random Partner Duel

Logo 方向：

- 圆润、明亮、轻竞技
- 字体厚实但不硬核
- “伙伴”可以带星星、徽章、召唤光
- “对决”可以带交叉武器或竞技徽章

Logo 版本：

- 中文横版透明背景
- 英文横版透明背景
- 方形图标版
- 纯文字小尺寸版

## 10. 通用生成提示词模板

### 角色提示词

```text
chibi fantasy academy battle partner, cute but competitive, clean cartoon line art, soft cel shading, bright readable silhouette, transparent background, full body, expressive pose, colorful magical details, game asset, no text, no watermark
```

### 背景提示词

```text
bright fantasy academy arena background, magical school courtyard, colorful banners, stone battle floor, soft daylight, whimsical but clean, game background, readable center area for characters, no text, no watermark
```

### 技能图标提示词

```text
fantasy game skill icon, single clear symbol, clean readable silhouette, circular badge, bright magical glow, high contrast, polished casual strategy game UI, no text, no watermark
```

### 特效提示词

```text
transparent background game VFX, stylized magical combat effect, bright readable shape, centered action, clean edges, suitable for 2D HTML5 battle game, no text, no watermark
```

## 11. 首批生成顺序

1. Logo 草案 3 版
2. itch.io 封面图 3 版
3. 社交分享图 1 版
4. 启动页背景 1 版
5. 6 个角色的受击/胜利/失败姿势
6. 8 个核心技能特效
7. UI 面板和按钮皮肤
8. 最终截图和页面装饰图

## 12. 验收标准

一张资产进入游戏前必须满足：

- 缩小后仍能读懂
- 不遮挡核心 UI
- 与现有 6 个角色风格一致
- 文件名使用小写英文和连字符
- 优先导出 WebP，保留 PNG 源文件
- 单张背景网页版尽量低于 500 KB
- 单个角色姿势网页版尽量低于 300 KB
- 单个图标网页版尽量低于 40 KB

