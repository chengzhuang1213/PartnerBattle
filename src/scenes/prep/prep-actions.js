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

function autoAssignEnemySkills(team, skills) {
  const limits = state.battleMode === "competitive" ? COMPETITIVE_SKILL_LIMITS : null;
  for (const skill of shuffle(skills)) {
    const candidates = shuffle(team).filter((pet) => canAssignSkill(pet, skill, skills, limits));
    const pet = candidates[0];
    if (!pet) continue;

    skill.assignedPetId = pet.id;
    pet.skills.push(skill.id);
  }
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
