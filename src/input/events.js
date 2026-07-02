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
  const startPracticeButton = event.target.closest("[data-start-practice]");
  const battleModeButton = event.target.closest("[data-battle-mode]");
  const modeBackButton = event.target.closest("[data-mode-back]");
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
  const practicePoolSkillButton = event.target.closest("[data-practice-pool-skill]");
  const practiceSlotButton = event.target.closest("[data-practice-slot]");
  const practiceRemoveButton = event.target.closest("[data-practice-remove]");
  const practiceStartButton = event.target.closest("[data-practice-start]");

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
    renderCurrentScene();
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
  if (startPracticeButton) {
    startPracticeMode();
    return;
  }
  if (battleModeButton) {
    startBattleMode(battleModeButton.dataset.battleMode);
    return;
  }
  if (modeBackButton) {
    returnHome();
    return;
  }
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
  if (practicePoolSkillButton) {
    selectPracticePoolSkill(practicePoolSkillButton.dataset.practicePoolSkill);
    return;
  }
  if (practiceSlotButton) {
    assignPracticeSelectedSkill(practiceSlotButton.dataset.practiceSide, practiceSlotButton.dataset.practiceSlot);
    return;
  }
  if (practiceRemoveButton) {
    removePracticeSkill(practiceRemoveButton.dataset.practiceSide, practiceRemoveButton.dataset.practiceRemove);
    return;
  }
  if (practiceStartButton) {
    startPracticeBattle();
    return;
  }
});

app.addEventListener("input", (event) => {
  const statInput = event.target.closest("[data-practice-stat]");
  if (!statInput) return;
  updatePracticeStat(statInput.dataset.practiceSide, statInput.dataset.practiceStat, statInput.value);
});

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
