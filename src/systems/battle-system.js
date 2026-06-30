function resolveBattle() {
  state.battlePickMode = true;
  state.enemyOrder = [];
  state.selectedId = null;
  state.pendingPlayerId = null;
  state.result = createBattleSession();
  state.replayIndex = 0;
  state.showBattleLog = false;
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
    playerStatus: match.playerStatus,
    enemyStatus: match.enemyStatus,
    playerStats: match.playerStats,
    enemyStats: match.enemyStats,
    playerWins: result.playerWins,
    enemyWins: result.enemyWins,
  });

  result.player = match.player;
  result.enemy = match.enemy;
  if (result.playerWins >= 2) result.winner = "player";
  if (result.enemyWins >= 2) result.winner = "enemy";
  state.result = result;
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
  applyOpeningStatModifiers(player, ctx);
  applyOpeningStatModifiers(enemy, ctx);

  for (let round = 1; round <= 12; round += 1) {
    recordEvent(ctx, `BO3 第 ${matchIndex + 1} 局，第 ${round} 回合。`, { type: "round", round });
    applyRegen(player, ctx);
    applyRegen(enemy, ctx);

    const first = player.spd >= enemy.spd ? player : enemy;
    const second = first === player ? enemy : player;
    performAttack(first, second, ctx, { canCombo: true, canCounter: true });
    if (isDefeated(first, ctx)) break;
    if (isDefeated(second, ctx)) break;
    performAttack(second, first, ctx, { canCombo: true, canCounter: true });
    if (isDefeated(second, ctx)) break;
    if (isDefeated(first, ctx)) break;

    applyPoisonTick(player, ctx);
    applyPoisonTick(enemy, ctx);
    if (player.hp <= 0 || enemy.hp <= 0) break;
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
    playerStatus: combatStatuses(player),
    enemyStatus: combatStatuses(enemy),
    playerStats: combatStats(player),
    enemyStats: combatStats(enemy),
    log: ctx.log,
    events: ctx.events,
  };
}

function combatStats(combatant) {
  return {
    hp: combatant.maxHp,
    atk: combatant.atk,
    def: combatant.def,
    spd: combatant.spd,
  };
}

function combatStatuses(combatant) {
  const statuses = [];
  if (combatant.poisonTurns > 0) {
    statuses.push({
      type: "debuff",
      name: "中毒",
      value: `${combatant.poisonTurns}回合`,
      description: "回合结束损失当前生命值10%",
    });
  }
  if (combatant.parryLeft > 0) {
    statuses.push({
      type: "buff",
      name: "招架",
      value: `${combatant.parryLeft}次`,
      description: "剩余可免疫攻击次数",
    });
  }
  return statuses;
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
    playerStatus: combatStatuses(ctx.player),
    enemyStatus: combatStatuses(ctx.enemy),
    playerStats: combatStats(ctx.player),
    enemyStats: combatStats(ctx.enemy),
    playerWins: ctx.playerWins,
    enemyWins: ctx.enemyWins,
    ...extra,
  });
}

function triggerSkill(ctx, combatant, skillName, text, extra = {}) {
  recordEvent(ctx, text, {
    type: "skill",
    side: combatant.side,
    skillName,
    ...extra,
  });
}

function performAttack(attacker, defender, ctx, options) {
  const config = {
    canCombo: options.canCombo ?? true,
    canCounter: options.canCounter ?? true,
    canReflect: options.canReflect ?? true,
    isComboAttack: options.isComboAttack ?? false,
  };
  if (attacker.hp <= 0 || defender.hp <= 0) return;

  if (applyFlightEvasion(attacker, defender, ctx, config.isComboAttack)) {
    if (config.canCombo) applyCombo(attacker, defender, ctx);
    return;
  }

  if (defender.parryLeft > 0) {
    defender.parryLeft -= 1;
    const parrySkill = hasSkill(defender, "parry");
    triggerSkill(ctx, defender, `-${parrySkill.name}`, `${attacker.name} 攻击，${defender.name} 触发招架，免疫本次攻击。`, {
      blocked: true,
      attackAnimationSide: attacker.side,
      targetSide: defender.side,
    });
    if (config.canCombo) applyCombo(attacker, defender, ctx);
    return;
  }

  const baseCrit = 5 + skillTierValue(attacker, "crit", 15, 30);
  const isCrit = chance(baseCrit);
  const luckySkill = isCrit ? hasSkill(defender, "lucky") : null;
  const luckyDamageRate = luckySkill ? (luckySkill.tier === "high" ? 0.4 : 0.6) : 1;
  const critMultiplier = isCrit ? 2 * luckyDamageRate : 1;
  const ignoredDefense = skillTierValue(attacker, "sneak", 0.1, 0.3);
  const targetDefense = Math.round(defender.def * (1 - ignoredDefense));
  const targetWasPoisoned = defender.poisonTurns > 0;
  const randomRoll = randomInt(-2, 2);
  const baseDamage = Math.max(4, Math.round(attacker.atk * 1.2 - targetDefense * 0.9 + randomRoll));
  let damage = Math.max(4, Math.round(baseDamage * critMultiplier));
  if (luckySkill) {
    triggerSkill(ctx, defender, luckySkill.name, `${defender.name} 触发${luckySkill.name}，暴击总伤害只承受 ${Math.round(luckyDamageRate * 100)}%。`);
  }
  defender.hp -= damage;
  const attackSkills = [
    isCrit && hasSkill(attacker, "crit"),
    ignoredDefense > 0 && hasSkill(attacker, "sneak"),
  ].filter(Boolean);
  recordEvent(ctx, `${attacker.name} 攻击 ${defender.name}，造成 ${damage} 伤害${isCrit ? "（暴击）" : ""}。`, {
    type: "attack",
    actorSide: attacker.side,
    targetSide: defender.side,
    damage,
    critical: isCrit,
    skillName: attackSkills.map((skill) => skill.name).join(" / "),
    damageBreakdown: {
      attack: attacker.atk,
      defense: defender.def,
      ignoredDefense,
      ignoredDefensePercent: Math.round(ignoredDefense * 100),
      targetDefense,
      randomRoll,
      baseDamage,
      critChance: baseCrit,
      luckySkillName: luckySkill?.name || "",
      luckyDamageRatePercent: Math.round(luckyDamageRate * 100),
      critMultiplier,
      finalDamage: damage,
      minimumDamage: 4,
    },
  });
  updateDynamicStats(defender, ctx);

  applyLifesteal(attacker, damage, ctx);
  applyPoisonOnHit(attacker, defender, ctx, targetWasPoisoned);
  if (config.canReflect) applyReflect(attacker, defender, damage, ctx);
  if (isDefeated(attacker, ctx)) return;
  if (isDefeated(defender, ctx)) return;

  if (config.canCounter && !hasSkill(attacker, "sneak")) applyCounter(defender, attacker, ctx);
  if (config.canCombo) applyCombo(attacker, defender, ctx);
}

function skillSummary(pet, skillList) {
  const skills = displaySkillOrder(getPetSkills(pet, skillList));
  if (!skills.length) return "无";
  return skills.map((skill) => skill.name).join("、");
}

