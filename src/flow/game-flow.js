function startGame() {
  renderBattleModeSelect("solo");
}

function startHotseatGame() {
  renderBattleModeSelect("hotseat");
}

function startPracticeMode() {
  startPracticeGame();
}

function renderBattleModeSelect(playMode) {
  stopBattleReplay();
  state.modeSelectPlayMode = playMode;
  const modeText = playMode === "hotseat" ? "双人同屏" : "AI 对战";
  app.innerHTML = `
    <section class="start-screen mode-choice-screen">
      <header class="start-title">
        <div class="sparkle-row" aria-hidden="true">
          <span>✦</span>
          <span>✧</span>
          <span>✦</span>
        </div>
        <h1>${modeText}</h1>
        <p>选择本局规则</p>
      </header>

      <main class="mode-select battle-mode-select">
        <button class="mode-card competitive" data-battle-mode="competitive" type="button">
          <span class="mode-icon">◆</span>
          <strong>竞技模式</strong>
          <small>选择角色 · 固定属性</small>
        </button>
        <button class="mode-card brawl" data-battle-mode="brawl" type="button">
          <span class="mode-icon">●</span>
          <strong>乱斗模式</strong>
          <small>KOF3 擂台赛</small>
        </button>
      </main>

      <footer class="start-menu">
        <button class="menu-button" data-mode-back type="button">
          <span>↩</span>
          返回
        </button>
      </footer>
    </section>
  `;
}

function startBattleMode(battleMode) {
  const playMode = state.modeSelectPlayMode || "solo";
  startRandomBuild(playMode, battleMode);
}

function startRandomBuild(mode, battleMode = "brawl") {
  state = battleMode === "competitive" ? createCompetitiveInitialState(mode) : createInitialState(mode);
  if (mode === "hotseat") {
    state.privacyGate = {
      title: "玩家 A 开始 Build",
      body: "玩家 B 请闭眼。确认后屏幕亮起，玩家 A 进行技能分配。",
      action: "start-build-a",
    };
  }
  renderGame();
}

function startRosterSelect(mode, battleMode = "brawl") {
  stopBattleReplay();
  state = {
    playerTeam: [],
    enemyTeam: [],
    playerSkills: [],
    enemySkills: [],
    mode,
    battleMode,
    modeSelectPlayMode: null,
    rosterSelectMode: true,
    rosterCandidates: ROSTER_AVATARS,
    selectedAvatarIds: [],
    buildSide: "player",
    selectedSkillId: null,
    selectedId: null,
    pendingPlayerId: null,
    pendingEnemyId: null,
    pendingPickSide: "player",
    pendingInspectSide: null,
    pendingInspectId: null,
    battlePickMode: false,
    enemyOrder: [],
    result: null,
    replayIndex: 0,
    showBattleLog: false,
    battleLogMatchIndex: null,
    showRules: false,
    equipWarning: null,
    confirmHome: false,
    confirmBuild: false,
    privacyGate: null,
  };
  renderRosterSelect();
}

function confirmRosterSelect() {
  if (!state.rosterSelectMode || state.selectedAvatarIds.length !== POOL_KEYS.length) return;
  const selected = state.selectedAvatarIds
    .map((id) => state.rosterCandidates.find((avatar) => avatar.id === id))
    .filter(Boolean);
  const mode = state.mode;
  const battleMode = state.battleMode;
  state = battleMode === "competitive" ? createCompetitiveInitialState(mode, selected) : createInitialState(mode, selected);
  if (mode === "hotseat") {
    state.privacyGate = {
      title: "玩家 A 开始 Build",
      body: "玩家 B 请闭眼。确认后屏幕亮起，玩家 A 进行技能分配。",
      action: "start-build-a",
    };
  }
  renderGame();
}

function toggleRosterAvatar(id) {
  if (!state.rosterSelectMode) return;
  const selected = new Set(state.selectedAvatarIds);
  if (selected.has(id)) selected.delete(id);
  else if (selected.size < POOL_KEYS.length) selected.add(id);
  state.selectedAvatarIds = state.rosterCandidates.filter((avatar) => selected.has(avatar.id)).map((avatar) => avatar.id);
  renderRosterSelect();
}

function randomRosterSelect() {
  if (!state.rosterSelectMode) return;
  state.selectedAvatarIds = shuffle(state.rosterCandidates).slice(0, POOL_KEYS.length).map((avatar) => avatar.id);
  renderRosterSelect();
}

function renderRosterSelect() {
  const selected = new Set(state.selectedAvatarIds);
  const canConfirm = state.selectedAvatarIds.length === POOL_KEYS.length;
  const playModeText = state.mode === "hotseat" ? "双人同屏" : "单人模式";
  const modeText = state.battleMode === "competitive" ? `${playModeText} · 竞技模式` : `${playModeText} · 乱斗模式`;
  const rosterHint = state.battleMode === "competitive"
    ? "选择 3 名角色加入队伍，剩下 3 名会成为对手。开局属性固定为 HP 90 / ATK 20 / DEF 10 / SPD 10。"
    : "选择 3 名角色加入队伍，剩下 3 名会成为对手。";
  app.innerHTML = `
    <section class="roster-screen">
      <header class="roster-header">
        <button class="roster-back" data-roster-back type="button">返回</button>
        <div>
          <h1>${modeText} 选择队伍</h1>
          <p>${rosterHint}</p>
        </div>
        <strong>${state.selectedAvatarIds.length}/3</strong>
      </header>
      <main class="roster-grid">
        ${state.rosterCandidates.map((avatar) => rosterAvatarCard(avatar, selected.has(avatar.id))).join("")}
      </main>
      <footer class="roster-actions">
        <button class="secondary-action roster-random" data-roster-random type="button">随机</button>
        <button class="primary-action roster-confirm" data-roster-confirm type="button" ${canConfirm ? "" : "disabled"}>确认队伍</button>
      </footer>
    </section>
  `;
}

function rosterAvatarCard(avatar, selected) {
  return `
    <button class="roster-card ${selected ? "selected" : ""}" data-roster-avatar="${avatar.id}" type="button">
      <span class="roster-avatar"><img src="${avatar.src}" alt="${avatar.name}" /></span>
      <strong>${avatar.name}</strong>
      <small>${selected ? "已加入" : "点击选择"}</small>
    </button>
  `;
}

function renderCurrentScene() {
  if (state.practiceBuildMode) {
    renderPracticeBuild();
    return;
  }
  if (state.rosterSelectMode) {
    renderRosterSelect();
    return;
  }
  if (state.battlePickMode || state.result) {
    renderBattlePage();
    return;
  }
  renderGame();
}

function requestReturnHome() {
  stopBattleReplay();
  state.confirmHome = true;
  renderCurrentScene();
}

function requestBuildConfirm() {
  state.confirmBuild = true;
  renderGame();
}

function returnHome() {
  stopBattleReplay();
  state.confirmHome = false;
  state.confirmBuild = false;
  state.showBattleLog = false;
  state.battleLogMatchIndex = null;
  state.showRules = false;
  state.equipWarning = null;
  state.practiceBuildMode = false;
  state.pendingInspectSide = null;
  state.pendingInspectId = null;
  renderStart();
}

function confirmPrivacyGate() {
  const action = state.privacyGate?.action;
  state.privacyGate = null;

  if (action === "start-build-a") {
    state.buildSide = "player";
    renderGame();
    return;
  }

  if (action === "start-build-b") {
    state.buildSide = "enemy";
    state.selectedSkillId = null;
    renderGame();
    return;
  }

  if (action === "start-battle-pick-player") {
    state.battlePickMode = true;
    state.pendingPickSide = "player";
    renderBattlePage();
    return;
  }

  if (action === "start-battle-pick-enemy") {
    state.battlePickMode = true;
    state.pendingPickSide = "enemy";
    renderBattlePage();
    return;
  }

  renderCurrentScene();
}

function privacyGateOverlay() {
  if (!state.privacyGate) return "";
  return `
    <div class="privacy-gate">
      <section class="privacy-card">
        <h2>${state.privacyGate.title}</h2>
        <p>${state.privacyGate.body}</p>
        <button class="primary-action" data-privacy-confirm type="button">确认</button>
      </section>
    </div>
  `;
}

function skipBattleReplay() {
  if (!state.result?.events.length) return;
  stopBattleReplay();
  state.replayIndex = state.result.events.length - 1;
  renderBattlePage();
}

function currentReplayMatchIndex() {
  const events = state.result?.events || [];
  const replayIndex = Math.min(state.replayIndex, Math.max(0, events.length - 1));
  for (let index = replayIndex; index >= 0; index -= 1) {
    if (Number.isInteger(events[index]?.matchIndex)) return events[index].matchIndex;
  }
  return 0;
}

function continueBattleFlow() {
  if (!state.result) return;
  stopBattleReplay();
  if (state.replayIndex < state.result.events.length - 1) {
    skipBattleReplay();
    return;
  }
  if (state.result.winner) {
    if (state.mode === "practice") {
      startPracticeGame();
      return;
    }
    if (state.mode === "hotseat") startHotseatGame();
    else startGame();
    return;
  }

  if (isKofMode()) {
    state.battlePickMode = true;
    state.pendingPlayerId = null;
    state.pendingEnemyId = null;
    state.pendingInspectSide = null;
    state.pendingInspectId = null;

    const currentPlayer = currentKofPet("player");
    const currentEnemy = currentKofPet("enemy");
    if (state.mode !== "hotseat" && currentPlayer && !currentEnemy) {
      startSelectedBattleMatch();
      return;
    }

    state.pendingPickSide = currentPlayer && !currentEnemy ? "enemy" : "player";
    renderBattlePage();
    return;
  }

  state.battlePickMode = true;
  state.pendingPlayerId = null;
  state.pendingEnemyId = null;
  state.pendingPickSide = "player";
  state.pendingInspectSide = null;
  state.pendingInspectId = null;
  if (state.mode === "hotseat") {
    state.privacyGate = {
      title: "玩家 A 选择出战",
      body: "玩家 B 请闭眼。确认后玩家 A 选择下一局上场伙伴。",
      action: "start-battle-pick-player",
    };
  }
  renderBattlePage();
}
