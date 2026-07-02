function resolveBattle() {
  if (state.mode === "hotseat" && state.buildSide === "player") {
    state.privacyGate = {
      title: "玩家 B 开始 Build",
      body: "玩家 A 请闭眼。确认后屏幕亮起，玩家 B 进行技能分配。",
      action: "start-build-b",
    };
    renderGame();
    return;
  }

  state.battlePickMode = true;
  state.enemyOrder = [];
  state.selectedId = null;
  state.pendingPlayerId = null;
  state.pendingEnemyId = null;
  state.pendingPickSide = "player";
  state.pendingInspectSide = null;
  state.pendingInspectId = null;
  state.result = createBattleSession();
  state.replayIndex = 0;
  state.showBattleLog = false;
  stopBattleReplay();
  if (state.mode === "hotseat") {
    state.privacyGate = {
      title: "玩家 A 选择出战",
      body: "玩家 B 请闭眼。确认后玩家 A 选择本局上场伙伴。",
      action: "start-battle-pick-player",
    };
  }
  renderBattlePage();
}

function selectBattlePet(id, side = "player") {
  if (!state.battlePickMode || state.result?.winner) return;
  const pickSide = state.mode === "hotseat" ? state.pendingPickSide : "player";
  if (side !== pickSide) return;
  const list = side === "enemy" ? availableEnemyTeam() : availablePlayerTeam();
  if (!list.some((pet) => pet.id === id)) return;
  if (side === "enemy") state.pendingEnemyId = id;
  else state.pendingPlayerId = id;
  state.pendingInspectSide = side;
  state.pendingInspectId = id;
  renderBattlePage();
}

function inspectBattlePet(side, id) {
  if (!state.battlePickMode) return;
  const list = side === "enemy" ? state.enemyTeam : state.playerTeam;
  if (!list.some((pet) => pet.id === id)) return;
  state.pendingInspectSide = side;
  state.pendingInspectId = id;
  renderBattlePage();
}

function startSelectedBattleMatch() {
  if (isKofMode()) {
    startSelectedKofMatch();
    return;
  }

  if (!state.battlePickMode || state.result?.winner || !state.pendingPlayerId) return;

  if (state.mode === "hotseat" && state.pendingPickSide === "player") {
    state.pendingPickSide = "enemy";
    state.pendingInspectSide = null;
    state.pendingInspectId = null;
    state.privacyGate = {
      title: "玩家 B 选择出战",
      body: "玩家 A 请闭眼。确认后玩家 B 选择本局上场伙伴。",
      action: "start-battle-pick-enemy",
    };
    renderBattlePage();
    return;
  }

  if (state.mode === "hotseat" && !state.pendingEnemyId) return;

  state.selectedId = state.pendingPlayerId;
  const player = availablePlayerTeam().find((pet) => pet.id === state.pendingPlayerId);
  const enemies = availableEnemyTeam();
  const enemy = state.mode === "hotseat"
    ? enemies.find((pet) => pet.id === state.pendingEnemyId)
    : enemies.length ? pick(enemies) : null;
  if (!player || !enemy) return;

  const startIndex = state.result.events.length;
  appendBattleMatch(player, enemy);
  state.battlePickMode = false;
  state.pendingPlayerId = null;
  state.pendingEnemyId = null;
  state.pendingPickSide = "player";
  state.replayIndex = startIndex;
  renderBattlePage();
  startBattleReplay();
}

function startSelectedKofMatch() {
  if (!state.battlePickMode || state.result?.winner) return;

  const currentPlayer = currentKofPet("player");
  const currentEnemy = currentKofPet("enemy");
  const needsPlayer = !currentPlayer;
  const needsEnemy = !currentEnemy;

  if (needsPlayer && !state.pendingPlayerId) return;

  if (state.mode === "hotseat" && state.pendingPickSide === "player" && needsEnemy) {
    state.pendingPickSide = "enemy";
    state.pendingInspectSide = null;
    state.pendingInspectId = null;
    state.privacyGate = {
      title: "玩家 B 选择出战",
      body: "玩家 A 请闭眼。确认后玩家 B 选择本战上场伙伴。",
      action: "start-battle-pick-enemy",
    };
    renderBattlePage();
    return;
  }

  if (state.mode === "hotseat" && needsEnemy && !state.pendingEnemyId) return;

  const player = currentPlayer || availablePlayerTeam().find((pet) => pet.id === state.pendingPlayerId);
  const enemies = availableEnemyTeam();
  const enemy = currentEnemy || (state.mode === "hotseat"
    ? enemies.find((pet) => pet.id === state.pendingEnemyId)
    : enemies.length ? pick(enemies) : null);
  if (!player || !enemy) return;

  const startIndex = state.result.events.length;
  appendBattleMatch(player, enemy);
  state.battlePickMode = false;
  state.pendingPlayerId = null;
  state.pendingEnemyId = null;
  state.pendingPickSide = "player";
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
    currentPlayerId: null,
    currentEnemyId: null,
    currentPlayerHp: null,
    currentEnemyHp: null,
    playerDefeatedIds: [],
    enemyDefeatedIds: [],
    winner: null,
  };
}

function availablePlayerTeam() {
  if (isKofMode()) {
    const defeatedIds = new Set(state.result?.playerDefeatedIds || []);
    const currentId = state.result?.currentPlayerId;
    return state.playerTeam.filter((pet) => !defeatedIds.has(pet.id) && pet.id !== currentId);
  }

  const usedIds = new Set(state.result?.matches.map((match) => match.player.id) || []);
  return state.playerTeam.filter((pet) => !usedIds.has(pet.id));
}

function availableEnemyTeam() {
  if (isKofMode()) {
    const defeatedIds = new Set(state.result?.enemyDefeatedIds || []);
    const currentId = state.result?.currentEnemyId;
    return state.enemyTeam.filter((pet) => !defeatedIds.has(pet.id) && pet.id !== currentId);
  }

  const usedIds = new Set(state.result?.matches.map((match) => match.enemy.id) || []);
  return state.enemyTeam.filter((pet) => !usedIds.has(pet.id));
}

function isKofMode() {
  return state.battleMode === "brawl";
}

function isPracticeMode() {
  return state.battleMode === "practice";
}

function currentKofPet(side) {
  if (!isKofMode() || !state.result) return null;
  const id = side === "player" ? state.result.currentPlayerId : state.result.currentEnemyId;
  const team = side === "player" ? state.playerTeam : state.enemyTeam;
  return team.find((pet) => pet.id === id) || null;
}

function currentKofHp(side, pet) {
  if (!isKofMode() || !state.result || !pet) return pet?.stats.hp || 0;
  const currentId = side === "player" ? state.result.currentPlayerId : state.result.currentEnemyId;
  if (currentId !== pet.id) return pet.stats.hp;
  const hp = side === "player" ? state.result.currentPlayerHp : state.result.currentEnemyHp;
  return Number.isFinite(hp) ? hp : pet.stats.hp;
}

function appendBattleMatch(player, enemy) {
  const result = state.result || createBattleSession();
  const matchIndex = result.matches.length;
  const match = simulateBattle(player, enemy, matchIndex, result.playerWins, result.enemyWins, {
    playerHp: isKofMode() ? currentKofHp("player", player) : null,
    enemyHp: isKofMode() ? currentKofHp("enemy", enemy) : null,
  });

  result.matches.push(match);
  result.log.push(...match.log);
  result.events.push(...match.events);

  if (isKofMode()) updateKofResult(result, match);
  else if (match.winner === "player") result.playerWins += 1;
  else result.enemyWins += 1;

  let scoreText = isKofMode()
    ? `KOF3 擂台：玩家击败 ${result.playerWins}/3，对方击败 ${result.enemyWins}/3。`
    : `BO3 当前比分：玩家 ${result.playerWins} - ${result.enemyWins} 电脑。`;
  if (isPracticeMode()) scoreText = `练习 BO1：${match.winner === "player" ? "我方" : "对方"}赢下本局。`;
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
    playerEffects: match.playerEffects,
    enemyEffects: match.enemyEffects,
    playerStats: match.playerStats,
    enemyStats: match.enemyStats,
    matchWinner: match.winner,
    playerWins: result.playerWins,
    enemyWins: result.enemyWins,
  });

  result.player = match.player;
  result.enemy = match.enemy;
  if (isPracticeMode()) result.winner = match.winner;
  if (!isKofMode() && result.playerWins >= 2) result.winner = "player";
  if (!isKofMode() && result.enemyWins >= 2) result.winner = "enemy";
  state.result = result;
}

function updateKofResult(result, match) {
  if (match.winner === "player") {
    result.enemyDefeatedIds = [...new Set([...result.enemyDefeatedIds, match.enemy.id])];
    result.currentPlayerId = match.player.id;
    result.currentPlayerHp = match.playerHp;
    result.currentEnemyId = null;
    result.currentEnemyHp = null;
  } else {
    result.playerDefeatedIds = [...new Set([...result.playerDefeatedIds, match.player.id])];
    result.currentPlayerId = null;
    result.currentPlayerHp = null;
    result.currentEnemyId = match.enemy.id;
    result.currentEnemyHp = match.enemyHp;
  }

  result.playerWins = result.enemyDefeatedIds.length;
  result.enemyWins = result.playerDefeatedIds.length;
  if (result.enemyDefeatedIds.length >= state.enemyTeam.length) result.winner = "player";
  if (result.playerDefeatedIds.length >= state.playerTeam.length) result.winner = "enemy";
}

function simulateBattle(playerPet, enemyPet, matchIndex, playerWins, enemyWins, initialHp = {}) {
  const player = createCombatant(playerPet, state.playerSkills, "player");
  const enemy = createCombatant(enemyPet, state.enemySkills, "enemy");
  if (Number.isFinite(initialHp.playerHp)) player.hp = Math.max(1, Math.min(player.maxHp, initialHp.playerHp));
  if (Number.isFinite(initialHp.enemyHp)) enemy.hp = Math.max(1, Math.min(enemy.maxHp, initialHp.enemyHp));
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
    recordEvent(ctx, `${isKofMode() ? "KOF3" : "BO3"} 第 ${matchIndex + 1} ${isKofMode() ? "战" : "局"}，第 ${round} 回合。`, { type: "round", round });
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
  recordEvent(ctx, winner === "player" ? "玩家赢下这一战。" : "电脑赢下这一战。", { type: "win", winner });

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
    playerEffects: combatEffects(player),
    enemyEffects: combatEffects(enemy),
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
      description: "剩余可降低攻击伤害次数",
    });
  }
  return statuses;
}

function combatEffects(combatant) {
  const effects = [];
  if (combatant.poisonTurns > 0) effects.push("poison");
  if (combatant.unyieldingActive) effects.push("unyielding");
  return effects;
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
    playerEffects: combatEffects(ctx.player),
    enemyEffects: combatEffects(ctx.enemy),
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

  let parryReduction = 0;
  let parrySkill = null;
  if (defender.parryLeft > 0) {
    defender.parryLeft -= 1;
    parrySkill = hasSkill(defender, "parry");
    parryReduction = parrySkill.tier === "high" ? 0.65 : 0.75;
    triggerSkill(ctx, defender, `-${parrySkill.name}`, `${attacker.name} 攻击，${defender.name} 触发招架，本次伤害降低 ${Math.round(parryReduction * 100)}%。`, {
      attackAnimationSide: attacker.side,
      parried: true,
      parryReductionPercent: Math.round(parryReduction * 100),
      targetSide: defender.side,
    });
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
  const preParryDamage = damage;
  if (parryReduction > 0) damage = Math.max(1, Math.round(damage * (1 - parryReduction)));
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
    effectName: parryReduction > 0 ? "parry" : config.isComboAttack ? "combo" : isCrit ? "crit" : "attack",
    effectSide: defender.side,
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
      preParryDamage,
      parryReductionPercent: Math.round(parryReduction * 100),
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

