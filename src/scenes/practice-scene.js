const PRACTICE_LIMITS = { high: 2, basic: 3 };
const PRACTICE_SKILL_CATEGORIES = [
  { title: "攻击类", groups: ["crit", "combo", "unyielding", "power", "sneak", "lifesteal"] },
  { title: "防御类", groups: ["defense", "counter", "reflect", "parry"] },
  { title: "功能类", groups: ["poison", "revive", "lucky", "regen", "agile", "flight"] },
];

function startPracticeGame() {
  state = createPracticeInitialState();
  renderPracticeBuild();
}

function renderPracticeBuild() {
  const player = state.playerTeam[0];
  const enemy = state.enemyTeam[0];
  app.innerHTML = `
    <section class="practice-screen">
      <header class="practice-header">
        <button class="prep-back" data-confirm-home type="button">返回</button>
        <div>
          <h1>练习模式 Build</h1>
          <p>双方各 1 名角色，共用一套全技能池；每人最多 2 高级 + 3 初级，同组技能仍互斥。</p>
        </div>
        <button class="ready-button" data-practice-start type="button">开始 BO1</button>
      </header>
      <section class="practice-pool">
        <header>
          <h2>共用技能池</h2>
          <p>${practicePoolHint()}</p>
        </header>
        <div class="practice-pool-categories">
          ${practiceSkillCategoryBlocks()}
        </div>
      </section>
      <main class="practice-board">
        ${practiceFighterCard("player", player, state.playerSkills, "我方")}
        ${practiceFighterCard("enemy", enemy, state.enemySkills, "对方")}
      </main>
      <div class="prep-floating-tooltip" role="tooltip" hidden></div>
      ${state.equipWarning ? equipWarningModal(state.equipWarning) : ""}
      ${state.confirmHome ? homeConfirmModal() : ""}
    </section>
  `;
}

function practiceFighterCard(side, pet, skills, label) {
  return `
    <article class="practice-card ${side} ${partnerThemeClass(pet)}" data-practice-drop-side="${side}">
      <header class="practice-card-head">
        <span class="practice-avatar">${partnerArt(pet)}</span>
        <div>
          ${poolName(pet, "h2")}
          <strong>${label}</strong>
        </div>
      </header>
      <section class="practice-stats">
        ${["hp", "atk", "def", "spd"].map((key) => practiceStatInput(side, key, pet.stats[key])).join("")}
      </section>
      ${practiceSlotTray(side, pet, skills)}
    </article>
  `;
}

function practiceStatInput(side, key, value) {
  return `
    <label class="practice-stat">
      <span>${key.toUpperCase()}</span>
      <input data-practice-stat="${key}" data-practice-side="${side}" type="number" min="1" max="999" value="${value}" />
    </label>
  `;
}

function practiceSlotTray(side, pet, skills) {
  const assigned = getPetSkills(pet, skills);
  const highSkills = assigned.filter((skill) => skill.tier === "high");
  const basicSkills = assigned.filter((skill) => skill.tier === "basic");
  return `
    <section class="practice-slots">
      <header>
        <h3>装备格</h3>
        <span>高级 ${highSkills.length}/${PRACTICE_LIMITS.high}</span>
        <span>初级 ${basicSkills.length}/${PRACTICE_LIMITS.basic}</span>
      </header>
      <div class="practice-slot-row high">
        ${practiceSlotButtons(side, "high", highSkills, PRACTICE_LIMITS.high)}
      </div>
      <div class="practice-slot-row basic">
        ${practiceSlotButtons(side, "basic", basicSkills, PRACTICE_LIMITS.basic)}
      </div>
    </section>
  `;
}

function practiceSlotButtons(side, tier, skills, count) {
  return Array.from({ length: count }, (_, index) => {
    const skill = skills[index];
    if (skill) {
      return `
        <button
          class="practice-slot filled ${tier}"
          data-practice-remove="${skill.id}"
          data-practice-side="${side}"
          data-practice-drag-skill="${skill.id}"
          data-practice-drop-side="${side}"
          data-practice-drop-tier="${tier}"
          data-practice-drop-skill="${skill.id}"
          data-tooltip="${skillTooltipText(skill)}"
          draggable="true"
          type="button"
        >
          <span>${skillIconText(skill)}</span>
          <b>${skill.name}</b>
        </button>
      `;
    }
    return `
      <button class="practice-slot empty ${tier}" data-practice-slot="${tier}" data-practice-side="${side}" data-practice-drop-side="${side}" data-practice-drop-tier="${tier}" type="button">
        <span>${tier === "high" ? "高" : "初"}</span>
      </button>
    `;
  }).join("");
}

function practicePoolSkillButton(skill) {
  const selected = state.selectedSkillId === skill.id;
  return `
    <button
      class="practice-skill ${skill.tier} ${selected ? "selected" : ""}"
      data-practice-pool-skill="${skill.id}"
      data-tooltip="${skillTooltipText(skill)}"
      draggable="true"
      type="button"
    >
      <span>${skillIconText(skill)}</span>
      <b>${skill.name}</b>
    </button>
  `;
}

function practiceSkillCategoryBlocks() {
  return PRACTICE_SKILL_CATEGORIES.map((category) => {
    const groupSet = new Set(category.groups);
    const skills = displaySkillOrder(state.practiceSkillPool.filter((skill) => groupSet.has(skill.group)));
    return `
      <section class="practice-skill-category">
        <h3>${category.title}</h3>
        <div class="practice-skill-grid">
          ${skills.map((skill) => practicePoolSkillButton(skill)).join("")}
        </div>
      </section>
    `;
  }).join("");
}

function practicePoolHint() {
  const skill = state.practiceSkillPool.find((item) => item.id === state.selectedSkillId);
  if (!skill) return "先选一个技能，再点我方或对方的空装备格。点已装备技能可卸下。";
  return `已选择：${skill.name}。请选择一个${skill.tier === "high" ? "高级" : "初级"}空格装备。`;
}

function selectPracticePoolSkill(skillId) {
  state.selectedSkillId = state.selectedSkillId === skillId ? null : skillId;
  renderPracticeBuild();
}

function assignPracticeSelectedSkill(side, tier) {
  const template = state.practiceSkillPool.find((item) => item.id === state.selectedSkillId);
  if (!template) return;
  assignPracticeTemplateToSide(template, side, tier);
}

function assignPracticeTemplateToSide(template, side, tier, replaceSkillId = null) {
  const skills = practiceSkillsForSide(side);
  const pet = practicePetForSide(side);
  if (!template || !pet) return;
  const blocked = practiceSkillBlockedReason(pet, template, skills, tier);
  if (blocked) {
    state.equipWarning = { skillName: template.name, petName: pet.name, reason: blocked };
    renderPracticeBuild();
    return;
  }

  const replacedSkill = replaceSkillId ? skills.find((skill) => skill.id === replaceSkillId) : null;
  if (replacedSkill) {
    if (replacedSkill.tier !== template.tier) return;
    skills.splice(skills.indexOf(replacedSkill), 1);
    pet.skills = pet.skills.filter((id) => id !== replacedSkill.id);
  }

  const skill = {
    ...template,
    id: `${side}-practice-${state.practiceSkillCopyId++}`,
    owner: side,
    assignedPetId: pet.id,
  };
  skills.push(skill);
  pet.skills.push(skill.id);
  state.selectedSkillId = null;
  renderPracticeBuild();
}

function movePracticeSkillToSide(skillId, side, tier, replaceSkillId = null) {
  const source = practiceSkillOwner(skillId);
  const targetSkills = practiceSkillsForSide(side);
  const targetPet = practicePetForSide(side);
  if (!source || !targetPet || source.skill.id === replaceSkillId) return;
  if (source.skill.tier !== tier) return;

  const replacedSource = replaceSkillId ? practiceSkillOwner(replaceSkillId) : null;
  if (replacedSource && replacedSource.skill.tier !== source.skill.tier) return;

  source.skills.splice(source.skills.indexOf(source.skill), 1);
  source.pet.skills = source.pet.skills.filter((id) => id !== source.skill.id);
  if (replacedSource) {
    replacedSource.skills.splice(replacedSource.skills.indexOf(replacedSource.skill), 1);
    replacedSource.pet.skills = replacedSource.pet.skills.filter((id) => id !== replacedSource.skill.id);
  }

  const blocked = practiceSkillBlockedReason(targetPet, source.skill, targetSkills, tier);
  if (blocked) {
    source.skills.push(source.skill);
    source.pet.skills.push(source.skill.id);
    if (replacedSource) {
      replacedSource.skills.push(replacedSource.skill);
      replacedSource.pet.skills.push(replacedSource.skill.id);
    }
    state.equipWarning = { skillName: source.skill.name, petName: targetPet.name, reason: blocked };
    renderPracticeBuild();
    return;
  }

  source.skill.owner = side;
  source.skill.assignedPetId = targetPet.id;
  targetSkills.push(source.skill);
  targetPet.skills.push(source.skill.id);
  state.selectedSkillId = null;
  renderPracticeBuild();
}

function removePracticeSkill(side, skillId) {
  const skills = side === "enemy" ? state.enemySkills : state.playerSkills;
  const pet = (side === "enemy" ? state.enemyTeam : state.playerTeam)[0];
  const skillIndex = skills.findIndex((skill) => skill.id === skillId);
  if (!pet || skillIndex < 0) return;
  skills.splice(skillIndex, 1);
  pet.skills = pet.skills.filter((id) => id !== skillId);
  renderPracticeBuild();
}

function practiceSkillBlockedReason(pet, skill, skills, slotTier) {
  if (skill.tier !== slotTier) return `这个是${skill.tier === "high" ? "高级" : "初级"}技能，请放进对应装备格`;
  const assigned = getPetSkills(pet, skills);
  const sameGroup = assigned.find((item) => item.group === skill.group);
  if (sameGroup) return `同组技能不可重复：已经携带 ${sameGroup.name}`;
  const tierCount = assigned.filter((item) => item.tier === skill.tier).length;
  const tierLimit = PRACTICE_LIMITS[skill.tier];
  if (tierCount >= tierLimit) return `${skill.tier === "high" ? "高级" : "初级"}技能已满：${tierCount}/${tierLimit}`;
  return "";
}

function updatePracticeStat(side, key, value) {
  const pet = (side === "enemy" ? state.enemyTeam : state.playerTeam)[0];
  if (!pet || !["hp", "atk", "def", "spd"].includes(key)) return;
  const nextValue = Math.max(1, Math.min(999, Number(value) || 1));
  pet.stats[key] = nextValue;
  pet.power = statPower(pet.stats);
}

function practicePetForSide(side) {
  return (side === "enemy" ? state.enemyTeam : state.playerTeam)[0];
}

function practiceSkillsForSide(side) {
  return side === "enemy" ? state.enemySkills : state.playerSkills;
}

function practiceSkillOwner(skillId) {
  for (const side of ["player", "enemy"]) {
    const skills = practiceSkillsForSide(side);
    const skill = skills.find((item) => item.id === skillId);
    if (skill) return { side, skill, skills, pet: practicePetForSide(side) };
  }
  return null;
}

function handlePracticeDragStart(event) {
  const templateButton = event.target.closest("[data-practice-pool-skill]");
  const equippedButton = event.target.closest("[data-practice-drag-skill]");
  const skillId = equippedButton?.dataset.practiceDragSkill || templateButton?.dataset.practicePoolSkill;
  if (!skillId) return;

  hidePrepTooltip();
  if (templateButton) state.selectedSkillId = skillId;
  event.dataTransfer.setData("text/plain", skillId);
  event.dataTransfer.setData("application/x-practice-skill-id", skillId);
  event.dataTransfer.setData("application/x-practice-skill-kind", equippedButton ? "equipped" : "template");
  event.dataTransfer.effectAllowed = "move";
}

function handlePracticeDragOver(event) {
  const target = event.target.closest("[data-practice-drop-side]");
  if (!target) return;
  const drag = practiceDragData(event);
  if (!drag.skill) return;
  const tier = target.dataset.practiceDropTier || drag.skill.tier;
  if (drag.skill.tier !== tier) return;
  if (target.dataset.practiceDropSkill === drag.skill.id) return;
  event.preventDefault();
  event.dataTransfer.dropEffect = "move";
}

function handlePracticeDrop(event) {
  const target = event.target.closest("[data-practice-drop-side]");
  if (!target) return;
  const drag = practiceDragData(event);
  if (!drag.skill) return;

  event.preventDefault();
  const side = target.dataset.practiceDropSide;
  const tier = target.dataset.practiceDropTier || drag.skill.tier;
  const replaceSkillId = target.dataset.practiceDropSkill || null;
  if (drag.kind === "equipped") movePracticeSkillToSide(drag.skill.id, side, tier, replaceSkillId);
  else assignPracticeTemplateToSide(drag.skill, side, tier, replaceSkillId);
}

function practiceDragData(event) {
  const id = event.dataTransfer.getData("application/x-practice-skill-id") || event.dataTransfer.getData("text/plain") || state.selectedSkillId;
  const kind = event.dataTransfer.getData("application/x-practice-skill-kind") || "template";
  const skill = kind === "equipped"
    ? practiceSkillOwner(id)?.skill
    : state.practiceSkillPool.find((item) => item.id === id);
  return { id, kind, skill };
}

function startPracticeBattle() {
  stopBattleReplay();
  state.practiceBuildMode = false;
  state.result = createBattleSession();
  state.replayIndex = 0;
  state.showBattleLog = false;
  appendBattleMatch(state.playerTeam[0], state.enemyTeam[0]);
  renderBattlePage();
  startBattleReplay();
}
