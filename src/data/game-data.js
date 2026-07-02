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
    budget: [118, 146],
    ranges: { hp: [80, 135], atk: [18, 35], def: [8, 22], spd: [6, 20] },
    names: ["熔岩龟", "南瓜骑士", "琥珀熊"],
  },
  purple: {
    label: "紫色池",
    className: "purple",
    rangeText: "稳定中高，极品紫可以打烂差橙",
    budget: [112, 136],
    ranges: { hp: [70, 105], atk: [15, 28], def: [7, 18], spd: [7, 18] },
    names: ["星尘猫", "月影狐", "魔晶鸦"],
  },
  blue: {
    label: "蓝色池",
    className: "blue",
    rangeText: "低总值，高特化，靠速度和克制偷赢",
    budget: [104, 132],
    ranges: { hp: [64, 100], atk: [12, 24], def: [7, 18], spd: [7, 18] },
    names: ["浪花犬", "晴空兔", "电鳍龙"],
  },
};

const PLAYER1_AVATARS = [
  { id: "gold-knight", name: "蔷薇骑士", src: "assets/chibi-avatars/gold-knight.png", battleSrc: "assets/battle-chibi/gold-knight.png", attackSrc: "assets/battle-attack/gold-knight.png" },
  { id: "silver-mage", name: "冰霜法师", src: "assets/chibi-avatars/silver-mage.png", battleSrc: "assets/battle-chibi/silver-mage.png", attackSrc: "assets/battle-attack/silver-mage.png" },
  { id: "flame-warrior", name: "火焰剑士", src: "assets/chibi-avatars/flame-warrior.png", battleSrc: "assets/battle-chibi/flame-warrior.png", attackSrc: "assets/battle-attack/flame-warrior.png" },
];

const PLAYER2_AVATARS = [
  { id: "pink-fox-mage", name: "九尾妖狐", src: "assets/chibi-avatars/pink-fox-mage.png", battleSrc: "assets/battle-chibi/pink-fox-mage.png", attackSrc: "assets/battle-attack/pink-fox-mage.png" },
  { id: "brown-rogue", name: "双刀刺客", src: "assets/chibi-avatars/brown-rogue.png", battleSrc: "assets/battle-chibi/brown-rogue.png", attackSrc: "assets/battle-attack/brown-rogue.png" },
  { id: "blue-ninja", name: "神秘忍者", src: "assets/chibi-avatars/blue-ninja.png", battleSrc: "assets/battle-chibi/blue-ninja.png", attackSrc: "assets/battle-attack/blue-ninja.png" },
];

const ROSTER_AVATARS = [...PLAYER1_AVATARS, ...PLAYER2_AVATARS];

const POOL_KEYS = ["orange", "purple", "blue"];
const COMPETITIVE_STATS = { hp: 90, atk: 20, def: 10, spd: 10 };

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
    avatarId: avatar?.id || "",
    name: avatar?.name || pick(pool.names),
    avatarSrc: avatar?.src || "",
    battleSrc: avatar?.battleSrc || "",
    attackSrc: avatar?.attackSrc || "",
    stats: rolled.stats,
    power: rolled.power,
    skills: [],
  };
}

function createFixedPet(poolKey, owner, avatar, stats) {
  const pool = POOLS[poolKey];
  const fixedStats = { ...stats };

  return {
    id: `${owner}-${poolKey}-${nextPetId++}`,
    owner,
    poolKey,
    poolLabel: pool.label,
    poolClass: pool.className,
    avatarId: avatar?.id || "",
    name: avatar?.name || pick(pool.names),
    avatarSrc: avatar?.src || "",
    battleSrc: avatar?.battleSrc || "",
    attackSrc: avatar?.attackSrc || "",
    stats: fixedStats,
    power: statPower(fixedStats),
    skills: [],
  };
}

function createTeam(owner) {
  const avatars = shuffle(owner === "enemy" ? PLAYER2_AVATARS : PLAYER1_AVATARS).slice(0, POOL_KEYS.length);
  return POOL_KEYS.map((poolKey, index) => createPet(poolKey, owner, avatars[index]));
}

function createTeamFromAvatars(owner, avatars) {
  return POOL_KEYS.map((poolKey, index) => createPet(poolKey, owner, avatars[index]));
}

function createCompetitiveTeam(owner, avatars) {
  return POOL_KEYS.map((poolKey, index) => createFixedPet(poolKey, owner, avatars[index], COMPETITIVE_STATS));
}

