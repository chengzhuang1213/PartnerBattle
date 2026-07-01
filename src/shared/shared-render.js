function statLabel(key) {
  return { hp: "生命", atk: "攻击", def: "防御", spd: "速度" }[key];
}

function statIcon(key) {
  return { hp: "♥", atk: "⚔", def: "◆", spd: "↯" }[key];
}

function maxStat(key) {
  return { hp: 135, atk: 35, def: 22, spd: 20 }[key];
}

function petSvg(pet, compact = false) {
  const fill = { orange: "#e9852d", purple: "#7c4dbe", blue: "#3978d8" }[pet.poolKey];
  const earShape =
    pet.poolKey === "purple"
      ? '<path d="M42 42 L56 10 L70 44 Z" fill="#fff" opacity=".72"/><path d="M130 44 L146 10 L158 42 Z" fill="#fff" opacity=".72"/>'
      : '<circle cx="54" cy="36" r="18" fill="#fff" opacity=".72"/><circle cx="146" cy="36" r="18" fill="#fff" opacity=".72"/>';

  return `
    <svg class="pet-art" viewBox="0 0 200 156" role="img" aria-label="${pet.name}">
      <rect width="200" height="156" rx="14" fill="#eef4ef"/>
      <circle cx="100" cy="84" r="${compact ? 44 : 52}" fill="${fill}"/>
      ${earShape}
      <circle cx="78" cy="50" r="7" fill="#17221a"/>
      <circle cx="122" cy="50" r="7" fill="#17221a"/>
      <path d="M78 102 Q100 116 122 102" fill="none" stroke="#17221a" stroke-width="7" stroke-linecap="round"/>
      <path d="M58 124 Q100 146 142 124" fill="none" stroke="#ffffff" stroke-width="8" stroke-linecap="round" opacity=".76"/>
    </svg>
  `;
}

function partnerArt(partner) {
  if (partner.avatarSrc) {
    return `<img class="pet-art partner-art" src="${partner.avatarSrc}" alt="${partner.name}" />`;
  }

  return petSvg(partner);
}

function battleArt(partner, attacking = false) {
  const src = attacking && partner.attackSrc ? partner.attackSrc : partner.battleSrc;
  if (src) {
    return `<img class="battle-art ${attacking && partner.attackSrc ? "attack-art" : ""}" src="${src}" alt="${partner.name}" />`;
  }

  return partnerArt(partner);
}

function poolName(partner, tag = "span") {
  return `<${tag} class="pool-name ${partner.poolClass}">${partner.name}</${tag}>`;
}

function statRows(pet) {
  return Object.entries(pet.stats)
    .map(([key, value]) => {
      return `
        <div class="stat-row ${key}">
          <span>${statIcon(key)} ${statLabel(key)}</span>
          <strong>${value}</strong>
        </div>
      `;
    })
    .join("");
}

