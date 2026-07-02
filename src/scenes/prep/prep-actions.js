function selectPet(id) {
  if (!state.selectedSkillId) return;
  assignSkillToPet(state.selectedSkillId, id);
}

function selectSkill(id) {
  const skill = activeBuildSkills().find((item) => item.id === id);
  state.selectedSkillId = skill && !skill.assignedPetId ? id : null;
  renderGame();
}

function assignSkillToPet(skillId, petId, requiredTier = null, options = {}) {
  const skills = activeBuildSkills();
  const team = activeBuildTeam();
  const skill = skills.find((item) => item.id === skillId);
  const pet = team.find((item) => item.id === petId);
  if (requiredTier && skill?.tier !== requiredTier) return;
  if (!skill || !pet) return;
  if (skill.assignedPetId && !options.allowAssigned) return;

  const sourcePet = team.find((item) => item.id === skill.assignedPetId);
  const replacedSkill = options.replaceSkillId ? skills.find((item) => item.id === options.replaceSkillId) : null;
  const replacedPet = replacedSkill ? team.find((item) => item.id === replacedSkill.assignedPetId) : null;

  if (replacedSkill?.tier && replacedSkill.tier !== skill.tier) return;
  if (replacedSkill?.id === skill.id) return;

  if (sourcePet) sourcePet.skills = sourcePet.skills.filter((id) => id !== skill.id);
  skill.assignedPetId = null;
  if (replacedSkill && replacedPet) {
    replacedPet.skills = replacedPet.skills.filter((id) => id !== replacedSkill.id);
    replacedSkill.assignedPetId = null;
  }

  const blockedReason = skillAssignBlockedReason(pet, skill);
  if (blockedReason) {
    if (sourcePet) sourcePet.skills.push(skill.id);
    skill.assignedPetId = sourcePet?.id || null;
    if (replacedSkill && replacedPet) {
      replacedSkill.assignedPetId = replacedPet.id;
      replacedPet.skills.push(replacedSkill.id);
    }
    state.equipWarning = {
      skillName: skill.name,
      petName: pet.name,
      reason: blockedReason,
    };
    renderGame();
    return;
  }

  skill.assignedPetId = pet.id;
  pet.skills.push(skill.id);
  state.selectedSkillId = null;
  state.result = null;
  renderGame();
}

function activeSkillLimits() {
  return state.battleMode === "competitive" ? COMPETITIVE_SKILL_LIMITS : null;
}

function skillAssignBlockedReason(pet, skill) {
  const assigned = getPetSkills(pet, activeBuildSkills());
  const sameGroupSkill = assigned.find((item) => item.group === skill.group);
  if (sameGroupSkill) return `同组技能不可重复：已经携带${sameGroupSkill.name}，不能再装备${skill.name}`;

  if (state.battleMode === "competitive" && skill.tier === "high") {
    const teamHighCount = activeBuildSkills().filter((item) => item.tier === "high" && item.assignedPetId).length;
    if (teamHighCount >= COMPETITIVE_SKILL_LIMITS.teamHigh) return `竞技模式全队最多装备 ${COMPETITIVE_SKILL_LIMITS.teamHigh} 个高级技能`;
  }

  if (!canAssignSkill(pet, skill, activeBuildSkills(), activeSkillLimits())) {
    if (skill.tier === "high") return "高级技能栏位已满";
    return "初级技能栏位已满";
  }

  return "";
}

function baseSkillName(skill) {
  return skill.name.replace(/^高级/, "");
}

function assignSelectedSkill(petId) {
  if (!state.selectedSkillId) return;
  assignSkillToPet(state.selectedSkillId, petId);
}

function removeSkill(skillId) {
  const skills = activeBuildSkills();
  const team = activeBuildTeam();
  const skill = skills.find((item) => item.id === skillId);
  if (!skill) return;

  const pet = team.find((item) => item.id === skill.assignedPetId);
  if (pet) pet.skills = pet.skills.filter((id) => id !== skill.id);
  skill.assignedPetId = null;
  state.selectedSkillId = null;
  state.result = null;
  renderGame();
}

const COMPETITIVE_AI_ROLES = ["carry", "support", "scout"];
const COMPETITIVE_AI_REACTIVE_GROUPS = ["counter", "reflect", "parry", "flight", "lucky"];
const COMPETITIVE_AI_ROLE_WEIGHTS = {
  carry: {
    high: { power: 11, combo: 10, crit: 9, lifesteal: 8, sneak: 7, agile: 5, unyielding: 4 },
    basic: { combo: 9, crit: 8, power: 7, sneak: 6, lifesteal: 5, agile: 4, unyielding: 3 },
  },
  support: {
    high: { poison: 10, regen: 9, revive: 8, defense: 7, lifesteal: 5, lucky: 4, flight: 4 },
    basic: { poison: 9, regen: 8, defense: 7, revive: 6, lifesteal: 4, lucky: 3, flight: 3 },
  },
  scout: {
    high: { agile: 10, sneak: 9, flight: 8, parry: 7, poison: 6, lucky: 5, crit: 4 },
    basic: { agile: 9, sneak: 8, flight: 7, parry: 6, poison: 5, lucky: 4, crit: 3 },
  },
};

function autoAssignEnemySkills(team, skills) {
  if (state.battleMode === "competitive") {
    autoAssignCompetitiveAiSkills(team, skills);
    return;
  }

  const limits = null;
  for (const skill of shuffle(skills)) {
    const candidates = shuffle(team).filter((pet) => canAssignSkill(pet, skill, skills, limits));
    const pet = candidates[0];
    if (!pet) continue;

    skill.assignedPetId = pet.id;
    pet.skills.push(skill.id);
  }
}

function autoAssignCompetitiveAiSkills(team, skills) {
  assignCompetitiveAiRoles(team);
  for (const pet of team) pet.skills = [];
  for (const skill of skills) skill.assignedPetId = null;

  const sortedSkills = [...skills].sort((a, b) => {
    if (a.tier !== b.tier) return a.tier === "high" ? -1 : 1;
    return bestCompetitiveSkillValue(b) - bestCompetitiveSkillValue(a);
  });

  for (const skill of sortedSkills) {
    const pet = bestCompetitiveSkillTarget(team, skills, skill);
    if (!pet) continue;
    skill.assignedPetId = pet.id;
    pet.skills.push(skill.id);
  }

  state.enemyOrder = competitiveAiBattleOrder(team, skills);
}

function assignCompetitiveAiRoles(team) {
  const roles = shuffle(COMPETITIVE_AI_ROLES);
  for (let index = 0; index < team.length; index += 1) {
    team[index].aiRole = roles[index] || COMPETITIVE_AI_ROLES[index % COMPETITIVE_AI_ROLES.length];
  }
}

function bestCompetitiveSkillValue(skill) {
  return Math.max(...COMPETITIVE_AI_ROLES.map((role) => competitiveSkillRoleValue(role, skill)));
}

function bestCompetitiveSkillTarget(team, skills, skill) {
  const candidates = shuffle(team).filter((pet) => canAssignSkill(pet, skill, skills, COMPETITIVE_SKILL_LIMITS));
  const viable = COMPETITIVE_AI_REACTIVE_GROUPS.includes(skill.group)
    ? candidates.filter((pet) => competitiveReactiveSkillCount(pet, skills) < 1)
    : candidates;

  return viable
    .map((pet) => ({ pet, score: competitiveSkillTargetScore(pet, skills, skill) }))
    .sort((a, b) => b.score - a.score)[0]?.pet || null;
}

function competitiveSkillTargetScore(pet, skills, skill) {
  const assigned = getPetSkills(pet, skills);
  const role = pet.aiRole || "support";
  const roleScore = competitiveSkillRoleValue(role, skill);
  const reactiveCount = assigned.filter((item) => COMPETITIVE_AI_REACTIVE_GROUPS.includes(item.group)).length;
  const hasReactive = COMPETITIVE_AI_REACTIVE_GROUPS.includes(skill.group);
  const sameTierCount = assigned.filter((item) => item.tier === skill.tier).length;
  const slotBalance = skill.tier === "high" ? (role === "carry" ? 2 : 1) - sameTierCount : 3 - sameTierCount;
  const antiStackPenalty = hasReactive ? reactiveCount * 8 + (role === "carry" ? 4 : 0) : 0;
  const emptyRoleBonus = assigned.length ? 0 : role === "scout" && skill.tier === "basic" ? 2 : 4;

  return roleScore * 10 + slotBalance * 3 + emptyRoleBonus - antiStackPenalty;
}

function competitiveSkillRoleValue(role, skill) {
  return COMPETITIVE_AI_ROLE_WEIGHTS[role]?.[skill.tier]?.[skill.group] || (skill.tier === "high" ? 2 : 1);
}

function competitiveAiBattleOrder(team, skills) {
  const roleOrder = ["scout", "support", "carry"];
  return [...team]
    .sort((a, b) => {
      const roleDelta = roleOrder.indexOf(a.aiRole) - roleOrder.indexOf(b.aiRole);
      if (roleDelta) return roleDelta;
      return competitivePetPlanScore(b, skills) - competitivePetPlanScore(a, skills);
    })
    .map((pet) => pet.id);
}

function competitivePetPlanScore(pet, skills) {
  return getPetSkills(pet, skills).reduce((total, skill) => total + competitiveSkillRoleValue(pet.aiRole, skill), 0);
}

function competitiveReactiveSkillCount(pet, skills) {
  return getPetSkills(pet, skills).filter((skill) => COMPETITIVE_AI_REACTIVE_GROUPS.includes(skill.group)).length;
}

function randomAssignPlayerSkills() {
  stopBattleReplay();
  const team = activeBuildTeam();
  const skills = activeBuildSkills();
  const limits = activeSkillLimits();
  for (const pet of team) pet.skills = [];
  for (const skill of skills) skill.assignedPetId = null;

  for (const skill of shuffle(skills)) {
    const candidates = shuffle(team).filter((pet) => canAssignSkill(pet, skill, skills, limits));
    const pet = candidates[0];
    if (!pet) continue;

    skill.assignedPetId = pet.id;
    pet.skills.push(skill.id);
  }

  state.selectedSkillId = null;
  state.result = null;
  renderGame();
}

function rerollPlayerStats() {
  stopBattleReplay();
  for (const pet of state.playerTeam) {
    const rolled = rollStats(POOLS[pet.poolKey]);
    pet.stats = rolled.stats;
    pet.power = rolled.power;
  }

  state.selectedSkillId = null;
  state.pendingPlayerId = null;
  state.battlePickMode = false;
  state.result = null;
  renderGame();
}

function handleSkillDragStart(event) {
  if (state.practiceBuildMode) {
    handlePracticeDragStart(event);
    return;
  }
  const button = event.target.closest("[data-skill], [data-drag-skill]");
  if (!button) return;

  hidePrepTooltip();
  const skillId = button.dataset.skill || button.dataset.dragSkill;
  state.selectedSkillId = skillId;
  event.dataTransfer.setData("text/plain", skillId);
  event.dataTransfer.setData("application/x-skill-id", skillId);
  event.dataTransfer.effectAllowed = "move";
}

function handleSkillDragOver(event) {
  if (state.practiceBuildMode) {
    handlePracticeDragOver(event);
    return;
  }
  const target = event.target.closest("[data-drop-pet]");
  if (!target) return;
  const skillId = event.dataTransfer.getData("text/plain") || state.selectedSkillId;
  const skill = activeBuildSkills().find((item) => item.id === skillId);
  if (target.dataset.dropTier && skill?.tier !== target.dataset.dropTier) return;
  if (target.dataset.dropSkill === skillId) return;
  event.preventDefault();
  event.dataTransfer.dropEffect = "move";
}

function handleSkillDrop(event) {
  if (state.practiceBuildMode) {
    handlePracticeDrop(event);
    return;
  }
  const target = event.target.closest("[data-drop-pet]");
  if (!target) return;

  event.preventDefault();
  const skillId = event.dataTransfer.getData("application/x-skill-id") || event.dataTransfer.getData("text/plain") || state.selectedSkillId;
  assignSkillToPet(skillId, target.dataset.dropPet, target.dataset.dropTier || null, {
    allowAssigned: true,
    replaceSkillId: target.dataset.dropSkill || null,
  });
}
