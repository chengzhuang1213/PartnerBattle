const app = document.querySelector("#app");

let replayTimer = null;
let state = {
  playerTeam: [],
  enemyTeam: [],
  playerSkills: [],
  enemySkills: [],
  practiceSkillPool: [],
  practiceSkillCopyId: 1,
  mode: "solo",
  battleMode: "brawl",
  practiceBuildMode: false,
  modeSelectPlayMode: null,
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
    practiceSkillPool: [],
    practiceSkillCopyId: 1,
    mode,
    battleMode: "brawl",
    practiceBuildMode: false,
    modeSelectPlayMode: null,
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

function createCompetitiveInitialState(mode = "solo", selectedAvatars = null) {
  stopBattleReplay();
  const playerAvatars = selectedAvatars || shuffle(ROSTER_AVATARS).slice(0, POOL_KEYS.length);
  const playerAvatarIds = new Set(playerAvatars.map((avatar) => avatar.id));
  const enemyAvatars = ROSTER_AVATARS.filter((avatar) => !playerAvatarIds.has(avatar.id));
  const playerTeam = createCompetitiveTeam("player", playerAvatars);
  const enemyTeam = createCompetitiveTeam("enemy", enemyAvatars);
  const enemySkills = createSkillHand("enemy");
  if (mode === "solo") autoAssignEnemySkills(enemyTeam, enemySkills);

  return {
    playerTeam,
    enemyTeam,
    playerSkills: createSkillHand("player"),
    enemySkills,
    mode,
    battleMode: "competitive",
    practiceBuildMode: false,
    modeSelectPlayMode: null,
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

function createPracticeInitialState() {
  stopBattleReplay();
  const playerAvatar = ROSTER_AVATARS[0];
  const enemyAvatar = ROSTER_AVATARS[3] || ROSTER_AVATARS[1];

  return {
    playerTeam: [createFixedPet("orange", "player", playerAvatar, COMPETITIVE_STATS)],
    enemyTeam: [createFixedPet("orange", "enemy", enemyAvatar, COMPETITIVE_STATS)],
    playerSkills: [],
    enemySkills: [],
    practiceSkillPool: createFullSkillHand("practice"),
    practiceSkillCopyId: 1,
    mode: "practice",
    battleMode: "practice",
    practiceBuildMode: true,
    modeSelectPlayMode: null,
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

function stopBattleReplay() {
  if (replayTimer) {
    clearTimeout(replayTimer);
    replayTimer = null;
  }
}


