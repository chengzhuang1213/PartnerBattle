const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const ITERATIONS = Number(process.argv[2] || 100);
const SEED = Number(process.argv[3] || 20260701);
const TARGET_ARG = process.argv[4] || "default";

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

const TARGETS = [
  {
    id: "unyielding-high|lifesteal-high",
    label: "高级不屈 + 高级吸血",
    skills: [
      { group: "unyielding", tier: "high" },
      { group: "lifesteal", tier: "high" },
    ],
  },
  {
    id: "unyielding-high|power-high",
    label: "高级不屈 + 高级强力",
    skills: [
      { group: "unyielding", tier: "high" },
      { group: "power", tier: "high" },
    ],
  },
  {
    id: "power-high|lifesteal-high",
    label: "高级强力 + 高级吸血",
    skills: [
      { group: "power", tier: "high" },
      { group: "lifesteal", tier: "high" },
    ],
  },
  {
    id: "power-high|parry-high",
    label: "高级强力 + 高级招架",
    skills: [
      { group: "power", tier: "high" },
      { group: "parry", tier: "high" },
    ],
  },
];

const activeTargets = TARGET_ARG === "default"
  ? TARGETS.filter((item) => item.id !== "power-high|parry-high")
  : TARGETS.filter((item) => item.id === TARGET_ARG);

if (activeTargets.length === 0) {
  throw new Error(`Unknown target combo: ${TARGET_ARG}`);
}

function groupInfo(groupKey) {
  return context.__skillGroups.find((item) => item.group === groupKey);
}

function skill(entry, owner, index) {
  const group = groupInfo(entry.group);
  const template = group[entry.tier];
  return {
    id: `${owner}-${entry.group}-${entry.tier}-${index}`,
    owner,
    group: entry.group,
    tier: entry.tier,
    name: template.name,
    description: template.description,
    assignedPetId: null,
  };
}

function fixedPet(owner) {
  const avatar = owner === "enemy" ? context.__avatars[3] || context.__avatars[1] : context.__avatars[0];
  return context.createFixedPet("orange", owner, avatar, context.__competitiveStats || { hp: 90, atk: 20, def: 10, spd: 10 });
}

function attach(pet, skills) {
  pet.skills = skills.map((item) => item.id);
  for (const item of skills) item.assignedPetId = pet.id;
}

function labelFor(entries) {
  return entries.map((entry) => {
    const name = groupInfo(entry.group)[entry.tier].name;
    return entry.tier === "high" ? name : `初级${name}`;
  }).join(" + ");
}

function candidateCombos() {
  const groups = context.__skillGroups.map((item) => item.group);
  const tiers = ["basic", "high"];
  const combos = [];
  for (let i = 0; i < groups.length; i += 1) {
    for (let j = i + 1; j < groups.length; j += 1) {
      for (const firstTier of tiers) {
        for (const secondTier of tiers) {
          const skills = [
            { group: groups[i], tier: firstTier },
            { group: groups[j], tier: secondTier },
          ];
          combos.push({
            id: `${groups[i]}:${firstTier}|${groups[j]}:${secondTier}`,
            label: labelFor(skills),
            skills,
          });
        }
      }
    }
  }
  return combos;
}

function metrics(result, side) {
  let damage = 0;
  let taken = 0;
  let healing = 0;
  let reflected = 0;
  let blocks = 0;
  for (const event of result.events) {
    if (event.type === "attack" && event.actorSide === side) damage += event.damage || 0;
    if (event.type === "attack" && event.targetSide === side) taken += event.damage || 0;
    if (event.healSide === side) healing += event.heal || 0;
    if (event.side === side && event.effectName === "reflect") reflected += event.damage || 0;
    if (event.side === side && (event.blocked || event.evaded || event.parried)) blocks += 1;
  }
  return {
    damage,
    taken,
    healing,
    reflected,
    blocks,
    hpLeft: side === "player" ? result.playerHp : result.enemyHp,
  };
}

function run(candidate, target, candidateAsPlayer) {
  const player = fixedPet("player");
  const enemy = fixedPet("enemy");
  const playerEntries = candidateAsPlayer ? candidate.skills : target.skills;
  const enemyEntries = candidateAsPlayer ? target.skills : candidate.skills;
  const playerSkills = playerEntries.map((entry, index) => skill(entry, "player", index));
  const enemySkills = enemyEntries.map((entry, index) => skill(entry, "enemy", index));
  attach(player, playerSkills);
  attach(enemy, enemySkills);
  context.state.playerSkills = playerSkills;
  context.state.enemySkills = enemySkills;
  return {
    result: context.simulateBattle(player, enemy, 0, 0, 0),
    candidateSide: candidateAsPlayer ? "player" : "enemy",
  };
}

const rows = [];
for (const candidate of candidateCombos()) {
  const row = {
    combo: candidate.label,
    games: 0,
    wins: 0,
    damage: 0,
    taken: 0,
    healing: 0,
    reflected: 0,
    blocks: 0,
    hpLeft: 0,
    targets: {},
  };

  for (const target of activeTargets) {
    const targetStats = { games: 0, wins: 0 };
    for (let i = 0; i < ITERATIONS; i += 1) {
      const { result, candidateSide } = run(candidate, target, i % 2 === 0);
      const won = result.winner === candidateSide;
      const item = metrics(result, candidateSide);
      row.games += 1;
      row.wins += won ? 1 : 0;
      row.damage += item.damage;
      row.taken += item.taken;
      row.healing += item.healing;
      row.reflected += item.reflected;
      row.blocks += item.blocks;
      row.hpLeft += item.hpLeft;
      targetStats.games += 1;
      targetStats.wins += won ? 1 : 0;
    }
    row.targets[target.label] = targetStats.wins / targetStats.games;
  }

  rows.push({
    combo: row.combo,
    games: row.games,
    wins: row.wins,
    winRate: row.wins / row.games,
    avgDamage: row.damage / row.games,
    avgTaken: row.taken / row.games,
    avgHealing: row.healing / row.games,
    avgReflected: row.reflected / row.games,
    avgBlocks: row.blocks / row.games,
    avgHpLeft: row.hpLeft / row.games,
    targets: row.targets,
  });
}

rows.sort((a, b) => b.winRate - a.winRate || b.avgHpLeft - a.avgHpLeft);

console.log(JSON.stringify({
  seed: SEED,
  iterationsPerTarget: ITERATIONS,
  targetCombos: activeTargets.map((item) => item.label),
  candidateCount: rows.length,
  top: rows.slice(0, 20),
}, null, 2));
