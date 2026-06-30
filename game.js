const app = document.querySelector("#app");

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
  { name: "高坂穗乃果", src: "assets/partners/4Kousaka-Honoka-m1dEvp.png", battleSrc: "assets/battle-p1/4Kousaka-Honoka-2nSYRU.png" },
  { name: "小泉花阳", src: "assets/partners/3Koizumi-Hanayo-kdVFUI.png", battleSrc: "assets/battle-p1/3Koizumi-Hanayo-wuvH3R.png" },
  { name: "星空凛", src: "assets/partners/2Hoshizora-Rin-sgemWZ.png", battleSrc: "assets/battle-p1/2Hoshizora-Rin-hO1h4C.png" },
  { name: "西木野真姬", src: "assets/partners/10Nishikino-Maki-UFQB4E.png", battleSrc: "assets/battle-p1/10Nishikino-Maki-UFQB4E.png" },
  { name: "园田海未", src: "assets/partners/13Sonoda-Umi-RVB62t.png", battleSrc: "assets/battle-p1/13Sonoda-Umi-rxgV8z.png" },
  { name: "绚濑绘里", src: "assets/partners/1Ayase-Eli-MqG2az.png", battleSrc: "assets/battle-p1/1Ayase-Eli-wRbUwD.png" },
];

const PLAYER2_AVATARS = [
  { name: "南小鸟", src: "assets/partners-p2/9Minami-Kotori-06DzDA.png", battleSrc: "assets/battle-p2/9Minami-Kotori-BkWR39.png" },
  { name: "唐可可", src: "assets/partners-p2/119Tang-Keke-DsQVZW.png", battleSrc: "assets/battle-p2/119Tang-Keke-4Tr0Yx.png" },
  { name: "上原步梦", src: "assets/partners-p2/102Uehara-Ayumu-TgB2p1.png", battleSrc: "assets/battle-p2/102Uehara-Ayumu-KN13pl.png" },
  { name: "松浦果南", src: "assets/partners-p2/8Matsuura-Kanan-qlLtYT.png", battleSrc: "assets/battle-p2/8Matsuura-Kanan-aT2Td5.png" },
  { name: "岚千砂都", src: "assets/partners-p2/120Arashi-Chisato-NGhy5X.png", battleSrc: "assets/battle-p2/120Arashi-Chisato-eySO7L.png" },
  { name: "日野下花帆", src: "assets/partners-p2/203Kaho-Hinoshita-obf8Nh.png", battleSrc: "assets/battle-p2/203Kaho-Hinoshita-PS7Ud5.png" },
  { name: "黑泽黛雅", src: "assets/partners-p2/6Kurosawa-Dia-gjXWOR.png", battleSrc: "assets/battle-p2/6Kurosawa-Dia-6ovIG8.png" },
  { name: "钟岚珠", src: "assets/partners-p2/124Lanzhu-ttDPY2.png", battleSrc: "assets/battle-p2/124Lanzhu-aPGOOW.png" },
];

const SKILL_GROUPS = [
  ["crit", "必杀", "暴击率 +15%", "高级必杀", "暴击率 +30%"],
  ["sneak", "偷袭", "造成伤害 +10%", "高级偷袭", "造成伤害 +20%"],
  ["combo", "连击", "攻击力降低20%，50%概率追加一次普通攻击", "高级连击", "不降低攻击力，70%概率追加一次普通攻击"],
  ["power", "强力", "攻击力 +15%", "高级强力", "攻击力 +30%"],
  ["lifesteal", "吸血", "造成伤害的15%转化为生命", "高级吸血", "造成伤害的30%转化为生命"],
  ["revive", "神佑复生", "死亡时20%概率复活，每场最多一次", "高级神佑复生", "死亡时35%概率复活，每场最多一次"],
  ["lucky", "幸运", "被暴击概率降低20%", "高级幸运", "被暴击概率降低40%"],
  ["parry", "招架", "本场第一次受到攻击完全免疫", "高级招架", "本场前两次受到攻击完全免疫"],
  ["defense", "防御", "防御提高30%", "高级防御", "防御提高50%"],
  ["regen", "再生", "每回合恢复最大生命5%", "高级再生", "每回合恢复最大生命10%"],
  ["reflect", "反震", "25%概率反弹25%伤害", "高级反震", "35%概率反弹40%伤害"],
  ["counter", "反击", "20%概率立即普通攻击一次", "高级反击", "35%概率立即普通攻击一次"],
  ["agile", "敏捷", "速度提高20%", "高级敏捷", "速度提高40%"],
  ["unyielding", "不屈", "生命低于50%时，造成伤害提高20%", "高级不屈", "生命低于50%时，造成伤害提高40%"],
].map(([group, basicName, basicDescription, highName, highDescription]) => ({
  group,
  basic: { tier: "basic", name: basicName, description: basicDescription },
  high: { tier: "high", name: highName, description: highDescription },
}));

const POOL_KEYS = ["orange", "purple", "blue"];
const SKILL_LIMITS = {
  orange: { high: 2, basic: 3, text: "最多 2 高级 + 3 初级" },
  purple: { high: 1, basic: 2, text: "最多 1 高级 + 2 初级" },
  blue: { high: 1, basic: 3, text: "3 初级，或 1 高级 + 1 初级" },
};

let nextPetId = 1;
let nextSkillId = 1;
let replayTimer = null;
let state = {
  playerTeam: [],
  enemyTeam: [],
  playerSkills: [],
  enemySkills: [],
  selectedSkillId: null,
  selectedId: null,
  pendingPlayerId: null,
  battlePickMode: false,
  enemyOrder: [],
  result: null,
  replayIndex: 0,
};

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

function createSkillHand(owner) {
  const highGroups = shuffle(SKILL_GROUPS).slice(0, 6);
  const basicGroups = shuffle(SKILL_GROUPS).slice(0, 12);
  const highSkills = highGroups.map((group) => createSkill(owner, group, group.high));
  const basicSkills = basicGroups.map((group) => createSkill(owner, group, group.basic));
  return shuffle([...highSkills, ...basicSkills]);
}

function createSkill(owner, group, template) {
  return {
    id: `${owner}-${template.tier}-${nextSkillId++}`,
    owner,
    group: group.group,
    tier: template.tier,
    name: template.name,
    description: template.description,
    assignedPetId: null,
  };
}

function startGame() {
  stopBattleReplay();
  const playerTeam = createTeam("player");
  const enemyTeam = createTeam("enemy");
  const enemySkills = createSkillHand("enemy");
  autoAssignEnemySkills(enemyTeam, enemySkills);

  state = {
    playerTeam,
    enemyTeam,
    playerSkills: createSkillHand("player"),
    enemySkills,
    selectedSkillId: null,
    selectedId: null,
    pendingPlayerId: null,
    battlePickMode: false,
    enemyOrder: [],
    result: null,
    replayIndex: 0,
  };
  renderGame();
}

function stopBattleReplay() {
  if (replayTimer) {
    clearTimeout(replayTimer);
    replayTimer = null;
  }
}

function selectPet(id) {
  if (!state.selectedSkillId) return;
  assignSelectedSkill(id);
}

function selectSkill(id) {
  const skill = state.playerSkills.find((item) => item.id === id);
  state.selectedSkillId = skill?.assignedPetId ? null : id;
  renderGame();
}

function assignSelectedSkill(petId) {
  const skill = state.playerSkills.find((item) => item.id === state.selectedSkillId);
  const pet = state.playerTeam.find((item) => item.id === petId);
  if (!skill || !pet || skill.assignedPetId || !canAssignSkill(pet, skill, state.playerSkills)) return;

  skill.assignedPetId = pet.id;
  pet.skills.push(skill.id);
  state.selectedSkillId = null;
  state.result = null;
  renderGame();
}

function removeSkill(skillId) {
  const skill = state.playerSkills.find((item) => item.id === skillId);
  if (!skill) return;

  const pet = state.playerTeam.find((item) => item.id === skill.assignedPetId);
  if (pet) pet.skills = pet.skills.filter((id) => id !== skill.id);
  skill.assignedPetId = null;
  state.selectedSkillId = null;
  state.result = null;
  renderGame();
}

function canAssignSkill(pet, skill, skillList) {
  const assigned = getPetSkills(pet, skillList);
  const highCount = assigned.filter((item) => item.tier === "high").length;
  const basicCount = assigned.filter((item) => item.tier === "basic").length;
  const hasSameGroup = assigned.some((item) => item.group === skill.group);

  if (hasSameGroup) return false;

  if (pet.poolKey === "blue") {
    if (skill.tier === "high") return highCount < 1 && basicCount <= 1;
    if (highCount > 0) return basicCount < 1;
    return basicCount < 3;
  }

  const limit = SKILL_LIMITS[pet.poolKey];
  return skill.tier === "high" ? highCount < limit.high : basicCount < limit.basic;
}

function autoAssignEnemySkills(team, skills) {
  for (const skill of shuffle(skills)) {
    const candidates = shuffle(team).filter((pet) => canAssignSkill(pet, skill, skills));
    const pet = candidates[0];
    if (!pet) continue;

    skill.assignedPetId = pet.id;
    pet.skills.push(skill.id);
  }
}

function randomAssignPlayerSkills() {
  stopBattleReplay();
  for (const pet of state.playerTeam) pet.skills = [];
  for (const skill of state.playerSkills) skill.assignedPetId = null;

  for (const skill of shuffle(state.playerSkills)) {
    const candidates = shuffle(state.playerTeam).filter((pet) => canAssignSkill(pet, skill, state.playerSkills));
    const pet = candidates[0];
    if (!pet) continue;

    skill.assignedPetId = pet.id;
    pet.skills.push(skill.id);
  }

  state.selectedSkillId = null;
  state.result = null;
  renderGame();
}

function getPetSkills(pet, skillList) {
  return pet.skills.map((id) => skillList.find((skill) => skill.id === id)).filter(Boolean);
}

function hasSkill(combatant, group) {
  return combatant.skills.find((skill) => skill.group === group);
}

function skillTierValue(combatant, group, basicValue, highValue, fallback = 0) {
  const skill = hasSkill(combatant, group);
  if (!skill) return fallback;
  return skill.tier === "high" ? highValue : basicValue;
}

function resolveBattle() {
  state.battlePickMode = true;
  state.enemyOrder = [];
  state.selectedId = null;
  state.pendingPlayerId = null;
  state.result = createBattleSession();
  state.replayIndex = 0;
  stopBattleReplay();
  renderBattlePage();
}

function selectBattlePet(id) {
  if (!state.battlePickMode || state.result?.winner) return;
  if (!availablePlayerTeam().some((pet) => pet.id === id)) return;
  state.pendingPlayerId = id;
  renderBattlePage();
}

function startSelectedBattleMatch() {
  if (!state.battlePickMode || state.result?.winner || !state.pendingPlayerId) return;
  state.selectedId = state.pendingPlayerId;
  const player = availablePlayerTeam().find((pet) => pet.id === state.pendingPlayerId);
  const enemies = availableEnemyTeam();
  const enemy = enemies.length ? pick(enemies) : null;
  if (!player || !enemy) return;

  const startIndex = state.result.events.length;
  appendBattleMatch(player, enemy);
  state.battlePickMode = false;
  state.pendingPlayerId = null;
  state.replayIndex = startIndex;
  renderBattlePage();
  startBattleReplay();
}

function createBattleSession() {
  return {
    player: null,
    enemy: null,
    matches: [],
    events: [],
    log: [],
    playerWins: 0,
    enemyWins: 0,
    winner: null,
  };
}

function availablePlayerTeam() {
  const usedIds = new Set(state.result?.matches.map((match) => match.player.id) || []);
  return state.playerTeam.filter((pet) => !usedIds.has(pet.id));
}

function availableEnemyTeam() {
  const usedIds = new Set(state.result?.matches.map((match) => match.enemy.id) || []);
  return state.enemyTeam.filter((pet) => !usedIds.has(pet.id));
}

function appendBattleMatch(player, enemy) {
  const result = state.result || createBattleSession();
  const matchIndex = result.matches.length;
  const match = simulateBattle(player, enemy, matchIndex, result.playerWins, result.enemyWins);

  result.matches.push(match);
  result.log.push(...match.log);
  result.events.push(...match.events);
  if (match.winner === "player") result.playerWins += 1;
  else result.enemyWins += 1;

  const scoreText = `BO3 当前比分：玩家 ${result.playerWins} - ${result.enemyWins} 电脑。`;
  result.log.push(scoreText);
  result.events.push({
    type: "matchResult",
    text: scoreText,
    matchIndex,
    player: match.player,
    enemy: match.enemy,
    playerHp: match.playerHp,
    enemyHp: match.enemyHp,
    playerMaxHp: match.playerMaxHp,
    enemyMaxHp: match.enemyMaxHp,
    playerWins: result.playerWins,
    enemyWins: result.enemyWins,
  });

  result.player = match.player;
  result.enemy = match.enemy;
  if (result.playerWins >= 2) result.winner = "player";
  if (result.enemyWins >= 2) result.winner = "enemy";
  state.result = result;
}

function createCombatant(pet, skillList, side) {
  const skills = getPetSkills(pet, skillList);
  const atkBonus = skills.some((skill) => skill.group === "power" && skill.tier === "high")
    ? 1.3
    : skills.some((skill) => skill.group === "power")
      ? 1.15
      : 1;
  const defBonus = skills.some((skill) => skill.group === "defense" && skill.tier === "high")
    ? 1.5
    : skills.some((skill) => skill.group === "defense")
      ? 1.3
      : 1;
  const spdBonus = skills.some((skill) => skill.group === "agile" && skill.tier === "high")
    ? 1.4
    : skills.some((skill) => skill.group === "agile")
      ? 1.2
      : 1;
  const comboPenalty = skills.some((skill) => skill.group === "combo" && skill.tier === "basic") ? 0.8 : 1;

  return {
    side,
    pet,
    name: pet.name,
    skills,
    maxHp: pet.stats.hp,
    hp: pet.stats.hp,
    atk: Math.round(pet.stats.atk * atkBonus * comboPenalty),
    def: Math.round(pet.stats.def * defBonus),
    spd: Math.round(pet.stats.spd * spdBonus),
    parryLeft: skillTierValue({ skills }, "parry", 1, 2),
    revived: false,
  };
}

function simulateBattle(playerPet, enemyPet, matchIndex, playerWins, enemyWins) {
  const player = createCombatant(playerPet, state.playerSkills, "player");
  const enemy = createCombatant(enemyPet, state.enemySkills, "enemy");
  const ctx = {
    log: [],
    events: [],
    player,
    enemy,
    matchIndex,
    playerWins,
    enemyWins,
  };

  recordEvent(ctx, `${player.name} 携带技能：${skillSummary(playerPet, state.playerSkills)}。`, { type: "skillList" });
  recordEvent(ctx, `${enemy.name} 携带技能：${skillSummary(enemyPet, state.enemySkills)}。`, { type: "skillList" });

  for (let round = 1; round <= 12; round += 1) {
    recordEvent(ctx, `BO3 第 ${matchIndex + 1} 局，第 ${round} 回合。`, { type: "round", round });
    applyRegen(player, ctx);
    applyRegen(enemy, ctx);

    const first = player.spd >= enemy.spd ? player : enemy;
    const second = first === player ? enemy : player;
    performAttack(first, second, ctx, { canCombo: true, canCounter: true });
    if (isDefeated(second, ctx)) break;
    performAttack(second, first, ctx, { canCombo: true, canCounter: true });
    if (isDefeated(first, ctx)) break;
  }

  const playerScore = Math.round(player.hp + player.atk * 3 + player.def * 2 + player.spd * 2);
  const enemyScore = Math.round(enemy.hp + enemy.atk * 3 + enemy.def * 2 + enemy.spd * 2);
  const winner = player.hp === enemy.hp ? (playerScore >= enemyScore ? "player" : "enemy") : player.hp > enemy.hp ? "player" : "enemy";

  recordEvent(ctx, `${player.name} 剩余生命 ${Math.max(0, player.hp)}，${enemy.name} 剩余生命 ${Math.max(0, enemy.hp)}。`, { type: "summary" });
  recordEvent(ctx, winner === "player" ? "玩家赢下这一局。" : "电脑赢下这一局。", { type: "win", winner });

  return {
    winner,
    player: playerPet,
    enemy: enemyPet,
    playerScore,
    enemyScore,
    playerHp: Math.max(0, player.hp),
    enemyHp: Math.max(0, enemy.hp),
    playerMaxHp: player.maxHp,
    enemyMaxHp: enemy.maxHp,
    log: ctx.log,
    events: ctx.events,
  };
}

function recordEvent(ctx, text, extra = {}) {
  ctx.log.push(text);
  ctx.events.push({
    type: "text",
    text,
    matchIndex: ctx.matchIndex,
    player: ctx.player.pet,
    enemy: ctx.enemy.pet,
    playerHp: Math.max(0, ctx.player.hp),
    enemyHp: Math.max(0, ctx.enemy.hp),
    playerMaxHp: ctx.player.maxHp,
    enemyMaxHp: ctx.enemy.maxHp,
    playerWins: ctx.playerWins,
    enemyWins: ctx.enemyWins,
    ...extra,
  });
}

function triggerSkill(ctx, combatant, skillName, text) {
  recordEvent(ctx, text, {
    type: "skill",
    side: combatant.side,
    skillName,
  });
}

function applyRegen(combatant, ctx) {
  const percent = skillTierValue(combatant, "regen", 5, 10);
  if (!percent || combatant.hp <= 0 || combatant.hp >= combatant.maxHp) return;

  const heal = Math.max(1, Math.round(combatant.maxHp * (percent / 100)));
  combatant.hp = Math.min(combatant.maxHp, combatant.hp + heal);
  triggerSkill(ctx, combatant, hasSkill(combatant, "regen").name, `${combatant.name} 触发再生，恢复 ${heal} 生命。`);
}

function performAttack(attacker, defender, ctx, options) {
  if (attacker.hp <= 0 || defender.hp <= 0) return;

  if (defender.parryLeft > 0) {
    defender.parryLeft -= 1;
    triggerSkill(ctx, defender, hasSkill(defender, "parry").name, `${defender.name} 触发招架，免疫本次攻击。`);
    return;
  }

  const baseCrit = 5 + skillTierValue(attacker, "crit", 15, 30);
  const critReduction = skillTierValue(defender, "lucky", 20, 40);
  const isCrit = chance(Math.max(0, baseCrit - critReduction));
  const sneakBonus = skillTierValue(attacker, "sneak", 0.1, 0.2);
  const unyieldingBonus = attacker.hp < attacker.maxHp * 0.5 ? skillTierValue(attacker, "unyielding", 0.2, 0.4) : 0;
  let damage = Math.max(1, Math.round(attacker.atk * 1.7 - defender.def * 0.75 + randomInt(-2, 2)));
  damage = Math.max(1, Math.round(damage * (1 + sneakBonus + unyieldingBonus) * (isCrit ? 1.8 : 1)));
  defender.hp -= damage;
  const attackSkills = [
    isCrit && hasSkill(attacker, "crit"),
    sneakBonus > 0 && hasSkill(attacker, "sneak"),
    unyieldingBonus > 0 && hasSkill(attacker, "unyielding"),
  ].filter(Boolean);
  recordEvent(ctx, `${attacker.name} 攻击 ${defender.name}，造成 ${damage} 伤害${isCrit ? "（暴击）" : ""}。`, {
    type: "attack",
    actorSide: attacker.side,
    targetSide: defender.side,
    damage,
    critical: isCrit,
    skillName: attackSkills.map((skill) => skill.name).join(" / "),
  });

  applyLifesteal(attacker, damage, ctx);
  applyReflect(attacker, defender, damage, ctx);
  if (isDefeated(defender, ctx)) return;

  if (options.canCounter) applyCounter(defender, attacker, ctx);
  if (options.canCombo) applyCombo(attacker, defender, ctx);
}

function applyLifesteal(attacker, damage, ctx) {
  const percent = skillTierValue(attacker, "lifesteal", 15, 30);
  if (!percent || attacker.hp <= 0) return;

  const heal = Math.max(1, Math.round(damage * (percent / 100)));
  attacker.hp = Math.min(attacker.maxHp, attacker.hp + heal);
  triggerSkill(ctx, attacker, hasSkill(attacker, "lifesteal").name, `${attacker.name} 触发吸血，恢复 ${heal} 生命。`);
}

function applyReflect(attacker, defender, damage, ctx) {
  const skill = hasSkill(defender, "reflect");
  if (!skill || defender.hp <= 0) return;

  const rate = skill.tier === "high" ? 35 : 25;
  const percent = skill.tier === "high" ? 40 : 25;
  if (!chance(rate)) return;

  const reflectDamage = Math.max(1, Math.round(damage * (percent / 100)));
  attacker.hp -= reflectDamage;
  triggerSkill(ctx, defender, skill.name, `${defender.name} 触发反震，反弹 ${reflectDamage} 伤害。`);
}

function applyCounter(defender, attacker, ctx) {
  const rate = skillTierValue(defender, "counter", 20, 35);
  if (!rate || defender.hp <= 0 || attacker.hp <= 0 || !chance(rate)) return;

  triggerSkill(ctx, defender, hasSkill(defender, "counter").name, `${defender.name} 触发反击。`);
  performAttack(defender, attacker, ctx, { canCombo: false, canCounter: false });
}

function applyCombo(attacker, defender, ctx) {
  const rate = skillTierValue(attacker, "combo", 50, 70);
  if (!rate || attacker.hp <= 0 || defender.hp <= 0 || !chance(rate)) return;

  triggerSkill(ctx, attacker, hasSkill(attacker, "combo").name, `${attacker.name} 触发连击。`);
  performAttack(attacker, defender, ctx, { canCombo: false, canCounter: true });
}

function isDefeated(combatant, ctx) {
  if (combatant.hp > 0) return false;

  const rate = skillTierValue(combatant, "revive", 20, 35);
  if (rate && !combatant.revived && chance(rate)) {
    combatant.revived = true;
    combatant.hp = Math.max(1, Math.round(combatant.maxHp * 0.35));
    triggerSkill(ctx, combatant, hasSkill(combatant, "revive").name, `${combatant.name} 触发神佑复生，恢复 ${combatant.hp} 生命。`);
    return false;
  }

  return true;
}

function skillSummary(pet, skillList) {
  const skills = getPetSkills(pet, skillList);
  if (!skills.length) return "无";
  return skills.map((skill) => skill.name).join("、");
}

function statLabel(key) {
  return { hp: "生命", atk: "攻击", def: "防御", spd: "速度" }[key];
}

function statIcon(key) {
  return { hp: "♥", atk: "⚔", def: "◆", spd: "↯" }[key];
}

function maxStat(key) {
  return { hp: 135, atk: 35, def: 22, spd: 20 }[key];
}

function petSvg(pet, compact = false) {
  const fill = { orange: "#e9852d", purple: "#7c4dbe", blue: "#3978d8" }[pet.poolKey];
  const earShape =
    pet.poolKey === "purple"
      ? '<path d="M42 42 L56 10 L70 44 Z" fill="#fff" opacity=".72"/><path d="M130 44 L146 10 L158 42 Z" fill="#fff" opacity=".72"/>'
      : '<circle cx="54" cy="36" r="18" fill="#fff" opacity=".72"/><circle cx="146" cy="36" r="18" fill="#fff" opacity=".72"/>';

  return `
    <svg class="pet-art" viewBox="0 0 200 156" role="img" aria-label="${pet.name}">
      <rect width="200" height="156" rx="14" fill="#eef4ef"/>
      <circle cx="100" cy="84" r="${compact ? 44 : 52}" fill="${fill}"/>
      ${earShape}
      <circle cx="78" cy="50" r="7" fill="#17221a"/>
      <circle cx="122" cy="50" r="7" fill="#17221a"/>
      <path d="M78 102 Q100 116 122 102" fill="none" stroke="#17221a" stroke-width="7" stroke-linecap="round"/>
      <path d="M58 124 Q100 146 142 124" fill="none" stroke="#ffffff" stroke-width="8" stroke-linecap="round" opacity=".76"/>
    </svg>
  `;
}

function partnerArt(partner) {
  if (partner.avatarSrc) {
    return `<img class="pet-art partner-art" src="${partner.avatarSrc}" alt="${partner.name}" />`;
  }

  return petSvg(partner);
}

function battleArt(partner) {
  if (partner.battleSrc) {
    return `<img class="battle-art" src="${partner.battleSrc}" alt="${partner.name}" />`;
  }

  return partnerArt(partner);
}

function statRows(pet) {
  return Object.entries(pet.stats)
    .map(([key, value]) => {
      return `
        <div class="stat-row ${key}">
          <span>${statIcon(key)} ${statLabel(key)}</span>
          <strong>${value}</strong>
        </div>
      `;
    })
    .join("");
}

function petCard(pet, selected = false, index = 0) {
  const selectedSkill = state.playerSkills.find((skill) => skill.id === state.selectedSkillId);
  const canReceive = selectedSkill ? canAssignSkill(pet, selectedSkill, state.playerSkills) : false;
  return `
    <button class="pet-card ${selected ? "selected" : ""} ${canReceive ? "can-receive-skill" : ""}" data-select="${pet.id}">
      <span class="pet-index">${index + 1}</span>
      <span class="pet-portrait">${partnerArt(pet)}</span>
      <span class="pet-info">
        <span class="pet-head">
          <span class="pool-label ${pet.poolClass}">${pet.poolLabel}</span>
          <span class="level">Lv.50</span>
        </span>
        <span class="stat-list">${statRows(pet)}</span>
      </span>
    </button>
  `;
}

function compactPet(pet) {
  const skills = getPetSkills(pet, state.enemySkills);
  return `
    <article class="enemy-card">
      <span class="pet-portrait">${partnerArt(pet)}</span>
      <span class="pet-info">
        <span class="pet-head">
          <span class="pool-label ${pet.poolClass}">${pet.poolLabel}</span>
          <span class="level">Lv.50</span>
        </span>
        <span class="stat-list">${statRows(pet)}</span>
        <span class="skill-preview">${skills.length ? `${skills.length} 个技能` : "未配置技能"}</span>
      </span>
    </article>
  `;
}

function renderSkillPanel() {
  const highSkills = state.playerSkills.filter((skill) => skill.tier === "high");
  const basicSkills = state.playerSkills.filter((skill) => skill.tier === "basic");
  const selected = state.playerSkills.find((skill) => skill.id === state.selectedSkillId);

  return `
    <section class="skill-panel">
      <div class="skill-assign-area">
        <h3 class="panel-title gold">技能分配 <small>${selected ? `当前选择：${selected.name}` : "从右侧技能池选择，再点伙伴槽位"}</small></h3>
        <div class="assign-grid">
          ${state.playerTeam.map((pet) => assignmentCard(pet)).join("")}
        </div>
        <div class="battle-actions">
          <button class="secondary-action" data-start>返回重随</button>
          <button class="secondary-action" data-random-skills>随机分配技能</button>
          <button class="primary-action" data-fight>进入战斗</button>
        </div>
      </div>
      <aside class="skill-pool">
        <h3 class="panel-title blue-title">我的技能池 <span>${state.playerSkills.filter((skill) => !skill.assignedPetId).length}/18</span></h3>
        <div class="skill-tier-block">
          <h4>高级技能 <span>(${highSkills.filter((skill) => !skill.assignedPetId).length}/6)</span></h4>
          <div class="skill-list">${highSkills.map(skillButton).join("")}</div>
        </div>
        <div class="skill-tier-block">
          <h4>初级技能 <span>(${basicSkills.filter((skill) => !skill.assignedPetId).length}/12)</span></h4>
          <div class="skill-list">${basicSkills.map(skillButton).join("")}</div>
        </div>
      </aside>
    </section>
  `;
}

function assignmentCard(pet) {
  const selectedSkill = state.playerSkills.find((skill) => skill.id === state.selectedSkillId);
  const canReceive = selectedSkill ? canAssignSkill(pet, selectedSkill, state.playerSkills) : false;
  const skills = getPetSkills(pet, state.playerSkills);
  const highSkills = skills.filter((skill) => skill.tier === "high");
  const basicSkills = skills.filter((skill) => skill.tier === "basic");
  const highSlotCount = SKILL_LIMITS[pet.poolKey].high;
  const basicSlotCount = pet.poolKey === "blue" && highSkills.length ? 1 : SKILL_LIMITS[pet.poolKey].basic;

  return `
    <article class="assign-card ${pet.poolClass} ${canReceive ? "can-receive-skill" : ""}" data-select="${pet.id}">
      <h4>${pet.poolLabel}</h4>
      <p>${SKILL_LIMITS[pet.poolKey].text}</p>
      <div class="slot-section">
        <strong>高级技能</strong>
        <div class="slot-row">
          ${renderSlots(highSkills, highSlotCount, pet.id, "high")}
        </div>
      </div>
      <div class="slot-section">
        <strong>初级技能</strong>
        <div class="slot-row">
          ${renderSlots(basicSkills, basicSlotCount, pet.id, "basic")}
        </div>
      </div>
    </article>
  `;
}

function renderSlots(skills, count, petId, tier) {
  return Array.from({ length: count }, (_, index) => {
    const skill = skills[index];
    if (!skill) return `<button class="skill-slot empty" data-select="${petId}">+</button>`;
    return `
      <button class="skill-slot filled ${tier}" data-tooltip="${skill.description}" data-select="${petId}">
        <span>${skill.name}</span>
        <span class="remove-skill" data-remove-skill="${skill.id}">×</span>
      </button>
    `;
  }).join("");
}

function skillButton(skill) {
  const assignedPet = state.playerTeam.find((pet) => pet.id === skill.assignedPetId);
  return `
    <button class="skill-button ${skill.tier} ${state.selectedSkillId === skill.id ? "selected" : ""}" data-skill="${skill.id}" data-tooltip="${skill.description}" ${assignedPet ? "disabled" : ""}>
      <span class="skill-icon">${skill.name.slice(0, 2)}</span>
      <span class="skill-name">${skill.name}</span>
      <small>${assignedPet ? `已给 ${assignedPet.name}` : skill.description}</small>
    </button>
  `;
}

function renderStart() {
  app.innerHTML = `
    <section class="start-screen">
      <div class="title-block">
        <p class="eyebrow">第一赛季 · 14 组技能池</p>
        <h1>随机伙伴对决</h1>
        <p class="lead">
          三个池子不是简单强弱排序。每局玩家获得 6 个高级技能和 12 个初级技能，自由分配给伙伴。
          同组普通/高级技能不能共存，连击和反击不会递归触发。
        </p>
        <div class="start-actions">
          <button class="primary-action" data-start>开始游戏</button>
        </div>
      </div>
      <div class="preview-row">
        ${POOL_KEYS.map((key) => {
          const pool = POOLS[key];
          return `
            <article class="pool-card">
              <span class="pool-chip ${pool.className}">${pool.label}</span>
              <p>${pool.rangeText}</p>
              <p>战力 ${pool.budget.join("-")} · 生命 ${pool.ranges.hp.join("-")} · 攻击 ${pool.ranges.atk.join("-")} · 防御 ${pool.ranges.def.join("-")} · 速度 ${pool.ranges.spd.join("-")}</p>
            </article>
          `;
        }).join("")}
      </div>
    </section>
  `;
}

function renderGame() {
  app.innerHTML = `
    <section class="game-screen">
      <section class="battle-panel enemy-panel">
        <div class="panel-head">
          <h2>对手阵容</h2>
          <button class="preview-button">查看技能预览</button>
        </div>
        <div class="enemy-grid">
          ${state.enemyTeam.map((pet) => compactPet(pet)).join("")}
        </div>
      </section>

      <div class="match-status">⚔ 分配技能后进入战斗页选择上场</div>

      <section class="battle-panel player-panel">
        <div class="panel-head">
          <h2>我的阵容</h2>
          <p>这里先分配技能，进入战斗页后再选择我方上场伙伴</p>
        </div>
        <div class="pet-grid">
          ${state.playerTeam.map((pet, index) => petCard(pet, false, index)).join("")}
        </div>
      </section>

      ${renderSkillPanel()}
    </section>
  `;
}

function renderBattlePage() {
  if (!state.result && !state.battlePickMode) {
    renderGame();
    return;
  }

  if (state.battlePickMode) {
    const playerWins = state.result?.playerWins || 0;
    const enemyWins = state.result?.enemyWins || 0;
    const matchIndex = state.result?.matches.length || 0;
    const usedPlayerIds = new Set(state.result?.matches.map((match) => match.player.id) || []);
    const pendingPlayer = state.playerTeam.find((pet) => pet.id === state.pendingPlayerId);
    app.innerHTML = `
      <section class="combat-screen">
        <main class="combat-main">
          <header class="combat-scorebar">
            <div class="score-side player-score">我方 <span>胜场: ${playerWins}</span></div>
            <div class="round-badge">BO3 第 ${matchIndex + 1} 局</div>
            <div class="score-side enemy-score"><span>胜场: ${enemyWins}</span> 对方</div>
          </header>

          <section class="combat-stage is-empty">
            <div class="empty-side player-empty ${pendingPlayer ? "has-pending" : ""}">
              ${pendingPlayer ? `<div class="fighter-preview">${battleArt(pendingPlayer)}</div>` : "选择我方上场"}
            </div>
            <div class="empty-side enemy-empty">电脑随机待命</div>
          </section>

          <div class="combat-prompt">${pendingPlayer ? `${pendingPlayer.name} 已准备上场，点击开始比赛` : "选择 1 位伙伴上场，确认后再开始战斗"}</div>

          <section class="bench-row">
            ${state.playerTeam.map((partner) => battleBenchCard(partner, pendingPlayer?.id === partner.id, null, !usedPlayerIds.has(partner.id), usedPlayerIds.has(partner.id))).join("")}
          </section>
        </main>

        <aside class="combat-sidebar">
          <section class="combat-log-panel">
            <h2>战斗日志</h2>
            <ol class="combat-log">
              ${(state.result?.log.length ? state.result.log : ["双方场地为空，等待我方选择上场伙伴。"]).map((line) => `<li>${colorBattleLine(line)}</li>`).join("")}
            </ol>
          </section>

          <section class="combat-result-card">
            <h3>${matchIndex ? "下一局候场" : "战斗准备"}</h3>
            <p>${playerWins} : ${enemyWins}</p>
            <span>${pendingPlayer ? "确认后电脑随机派出" : "先选择我方上场伙伴"}</span>
          </section>

          <button class="primary-action continue-button" data-start-match ${pendingPlayer ? "" : "disabled"}>开始比赛</button>
          <button class="secondary-action prep-button" data-back-prep>返回战前准备</button>
        </aside>
      </section>
    `;
    return;
  }

  const result = state.result;
  const events = result.events.length ? result.events : [];
  const replayIndex = Math.min(state.replayIndex, Math.max(0, events.length - 1));
  const frame = events[replayIndex] || {
    player: result.player,
    enemy: result.enemy,
    playerHp: result.matches[0]?.playerMaxHp || result.player.stats.hp,
    enemyHp: result.matches[0]?.enemyMaxHp || result.enemy.stats.hp,
    playerMaxHp: result.matches[0]?.playerMaxHp || result.player.stats.hp,
    enemyMaxHp: result.matches[0]?.enemyMaxHp || result.enemy.stats.hp,
    playerWins: 0,
    enemyWins: 0,
    text: "战斗准备。",
  };
  const replayDone = replayIndex >= events.length - 1;
  const visibleLog = result.log.slice(0, Math.max(1, replayIndex + 1));
  app.innerHTML = `
    <section class="combat-screen">
      <main class="combat-main">
        <header class="combat-scorebar">
          <div class="score-side player-score">我方 <span>胜场: ${frame.playerWins}</span></div>
          <div class="round-badge">BO3 第 ${(frame.matchIndex ?? 0) + 1} 局</div>
          <div class="score-side enemy-score"><span>胜场: ${frame.enemyWins}</span> 对方</div>
        </header>

        <section class="combat-stage">
          ${battleStatusCard(frame.player, state.playerSkills, "player", frame.playerHp, frame.playerMaxHp)}
          ${battleStatusCard(frame.enemy, state.enemySkills, "enemy", frame.enemyHp, frame.enemyMaxHp)}
          <div class="fighter player-fighter ${fighterState("player", frame)}">
            ${skillBubble("player", frame)}
            ${damageBubble("player", frame)}
            ${battleArt(frame.player)}
          </div>
          <div class="fighter enemy-fighter ${fighterState("enemy", frame)}">
            ${skillBubble("enemy", frame)}
            ${damageBubble("enemy", frame)}
            ${battleArt(frame.enemy)}
          </div>
        </section>

        <div class="combat-prompt">${replayDone && result.winner ? (result.winner === "player" ? "BO3 战斗胜利！" : "BO3 战斗结束") : frame.text}</div>

        <section class="bench-row">
          ${state.playerTeam.map((partner) => battleBenchCard(partner, frame.player && partner.id === frame.player.id, frame)).join("")}
        </section>
      </main>

      <aside class="combat-sidebar">
        <section class="combat-log-panel">
          <h2>战斗日志</h2>
          <ol class="combat-log">
            ${visibleLog.map((line) => `<li>${colorBattleLine(line)}</li>`).join("")}
          </ol>
        </section>

        <section class="combat-result-card">
          <h3>战斗结果</h3>
          <p>${replayDone && result.winner ? (result.winner === "player" ? "我方胜利！" : "对方胜利！") : `${frame.playerWins} : ${frame.enemyWins}`}</p>
          <span>${replayDone && result.winner ? `BO3 ${result.playerWins}-${result.enemyWins}` : replayDone ? "等待下一局选择" : "战斗播放中"}</span>
        </section>

        <button class="primary-action continue-button" data-start>${replayDone ? "继续战斗" : "跳过并重开"}</button>
        <button class="secondary-action prep-button" data-back-prep>返回战前准备</button>
      </aside>
    </section>
  `;
}

function startBattleReplay() {
  stopBattleReplay();
  if (!state.result) return;
  if (state.replayIndex >= state.result.events.length - 1) {
    if (!state.result.winner) {
      replayTimer = setTimeout(() => {
        state.battlePickMode = true;
        state.pendingPlayerId = null;
        renderBattlePage();
      }, 900);
    }
    return;
  }

  const frame = state.result.events[state.replayIndex];
  const delay = frame?.type === "attack" ? 920 : frame?.type === "skill" ? 760 : 560;
  replayTimer = setTimeout(() => {
    state.replayIndex += 1;
    renderBattlePage();
    startBattleReplay();
  }, delay);
}

function fighterState(side, frame) {
  if (frame.type === "attack" && frame.actorSide === side) return "is-attacking";
  if (frame.targetSide === side) return "is-hit";
  return "";
}

function skillBubble(side, frame) {
  if (!frame.skillName || (frame.side && frame.side !== side) || (frame.actorSide && frame.actorSide !== side)) return "";
  return `<span class="skill-callout">${frame.skillName}</span>`;
}

function damageBubble(side, frame) {
  if (frame.type !== "attack" || frame.targetSide !== side || !frame.damage) return "";
  return `<span class="damage-pop">-${frame.damage}${frame.critical ? " 暴击" : ""}</span>`;
}

function battleStatusCard(partner, skillList, side, hp, maxHpValue) {
  const hpPercent = Math.max(0, Math.min(100, Math.round((hp / maxHpValue) * 100)));
  return `
    <article class="combat-status-card ${side}">
      <div class="combat-avatar">${partnerArt(partner)}</div>
      <div class="combat-stats">
        <div class="combat-name-row">
          <strong>${partner.name}</strong>
          <span>Lv.50</span>
        </div>
        <div class="hp-text">${hp} / ${maxHpValue}</div>
        <div class="hp-bar"><span style="width:${hpPercent}%"></span></div>
        <div class="compact-stats">${statRows(partner)}</div>
        <div class="combat-skill-capsules">${skillCapsules(partner, skillList)}</div>
      </div>
    </article>
  `;
}

function skillCapsules(partner, skillList) {
  const skills = getPetSkills(partner, skillList);
  if (!skills.length) return `<span class="skill-capsule empty">无技能</span>`;

  return skills
    .map((skill) => `<span class="skill-capsule ${skill.tier}" data-tooltip="${skill.description}">${skill.name}</span>`)
    .join("");
}

function battleBenchCard(partner, selected, frame = null, canPick = false, used = false) {
  const hp = selected && frame ? frame.playerHp : partner.stats.hp;
  return `
    <article class="bench-card ${selected ? "selected" : ""} ${canPick ? "can-pick" : ""} ${used ? "used" : ""}" ${canPick ? `data-battle-pick="${partner.id}"` : ""}>
      <div class="bench-art">${partnerArt(partner)}</div>
      <div>
        <h3>${partner.name}</h3>
        <p>Lv.50</p>
        <div class="hp-bar"><span style="width:${Math.max(0, Math.round((hp / partner.stats.hp) * 100))}%"></span></div>
        <div class="bench-stats">${statRows(partner)}</div>
        <div class="bench-skills">${skillCapsules(partner, state.playerSkills)}</div>
      </div>
      <span class="bench-state">${used ? "已出战" : canPick ? "点击上场" : selected ? "已上场" : "待命"}</span>
    </article>
  `;
}

function colorBattleLine(line) {
  return line
    .replaceAll("玩家", "<b class=\"blue-word\">玩家</b>")
    .replaceAll("电脑", "<b class=\"red-word\">电脑</b>")
    .replaceAll("暴击", "<b class=\"gold-word\">暴击</b>")
    .replaceAll("触发", "<b class=\"gold-word\">触发</b>")
    .replaceAll("伤害", "<b class=\"purple-word\">伤害</b>");
}

function resultPanel(result) {
  return `
    <section class="result-panel">
      <p class="winner-text">${result.winner === "player" ? "你赢了" : "电脑赢了"}</p>
      <div class="arena">
        <article class="arena-side">
          ${battleArt(result.player)}
          <h4>你派出：${result.player.name}</h4>
          <div class="mini-stats"><span>结算评分 ${result.playerPower}</span></div>
        </article>
        <div class="versus">VS</div>
        <article class="arena-side">
          ${battleArt(result.enemy)}
          <h4>电脑派出：${result.enemy.name}</h4>
          <div class="mini-stats"><span>结算评分 ${result.enemyPower}</span></div>
        </article>
      </div>
      <ul class="battle-log">
        ${result.log.map((line) => `<li>${line}</li>`).join("")}
      </ul>
    </section>
  `;
}

app.addEventListener("click", (event) => {
  const removeButton = event.target.closest("[data-remove-skill]");
  const skillButton = event.target.closest("[data-skill]");
  const backPrepButton = event.target.closest("[data-back-prep]");
  const randomSkillsButton = event.target.closest("[data-random-skills]");
  const startButton = event.target.closest("[data-start]");
  const selectButton = event.target.closest("[data-select]");
  const fightButton = event.target.closest("[data-fight]");
  const battlePickButton = event.target.closest("[data-battle-pick]");
  const startMatchButton = event.target.closest("[data-start-match]");

  if (removeButton) {
    event.preventDefault();
    event.stopPropagation();
    removeSkill(removeButton.dataset.removeSkill);
    return;
  }
  if (skillButton) selectSkill(skillButton.dataset.skill);
  if (backPrepButton) {
    stopBattleReplay();
    state.battlePickMode = false;
    state.pendingPlayerId = null;
    renderGame();
  }
  if (randomSkillsButton) randomAssignPlayerSkills();
  if (startButton) startGame();
  if (selectButton) selectPet(selectButton.dataset.select);
  if (fightButton) resolveBattle();
  if (battlePickButton) selectBattlePet(battlePickButton.dataset.battlePick);
  if (startMatchButton) startSelectedBattleMatch();
});

renderStart();
