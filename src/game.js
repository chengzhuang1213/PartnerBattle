const app = document.querySelector("#app");

let replayTimer = null;
let state = {
  playerTeam: [],
  enemyTeam: [],
  playerSkills: [],
  enemySkills: [],
  mode: "solo",
  rosterSelectMode: false,
  rosterCandidates: [],
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


function createInitialState(mode = "solo", selectedAvatars = null) {
  stopBattleReplay();
  const playerAvatars = selectedAvatars || shuffle(ROSTER_AVATARS).slice(0, POOL_KEYS.length);
  const playerAvatarIds = new Set(playerAvatars.map((avatar) => avatar.id));
  const enemyAvatars = ROSTER_AVATARS.filter((avatar) => !playerAvatarIds.has(avatar.id));
  const playerTeam = createTeamFromAvatars("player", playerAvatars);
  const enemyTeam = createTeamFromAvatars("enemy", enemyAvatars);
  const enemySkills = createSkillHand("enemy");
  if (mode === "solo") autoAssignEnemySkills(enemyTeam, enemySkills);

  return {
    playerTeam,
    enemyTeam,
    playerSkills: createSkillHand("player"),
    enemySkills,
    mode,
    rosterSelectMode: false,
    rosterCandidates: [],
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
}

function startGame() {
  startRosterSelect("solo");
}

function startHotseatGame() {
  startRosterSelect("hotseat");
}

function startRosterSelect(mode) {
  stopBattleReplay();
  state = {
    playerTeam: [],
    enemyTeam: [],
    playerSkills: [],
    enemySkills: [],
    mode,
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
  state = createInitialState(mode, selected);
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
  const modeText = state.mode === "hotseat" ? "双人同屏" : "单人模式";
  app.innerHTML = `
    <section class="roster-screen">
      <header class="roster-header">
        <button class="roster-back" data-roster-back type="button">返回</button>
        <div>
          <h1>${modeText} 选择队伍</h1>
          <p>选择 3 名角色加入队伍，剩下 3 名会成为对手。</p>
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

function stopBattleReplay() {
  if (replayTimer) {
    clearTimeout(replayTimer);
    replayTimer = null;
  }
}


app.addEventListener("click", (event) => {
  const removeButton = event.target.closest("[data-remove-skill]");
  const skillButton = event.target.closest("[data-skill]");
  const backPrepButton = event.target.closest("[data-back-prep]");
  const randomSkillsButton = event.target.closest("[data-random-skills]");
  const rerollPlayerButton = event.target.closest("[data-reroll-player]");
  const rulesButton = event.target.closest("[data-rules]");
  const closeRulesButton = event.target.closest("[data-close-rules]");
  const closeEquipWarningButton = event.target.closest("[data-close-equip-warning]");
  const confirmHomeButton = event.target.closest("[data-confirm-home]");
  const closeHomeConfirmButton = event.target.closest("[data-close-home-confirm]");
  const goHomeButton = event.target.closest("[data-go-home]");
  const closeBuildConfirmButton = event.target.closest("[data-close-build-confirm]");
  const confirmBuildButton = event.target.closest("[data-confirm-build]");
  const startButton = event.target.closest("[data-start]");
  const startHotseatButton = event.target.closest("[data-start-hotseat]");
  const rosterAvatarButton = event.target.closest("[data-roster-avatar]");
  const rosterRandomButton = event.target.closest("[data-roster-random]");
  const rosterConfirmButton = event.target.closest("[data-roster-confirm]");
  const rosterBackButton = event.target.closest("[data-roster-back]");
  const gateConfirmButton = event.target.closest("[data-privacy-confirm]");
  const selectButton = event.target.closest("[data-select]");
  const fightButton = event.target.closest("[data-fight]");
  const battlePickButton = event.target.closest("[data-battle-pick]");
  const battleInspectButton = event.target.closest("[data-battle-inspect]");
  const startMatchButton = event.target.closest("[data-start-match]");
  const toggleLogButton = event.target.closest("[data-toggle-log]");
  const battleLogMatchButton = event.target.closest("[data-battle-log-match]");
  const closeLogButton = event.target.closest("[data-close-log]");
  const continueBattleButton = event.target.closest("[data-continue-battle]");

  if (removeButton) {
    event.preventDefault();
    event.stopPropagation();
    removeSkill(removeButton.dataset.removeSkill);
    return;
  }
  if (skillButton) selectSkill(skillButton.dataset.skill);
  if (rulesButton) {
    state.showRules = true;
    renderGame();
  }
  if (closeRulesButton && (!event.target.closest(".rules-modal") || event.target.closest(".rules-close"))) {
    state.showRules = false;
    renderGame();
  }
  if (closeEquipWarningButton && (!event.target.closest(".equip-warning-modal") || event.target.closest(".equip-warning-close") || event.target.closest(".equip-warning-back"))) {
    state.equipWarning = null;
    renderGame();
  }
  if (confirmHomeButton) requestReturnHome();
  if (closeHomeConfirmButton && (!event.target.closest(".home-confirm-modal") || event.target.closest(".home-confirm-close") || event.target.closest(".home-confirm-cancel"))) {
    state.confirmHome = false;
    renderCurrentScene();
  }
  if (goHomeButton) returnHome();
  if (closeBuildConfirmButton && (!event.target.closest(".build-confirm-modal") || event.target.closest(".build-confirm-close") || event.target.closest(".build-confirm-cancel"))) {
    state.confirmBuild = false;
    renderGame();
  }
  if (confirmBuildButton) {
    state.confirmBuild = false;
    resolveBattle();
    return;
  }
  if (gateConfirmButton) confirmPrivacyGate();
  if (backPrepButton) {
    stopBattleReplay();
    state.battlePickMode = false;
    state.pendingPlayerId = null;
    state.pendingEnemyId = null;
    state.pendingInspectSide = null;
    state.pendingInspectId = null;
    renderGame();
  }
  if (randomSkillsButton) randomAssignPlayerSkills();
  if (rerollPlayerButton) rerollPlayerStats();
  if (startButton) startGame();
  if (startHotseatButton) startHotseatGame();
  if (rosterAvatarButton) {
    toggleRosterAvatar(rosterAvatarButton.dataset.rosterAvatar);
    return;
  }
  if (rosterRandomButton) {
    randomRosterSelect();
    return;
  }
  if (rosterConfirmButton) {
    confirmRosterSelect();
    return;
  }
  if (rosterBackButton) {
    returnHome();
    return;
  }
  if (selectButton) selectPet(selectButton.dataset.select);
  if (fightButton) {
    requestBuildConfirm();
    return;
  }
  if (battlePickButton) selectBattlePet(battlePickButton.dataset.battlePick, battlePickButton.dataset.battlePickSide);
  if (battleInspectButton) inspectBattlePet(battleInspectButton.dataset.battleInspectSide, battleInspectButton.dataset.battleInspect);
  if (startMatchButton) startSelectedBattleMatch();
  if (continueBattleButton) continueBattleFlow();
  if (toggleLogButton) {
    state.showBattleLog = true;
    state.battleLogMatchIndex = currentReplayMatchIndex();
    renderBattlePage();
  }
  if (battleLogMatchButton) {
    state.battleLogMatchIndex = Number(battleLogMatchButton.dataset.battleLogMatch);
    renderBattlePage();
  }
  if (closeLogButton) {
    state.showBattleLog = false;
    renderBattlePage();
  }
});

function renderCurrentScene() {
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
    if (state.mode === "hotseat") startHotseatGame();
    else startGame();
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

app.addEventListener("dragstart", handleSkillDragStart);
app.addEventListener("dragover", handleSkillDragOver);
app.addEventListener("drop", handleSkillDrop);
app.addEventListener("mousemove", handlePrepTooltipMove);
app.addEventListener("mouseleave", hidePrepTooltip);
app.addEventListener("focusin", handlePrepTooltipFocus);
app.addEventListener("focusout", hidePrepTooltip);
app.addEventListener("touchstart", handlePrepTooltipTouchStart, { passive: true });
app.addEventListener("touchend", handlePrepTooltipTouchEnd, { passive: true });
app.addEventListener("touchcancel", handlePrepTooltipTouchEnd, { passive: true });

renderStart();
