function renderBattlePage() {
  if (!state.result && !state.battlePickMode) {
    renderGame();
    return;
  }

  if (state.battlePickMode) {
    renderBattlePrepPage();
    return;
  }

  renderBattleReplayPage();
}

function renderBattlePrepPage() {
  const playerWins = state.result?.playerWins || 0;
  const enemyWins = state.result?.enemyWins || 0;
  const matchIndex = state.result?.matches.length || 0;
  const usedPlayerIds = isKofMode() ? new Set(state.result?.playerDefeatedIds || []) : new Set(state.result?.matches.map((match) => match.player.id) || []);
  const usedEnemyIds = isKofMode() ? new Set(state.result?.enemyDefeatedIds || []) : new Set(state.result?.matches.map((match) => match.enemy.id) || []);
  const pendingPlayer = state.playerTeam.find((pet) => pet.id === state.pendingPlayerId);
  const pendingEnemy = state.enemyTeam.find((pet) => pet.id === state.pendingEnemyId);
  const currentPlayer = currentKofPet("player");
  const currentEnemy = currentKofPet("enemy");
  const hotseat = state.mode === "hotseat";
  const pickSide = hotseat ? state.pendingPickSide : "player";
  const shouldShowPendingPlayer = !hotseat || pickSide !== "enemy";
  const inspectedSide = state.pendingInspectSide || (shouldShowPendingPlayer && pendingPlayer ? "player" : null);
  const inspectedPlayer = inspectedSide === "player" ? state.playerTeam.find((pet) => pet.id === state.pendingInspectId) || pendingPlayer || currentPlayer : shouldShowPendingPlayer ? pendingPlayer || currentPlayer : currentPlayer;
  const inspectedEnemy = inspectedSide === "enemy" ? state.enemyTeam.find((pet) => pet.id === state.pendingInspectId) || pendingEnemy || currentEnemy : pendingEnemy || currentEnemy;
  const inspectedPlayerHp = currentKofHp("player", inspectedPlayer);
  const inspectedEnemyHp = currentKofHp("enemy", inspectedEnemy);
  const canStart = isKofMode()
    ? hotseat ? (pickSide === "player" ? Boolean(pendingPlayer || currentPlayer) : Boolean(pendingEnemy || currentEnemy)) : Boolean(pendingPlayer || currentPlayer)
    : hotseat ? (pickSide === "player" ? Boolean(pendingPlayer) : Boolean(pendingEnemy)) : Boolean(pendingPlayer);
  const confirmText = hotseat && pickSide === "player" ? "确认 A 的选择" : hotseat ? "开始比赛" : "确认选择";

  app.innerHTML = `
    <section class="combat-screen battle-prep-screen is-pick-mode">
      ${combatHeader(playerWins, enemyWins, matchIndex)}
      <main class="combat-main battle-prep-main">
        ${teamDock(null, usedPlayerIds, usedEnemyIds, pickSide, true)}
        <section class="battle-prep-panel">
          <div class="battle-prep-detail ${pendingPlayer ? "has-pending" : ""}">
            ${inspectedPlayer ? battlePrepCard(inspectedPlayer, state.playerSkills, hotseat && pickSide === "enemy", inspectedPlayerHp) : battlePrepChoicePanel("player", usedPlayerIds, pickSide === "player", hotseat && pickSide === "enemy")}
          </div>
          <div class="battle-prep-opponent ${inspectedEnemy ? "has-inspect" : ""}">
            ${inspectedEnemy ? battlePrepCard(inspectedEnemy, state.enemySkills, !hotseat || pickSide === "player", inspectedEnemyHp) : battlePrepLockedPanel(hotseat, pickSide)}
          </div>
        </section>
        <div class="battle-prep-confirm">
          <button class="battle-home-button" data-confirm-home type="button">返回首页</button>
          <button class="primary-action continue-button" data-start-match ${canStart ? "" : "disabled"}>${confirmText}</button>
        </div>
        ${state.confirmHome ? homeConfirmModal() : ""}
        ${privacyGateOverlay()}
      </main>
    </section>
  `;
}

function battlePrepChoicePanel(side, usedIds, canPick, hideSkills = false) {
  const title = side === "player" ? "选择 1 位我方伙伴上场" : "选择 1 位对方伙伴上场";
  const hint = canPick ? "从上方候选卡选择本局出场伙伴" : "等待另一位玩家完成选择";
  return `
    <div class="battle-prep-choice-panel ${side}">
      <h2>${title}</h2>
      <p>${hint}</p>
    </div>
  `;
}

function battlePrepLockedPanel(hotseat, pickSide) {
  const title = hotseat ? "玩家 B 待命" : "对方随机待命";
  const hint = hotseat && pickSide === "enemy" ? "请选择玩家 B 的上场伙伴" : "对方技能与出场选择保持隐藏";
  return `
    <div class="battle-prep-lock-panel">
      <span class="lock-mark">?</span>
      <strong>${title}</strong>
      <p>${hint}</p>
    </div>
  `;
}

function renderBattleReplayPage() {
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
    playerStatus: [],
    enemyStatus: [],
    playerEffects: [],
    enemyEffects: [],
    playerStats: result.matches[0]?.playerStats || result.player.stats,
    enemyStats: result.matches[0]?.enemyStats || result.enemy.stats,
    playerWins: 0,
    enemyWins: 0,
    text: "战斗准备。",
  };
  const replayDone = replayIndex >= events.length - 1;
  const frameWinner = frame.matchWinner || frame.winner || result.winner;
  const playerDefeated = replayDone && frameWinner === "enemy";
  const enemyDefeated = replayDone && frameWinner === "player";
  const defeatClass = `${playerDefeated ? "player-defeated" : ""} ${enemyDefeated ? "enemy-defeated" : ""}`.trim();
  const visibleEvents = events.slice(0, Math.max(1, replayIndex + 1));
  const roundText = battleRoundText(events, replayIndex);

  app.innerHTML = `
    <section class="combat-screen battle-replay-screen ${defeatClass}">
      ${combatHeader(frame.playerWins, frame.enemyWins, frame.matchIndex ?? 0)}
      <main class="combat-main battle-replay-main">
        <section class="combat-stage">
          ${battleStatusCard(frame.player, state.playerSkills, "player", frame.playerHp, frame.playerMaxHp, frame.playerStatus, frame.playerStats)}
          ${battleStatusCard(frame.enemy, state.enemySkills, "enemy", frame.enemyHp, frame.enemyMaxHp, frame.enemyStatus, frame.enemyStats)}
          <div class="fighter player-fighter ${fighterState("player", frame)}">
            ${battleArt(frame.player, isFighterAttacking("player", frame))}
            ${persistentEffects("player", frame)}
          </div>
          <div class="fighter enemy-fighter ${fighterState("enemy", frame)}">
            ${battleArt(frame.enemy, isFighterAttacking("enemy", frame))}
            ${persistentEffects("enemy", frame)}
          </div>
          <div class="center-combat-text">
            <span>${roundText}</span>
          </div>
          ${skillBubble("player", frame)}
          ${skillBubble("enemy", frame)}
          ${instantEffect("player", frame)}
          ${instantEffect("enemy", frame)}
          ${damageBubble("player", frame)}
          ${damageBubble("enemy", frame)}
          ${healBubble("player", frame)}
          ${healBubble("enemy", frame)}
        </section>
        <div class="combat-prompt ${replayDone && result.winner ? "ended" : ""}">${battlePromptText(result, frame, replayDone)}</div>
        ${replayDone && result.winner ? finalResultPanel(result) : ""}
        <div class="battle-control-bar">
          <button class="secondary-action soft-action" data-confirm-home type="button">返回主菜单</button>
          <button class="secondary-action soft-action" data-toggle-log>战斗分析</button>
          <button class="primary-action continue-button" data-continue-battle>${result.winner && replayDone ? "再来一局" : replayDone ? "下一步" : "跳到结果"}</button>
        </div>
        ${state.showBattleLog ? battleLogOverlay(visibleEvents) : ""}
        ${state.confirmHome ? homeConfirmModal() : ""}
        ${privacyGateOverlay()}
      </main>
    </section>
  `;
}

function combatHeader(playerWins, enemyWins, matchIndex) {
  const playerLabel = state.mode === "hotseat" ? "玩家 A" : "我方";
  const enemyLabel = state.mode === "hotseat" ? "玩家 B" : "对方 (AI)";
  if (isPracticeMode()) {
    return `
      <header class="combat-scorebar">
        <div class="score-side player-score"><strong>我方</strong><span>练习</span></div>
        <div class="round-badge">BO1</div>
        <div class="score-side enemy-score"><span>练习</span><strong>对方</strong></div>
      </header>
    `;
  }
  if (isKofMode()) {
    return `
      <header class="combat-scorebar">
        <div class="score-side player-score"><strong>${playerLabel}</strong><span>击败：${playerWins}/3</span></div>
        <div class="round-badge">KOF3 第 ${(matchIndex ?? 0) + 1} 战</div>
        <div class="score-side enemy-score"><span>击败：${enemyWins}/3</span><strong>${enemyLabel}</strong></div>
      </header>
    `;
  }

  return `
    <header class="combat-scorebar">
      <div class="score-side player-score"><strong>${playerLabel}</strong><span>胜场：${playerWins}</span></div>
      <div class="round-badge">BO3 第 ${(matchIndex ?? 0) + 1} 局</div>
      <div class="score-side enemy-score"><span>胜场：${enemyWins}</span><strong>${enemyLabel}</strong></div>
    </header>
  `;
}

function battlePromptText(result, frame, replayDone) {
  if (!replayDone || !result.winner) return frame.text;
  const title = battleResultTitle(result);
  if (isPracticeMode()) return result.winner === "player" ? "练习 BO1 胜利！" : "练习 BO1 结束：对方胜利";
  if (isKofMode()) return `${title}！${sideName(result.winner)}赢下 KOF3 擂台。`;
  return `${title}！${sideName(result.winner)}赢下 BO3。`;
}

function battleCenterText(frame) {
  if (frame.type === "round") return `第 ${frame.round ?? "?"} 回合`;
  return "";
}

function battleRoundText(events, replayIndex) {
  for (let index = replayIndex; index >= 0; index -= 1) {
    const event = events[index];
    if (event?.type === "round") return `第 ${event.round ?? "?"} 回合`;
  }
  return "第 1 回合";
}

function completedMatchesByReplay(result, replayIndex) {
  const completedCount = result.events
    .slice(0, replayIndex + 1)
    .filter((event) => event.type === "matchResult")
    .length;
  return result.matches.slice(0, completedCount);
}

function combatLogPanel(events, matchIndexes = [], activeMatchIndex = 0) {
  return `
    <section class="combat-log-panel">
      <div class="combat-log-head">
        <h2>战斗分析</h2>
        ${battleLogTabs(matchIndexes, activeMatchIndex)}
      </div>
      <div class="combat-log-scroll">
        ${battleSummaryPanel(events)}
        <ol class="combat-log">
          ${events.map(renderBattleLogEntry).join("")}
        </ol>
      </div>
    </section>
  `;
}

function battleSummaryPanel(events) {
  if (!events.length) return "";
  const summary = battleSummaryItems(events);
  return `
    <section class="battle-summary-panel">
      <h3>摘要</h3>
      <ul>
        ${summary.map((item) => `<li>${item}</li>`).join("")}
      </ul>
    </section>
  `;
}

function battleSummaryItems(events) {
  const skillCounts = new Map();
  let topDamage = null;
  let winner = "";
  let crits = 0;
  let combos = 0;
  let poisons = 0;
  let revives = 0;
  let counters = 0;
  let reflects = 0;
  let blocks = 0;

  for (const event of events) {
    if (event.type === "skill" && event.skillName && !event.skillName.startsWith("-")) {
      skillCounts.set(event.skillName, (skillCounts.get(event.skillName) || 0) + 1);
    }
    if (event.type === "attack" && (!topDamage || event.damage > topDamage.damage)) topDamage = event;
    if (event.critical) crits += 1;
    if (event.effectName === "combo") combos += 1;
    if (event.effectName === "poison" || event.skillName === "中毒") poisons += 1;
    if (event.skillName?.includes("复生")) revives += 1;
    if (event.effectName === "counter" || event.skillName?.includes("反击")) counters += 1;
    if (event.effectName === "reflect" || event.skillName?.includes("反震")) reflects += 1;
    if (event.blocked || event.evaded || event.skillName?.includes("招架") || event.skillName?.includes("闪躲")) blocks += 1;
    if (event.winner || event.matchWinner) winner = sideName(event.winner || event.matchWinner);
  }

  const topSkills = [...skillCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, count]) => `${name} x${count}`);
  const reasons = [
    crits ? `暴击 ${crits} 次` : "",
    combos ? `连击 ${combos} 次` : "",
    poisons ? `毒/中毒 ${poisons} 次` : "",
    revives ? `复活 ${revives} 次` : "",
    counters || reflects ? `防反 ${counters + reflects} 次` : "",
    blocks ? `闪躲/招架 ${blocks} 次` : "",
  ].filter(Boolean);

  return [
    topSkills.length ? `关键技能：${topSkills.join("，")}` : "关键技能：本局主要由普通攻击和属性差决定。",
    topDamage ? `最高单次伤害：${sideName(topDamage.actorSide)}造成 ${topDamage.damage} 点${topDamage.critical ? "，来自暴击" : ""}。` : "最高单次伤害：暂无攻击事件。",
    reasons.length ? `主要影响：${reasons.join("，")}。` : "主要影响：没有明显的暴击、连击、毒、复活或防反事件。",
    winner ? `结果判断：${winner}赢下这一局。` : "结果判断：本局仍在回放中。",
  ];
}

function sideName(side) {
  if (side === "player") return state.mode === "hotseat" ? "玩家 A" : "我方";
  if (side === "enemy") return state.mode === "hotseat" ? "玩家 B" : "对方";
  return "";
}

function battleLogTabs(matchIndexes, activeMatchIndex) {
  return `
    <div class="battle-log-tabs" role="tablist" aria-label="战斗场次">
      ${matchIndexes
        .map((matchIndex) => `<button class="${matchIndex === activeMatchIndex ? "active" : ""}" data-battle-log-match="${matchIndex}" type="button" role="tab" aria-selected="${matchIndex === activeMatchIndex}">第 ${matchIndex + 1} 场</button>`)
        .join("")}
    </div>
  `;
}

function renderBattleLogEntry(event) {
  const actionSide = battleLogActionSide(event);
  return `
    <li class="${actionSide ? `${actionSide}-action` : ""}">
      <div>${colorBattleLine(event.text || event)}</div>
      ${event.damageBreakdown ? battleDamageAnalysis(event.damageBreakdown) : ""}
    </li>
  `;
}

function battleLogActionSide(event) {
  if (event.type === "round" || event.type === "summary") return "";
  if (event.actorSide) return event.actorSide;
  if (event.side) return event.side;
  if (event.matchWinner) return event.matchWinner === "player" ? "player" : "enemy";
  if (event.winner) return event.winner === "player" ? "player" : "enemy";
  return "";
}

function battleDamageAnalysis(detail) {
  return `
    <div class="battle-damage-analysis">
      <span>攻击 ${detail.attack}</span>
      <span>防御 ${detail.defense}${detail.ignoredDefense ? `，偷袭无视 ${detail.ignoredDefensePercent}% 后按 ${detail.targetDefense} 计算` : ""}</span>
      <span>基础：max(${detail.minimumDamage}, round(${detail.attack} * 1.2 - ${detail.targetDefense} * 0.9 ${formatSignedNumber(detail.randomRoll)})) = ${detail.baseDamage}</span>
      ${luckyDamageLine(detail)}
      <span>暴击倍率 ${formatMultiplier(detail.critMultiplier)}，最终 max(${detail.minimumDamage}, 暴击后伤害) = ${detail.finalDamage}</span>
    </div>
  `;
}

function luckyDamageLine(detail) {
  if (!detail.luckySkillName || !detail.luckyDamageRatePercent) return "";
  return `<span>${detail.luckySkillName}：暴击总伤害只承受 ${detail.luckyDamageRatePercent}%，暴击倍率 2 → ${formatMultiplier(detail.critMultiplier)}</span>`;
}

function formatMultiplier(value) {
  if (Number.isInteger(value)) return String(value);
  return Number(value.toFixed(2)).toString();
}

function formatSignedNumber(value) {
  return value >= 0 ? `+ ${value}` : `- ${Math.abs(value)}`;
}

function teamDock(frame, usedPlayerIds, usedEnemyIds, canPickSide, hideEnemySkills = false) {
  return `
    <section class="team-dock">
      <div class="team-mini-list player-list">
        ${state.playerTeam.map((partner) => teamMiniCard(partner, "player", frame, usedPlayerIds, canPickSide === "player", state.mode === "hotseat" && canPickSide === "enemy")).join("")}
      </div>
      <div class="vs-badge">VS</div>
      <div class="team-mini-list enemy-list">
        ${state.enemyTeam.map((partner) => teamMiniCard(partner, "enemy", frame, usedEnemyIds, state.mode === "hotseat" && canPickSide === "enemy", hideEnemySkills && canPickSide !== "enemy")).join("")}
      </div>
    </section>
  `;
}

function teamMiniCard(partner, side, frame, usedIds, canPick, hideSkills = false) {
  const current = frame
    ? side === "player" ? frame.player?.id === partner.id : frame.enemy?.id === partner.id
    : isKofMode() && (side === "player" ? state.result?.currentPlayerId === partner.id : state.result?.currentEnemyId === partner.id);
  const hp = current && frame ? (side === "player" ? frame.playerHp : frame.enemyHp) : currentKofHp(side, partner);
  const hpPercent = Math.max(0, Math.round((hp / partner.stats.hp) * 100));
  const skillList = side === "player" ? state.playerSkills : state.enemySkills;
  const skills = hideSkills ? [] : displaySkillOrder(getPetSkills(partner, skillList)).slice(0, 3);
  const used = usedIds.has(partner.id);
  const pickable = canPick && !used && !current;
  const inspectable = hideSkills || (state.mode === "hotseat" && !pickable);
  const inspecting = state.pendingInspectSide === side && state.pendingInspectId === partner.id;
  const orderText = battleOrderText(partner, side);
  return `
    <article class="team-mini-card ${side} ${current ? "active" : ""} ${used ? "used" : ""} ${pickable ? "can-pick" : ""} ${inspectable ? "can-inspect" : ""} ${inspecting ? "inspecting" : ""}" ${pickable ? `data-battle-pick="${partner.id}" data-battle-pick-side="${side}"` : ""} ${inspectable ? `data-battle-inspect="${partner.id}" data-battle-inspect-side="${side}"` : ""}>
      <span class="battle-order-badge">${orderText}</span>
      <div class="mini-avatar">${partnerArt(partner)}</div>
      <div class="mini-info">
        ${poolName(partner, "strong")}
        <div class="hp-bar"><span style="width:${hpPercent}%"></span></div>
        ${hideSkills ? `<div class="mini-skills hidden-skills">???</div>` : `<div class="mini-skills">${skills.map((skill) => `<i class="${skill.tier}">${skillIconText(skill)}</i>`).join("")}</div>`}
      </div>
      <b>${current ? "守擂中" : used ? "已败" : pickable ? "点击上场" : "待命"}</b>
    </article>
  `;
}

function battleOrderText(partner, side) {
  const matches = state.result?.matches || [];
  const matchIndex = matches.findIndex((match) => side === "player" ? match.player.id === partner.id : match.enemy.id === partner.id);
  if (matchIndex >= 0) return String(matchIndex + 1);
  const pendingId = side === "player" ? state.pendingPlayerId : state.pendingEnemyId;
  if (pendingId === partner.id) return String(matches.length + 1);
  const team = side === "player" ? state.playerTeam : state.enemyTeam;
  return String(team.findIndex((item) => item.id === partner.id) + 1);
}

function battleLogOverlay(lines) {
  const matchIndexes = [...new Set(lines.map((line) => line.matchIndex).filter(Number.isInteger))];
  const fallbackMatchIndex = matchIndexes[matchIndexes.length - 1] ?? 0;
  const activeMatchIndex = matchIndexes.includes(state.battleLogMatchIndex) ? state.battleLogMatchIndex : fallbackMatchIndex;
  const activeLines = lines.filter((line) => line.matchIndex === activeMatchIndex);
  return `
    <div class="battle-log-overlay">
      <div class="battle-log-dialog">
        <button class="log-close-button" data-close-log type="button">关闭</button>
        ${combatLogPanel(activeLines, matchIndexes, activeMatchIndex)}
      </div>
    </div>
  `;
}

function matchReviewPanel(result) {
  if (!result.matches.length) return "";
  const labels = ["第 1 局", "第 2 局", "第 3 局"];
  return `
    <section class="match-review-panel">
      <h2>本场复盘</h2>
      <div class="match-review-grid">
        ${result.matches.map((match, index) => `
          <article class="match-review-card ${match.winner}">
            <strong>${labels[index] || `第 ${index + 1} 局`}</strong>
            <span>${match.player.name} vs ${match.enemy.name}</span>
            <b>${sideName(match.winner)}胜</b>
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function finalResultPanel(result) {
  if (!result.matches.length) return "";
  const won = result.winner === "player";
  const winnerText = sideName(result.winner);
  const resultTitle = battleResultTitle(result);
  const scoreText = isPracticeMode()
    ? "BO1"
    : isKofMode()
      ? `${result.playerWins} - ${result.enemyWins}`
      : `${result.playerWins} - ${result.enemyWins}`;
  const mvp = battleMvp(result);
  const topDamage = battleTopDamage(result.events);
  const keySkills = battleKeySkills(result.events);

  return `
    <section class="final-result-panel ${won ? "victory" : "defeat"}">
      <div class="final-result-hero">
        <span>${resultTitle}</span>
        <h2>${winnerText}赢下本场</h2>
        <p>${isKofMode() ? "KOF3 最终比分" : isPracticeMode() ? "练习模式结束" : "BO3 最终比分"} · ${scoreText}</p>
      </div>
      <div class="final-result-highlights">
        <article>
          <small>MVP</small>
          <strong>${mvp ? mvp.name : "暂无"}</strong>
          <span>${mvp ? `${sideName(mvp.side)} · ${mvp.wins} 胜` : "没有完成对局"}</span>
        </article>
        <article>
          <small>最高伤害</small>
          <strong>${topDamage ? `${topDamage.damage}` : "0"}</strong>
          <span>${topDamage ? `${sideName(topDamage.actorSide)}单次打出` : "暂无攻击事件"}</span>
        </article>
        <article>
          <small>关键技能</small>
          <strong>${keySkills.length ? keySkills[0].name : "普通攻击"}</strong>
          <span>${keySkills.length ? keySkills.map((skill) => `${skill.name} x${skill.count}`).join(" / ") : "本场主要由属性与普攻决定"}</span>
        </article>
      </div>
      ${matchReviewPanel(result)}
    </section>
  `;
}

function battleResultTitle(result) {
  if (isPracticeMode()) return result.winner === "player" ? "练习胜利" : "练习落败";
  if (isKofMode()) return kofResultTitle(result);

  const playerWins = result.playerWins || 0;
  const enemyWins = result.enemyWins || 0;
  if (playerWins === 2 && enemyWins === 0) return "完胜";
  if (playerWins === 2 && enemyWins === 1) return "险胜";
  if (playerWins === 1 && enemyWins === 2) return "惜败";
  if (playerWins === 0 && enemyWins === 2) return "完败";
  return result.winner === "player" ? "胜利" : "落败";
}

function kofResultTitle(result) {
  const winnerWins = result.winner === "player" ? result.playerWins : result.enemyWins;
  const loserWins = result.winner === "player" ? result.enemyWins : result.playerWins;
  const mvp = battleMvp(result);

  if (winnerWins === 3 && loserWins === 0 && mvp?.side === result.winner && mvp.wins === 3) return "一穿三";
  if (winnerWins === 3 && loserWins === 2 && kofWasDownZeroTwo(result)) return result.winner === "player" ? "让二追三" : "被让二追三";
  if (winnerWins === 3 && loserWins === 0) return result.winner === "player" ? "完封" : "被完封";
  if (winnerWins === 3 && loserWins === 2) return result.winner === "player" ? "极限险胜" : "极限惜败";
  if (result.winner === "player") return "擂台胜利";
  return "擂台落败";
}

function kofWasDownZeroTwo(result) {
  if (!isKofMode() || result.matches.length < 5) return false;
  const firstTwo = result.matches.slice(0, 2);
  return firstTwo.every((match) => match.winner !== result.winner);
}

function battleMvp(result) {
  const records = new Map();
  for (const match of result.matches) {
    const winnerPet = match.winner === "player" ? match.player : match.enemy;
    const key = `${match.winner}:${winnerPet.id}`;
    const current = records.get(key) || { side: match.winner, name: winnerPet.name, wins: 0, hpLeft: 0 };
    current.wins += 1;
    current.hpLeft += match.winner === "player" ? match.playerHp : match.enemyHp;
    records.set(key, current);
  }

  return [...records.values()].sort((a, b) => b.wins - a.wins || b.hpLeft - a.hpLeft)[0] || null;
}

function battleTopDamage(events) {
  return events.filter((event) => event.type === "attack").sort((a, b) => b.damage - a.damage)[0] || null;
}

function battleKeySkills(events) {
  const counts = new Map();
  for (const event of events) {
    if (event.type !== "skill" || !event.skillName || event.skillName.startsWith("-")) continue;
    counts.set(event.skillName, (counts.get(event.skillName) || 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);
}

function startBattleReplay() {
  stopBattleReplay();
  if (!state.result) return;
  if (state.replayIndex >= state.result.events.length - 1) return;

  const frame = state.result.events[state.replayIndex];
  const delay = frame?.type === "attack" ? 1200 : frame?.type === "skill" || frame?.type === "statChange" ? 990 : 730;
  replayTimer = setTimeout(() => {
    state.replayIndex += 1;
    renderBattlePage();
    startBattleReplay();
  }, delay);
}

function fighterState(side, frame) {
  if (isFighterAttacking(side, frame)) return "is-attacking";
  if (frame.blocked || frame.evaded) return "";
  if (frame.targetSide === side) return "is-hit";
  return "";
}

function isFighterAttacking(side, frame) {
  return frame.attackAnimationSide === side || (frame.type === "attack" && frame.actorSide === side);
}

function skillBubble(side, frame) {
  if (!frame.skillName || (frame.side && frame.side !== side) || (frame.actorSide && frame.actorSide !== side)) return "";
  return `<span class="skill-callout ${side}">${frame.skillName}</span>`;
}

function instantEffect(side, frame) {
  if (!frame.effectName || frame.effectSide !== side) return "";
  const src = {
    poison: "assets/effects/poison-burst.png",
    unyielding: "assets/effects/unyielding-burst.png",
    attack: "assets/effects/attack-slash.png",
    crit: "assets/effects/crit-slash.png",
    combo: "assets/effects/combo-slash.png",
    counter: "assets/effects/attack-slash.png",
    reflect: "assets/effects/crit-slash.png",
  }[frame.effectName];
  if (!src) return "";
  return `<img class="instant-effect ${frame.effectName} ${side}" src="${src}" alt="" aria-hidden="true" />`;
}

function persistentEffects(side, frame) {
  const effects = side === "player" ? frame.playerEffects || [] : frame.enemyEffects || [];
  const sources = {
    poison: "assets/effects/poison-aura.png",
    unyielding: "assets/effects/unyielding-aura.png",
  };
  return effects
    .map((effect) => {
      const src = sources[effect];
      return src ? `<img class="persistent-effect ${effect}" src="${src}" alt="" aria-hidden="true" />` : "";
    })
    .join("");
}

function damageBubble(side, frame) {
  if (frame.targetSide !== side || !frame.damage) return "";
  return `<span class="damage-pop ${side}">${frame.critical ? "暴击 " : ""}-${frame.damage}</span>`;
}

function healBubble(side, frame) {
  if (frame.healSide !== side || !frame.heal) return "";
  return `<span class="heal-pop ${side}">+${frame.heal}</span>`;
}

function battlePrepCard(partner, skillList, hideSkills = false, hp = null) {
  const skills = hideSkills ? [] : displaySkillOrder(getPetSkills(partner, skillList));
  const currentHp = Number.isFinite(hp) ? hp : partner.stats.hp;
  const hpPercent = Math.max(0, Math.min(100, Math.round((currentHp / partner.stats.hp) * 100)));
  const cardClass = state.battleMode === "competitive" ? partnerThemeClass(partner) : `pool-${partner.poolKey}`;
  return `
    <article class="battle-prep-card ${cardClass}">
      <div class="battle-prep-card-head">
        <div class="combat-avatar">${partnerArt(partner)}</div>
        <div class="battle-prep-card-title">
          ${poolName(partner, "strong")}
          <div class="hp-text"><small>HP</small><b>${currentHp} / ${partner.stats.hp}</b></div>
          <div class="hp-bar"><span style="width:${hpPercent}%"></span></div>
        </div>
      </div>
      <section class="battle-prep-stat-panel">
        <h3>属性</h3>
        <div class="battle-prep-stats">${statRows(partner)}</div>
      </section>
      <section class="battle-prep-skill-panel">
        <h3>${hideSkills ? "装备技能（未知）" : "装备技能"}</h3>
        <div class="battle-prep-skills">
          ${hideSkills ? hiddenSkillDetail() : skills.length ? skills.map((skill) => prepSkillDetail(skill)).join("") : `<span class="skill-capsule empty">无技能</span>`}
        </div>
      </section>
    </article>
  `;
}

function hiddenSkillDetail() {
  return `
    <div class="battle-prep-skill hidden">
      <i>?</i>
      <div>
        <strong>技能未知</strong>
        <span>对方技能将在进入正式战斗后公开。</span>
      </div>
    </div>
    <div class="battle-prep-ai-note">
      AI 会随机选择出战伙伴
    </div>
  `;
}

function prepSkillDetail(skill) {
  return `
    <div class="battle-prep-skill ${skill.tier}">
      <i>${skillIconText(skill)}</i>
      <div>
        <strong>${skill.name}</strong>
        <span>${skill.description}</span>
      </div>
    </div>
  `;
}

function battleStatusCard(partner, skillList, side, hp, maxHpValue, statuses = [], combatStats = null) {
  const hpPercent = Math.max(0, Math.min(100, Math.round((hp / maxHpValue) * 100)));
  return `
    <article class="combat-status-card ${side}">
      <div class="combat-card-head">
        <div class="combat-avatar">${partnerArt(partner)}</div>
        <div class="combat-title-block">
          ${poolName(partner, "strong")}
        </div>
      </div>
      <div class="combat-hp-section">
        <div class="hp-text"><small>HP</small><b>${hp} / ${maxHpValue}</b></div>
        <div class="hp-bar"><span style="width:${hpPercent}%"></span></div>
      </div>
      <div class="combat-stat-grid">${battleStatRows(partner, combatStats)}</div>
      <div class="combat-skill-block">${skillCapsules(partner, skillList)}</div>
      ${statusTray(statuses)}
    </article>
  `;
}

function battleStatRows(partner, combatStats) {
  return ["hp", "atk", "def", "spd"]
    .map((key) => {
      const baseValue = partner.stats[key];
      const currentValue = key === "hp" ? baseValue : combatStats?.[key] ?? baseValue;
      return `
        <div class="stat-row ${key}">
          <span>${statIcon(key)} ${statLabel(key)}</span>
          <strong>${battleStatValue(baseValue, currentValue, key)}</strong>
        </div>
      `;
    })
    .join("");
}

function battleStatValue(baseValue, currentValue, key) {
  if (key === "hp" || currentValue === baseValue) return currentValue;
  const delta = currentValue - baseValue;
  const sign = delta > 0 ? "+" : "";
  return `<span class="stat-formula">${baseValue}${sign}${delta}=<b>${currentValue}</b></span>`;
}

function skillCapsules(partner, skillList) {
  const skills = displaySkillOrder(getPetSkills(partner, skillList));
  if (!skills.length) return `<span class="skill-capsule empty">无技能</span>`;

  return skills
    .map((skill) => `<span class="skill-capsule ${skill.tier}" data-tooltip="${skillTooltipText(skill)}">${skill.name}</span>`)
    .join("");
}

function statusTray(statuses = []) {
  if (!statuses.length) return "";
  return `<div class="combat-status-effects">${statuses.map(statusCapsule).join("")}</div>`;
}

function statusCapsule(status) {
  return `<span class="status-capsule ${status.type}" data-tooltip="${status.description}"><b>${status.name}</b><em>${status.value}</em></span>`;
}

function colorBattleLine(line) {
  return line
    .replaceAll("玩家", "<b class=\"pink-word\">玩家</b>")
    .replaceAll("电脑", "<b class=\"blue-word\">电脑</b>")
    .replaceAll("暴击", "<b class=\"red-word\">暴击</b>")
    .replaceAll("攻击", "<b class=\"orange-word\">攻击</b>")
    .replaceAll("触发", "<b class=\"orange-word\">触发</b>")
    .replaceAll("伤害", "<b class=\"red-word\">伤害</b>")
    .replaceAll("免疫", "<b class=\"green-word\">免疫</b>")
    .replaceAll("恢复", "<b class=\"green-word\">恢复</b>");
}
