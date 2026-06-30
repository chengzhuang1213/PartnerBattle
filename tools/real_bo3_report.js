const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const ITERATIONS = Number(process.argv[2] || 500);
const SEED = Number(process.argv[3] || 20260630);
const MIN_PAIR_APPEARANCES = Number(process.argv[4] || 12);
const PAIR_FILTER = process.argv[5] || "";

function makeRng(seed) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 0x100000000;
  };
}

const rng = makeRng(SEED);
const seededMath = Object.create(Math);
seededMath.random = rng;

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

function pick(list) {
  return list[Math.floor(rng() * list.length)];
}

function rate(wins, appearances) {
  return appearances ? `${((wins / appearances) * 100).toFixed(1)}%` : "0.0%";
}

function avg(value, appearances) {
  return appearances ? (value / appearances).toFixed(1) : "0.0";
}

function printTable(title, rows, columns) {
  console.log(`\n## ${title}`);
  console.log(columns.join(" | "));
  console.log(columns.map(() => "---").join(" | "));
  for (const row of rows) {
    console.log(columns.map((column) => row[column]).join(" | "));
  }
}

function assignRandomSkills(team, owner) {
  const skills = context.createSkillHand(owner);
  for (const item of skills) {
    const candidates = team.filter((pet) => context.canAssignSkill(pet, item, skills));
    if (!candidates.length) continue;
    const target = pick(candidates);
    item.assignedPetId = target.id;
    target.skills.push(item.id);
  }
  return skills;
}

function runDuel(playerPet, enemyPet, playerSkills, enemySkills, matchIndex) {
  context.state.playerSkills = playerSkills;
  context.state.enemySkills = enemySkills;
  return context.simulateBattle(playerPet, enemyPet, matchIndex, 0, 0);
}

function simulateBo3(playerTeam, enemyTeam, playerSkills, enemySkills) {
  let playerWins = 0;
  let enemyWins = 0;
  const usedPlayers = new Set();
  const usedEnemies = new Set();
  const matches = [];

  for (let matchIndex = 0; matchIndex < 3 && playerWins < 2 && enemyWins < 2; matchIndex += 1) {
    const player = pick(playerTeam.filter((pet) => !usedPlayers.has(pet.id)));
    const enemy = pick(enemyTeam.filter((pet) => !usedEnemies.has(pet.id)));
    usedPlayers.add(player.id);
    usedEnemies.add(enemy.id);

    const result = runDuel(player, enemy, playerSkills, enemySkills, matchIndex);
    matches.push(result);
    if (result.winner === "player") playerWins += 1;
    else enemyWins += 1;
  }

  return {
    winner: playerWins >= 2 ? "player" : "enemy",
    playerWins,
    enemyWins,
    matches,
  };
}

function sideMetrics(result, side) {
  const metrics = { damage: 0, taken: 0, healing: 0, reflected: 0, revives: 0 };
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

function skillNames(skillList, pet) {
  return pet.skills
    .map((id) => skillList.find((skill) => skill.id === id)?.name)
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, "zh-Hans-CN"));
}

function addPairStats(pairStats, names, won, metrics) {
  for (let left = 0; left < names.length; left += 1) {
    for (let right = left + 1; right < names.length; right += 1) {
      const key = `${names[left]} + ${names[right]}`;
      if (!pairStats.has(key)) {
        pairStats.set(key, {
          pair: key,
          appearances: 0,
          wins: 0,
          damage: 0,
          taken: 0,
          healing: 0,
          reflected: 0,
          revives: 0,
        });
      }
      const item = pairStats.get(key);
      item.appearances += 1;
      item.wins += won ? 1 : 0;
      item.damage += metrics.damage;
      item.taken += metrics.taken;
      item.healing += metrics.healing;
      item.reflected += metrics.reflected;
      item.revives += metrics.revives;
    }
  }
}

const totals = {
  bo3: { player: 0, enemy: 0 },
  bo1: { player: 0, enemy: 0 },
  bo1Count: 0,
  bo3Count: ITERATIONS,
};
const pairStats = new Map();

for (let i = 0; i < ITERATIONS; i += 1) {
  const playerTeam = context.createTeam("player");
  const enemyTeam = context.createTeam("enemy");
  const playerSkills = assignRandomSkills(playerTeam, "player");
  const enemySkills = assignRandomSkills(enemyTeam, "enemy");
  const session = simulateBo3(playerTeam, enemyTeam, playerSkills, enemySkills);

  totals.bo3[session.winner] += 1;
  for (const match of session.matches) {
    totals.bo1Count += 1;
    totals.bo1[match.winner] += 1;

    addPairStats(
      pairStats,
      skillNames(playerSkills, match.player),
      match.winner === "player",
      sideMetrics(match, "player"),
    );
    addPairStats(
      pairStats,
      skillNames(enemySkills, match.enemy),
      match.winner === "enemy",
      sideMetrics(match, "enemy"),
    );
  }
}

const summaryRows = [
  {
    阵营: "玩家",
    BO3胜场: totals.bo3.player,
    BO3胜率: rate(totals.bo3.player, totals.bo3Count),
    BO1胜场: totals.bo1.player,
    BO1胜率: rate(totals.bo1.player, totals.bo1Count),
  },
  {
    阵营: "电脑",
    BO3胜场: totals.bo3.enemy,
    BO3胜率: rate(totals.bo3.enemy, totals.bo3Count),
    BO1胜场: totals.bo1.enemy,
    BO1胜率: rate(totals.bo1.enemy, totals.bo1Count),
  },
];

const pairRows = [...pairStats.values()]
  .filter((item) => item.appearances >= MIN_PAIR_APPEARANCES)
  .filter((item) => !PAIR_FILTER || item.pair.includes(PAIR_FILTER))
  .sort((a, b) => b.wins / b.appearances - a.wins / a.appearances || b.appearances - a.appearances)
  .slice(0, 30)
  .map((item) => ({
    技能组合: item.pair,
    出场次数: item.appearances,
    胜率: rate(item.wins, item.appearances),
    平均伤害: avg(item.damage, item.appearances),
    平均承伤: avg(item.taken, item.appearances),
    平均回血: avg(item.healing, item.appearances),
    平均反伤: avg(item.reflected, item.appearances),
    平均复活: avg(item.revives, item.appearances),
  }));

console.log(`# Real BO3 report`);
console.log(`bo3=${ITERATIONS}, bo1=${totals.bo1Count}, seed=${SEED}, minPairAppearances=${MIN_PAIR_APPEARANCES}`);
printTable("两方胜率", summaryRows, ["阵营", "BO3胜场", "BO3胜率", "BO1胜场", "BO1胜率"]);
printTable("胜率最高的双技能组合", pairRows, [
  "技能组合",
  "出场次数",
  "胜率",
  "平均伤害",
  "平均承伤",
  "平均回血",
  "平均反伤",
  "平均复活",
]);
