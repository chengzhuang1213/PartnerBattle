const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");

function makeRng(values) {
  let index = 0;
  return () => values[Math.min(index++, values.length - 1)];
}

function loadContext(randomValues) {
  const seededMath = Object.create(Math);
  seededMath.random = makeRng(randomValues);
  const context = {
    console,
    Math: seededMath,
    state: { playerSkills: [], enemySkills: [] },
  };
  vm.createContext(context);
  for (const file of ["src/data/game-data.js", "src/systems/ability.js", "src/systems/battle-system.js"]) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename: file });
  }
  return context;
}

const context = loadContext([0.9, 0.0]);
const reviveSkill = {
  id: "revive-high",
  owner: "player",
  group: "revive",
  tier: "high",
  name: "高级神佑复生",
  description: "",
  assignedPetId: "player-test",
};
const pet = {
  id: "player-test",
  owner: "player",
  poolKey: "orange",
  name: "test",
  stats: { hp: 100, atk: 20, def: 10, spd: 10 },
  skills: [reviveSkill.id],
};
context.state.playerSkills = [reviveSkill];

const combatant = context.createCombatant(pet, context.state.playerSkills, "player");
combatant.hp = 0;
const ctx = {
  log: [],
  events: [],
  player: { pet, hp: 1, maxHp: 1, atk: 1, def: 1, spd: 1, skills: [], side: "player" },
  enemy: { pet, hp: 1, maxHp: 1, atk: 1, def: 1, spd: 1, skills: [], side: "enemy" },
  matchIndex: 0,
  playerWins: 0,
  enemyWins: 0,
};

const first = context.isDefeated(combatant, ctx);
const second = context.isDefeated(combatant, ctx);

console.log(JSON.stringify({
  first,
  second,
  hp: combatant.hp,
  revived: combatant.revived,
  reviveAttempted: combatant.reviveAttempted,
  eventCount: ctx.events.length,
}));
