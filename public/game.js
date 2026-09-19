const socket = io();

const SAVE_KEY = "yuusha_bounty_rpg_online_v5";

const BOSS = {
  name: "懸賞金王",
  hp: 500,
  attack: 45,
  xp: 1000,
  money: 1000
};

const monsters = [
  {
    name: "怪物猫",
    hp: 20,
    attack: 5,
    xp: 25,
    money: 20,
    area: "草原",
    minLv: 1,
    maxLv: 5
  },
  {
    name: "スライム",
    hp: 30,
    attack: 6,
    xp: 30,
    money: 25,
    area: "草原",
    minLv: 1,
    maxLv: 6
  },
  {
    name: "ゴブリン",
    hp: 45,
    attack: 10,
    xp: 45,
    money: 40,
    area: "草原",
    minLv: 2,
    maxLv: 8
  },
  {
    name: "オオカミ",
    hp: 60,
    attack: 13,
    xp: 60,
    money: 55,
    area: "草原",
    minLv: 3,
    maxLv: 10
  },
  {
    name: "スケルトン",
    hp: 80,
    attack: 15,
    xp: 75,
    money: 70,
    area: "遺跡",
    minLv: 4,
    maxLv: 12
  },
  {
    name: "オーク",
    hp: 100,
    attack: 18,
    xp: 100,
    money: 90,
    area: "山道",
    minLv: 6,
    maxLv: 15
  },
  {
    name: "ゴブリンキング",
    hp: 150,
    attack: 24,
    xp: 200,
    money: 220,
    area: "山道",
    minLv: 8,
    maxLv: 18
  },
  {
    name: "ミノタウロス",
    hp: 180,
    attack: 30,
    xp: 260,
    money: 300,
    area: "遺跡",
    minLv: 10,
    maxLv: 20
  },
  {
    name: "闇の騎士",
    hp: 180,
    attack: 20,
    xp: 130,
    money: 120,
    area: "都市周辺",
    minLv: 7,
    maxLv: 20
  },
  {
    name: "吸血鬼",
    hp: 220,
    attack: 25,
    xp: 180,
    money: 180,
    area: "都市周辺",
    minLv: 10,
    maxLv: 25
  },
  {
    name: "魔法使い",
    hp: 250,
    attack: 30,
    xp: 220,
    money: 230,
    area: "魔境",
    minLv: 12,
    maxLv: 30
  },
  {
    name: "ドラゴン",
    hp: 300,
    attack: 35,
    xp: 350,
    money: 400,
    area: "魔境",
    minLv: 15,
    maxLv: 35
  },
  {
    name: "デーモン",
    hp: 350,
    attack: 38,
    xp: 400,
    money: 500,
    area: "魔境",
    minLv: 18,
    maxLv: 40
  },
  {
    name: "古代竜",
    hp: 450,
    attack: 48,
    xp: 650,
    money: 800,
    area: "魔王城",
    minLv: 20,
    maxLv: 50
  },
  {
    name: "魔王",
    hp: 400,
    attack: 40,
    xp: 500,
    money: 600,
    area: "魔王城",
    minLv: 20,
    maxLv: 50
  }
];

const skills = {
  "斬撃": 35,
  "高速切り": 65,
  "ヒール": 25,
  "強斬り": 50,
  "回転斬り": 80,
  "超斬撃": 120
};

const jobs = {
  "勇者": {
    hp: 30,
    attack: 0,
    skill: "斬撃"
  },
  "ヒーラー": {
    hp: 30,
    attack: 0,
    skill: "ヒール"
  },
  "剣士": {
    hp: 30,
    attack: 0,
    skill: "斬撃"
  }
};

let player = loadPlayer();

let enemy = null;
let defending = false;
let selectedJob = player.job || "勇者";

function defaultPlayer() {
  return {
    name: "勇者",
    job: "勇者",

    maxHp: 30,
    hp: 30,

    level: 0,
    xp: 0,

    attack: 0,

    money: 250,
    bounty: 0,

    weapon: "タガー",
    inventory: ["タガー"],

    skills: [],

    defeats: 0,

    area: "草原",
    day: 1,

    townUnlocked: false,
    cityUnlocked: false
  };
}

function loadPlayer() {
  try {
    const saved = localStorage.getItem(SAVE_KEY);

    if (!saved) {
      return defaultPlayer();
    }

    const data = JSON.parse(saved);

    return {
      ...defaultPlayer(),
      ...data
    };
  } catch (error) {
    console.error("セーブ読み込みエラー:", error);
    return defaultPlayer();
  }
}

function savePlayer() {
  localStorage.setItem(SAVE_KEY, JSON.stringify(player));
}

function $(id) {
  return document.getElementById(id);
}

function show(id) {
  const element = $(id);

  if (element) {
    element.style.display = "";
  }
}

function hide(id) {
  const element = $(id);

  if (element) {
    element.style.display = "none";
  }
}

function setText(id, text) {
  const element = $(id);

  if (element) {
    element.textContent = text;
  }
}

function log(message) {
  const logElement =
    $("log") ||
    $("battleLog") ||
    $("message");

  if (!logElement) return;

  const line = document.createElement("div");
  line.textContent = message;

  logElement.appendChild(line);

  logElement.scrollTop = logElement.scrollHeight;
}

function updateStatus() {
  setText("playerName", player.name);
  setText("job", player.job);
  setText("level", player.level);
  setText("hp", `${player.hp} / ${player.maxHp}`);
  setText("xp", player.xp);
  setText("attack", player.attack);
  setText("money", `${player.money}円`);
  setText("bounty", `${player.bounty}円`);
  setText("weapon", player.weapon);
  setText("area", player.area);
  setText("defeats", player.defeats);

  const hpBar = $("hpBar");

  if (hpBar) {
    const percent =
      player.maxHp > 0
        ? Math.max(0, Math.min(100, player.hp / player.maxHp * 100))
        : 0;

    hpBar.style.width = `${percent}%`;
  }

  savePlayer();
}

function startGame() {
  hide("startScreen");
  show("gameScreen");

  updateStatus();

  log("勇者の懸賞金RPGへようこそ！");
  log("敵を倒してXPとお金を集めよう！");
}

function randomMonster(stronger = false) {
  let available = monsters.filter(monster => {
    return (
      player.level >= monster.minLv &&
      player.level <= monster.maxLv
    );
  });

  if (available.length === 0) {
    available = monsters;
  }

  const base =
    available[Math.floor(Math.random() * available.length)];

  const multiplier = stronger ? 1.35 : 1;

  return {
    ...base,
    maxHp: Math.floor(base.hp * multiplier),
    hp: Math.floor(base.hp * multiplier),
    attack: Math.floor(base.attack * multiplier)
  };
}

function startBattle(stronger = false) {
  enemy = randomMonster(stronger);

  defending = false;

  show("battleScreen");

  setText("enemyName", enemy.name);
  setText("enemyHp", `${enemy.hp} / ${enemy.maxHp}`);

  log(`「${enemy.name}」が現れた！`);

  updateBattleButtons();
}

function startBossBattle() {
  enemy = {
    ...BOSS,
    maxHp: BOSS.hp,
    hp: BOSS.hp,
    currentHp: BOSS.hp,
    level: 50
  };

  defending = false;

  show("battleScreen");

  setText("enemyName", enemy.name);
  setText("enemyHp", `${enemy.hp} / ${enemy.maxHp}`);

  log(`「${enemy.name}」が現れた！`);
  log("巨大な懸賞金がかかったボスだ！");

  updateBattleButtons();
}

function updateBattleButtons() {
  const alive = enemy && enemy.hp > 0;

  [
    "attackBtn",
    "defendBtn",
    "skillBtn",
    "inspectBtn",
    "runBtn"
  ].forEach(id => {
    const button = $(id);

    if (button) {
      button.disabled = !alive;
    }
  });
}

function weaponPower() {
  if (player.weapon === "タガー") {
    return 15;
  }

  if (player.weapon === "剣") {
    return 5;
  }

  if (player.weapon === "強化剣") {
    return 25;
  }

  return 0;
}

function calculateDamage(skillName = null) {
  let damage =
    player.attack +
    weaponPower();

  if (skillName && skills[skillName]) {
    damage += skills[skillName];
  }

  damage = Math.max(1, damage);

  const critical = Math.random() < 0.15;

  if (critical) {
    damage += 5;
  }

  return {
    damage,
    critical
  };
}

function attackEnemy() {
  if (!enemy || enemy.hp <= 0) return;

  const result = calculateDamage();

  enemy.hp -= result.damage;

  if (result.critical) {
    log(`クリティカルヒット！ ${result.damage}ダメージ！`);
  } else {
    log(`${result.damage}ダメージを与えた！`);
  }

  updateEnemyHp();

  if (enemy.hp <= 0) {
    winBattle();
    return;
  }

  enemyTurn();
}

function defend() {
  if (!enemy || enemy.hp <= 0) return;

  defending = true;

  log("ボウギョした！");

  enemyTurn();
}

function useSkill() {
  if (!enemy || enemy.hp <= 0) return;

  let skillName = null;

  if (player.skills.length > 0) {
    skillName = player.skills[0];
  } else {
    skillName = player.job === "ヒーラー"
      ? "ヒール"
      : "斬撃";
  }

  if (skillName === "ヒール") {
    const heal = skills[skillName];

    player.hp = Math.min(
      player.maxHp,
      player.hp + heal
    );

    log(`ヒール！ HPが${heal}回復した！`);

    updateStatus();

    enemyTurn();
    return;
  }

  const result = calculateDamage(skillName);

  enemy.hp -= result.damage;

  log(`${skillName}！ ${result.damage}ダメージ！`);

  updateEnemyHp();

  if (enemy.hp <= 0) {
    winBattle();
    return;
  }

  enemyTurn();
}

function inspectEnemy() {
  if (!enemy) return;

  log(
    `${enemy.name} HP:${enemy.hp}/${enemy.maxHp} 攻撃:${enemy.attack}`
  );
}

function runBattle() {
  if (!enemy) return;

  if (Math.random() < 0.7) {
    log("逃げ出した！");
    enemy = null;
    hide("battleScreen");
    return;
  }

  log("逃げられなかった！");
  enemyTurn();
}

function enemyTurn() {
  if (!enemy || enemy.hp <= 0) return;

  let damage = enemy.attack;

  if (defending) {
    damage = Math.floor(damage / 2);
    defending = false;
  }

  damage = Math.max(1, damage);

  player.hp -= damage;

  log(`${enemy.name}の攻撃！ ${damage}ダメージ！`);

  if (player.hp <= 0) {
    player.hp = 0;

    updateStatus();

    log("勇者は倒れてしまった……");

    setTimeout(() => {
      gameOver();
    }, 500);

    return;
  }

  updateStatus();
}

function updateEnemyHp() {
  if (!enemy) return;

  setText(
    "enemyHp",
    `${Math.max(0, enemy.hp)} / ${enemy.maxHp}`
  );

  const bar = $("enemyHpBar");

  if (bar) {
    const percent =
      enemy.maxHp > 0
        ? Math.max(0, enemy.hp / enemy.maxHp * 100)
        : 0;

    bar.style.width = `${percent}%`;
  }
}

function winBattle() {
  if (!enemy) return;

  const defeatedEnemy = enemy;

  log(`${defeatedEnemy.name}を倒した！`);
  log(`${defeatedEnemy.name}が${defeatedEnemy.money}円を落とした！`);
  log(`${defeatedEnemy.xp}XPを獲得した！`);

  player.money += defeatedEnemy.money;
  player.xp += defeatedEnemy.xp;
  player.bounty += defeatedEnemy.xp;
  player.defeats++;

  if (player.defeats >= 3) {
    player.townUnlocked = true;
    player.cityUnlocked = true;
  }

  checkLevelUp();

  enemy = null;

  updateStatus();
  updateBattleButtons();

  setTimeout(() => {
    hide("battleScreen");
  }, 700);
}

function checkLevelUp() {
  const need = 100 + player.level * 50;

  if (player.xp < need) return;

  player.xp -= need;
  player.level++;

  log(`レベル${player.level}になった！`);
  log("レベルアップボーナスを選んでください。");

  showLevelChoices();
}

function showLevelChoices() {
  const choiceBox = $("levelChoices");

  if (!choiceBox) return;

  choiceBox.innerHTML = "";

  const hpButton = document.createElement("button");
  hpButton.textContent = "HP増加（+5）";
  hpButton.onclick = () => {
    player.maxHp += 5;
    player.hp += 5;

    log("最大HPが5増えた！");
    hide("levelChoices");

    updateStatus();
  };

  const attackButton = document.createElement("button");
  attackButton.textContent = "攻撃増加（+20）";
  attackButton.onclick = () => {
    player.attack += 20;

    log("攻撃力が20増えた！");
    hide("levelChoices");

    updateStatus();
  };

  const skillButton = document.createElement("button");
  skillButton.textContent = "スキル解放（+1）";
  skillButton.onclick = () => {
    const skillList = Object.keys(skills);

    const next =
      skillList.find(skill => !player.skills.includes(skill));

    if (next) {
      player.skills.push(next);
      log(`スキル「${next}」を解放した！`);
    } else {
      log("解放できる新しいスキルがありません。");
    }

    hide("levelChoices");

    updateStatus();
  };

  choiceBox.appendChild(hpButton);
  choiceBox.appendChild(attackButton);
  choiceBox.appendChild(skillButton);

  show("levelChoices");
}

function chooseJob(jobName) {
  if (!jobs[jobName]) return;

  selectedJob = jobName;

  player.job = jobName;

  player.maxHp = jobs[jobName].hp;
  player.hp = player.maxHp;

  player.attack = jobs[jobName].attack;

  if (jobName === "勇者" || jobName === "剣士") {
    if (!player.skills.includes("斬撃")) {
      player.skills.push("斬撃");
    }
  }

  if (jobName === "ヒーラー") {
    if (!player.skills.includes("ヒール")) {
      player.skills.push("ヒール");
    }
  }

  log(`職業を「${jobName}」に変更した！`);

  updateStatus();

  hide("jobScreen");
}

function openJobs() {
  show("jobScreen");
}

function openSkills() {
  const box = $("skillsList");

  if (!box) return;

  box.innerHTML = "";

  const allSkills = Object.entries(skills);

  allSkills.forEach(([name, damage]) => {
    const div = document.createElement("div");

    const unlocked =
      player.skills.includes(name);

    div.textContent =
      `${name}：${damage}ダメージ ${unlocked ? "【解放済み】" : "【未解放】"}`;

    box.appendChild(div);
  });

  show("skillsScreen");
}

function openLevel() {
  const box = $("levelInfo");

  if (box) {
    box.textContent =
      `レベル：${player.level}\nXP：${player.xp}`;
  }

  show("levelScreen");
}

function openBook() {
  const box = $("bookList");

  if (!box) return;

  box.innerHTML = "";

  monsters.forEach(monster => {
    const div = document.createElement("div");

    div.textContent =
      `${monster.name} / HP${monster.hp} / Lv${monster.minLv}～${monster.maxLv} / ${monster.area} / XP${monster.xp}`;

    box.appendChild(div);
  });

  const bossDiv = document.createElement("div");

  bossDiv.textContent =
    `${BOSS.name} / HP${BOSS.hp} / 攻撃${BOSS.attack} / XP${BOSS.xp}`;

  box.appendChild(bossDiv);

  show("bookScreen");
}

function openBag() {
  const box = $("bagList");

  if (!box) return;

  box.innerHTML = "";

  player.inventory.forEach((item, index) => {
    const div = document.createElement("div");

    div.textContent = item;

    div.onclick = () => {
      equipItem(item);
    };

    box.appendChild(div);
  });

  show("bagScreen");
}

function equipItem(item) {
  player.weapon = item;

  log(`${item}を装備した！`);

  updateStatus();
}

function gachaNormal() {
  if (player.money < 50) {
    log("お金が足りない！");
    return;
  }

  player.money -= 50;

  const item =
    Math.random() < 0.5
      ? "タガー"
      : "剣";

  player.inventory.push(item);

  log(`ガチャで「${item}」を手に入れた！`);

  updateStatus();
  openBag();
}

function goTown() {
  if (!player.townUnlocked && player.defeats < 3) {
    log("まだ町へ行けない。あと3体倒そう！");
    return;
  }

  player.townUnlocked = true;
  player.area = "町";

  log("町へ到着した！");
  log("お手軽にショップで買い物ができる！");

  const event =
    Math.random() < 0.35;

  if (event) {
    const gift =
      Math.floor(Math.random() * 51) + 10;

    player.money += gift;

    log(`町の人が${gift}円を譲ってくれた！`);
  }

  updateStatus();
}

function goCity() {
  if (!player.cityUnlocked && player.defeats < 3) {
    log("まだ都市へ行けない。まず敵を3体倒そう！");
    return;
  }

  player.cityUnlocked = true;
  player.area = "都市";

  log("都市へ到着した！");
  log("超お手軽に買い物できる！");
  log("時々強い敵が現れるため注意！");

  updateStatus();

  if (Math.random() < 0.5) {
    startBattle(true);
  }
}

function healAtTown() {
  const cost = 30;

  if (player.money < cost) {
    log("30円必要です！");
    return;
  }

  player.money -= cost;
  player.hp = player.maxHp;

  log("宿屋でHPが全回復した！");

  updateStatus();
}

function resetGame() {
  const ok =
    confirm("本当にデータをリセットしますか？");

  if (!ok) return;

  localStorage.removeItem(SAVE_KEY);

  player = defaultPlayer();

  enemy = null;

  updateStatus();

  location.reload();
}

function gameOver() {
  player.hp = player.maxHp;

  player.money = 0;
  player.bounty = 0;

  player.level = 0;
  player.xp = 0;

  player.attack = 0;

  player.skills = [];

  player.inventory = ["タガー"];
  player.weapon = "タガー";

  player.defeats = 0;

  log("すべてのデータがリセットされた……");

  hide("battleScreen");

  updateStatus();
}

function setupButtons() {
  const actions = {
    startBtn: startGame,
    attackBtn: attackEnemy,
    defendBtn: defend,
    skillBtn: useSkill,
    inspectBtn: inspectEnemy,
    runBtn: runBattle,

    jobBtn: openJobs,
    skillsBtn: openSkills,
    levelBtn: openLevel,
    bookBtn: openBook,
    bagBtn: openBag,

    townBtn: goTown,
    cityBtn: goCity,
    townHealBtn: healAtTown,

    gachaBtn: gachaNormal,
    bossBtn: startBossBattle,

    resetBtn: resetGame
  };

  Object.entries(actions).forEach(([id, action]) => {
    const button = $(id);

    if (button) {
      button.addEventListener("click", action);
    }
  });

  document.querySelectorAll("[data-job]").forEach(button => {
    button.addEventListener("click", () => {
      chooseJob(button.dataset.job);
    });
  });

  document.querySelectorAll("[data-close]").forEach(button => {
    button.addEventListener("click", () => {
      hide(button.dataset.close);
    });
  });
}

function setupOnline() {
  const createRoomBtn = $("createRoomBtn");
  const joinRoomBtn = $("joinRoomBtn");
  const leaveRoomBtn = $("leaveRoomBtn");
  const chatSendBtn = $("chatSendBtn");
  const chatInput = $("chatInput");

  if (createRoomBtn) {
    createRoomBtn.addEventListener("click", () => {
      socket.emit("createRoom", {
        name: player.name
      });
    });
  }

  if (joinRoomBtn) {
    joinRoomBtn.addEventListener("click", () => {
      const input = $("roomId");

      if (!input) return;

      socket.emit("joinRoom", {
        roomId: input.value,
        name: player.name
      });
    });
  }

  if (leaveRoomBtn) {
    leaveRoomBtn.addEventListener("click", () => {
      socket.emit("leaveRoom");
    });
  }

  if (chatSendBtn && chatInput) {
    chatSendBtn.addEventListener("click", () => {
      const text = chatInput.value.trim();

      if (!text) return;

      socket.emit("chat", text);

      chatInput.value = "";
    });

    chatInput.addEventListener("keydown", event => {
      if (event.key === "Enter") {
        chatSendBtn.click();
      }
    });
  }

  socket.on("roomCreated", data => {
    setText("roomCode", data.roomId);

    log(`ルームを作成しました：${data.roomId}`);

    updateRoomPlayers(data.players);
  });

  socket.on("roomJoined", data => {
    setText("roomCode", data.roomId);

    log(`ルーム${data.roomId}に参加しました！`);

    updateRoomPlayers(data.players);
  });

  socket.on("roomPlayers", players => {
    updateRoomPlayers(players);
  });

  socket.on("roomError", message => {
    log(`ルームエラー：${message}`);
  });

  socket.on("systemMessage", message => {
    log(`[システム] ${message}`);
  });

  socket.on("chat", data => {
    const chatBox = $("chatLog");

    if (!chatBox) return;

    const line = document.createElement("div");

    line.textContent =
      `${data.name}: ${data.message}`;

    chatBox.appendChild(line);

    chatBox.scrollTop = chatBox.scrollHeight;
  });
}

function updateRoomPlayers(players) {
  const box = $("roomPlayers");

  if (!box) return;

  box.innerHTML = "";

  players.forEach(playerData => {
    const div = document.createElement("div");

    div.textContent = playerData.name;

    box.appendChild(div);
  });
}

function setupName() {
  const nameInput = $("nameInput");
  const nameSaveBtn = $("nameSaveBtn");

  if (!nameInput) return;

  nameInput.value = player.name;

  if (nameSaveBtn) {
    nameSaveBtn.addEventListener("click", () => {
      const name =
        nameInput.value.trim();

      if (!name) return;

      player.name = name.slice(0, 16);

      savePlayer();
      updateStatus();

      log(`名前を「${player.name}」に変更しました。`);
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  setupButtons();
  setupOnline();
  setupName();
  updateStatus();

  hide("gameScreen");
  hide("battleScreen");
  hide("jobScreen");
  hide("skillsScreen");
  hide("levelScreen");
  hide("bookScreen");
  hide("bagScreen");
});
