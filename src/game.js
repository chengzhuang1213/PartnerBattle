const app = document.querySelector("#app");

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
  showBattleLog: false,
  showRules: false,
  equipWarning: null,
  confirmHome: false,
};


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
    showBattleLog: false,
    showRules: false,
    equipWarning: null,
    confirmHome: false,
  };
  renderGame();
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
  const startButton = event.target.closest("[data-start]");
  const selectButton = event.target.closest("[data-select]");
  const fightButton = event.target.closest("[data-fight]");
  const battlePickButton = event.target.closest("[data-battle-pick]");
  const startMatchButton = event.target.closest("[data-start-match]");
  const toggleLogButton = event.target.closest("[data-toggle-log]");
  const closeLogButton = event.target.closest("[data-close-log]");
  const skipReplayButton = event.target.closest("[data-skip-replay]");
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
  if (backPrepButton) {
    stopBattleReplay();
    state.battlePickMode = false;
    state.pendingPlayerId = null;
    renderGame();
  }
  if (randomSkillsButton) randomAssignPlayerSkills();
  if (rerollPlayerButton) rerollPlayerStats();
  if (startButton) startGame();
  if (selectButton) selectPet(selectButton.dataset.select);
  if (fightButton) resolveBattle();
  if (battlePickButton) selectBattlePet(battlePickButton.dataset.battlePick);
  if (startMatchButton) startSelectedBattleMatch();
  if (skipReplayButton) skipBattleReplay();
  if (continueBattleButton) continueBattleFlow();
  if (toggleLogButton) {
    state.showBattleLog = true;
    renderBattlePage();
  }
  if (closeLogButton) {
    state.showBattleLog = false;
    renderBattlePage();
  }
});

function renderCurrentScene() {
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

function returnHome() {
  stopBattleReplay();
  state.confirmHome = false;
  state.showBattleLog = false;
  state.showRules = false;
  state.equipWarning = null;
  renderStart();
}

function skipBattleReplay() {
  if (!state.result?.events.length) return;
  stopBattleReplay();
  state.replayIndex = state.result.events.length - 1;
  renderBattlePage();
}

function continueBattleFlow() {
  if (!state.result) return;
  stopBattleReplay();
  if (state.replayIndex < state.result.events.length - 1) {
    skipBattleReplay();
    return;
  }
  if (state.result.winner) {
    startGame();
    return;
  }
  state.battlePickMode = true;
  state.pendingPlayerId = null;
  renderBattlePage();
}

app.addEventListener("dragstart", handleSkillDragStart);
app.addEventListener("dragover", handleSkillDragOver);
app.addEventListener("drop", handleSkillDrop);
app.addEventListener("mousemove", handlePrepTooltipMove);
app.addEventListener("mouseleave", hidePrepTooltip);
app.addEventListener("focusin", handlePrepTooltipFocus);
app.addEventListener("focusout", hidePrepTooltip);

renderStart();
