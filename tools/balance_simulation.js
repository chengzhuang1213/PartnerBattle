const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const ITERATIONS = Number(process.argv[2] || 1000);
const SEED = Number(process.argv[3] || 20260630);

function makeRng(seed) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 0x100000000;
  };
}

const seededMath = Object.create(Math);
seededMath.random = makeRng(SEED);

const context = {
  console,
  Math: seededMath,
  state: {
    playerSkills: [],
    enemySkills: [],
    playerTeam: [],
    enemyTeam: [],
  },
  renderBattlePage() {},
  renderGame() {},
  stopBattleReplay() {},
};

vm.createContext(context);
for (const file of ["src/data/game-data.js", "src/systems/ability.js", "src/systems/battle-system.js"]) {
  vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename: file });
}
vm.runInContext("this.__skillGroups = SKILL_GROUPS; this.__pools = POOLS;", context);

const groups = context.__skillGroups.map((group) => ({
  group: group.group,
  basicName: group.basic.name,
  highName: group.high.name,
}));
const poolKeys = ["orange", "purple", "blue"];
const priorityGroups = new Set(["combo", "reflect", "revive", "parry", "lifesteal", "regen", "poison", "counter"]);
const CROSS_QUALITY_ITERATIONS = 200;

function skill(groupKey, tier, owner) {
  const template = context.__skillGroups.find((item) => item.group === groupKey)[tier];
  return {
    id: `${owner}-${groupKey}-${tier}-${Math.random()}`,
    owner,
    group: groupKey,
    tier,
    name: template.name,
    description: template.description,
    assignedPetId: null,
  };
}

function pet(poolKey, owner, suffix = "") {
  const created = context.createPet(poolKey, owner, { name: `${owner}-${poolKey}${suffix}` });
  created.skills = [];
  return created;
}

function runDuel(playerPet, enemyPet, playerSkills, enemySkills, matchIndex = 0) {
  context.state.playerSkills = playerSkills;
  context.state.enemySkills = enemySkills;
  return context.simulateBattle(playerPet, enemyPet, matchIndex, 0, 0);
}

function shuffledGroups() {
  return [...groups].sort(() => Math.random() - 0.5);
}

function randomLegalSkills(owner, highCount, basicCount) {
  const selected = shuffledGroups().slice(0, highCount + basicCount);
  const highSkills = selected.slice(0, highCount).map((group) => skill(group.group, "high", owner));
  const basicSkills = selected.slice(highCount).map((group) => skill(group.group, "basic", owner));
  return [...highSkills, ...basicSkills].sort(() => Math.random() - 0.5);
}

function emptyStats(label = "") {
  return {
    label,
    appearances: 0,
    wins: 0,
    damage: 0,
    taken: 0,
    healing: 0,
    reflected: 0,
    revives: 0,
    winMatches: 0,
  };
}

function collectSideMetrics(result, side) {
  const metrics = emptyStats();
  for (const event of result.events) {
    if (event.type === "attack" && event.actorSide === side) metrics.damage += event.damage || 0;
    if (event.type === "attack" && event.targetSide === side) metrics.taken += event.damage || 0;
    if (event.healSide === side) metrics.healing += event.heal || 0;
    if (event.side === side && /反弹\s+(\d+)\s+伤害/.test(event.text || "")) {
      metrics.reflected += Number(event.text.match(/反弹\s+(\d+)\s+伤害/)[1]);
    }
    if (event.side === side && (event.text || "").includes("神佑复生")) metrics.revives += 1;
  }
  return metrics;
}

function addStats(target, source, won) {
  target.appearances += 1;
  target.wins += won ? 1 : 0;
  target.damage += source.damage;
  target.taken += source.taken;
  target.healing += source.healing;
  target.reflected += source.reflected;
  target.revives += source.revives;
}

function rate(wins, appearances) {
  return appearances ? `${((wins / appearances) * 100).toFixed(1)}%` : "0.0%";
}

function avg(value, appearances) {
  return appearances ? (value / appearances).toFixed(1) : "0.0";
}

function verdict(winRate) {
  if (winRate >= 0.6) return "基本要削";
  if (winRate >= 0.58) return "明显强";
  if (winRate >= 0.55) return "偏强观察";
  if (winRate <= 0.4) return "基本要加强";
  if (winRate <= 0.45) return "偏弱";
  return "正常";
}

function printTable(title, rows, columns) {
  console.log(`\n## ${title}`);
  console.log(columns.join(" | "));
  console.log(columns.map(() => "---").join(" | "));
  for (const row of rows) {
    console.log(columns.map((column) => row[column]).join(" | "));
  }
}

function singleSkillWinRates() {
  const rows = [];
  for (const poolKey of poolKeys) {
    const stats = new Map(groups.map((group) => [group.group, emptyStats(group.basicName)]));
    for (let i = 0; i < ITERATIONS; i += 1) {
      for (const tested of groups) {
        const opponent = groups[Math.floor(Math.random() * groups.length)];
        const playerSkill = skill(tested.group, "basic", "player");
        const enemySkill = skill(opponent.group, "basic", "enemy");
        const player = pet(poolKey, "player", i);
        const enemy = pet(poolKey, "enemy", i);
        player.skills = [playerSkill.id];
        enemy.skills = [enemySkill.id];
        const result = runDuel(player, enemy, [playerSkill], [enemySkill]);
        addStats(stats.get(tested.group), collectSideMetrics(result, "player"), result.winner === "player");
      }
    }

    for (const group of groups) {
      const item = stats.get(group.group);
      const winRate = item.wins / item.appearances;
      rows.push({
        品质: poolKey,
        技能: item.label,
        出场次数: item.appearances,
        胜率: rate(item.wins, item.appearances),
        平均伤害: avg(item.damage, item.appearances),
        平均承伤: avg(item.taken, item.appearances),
        评价: verdict(winRate),
      });
    }
  }
  return rows;
}

function highVsBasic() {
  const rows = [];
  for (const poolKey of poolKeys) {
    for (const group of groups) {
      const item = emptyStats(group.highName);
      let basicWins = 0;
      for (let i = 0; i < ITERATIONS; i += 1) {
        const high = skill(group.group, "high", "player");
        const basic = skill(group.group, "basic", "enemy");
        const player = pet(poolKey, "player", i);
        const enemy = pet(poolKey, "enemy", i);
        player.skills = [high.id];
        enemy.skills = [basic.id];
        const result = runDuel(player, enemy, [high], [basic]);
        const won = result.winner === "player";
        basicWins += won ? 0 : 1;
        addStats(item, collectSideMetrics(result, "player"), won);
      }
      rows.push({
        品质: poolKey,
        对局: `${group.highName} vs ${group.basicName}`,
        高级胜率: rate(item.wins, item.appearances),
        初级胜率: rate(basicWins, item.appearances),
        评价: item.wins / item.appearances >= 0.72 ? "高级可能碾压" : "可观察",
      });
    }
  }
  return rows;
}

const counters = [
  ["combo", "reflect"],
  ["combo", "parry"],
  ["combo", "flight"],
  ["lifesteal", "poison"],
  ["crit", "lucky"],
  ["sneak", "counter"],
  ["regen", "poison"],
  ["revive", "crit"],
  ["revive", "power"],
];

function counterMatchups() {
  const rows = [];
  for (const poolKey of poolKeys) {
    for (const [leftGroup, rightGroup] of counters) {
      const leftInfo = groups.find((group) => group.group === leftGroup);
      const rightInfo = groups.find((group) => group.group === rightGroup);
      const leftStats = emptyStats(leftInfo.basicName);
      const rightStats = emptyStats(rightInfo.basicName);
      for (let i = 0; i < ITERATIONS; i += 1) {
        const left = skill(leftGroup, "basic", "player");
        const right = skill(rightGroup, "basic", "enemy");
        const player = pet(poolKey, "player", i);
        const enemy = pet(poolKey, "enemy", i);
        player.skills = [left.id];
        enemy.skills = [right.id];
        const result = runDuel(player, enemy, [left], [right]);
        addStats(leftStats, collectSideMetrics(result, "player"), result.winner === "player");
        addStats(rightStats, collectSideMetrics(result, "enemy"), result.winner === "enemy");
      }
      rows.push({
        品质: poolKey,
        对局: `${leftInfo.basicName} vs ${rightInfo.basicName}`,
        左侧胜率: rate(leftStats.wins, leftStats.appearances),
        右侧胜率: rate(rightStats.wins, rightStats.appearances),
        左侧评价: verdict(leftStats.wins / leftStats.appearances),
      });
    }
  }
  return rows;
}

function assignRandomSkills(team, owner) {
  const skills = context.createSkillHand(owner);
  for (const item of skills) {
    const candidates = team.filter((petItem) => context.canAssignSkill(petItem, item, skills));
    if (!candidates.length) continue;
    const target = candidates[Math.floor(Math.random() * candidates.length)];
    item.assignedPetId = target.id;
    target.skills.push(item.id);
  }
  return skills;
}

function simulateBo3(playerTeam, enemyTeam, playerSkills, enemySkills) {
  let playerWins = 0;
  let enemyWins = 0;
  const usedPlayers = new Set();
  const usedEnemies = new Set();
  const matches = [];
  for (let matchIndex = 0; matchIndex < 3 && playerWins < 2 && enemyWins < 2; matchIndex += 1) {
    const playerPool = playerTeam.filter((item) => !usedPlayers.has(item.id));
    const enemyPool = enemyTeam.filter((item) => !usedEnemies.has(item.id));
    const player = playerPool[Math.floor(Math.random() * playerPool.length)];
    const enemy = enemyPool[Math.floor(Math.random() * enemyPool.length)];
    usedPlayers.add(player.id);
    usedEnemies.add(enemy.id);
    const result = runDuel(player, enemy, playerSkills, enemySkills, matchIndex);
    matches.push(result);
    if (result.winner === "player") playerWins += 1;
    else enemyWins += 1;
  }
  return { winner: playerWins >= 2 ? "player" : "enemy", matches };
}

function recordRealSkill(stats, skillList, petItem, result, side) {
  const metrics = collectSideMetrics(result, side);
  const won = result.winner === side;
  for (const id of petItem.skills) {
    const item = skillList.find((entry) => entry.id === id);
    if (!item) continue;
    const key = `${item.tier}:${item.group}`;
    if (!stats.has(key)) stats.set(key, emptyStats(item.name));
    addStats(stats.get(key), metrics, won);
    if (won) stats.get(key).winMatches += 1;
  }
}

function realEnvironment() {
  const stats = new Map();
  for (let i = 0; i < ITERATIONS; i += 1) {
    const playerTeam = context.createTeam("player");
    const enemyTeam = context.createTeam("enemy");
    const playerSkills = assignRandomSkills(playerTeam, "player");
    const enemySkills = assignRandomSkills(enemyTeam, "enemy");
    const session = simulateBo3(playerTeam, enemyTeam, playerSkills, enemySkills);
    for (const match of session.matches) {
      recordRealSkill(stats, playerSkills, match.player, match, "player");
      recordRealSkill(stats, enemySkills, match.enemy, match, "enemy");
    }
  }
  return [...stats.values()]
    .sort((a, b) => b.appearances - a.appearances)
    .map((item) => ({
      技能名: item.label,
      出场次数: item.appearances,
      胜率: rate(item.wins, item.appearances),
      平均伤害: avg(item.damage, item.appearances),
      平均承伤: avg(item.taken, item.appearances),
      平均回血: avg(item.healing, item.appearances),
      平均反伤: avg(item.reflected, item.appearances),
      平均复活次数: avg(item.revives, item.appearances),
      评价: verdict(item.wins / item.appearances),
    }));
}

const crossQualityScenarios = [
  {
    match: "蓝（无技能） vs 紫（无技能）",
    playerPool: "blue",
    enemyPool: "purple",
    playerHigh: 0,
    playerBasic: 0,
    enemyHigh: 0,
    enemyBasic: 0,
    targetText: "25%~35%",
    targetMin: 0.25,
    targetMax: 0.35,
  },
  {
    match: "蓝（1高1初） vs 紫（无技能）",
    playerPool: "blue",
    enemyPool: "purple",
    playerHigh: 1,
    playerBasic: 1,
    enemyHigh: 0,
    enemyBasic: 0,
    targetText: "45%~55%",
    targetMin: 0.45,
    targetMax: 0.55,
  },
  {
    match: "蓝（3初） vs 紫（无技能）",
    playerPool: "blue",
    enemyPool: "purple",
    playerHigh: 0,
    playerBasic: 3,
    enemyHigh: 0,
    enemyBasic: 0,
    targetText: "50%左右",
    targetMin: 0.45,
    targetMax: 0.55,
  },
  {
    match: "紫（1高2初） vs 橙（无技能）",
    playerPool: "purple",
    enemyPool: "orange",
    playerHigh: 1,
    playerBasic: 2,
    enemyHigh: 0,
    enemyBasic: 0,
    targetText: "45%~55%",
    targetMin: 0.45,
    targetMax: 0.55,
  },
];

function assignSkillsForScenario(petItem, owner, highCount, basicCount) {
  const skills = randomLegalSkills(owner, highCount, basicCount);
  petItem.skills = skills.map((item) => item.id);
  return skills;
}

function crossQualityFixedTests() {
  return crossQualityScenarios.map((scenario) => {
    let wins = 0;
    let totalDamage = 0;
    let totalTaken = 0;

    for (let i = 0; i < CROSS_QUALITY_ITERATIONS; i += 1) {
      const player = pet(scenario.playerPool, "player", i);
      const enemy = pet(scenario.enemyPool, "enemy", i);
      const playerSkills = assignSkillsForScenario(player, "player", scenario.playerHigh, scenario.playerBasic);
      const enemySkills = assignSkillsForScenario(enemy, "enemy", scenario.enemyHigh, scenario.enemyBasic);
      const result = runDuel(player, enemy, playerSkills, enemySkills);
      const metrics = collectSideMetrics(result, "player");

      if (result.winner === "player") wins += 1;
      totalDamage += metrics.damage;
      totalTaken += metrics.taken;
    }

    const winRate = wins / CROSS_QUALITY_ITERATIONS;
    return {
      对局: scenario.match,
      场次: CROSS_QUALITY_ITERATIONS,
      目标胜率: scenario.targetText,
      当前胜率: rate(wins, CROSS_QUALITY_ITERATIONS),
      平均伤害: avg(totalDamage, CROSS_QUALITY_ITERATIONS),
      平均承伤: avg(totalTaken, CROSS_QUALITY_ITERATIONS),
      结果: winRate >= scenario.targetMin && winRate <= scenario.targetMax ? "达标" : "未达标",
    };
  });
}

console.log(`# Balance simulation`);
console.log(`iterations=${ITERATIONS}, seed=${SEED}`);

printTable("一、单技能胜率（初级技能，聚合随机对手）", singleSkillWinRates(), [
  "品质",
  "技能",
  "出场次数",
  "胜率",
  "平均伤害",
  "平均承伤",
  "评价",
]);

printTable("二、高级技能 vs 初级技能", highVsBasic(), ["品质", "对局", "高级胜率", "初级胜率", "评价"]);
printTable("三、技能克制关系（初级技能）", counterMatchups(), ["品质", "对局", "左侧胜率", "右侧胜率", "左侧评价"]);
printTable("四、真实环境测试", realEnvironment(), [
  "技能名",
  "出场次数",
  "胜率",
  "平均伤害",
  "平均承伤",
  "平均回血",
  "平均反伤",
  "平均复活次数",
  "评价",
]);

printTable("五、跨品质固定测试（每组 200 场）", crossQualityFixedTests(), [
  "对局",
  "场次",
  "目标胜率",
  "当前胜率",
  "平均伤害",
  "平均承伤",
  "结果",
]);
