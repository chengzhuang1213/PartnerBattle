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
  const usedPlayerIds = new Set(state.result?.matches.map((match) => match.player.id) || []);
  const usedEnemyIds = new Set(state.result?.matches.map((match) => match.enemy.id) || []);
  const pendingPlayer = state.playerTeam.find((pet) => pet.id === state.pendingPlayerId);

  app.innerHTML = `
    <section class="combat-screen battle-prep-screen is-pick-mode">
      ${combatHeader(playerWins, enemyWins, matchIndex)}
      <main class="combat-main battle-prep-main">
        ${teamDock(null, usedPlayerIds, usedEnemyIds, true)}
        <section class="battle-prep-panel">
          <div class="battle-prep-detail ${pendingPlayer ? "has-pending" : ""}">
            ${pendingPlayer ? battlePrepCard(pendingPlayer, state.playerSkills) : `<div class="battle-prep-empty">选择 1 位我方伙伴上场</div>`}
          </div>
          <div class="battle-prep-opponent">
            <strong>对方随机待命</strong>
            <span>确认选择后进入战斗页面</span>
          </div>
        </section>
        <div class="battle-prep-confirm">
          <button class="battle-home-button" data-confirm-home type="button">返回首页</button>
          <button class="primary-action continue-button" data-start-match ${pendingPlayer ? "" : "disabled"}>确认选择</button>
        </div>
        ${state.confirmHome ? homeConfirmModal() : ""}
      </main>
    </section>
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
    playerStats: result.matches[0]?.playerStats || result.player.stats,
    enemyStats: result.matches[0]?.enemyStats || result.enemy.stats,
    playerWins: 0,
    enemyWins: 0,
    text: "战斗准备。",
  };
  const replayDone = replayIndex >= events.length - 1;
  const playerDefeated = replayDone && result.winner === "enemy";
  const enemyDefeated = replayDone && result.winner === "player";
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
            ${battleArt(frame.player)}
          </div>
          <div class="fighter enemy-fighter ${fighterState("enemy", frame)}">
            ${battleArt(frame.enemy)}
          </div>
          <div class="center-combat-text">
            <span>${roundText}</span>
          </div>
          ${skillBubble("player", frame)}
          ${skillBubble("enemy", frame)}
          ${damageBubble("player", frame)}
          ${damageBubble("enemy", frame)}
          ${healBubble("player", frame)}
          ${healBubble("enemy", frame)}
        </section>
        <div class="combat-prompt ${replayDone && result.winner ? "ended" : ""}">${battlePromptText(result, frame, replayDone)}</div>
        <div class="battle-control-bar">
          <button class="secondary-action soft-action" data-skip-replay>跳过动画</button>
          <button class="secondary-action soft-action" data-toggle-log>战斗分析</button>
          <button class="primary-action continue-button" data-continue-battle>${result.winner && replayDone ? "重新开始" : replayDone ? "下一步" : "跳到结果"}</button>
        </div>
        ${state.showBattleLog ? battleLogOverlay(visibleEvents) : ""}
      </main>
    </section>
  `;
}

function combatHeader(playerWins, enemyWins, matchIndex) {
  return `
    <header class="combat-scorebar">
      <div class="score-side player-score"><strong>我方</strong><span>胜场：${playerWins}</span></div>
      <div class="round-badge">BO3 第 ${(matchIndex ?? 0) + 1} 局</div>
      <div class="score-side enemy-score"><span>胜场：${enemyWins}</span><strong>对方 (AI)</strong></div>
    </header>
  `;
}

function battlePromptText(result, frame, replayDone) {
  if (!replayDone || !result.winner) return frame.text;
  return result.winner === "player" ? "BO3 战斗胜利！对方失败，本局已结束" : "BO3 战斗结束：我方失败，本局已结束";
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

function combatLogPanel(events) {
  return `
    <section class="combat-log-panel">
      <h2>战斗分析</h2>
      <ol class="combat-log">
        ${events.map(renderBattleLogEntry).join("")}
      </ol>
    </section>
  `;
}

function renderBattleLogEntry(event) {
  return `
    <li>
      <div>${colorBattleLine(event.text || event)}</div>
      ${event.damageBreakdown ? battleDamageAnalysis(event.damageBreakdown) : ""}
    </li>
  `;
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

function teamDock(frame, usedPlayerIds, usedEnemyIds, canPick) {
  return `
    <section class="team-dock">
      <div class="team-mini-list player-list">
        ${state.playerTeam.map((partner) => teamMiniCard(partner, "player", frame, usedPlayerIds, canPick)).join("")}
      </div>
      <div class="vs-badge">VS</div>
      <div class="team-mini-list enemy-list">
        ${state.enemyTeam.map((partner) => teamMiniCard(partner, "enemy", frame, usedEnemyIds, false)).join("")}
      </div>
    </section>
  `;
}

function teamMiniCard(partner, side, frame, usedIds, canPick) {
  const current = side === "player" ? frame?.player?.id === partner.id : frame?.enemy?.id === partner.id;
  const hp = current ? (side === "player" ? frame.playerHp : frame.enemyHp) : partner.stats.hp;
  const hpPercent = Math.max(0, Math.round((hp / partner.stats.hp) * 100));
  const skillList = side === "player" ? state.playerSkills : state.enemySkills;
  const skills = displaySkillOrder(getPetSkills(partner, skillList)).slice(0, 3);
  const used = usedIds.has(partner.id);
  const pickable = canPick && side === "player" && !used;
  return `
    <article class="team-mini-card ${side} ${current ? "active" : ""} ${used ? "used" : ""} ${pickable ? "can-pick" : ""}" ${pickable ? `data-battle-pick="${partner.id}"` : ""}>
      <div class="mini-avatar">${partnerArt(partner)}</div>
      <div class="mini-info">
        ${poolName(partner, "strong")}
        <div class="hp-bar"><span style="width:${hpPercent}%"></span></div>
        <div class="mini-skills">${skills.map((skill) => `<i class="${skill.tier}">${skillIconText(skill)}</i>`).join("")}</div>
      </div>
      <b>${current ? "出战中" : used ? "已上场" : pickable ? "点击上场" : "待命"}</b>
    </article>
  `;
}

function battleLogOverlay(lines) {
  return `
    <div class="battle-log-overlay">
      <div class="battle-log-dialog">
        <button class="log-close-button" data-close-log type="button">关闭</button>
        ${combatLogPanel(lines)}
      </div>
    </div>
  `;
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
  if (frame.attackAnimationSide === side) return "is-attacking";
  if (frame.type === "attack" && frame.actorSide === side) return "is-attacking";
  if (frame.blocked || frame.evaded) return "";
  if (frame.targetSide === side) return "is-hit";
  return "";
}

function skillBubble(side, frame) {
  if (!frame.skillName || (frame.side && frame.side !== side) || (frame.actorSide && frame.actorSide !== side)) return "";
  return `<span class="skill-callout ${side}">${frame.skillName}</span>`;
}

function damageBubble(side, frame) {
  if (frame.type !== "attack" || frame.targetSide !== side || !frame.damage) return "";
  return `<span class="damage-pop ${side}">${frame.critical ? "暴击 " : ""}-${frame.damage}</span>`;
}

function healBubble(side, frame) {
  if (frame.healSide !== side || !frame.heal) return "";
  return `<span class="heal-pop ${side}">+${frame.heal}</span>`;
}

function battlePrepCard(partner, skillList) {
  const skills = displaySkillOrder(getPetSkills(partner, skillList));
  return `
    <article class="battle-prep-card pool-${partner.poolKey}">
      <div class="battle-prep-card-head">
        <div class="combat-avatar">${partnerArt(partner)}</div>
        <div class="battle-prep-card-title">
          ${poolName(partner, "strong")}
          <div class="hp-text"><small>HP</small><b>${partner.stats.hp} / ${partner.stats.hp}</b></div>
          <div class="hp-bar"><span style="width:100%"></span></div>
        </div>
      </div>
      <section class="battle-prep-stat-panel">
        <h3>属性</h3>
        <div class="battle-prep-stats">${statRows(partner)}</div>
      </section>
      <section class="battle-prep-skill-panel">
        <h3>装备技能</h3>
        <div class="battle-prep-skills">
          ${skills.length ? skills.map((skill) => prepSkillDetail(skill)).join("") : `<span class="skill-capsule empty">无技能</span>`}
        </div>
      </section>
    </article>
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
