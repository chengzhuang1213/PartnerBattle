const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const ITERATIONS_PER_MATCHUP = Number(process.argv[2] || 200);
const SEED = Number(process.argv[3] || 20260701);
const ATTACK_GROUPS = ["crit", "combo", "unyielding", "power", "sneak", "lifesteal"];
const TIERS = ["basic", "high"];

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
    battleMode: "practice",
  },
  renderBattlePage() {},
  renderGame() {},
  stopBattleReplay() {},
};

vm.createContext(context);
for (const file of ["src/data/game-data.js", "src/systems/ability.js", "src/systems/battle-system.js"]) {
  vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename: file });
}
vm.runInContext("this.__skillGroups = SKILL_GROUPS; this.__competitiveStats = COMPETITIVE_STATS; this.__avatars = ROSTER_AVATARS;", context);

function skill(groupKey, tier, owner, index) {
  const group = context.__skillGroups.find((item) => item.group === groupKey);
  const template = group[tier];
  return {
    id: `${owner}-${groupKey}-${tier}-${index}`,
    owner,
    group: groupKey,
    tier,
    name: template.name,
    description: template.description,
    assignedPetId: null,
  };
}

function fixedPet(owner, suffix) {
  const avatar = owner === "enemy" ? context.__avatars[3] || context.__avatars[1] : context.__avatars[0];
  return context.createFixedPet("orange", owner, avatar, context.__competitiveStats || { hp: 90, atk: 20, def: 10, spd: 10 });
}

function buildComboSkills(combo, owner) {
  return combo.skills.map((entry, index) => skill(entry.group, entry.tier, owner, index));
}

function attach(pet, skills) {
  pet.skills = skills.map((item) => item.id);
  for (const item of skills) item.assignedPetId = pet.id;
}

function runDuel(leftCombo, rightCombo, leftAsPlayer) {
  const playerCombo = leftAsPlayer ? leftCombo : rightCombo;
  const enemyCombo = leftAsPlayer ? rightCombo : leftCombo;
  const player = fixedPet("player");
  const enemy = fixedPet("enemy");
  const playerSkills = buildComboSkills(playerCombo, "player");
  const enemySkills = buildComboSkills(enemyCombo, "enemy");
  attach(player, playerSkills);
  attach(enemy, enemySkills);
  context.state.playerSkills = playerSkills;
  context.state.enemySkills = enemySkills;
  const result = context.simulateBattle(player, enemy, 0, 0, 0);
  const leftWon = leftAsPlayer ? result.winner === "player" : result.winner === "enemy";
  return { leftWon, result };
}

function comboLabel(combo) {
  return combo.skills.map((entry) => `${entry.tier === "high" ? entry.name : `初级${entry.name}`}`).join(" + ");
}

function combos() {
  const result = [];
  for (let i = 0; i < ATTACK_GROUPS.length; i += 1) {
    for (let j = i + 1; j < ATTACK_GROUPS.length; j += 1) {
      for (const firstTier of TIERS) {
        for (const secondTier of TIERS) {
          const firstGroup = context.__skillGroups.find((item) => item.group === ATTACK_GROUPS[i]);
          const secondGroup = context.__skillGroups.find((item) => item.group === ATTACK_GROUPS[j]);
          result.push({
            id: `${ATTACK_GROUPS[i]}:${firstTier}|${ATTACK_GROUPS[j]}:${secondTier}`,
            skills: [
              { group: ATTACK_GROUPS[i], tier: firstTier, name: firstGroup[firstTier].name },
              { group: ATTACK_GROUPS[j], tier: secondTier, name: secondGroup[secondTier].name },
            ],
          });
        }
      }
    }
  }
  return result;
}

function emptyStats(combo) {
  return {
    combo,
    wins: 0,
    games: 0,
    damage: 0,
    taken: 0,
    hpLeft: 0,
  };
}

function sideMetrics(result, side) {
  let damage = 0;
  let taken = 0;
  for (const event of result.events) {
    if (event.type === "attack" && event.actorSide === side) damage += event.damage || 0;
    if (event.type === "attack" && event.targetSide === side) taken += event.damage || 0;
  }
  return {
    damage,
    taken,
    hpLeft: side === "player" ? result.playerHp : result.enemyHp,
  };
}

function record(stats, comboId, result, side, won) {
  const target = stats.get(comboId);
  const metrics = sideMetrics(result, side);
  target.games += 1;
  target.wins += won ? 1 : 0;
  target.damage += metrics.damage;
  target.taken += metrics.taken;
  target.hpLeft += metrics.hpLeft;
}

const allCombos = combos();
const stats = new Map(allCombos.map((combo) => [combo.id, emptyStats(combo)]));
const perSideRuns = Math.max(1, Math.floor(ITERATIONS_PER_MATCHUP / 2));

for (let i = 0; i < allCombos.length; i += 1) {
  for (let j = i + 1; j < allCombos.length; j += 1) {
    const left = allCombos[i];
    const right = allCombos[j];
    for (let n = 0; n < perSideRuns; n += 1) {
      const first = runDuel(left, right, true);
      record(stats, left.id, first.result, "player", first.leftWon);
      record(stats, right.id, first.result, "enemy", !first.leftWon);

      const second = runDuel(left, right, false);
      record(stats, left.id, second.result, "enemy", second.leftWon);
      record(stats, right.id, second.result, "player", !second.leftWon);
    }
  }
}

const rows = [...stats.values()]
  .map((item) => ({
    combo: comboLabel(item.combo),
    games: item.games,
    wins: item.wins,
    winRate: item.wins / item.games,
    avgDamage: item.damage / item.games,
    avgTaken: item.taken / item.games,
    avgHpLeft: item.hpLeft / item.games,
  }))
  .sort((a, b) => b.winRate - a.winRate || b.avgHpLeft - a.avgHpLeft);

console.log(JSON.stringify({
  seed: SEED,
  iterationsPerMatchup: ITERATIONS_PER_MATCHUP,
  comboCount: allCombos.length,
  totalDuels: rows.reduce((sum, row) => sum + row.games, 0),
  top: rows.slice(0, 15),
  bottom: rows.slice(-10),
}, null, 2));
