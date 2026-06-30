const STAT_WEIGHTS = {
  hp: 0.25,
  atk: 3,
  def: 3,
  spd: 2,
};

const POOLS = {
  orange: {
    label: "橙色池",
    className: "orange",
    rangeText: "上限最高，但波动最大，可能偏科严重",
    budget: [132, 165],
    ranges: { hp: [80, 135], atk: [18, 35], def: [8, 22], spd: [6, 20] },
    names: ["熔岩龟", "南瓜骑士", "琥珀熊"],
  },
  purple: {
    label: "紫色池",
    className: "purple",
    rangeText: "稳定中高，极品紫可以打烂差橙",
    budget: [112, 140],
    ranges: { hp: [70, 105], atk: [15, 28], def: [7, 18], spd: [7, 18] },
    names: ["星尘猫", "月影狐", "魔晶鸦"],
  },
  blue: {
    label: "蓝色池",
    className: "blue",
    rangeText: "低总值，高特化，靠速度和克制偷赢",
    budget: [90, 115],
    ranges: { hp: [55, 85], atk: [10, 22], def: [4, 14], spd: [5, 16] },
    names: ["浪花犬", "晴空兔", "电鳍龙"],
  },
};

const PLAYER1_AVATARS = [
  { name: "东条希", src: "assets/partners/15Toujou-Nozomi-ToXNZh.png", battleSrc: "assets/battle-p1/15Toujou-Nozomi-S678cZ.png" },
  { name: "矢泽妮可", src: "assets/partners/18Yazawa-Nico-agidhY.png", battleSrc: "assets/battle-p1/18Yazawa-Nico-agidhY.png" },
  { name: "绚濑绘里", src: "assets/partners/1Ayase-Eli-MqG2az.png", battleSrc: "assets/battle-p1/1Ayase-Eli-wRbUwD.png" },
];

const PLAYER2_AVATARS = [
  { name: "西木野真姬", src: "assets/partners-p2/10Nishikino-Maki-UFQB4E.png", battleSrc: "assets/battle-p2/10Nishikino-Maki-UFQB4E.png" },
  { name: "岚千砂都", src: "assets/partners-p2/120Arashi-Chisato-NGhy5X.png", battleSrc: "assets/battle-p2/120Arashi-Chisato-eySO7L.png" },
  { name: "南小鸟", src: "assets/partners-p2/9Minami-Kotori-06DzDA.png", battleSrc: "assets/battle-p2/9Minami-Kotori-BkWR39.png" },
];

const POOL_KEYS = ["orange", "purple", "blue"];

let nextPetId = 1;

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function chance(percent) {
  return Math.random() * 100 < percent;
}

function pick(list) {
  return list[randomInt(0, list.length - 1)];
}

function shuffle(list) {
  return [...list].sort(() => Math.random() - 0.5);
}

function statPower(stats) {
  return Math.round(
    stats.hp * STAT_WEIGHTS.hp +
      stats.atk * STAT_WEIGHTS.atk +
      stats.def * STAT_WEIGHTS.def +
      stats.spd * STAT_WEIGHTS.spd,
  );
}

function rollStats(pool) {
  const [minBudget, maxBudget] = pool.budget;
  let best = null;

  for (let i = 0; i < 700; i += 1) {
    const stats = {
      hp: randomInt(pool.ranges.hp[0], pool.ranges.hp[1]),
      atk: randomInt(pool.ranges.atk[0], pool.ranges.atk[1]),
      def: randomInt(pool.ranges.def[0], pool.ranges.def[1]),
      spd: randomInt(pool.ranges.spd[0], pool.ranges.spd[1]),
    };
    const power = statPower(stats);

    if (power >= minBudget && power <= maxBudget) return { stats, power };

    const distance = Math.min(Math.abs(power - minBudget), Math.abs(power - maxBudget));
    if (!best || distance < best.distance) best = { stats, power, distance };
  }

  return best;
}

function createPet(poolKey, owner, avatar) {
  const pool = POOLS[poolKey];
  const rolled = rollStats(pool);

  return {
    id: `${owner}-${poolKey}-${nextPetId++}`,
    owner,
    poolKey,
    poolLabel: pool.label,
    poolClass: pool.className,
    name: avatar?.name || pick(pool.names),
    avatarSrc: avatar?.src || "",
    battleSrc: avatar?.battleSrc || "",
    stats: rolled.stats,
    power: rolled.power,
    skills: [],
  };
}

function createTeam(owner) {
  const avatars = shuffle(owner === "enemy" ? PLAYER2_AVATARS : PLAYER1_AVATARS).slice(0, POOL_KEYS.length);
  return POOL_KEYS.map((poolKey, index) => createPet(poolKey, owner, avatars[index]));
}

