const socket = io();

const SAVE_KEY = "yuusha_bounty_rpg_online_final";

const BOSS = {
  name: "懸賞金王",
  hp: 500,
  attack: 45,
  xp: 1000,
  money: 1000
};

const SKILLS = {
  "斬撃": 35,
  "高速切り": 65
};

const JOBS = {
  "勇者": {
    hp: 30,
    attack: 0,
    skill: "斬撃"
  },

  "ヒーラー": {
    hp: 35,
    attack: 0,
    skill: "ヒール"
  },

  "剣士": {
    hp: 30,
    attack: 0,
    skill: "斬撃"
  }
};

const MONSTERS = [
  {
    name: "怪物猫",
    hp: 20,
    attack: 5,
    xp: 25,
    money: 20,
    min: 1,
    max: 5,
    area: "草原"
  },

  {
    name: "スライム",
    hp: 60,
    attack: 7,
    xp: 30,
    money: 25,
    min: 1,
    max: 6,
    area: "草原"
  },

  {
    name: "ゴブリン",
    hp: 80,
    attack: 10,
    xp: 45,
    money: 40,
    min: 2,
    max: 8,
    area: "草原"
  },

  {
    name: "オオカミ",
    hp: 100,
    attack: 13,
    xp: 60,
    money: 55,
    min: 3,
    max: 10,
    area: "草原"
  },

  {
    name: "スケルトン",
    hp: 120,
    attack: 15,
    xp: 75,
    money: 70,
    min: 4,
    max: 12,
    area: "遺跡"
  },

  {
    name: "オーク",
    hp: 150,
    attack: 18,
    xp: 100,
    money: 90,
    min: 6,
    max: 15,
    area: "山道"
  },

  {
    name: "ゴブリンキング",
    hp: 230,
    attack: 24,
    xp: 200,
    money: 220,
    min: 7,
    max: 20,
    area: "山道"
  },

  {
    name: "ミノタウロス",
    hp: 280,
    attack: 30,
    xp: 260,
    money: 300,
    min: 8,
    max: 25,
    area: "遺跡"
  },

  {
    name: "闇の騎士",
    hp: 180,
    attack: 20,
    xp: 130,
    money: 120,
    min: 7,
    max: 20,
    area: "都市周辺"
  },

  {
    name: "吸血鬼",
    hp: 220,
    attack: 25,
    xp: 180,
    money: 180,
    min: 10,
    max: 25,
    area: "都市周辺"
  },

  {
    name: "魔法使い",
    hp: 250,
    attack: 30,
    xp: 220,
    money: 230,
    min: 12,
    max: 30,
    area: "魔境"
  },

  {
    name: "デーモン",
    hp: 350,
    attack: 38,
    xp: 400,
    money: 500,
    min: 15,
    max: 40,
    area: "魔境"
  },

  {
    name: "ドラゴン",
    hp: 300,
    attack: 35,
    xp: 350,
    money: 400,
    min: 15,
    max: 35,
    area: "魔境"
  },

  {
    name: "古代竜",
    hp: 450,
    attack: 48,
    xp: 650,
    money: 800,
    min: 18,
    max: 45,
    area: "魔王城"
  },

  {
    name: "魔王",
    hp: 400,
    attack: 40,
    xp: 500,
    money: 600,
    min: 20,
    max: 50,
    area: "魔王城"
  }
];


let player = {
  name: "勇者",
  job: "勇者",

  level: 0,
  xp: 0,

  hp: 30,
  maxHp: 30,

  attack: 0,

  money: 250,
  bounty: 0,

  weapon: "タガー",

  inventory: ["タガー"],

  skills: [],

  defeats: 0,

  area: "草原",

  townUnlocked: false,
  cityUnlocked: false
};


let battle = null;
let currentRoom = null;
let defending = false;
let levelUpWaiting = false;


function $(id) {
  return document.getElementById(id);
}


function log(message) {

  const box = $("log");

  if (!box) return;

  const line = document.createElement("div");

  line.textContent = message;

  box.appendChild(line);

  box.scrollTop = box.scrollHeight;
}


function chatLog(name, message) {

  const box = $("chatLog");

  if (!box) return;

  const div = document.createElement("div");

  div.className = "chat-message";

  div.innerHTML =
    `<span class="chat-name">${escapeHtml(name)}</span>：${escapeHtml(message)}`;

  box.appendChild(div);

  box.scrollTop = box.scrollHeight;
}


function escapeHtml(text) {

  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function saveGame() {

  localStorage.setItem(
    SAVE_KEY,
    JSON.stringify(player)
  );
}


function loadGame() {

  try {

    const saved =
      JSON.parse(localStorage.getItem(SAVE_KEY));

    if (!saved) return;

    player = {
      ...player,
      ...saved
    };

  } catch (e) {

    console.log("セーブデータ読み込み失敗");
  }
}


function updateStatus() {

  $("playerName").textContent = player.name;
  $("job").textContent = player.job;
  $("level").textContent = player.level;

  $("hp").textContent = player.hp;
  $("maxHp").textContent = player.maxHp;

  $("attack").textContent = player.attack;

  $("xp").textContent = player.xp;

  $("money").textContent = player.money;
  $("bounty").textContent = player.bounty;

  $("weapon").textContent = player.weapon;

  $("area").textContent = player.area;

  $("defeats").textContent = player.defeats;

  const percent =
    Math.max(
      0,
      Math.min(
        100,
        (player.hp / player.maxHp) * 100
      )
    );

  $("hpBar").style.width = `${percent}%`;

  saveGame();

  if (currentRoom) {

    socket.emit(
      "playerUpdate",
      {
        name: player.name,
        hp: player.hp,
        maxHp: player.maxHp,
        level: player.level,
        bounty: player.bounty,
        money: player.money,
        job: player.job,
        area: player.area
      }
    );
  }
}


function sendOnlineBattleLog(message) {

  log(message);

  if (currentRoom) {

    socket.emit(
      "battleLog",
      message
    );
  }
}


function startGame() {

  const name =
    $("nameInput").value.trim() || "勇者";

  const job =
    $("jobInput").value;

  player.name = name;
  player.job = job;

  const jobData = JOBS[job];

  player.maxHp = jobData.hp;
  player.hp = player.maxHp;

  player.attack = jobData.attack;

  player.skills = [];

  player.weapon = "タガー";

  player.inventory = ["タガー"];

  player.level = 0;
  player.xp = 0;

  player.money = 250;
  player.bounty = 0;

  player.defeats = 0;
  player.area = "草原";

  $("startScreen").classList.add("hidden");
  $("gameScreen").classList.remove("hidden");

  log("勇者の懸賞金RPGを開始しました！");
  log(`役職「${job}」を選択しました。`);
  log("現在HP30、レベル0、スキルなし。");
  log("敵を倒してレベルを上げよう！");

  updateStatus();
}


function startBattle() {

  if (battle) {

    log("現在すでに戦闘中です！");
    return;
  }

  const possible =
    MONSTERS.filter(monster => {

      return (
        player.level >= monster.min &&
        player.level <= monster.max &&
        monster.area === player.area
      );
    });

  let pool = possible;

  if (pool.length === 0) {

    pool = MONSTERS.filter(
      monster =>
        monster.area === player.area
    );
  }

  if (pool.length === 0) {

    pool = MONSTERS;
  }

  const base =
    pool[Math.floor(Math.random() * pool.length)];

  battle = {
    type: "normal",

    enemy: {
      ...base,

      maxHp: base.hp
    }
  };

  defending = false;

  $("battleScreen").classList.remove("hidden");

  updateBattleUI();

  sendOnlineBattleLog(
    `${battle.enemy.name}が現れた！`
  );
}


function startBossBattle() {

  if (battle) {

    log("現在すでに戦闘中です！");
    return;
  }

  battle = {

    type: "boss",

    enemy: {
      ...BOSS,
      maxHp: BOSS.hp
    }
  };

  defending = false;

  $("battleScreen").classList.remove("hidden");

  updateBattleUI();

  sendOnlineBattleLog(
    `${BOSS.name}が現れた！`
  );
}


function updateBattleUI() {

  if (!battle) return;

  $("enemyName").textContent =
    battle.enemy.name;

  $("enemyHp").textContent =
    battle.enemy.hp;

  $("enemyMaxHp").textContent =
    battle.enemy.maxHp;

  const percent =
    Math.max(
      0,
      Math.min(
        100,
        (battle.enemy.hp /
          battle.enemy.maxHp) * 100
      )
    );

  $("enemyHpBar").style.width =
    `${percent}%`;
}


function getWeaponDamage() {

  if (player.weapon === "タガー") {
    return 15;
  }

  if (player.weapon === "剣") {
    return 5;
  }

  return 0;
}


function calculateDamage(skillPower = 0) {

  let damage =
    player.attack +
    getWeaponDamage() +
    skillPower;

  if (damage < 1) {
    damage = 1;
  }

  let critical = false;

  if (Math.random() < 0.15) {

    critical = true;
    damage += 5;
  }

  return {
    damage,
    critical
  };
}


function attackEnemy() {

  if (!battle) {

    startBattle();
    return;
  }

  const result =
    calculateDamage();

  battle.enemy.hp -= result.damage;

  if (battle.enemy.hp < 0) {
    battle.enemy.hp = 0;
  }

  let message =
    `${battle.enemy.name}に${result.damage}ダメージを与えた！`;

  if (result.critical) {
    message += " クリティカルヒット！";
  }

  sendOnlineBattleLog(message);

  updateBattleUI();

  if (battle.enemy.hp <= 0) {

    winBattle();
    return;
  }

  enemyTurn();
}


function defend() {

  if (!battle) {

    log("敵がいません。");
    return;
  }

  defending = true;

  sendOnlineBattleLog(
    "ボウギョした！"
  );

  enemyTurn();
}


function useSkill() {

  if (!battle) {

    log("敵がいません。");
    return;
  }

  if (player.skills.length === 0) {

    sendOnlineBattleLog(
      "まだスキルを覚えていない！"
    );

    return;
  }

  const skill =
    player.skills[0];

  const power =
    SKILLS[skill] || 0;

  const result =
    calculateDamage(power);

  battle.enemy.hp -= result.damage;

  if (battle.enemy.hp < 0) {
    battle.enemy.hp = 0;
  }

  let message =
    `スキル「${skill}」！ ${battle.enemy.name}に${result.damage}ダメージ！`;

  if (result.critical) {
    message += " クリティカルヒット！";
  }

  sendOnlineBattleLog(message);

  updateBattleUI();

  if (battle.enemy.hp <= 0) {

    winBattle();
    return;
  }

  enemyTurn();
}


function inspectEnemy() {

  if (!battle) {

    log("調べる敵がいません。");
    return;
  }

  sendOnlineBattleLog(
    `${battle.enemy.name} HP:${battle.enemy.hp}/${battle.enemy.maxHp} 攻撃:${battle.enemy.attack}`
  );
}


function runBattle() {

  if (!battle) {

    log("戦闘していません。");
    return;
  }

  if (battle.type === "boss") {

    sendOnlineBattleLog(
      "ボスからは逃げられない！"
    );

    return;
  }

  if (Math.random() < 0.7) {

    sendOnlineBattleLog(
      "逃げ出した！"
    );

    battle = null;

    $("battleScreen").classList.add("hidden");

  } else {

    sendOnlineBattleLog(
      "逃げられなかった！"
    );

    enemyTurn();
  }
}


function enemyTurn() {

  if (!battle) return;

  let damage =
    battle.enemy.attack;

  if (defending) {

    damage =
      Math.floor(damage / 2);

    defending = false;

    sendOnlineBattleLog(
      `ボウギョでダメージを半減した！`
    );
  }

  player.hp -= damage;

  if (player.hp < 0) {
    player.hp = 0;
  }

  sendOnlineBattleLog(
    `${battle.enemy.name}から${damage}ダメージを受けた！`
  );

  updateStatus();

  if (player.hp <= 0) {

    gameOver();
  }
}


function winBattle() {

  if (!battle) return;

  const enemy =
    battle.enemy;

  player.xp += enemy.xp;
  player.money += enemy.money;

  player.defeats++;

  player.bounty +=
    enemy.money;

  sendOnlineBattleLog(
    `${enemy.name}を倒した！`
  );

  sendOnlineBattleLog(
    `${enemy.name}は${enemy.money}円を落とした！`
  );

  sendOnlineBattleLog(
    `${enemy.xp}XPを獲得した！`
  );

  battle = null;

  $("battleScreen").classList.add("hidden");

  updateStatus();

  checkUnlocks();

  checkLevelUp();
}


function checkUnlocks() {

  if (
    player.defeats >= 3 &&
    !player.townUnlocked
  ) {

    player.townUnlocked = true;

    log(
      "町へ行けるようになった！"
    );
  }

  if (
    player.defeats >= 10 &&
    !player.cityUnlocked
  ) {

    player.cityUnlocked = true;

    log(
      "都市へ行けるようになった！"
    );
  }
}


function getNextXP() {

  return 50 + player.level * 50;
}


function checkLevelUp() {

  if (
    player.xp >= getNextXP()
  ) {

    player.xp -= getNextXP();

    player.level++;

    levelUpWaiting = true;

    $("levelChoices")
      .classList.remove("hidden");

    log(
      `レベル${player.level}になった！`
    );

    log(
      "どれを選びますか？"
    );
  }
}


function chooseHPLevel() {

  if (!levelUpWaiting) return;

  player.maxHp += 5;
  player.hp += 5;

  finishLevelUp(
    "HPが5増えた！"
  );
}


function chooseAttackLevel() {

  if (!levelUpWaiting) return;

  player.attack += 20;

  finishLevelUp(
    "攻撃力が20増えた！"
  );
}


function chooseSkillLevel() {

  if (!levelUpWaiting) return;

  let nextSkill = null;

  if (!player.skills.includes("斬撃")) {

    nextSkill = "斬撃";

  } else if (!player.skills.includes("高速切り")) {

    nextSkill = "高速切り";
  }

  if (nextSkill) {

    player.skills.push(nextSkill);

    finishLevelUp(
      `スキル「${nextSkill}」を覚えた！`
    );

  } else {

    log(
      "覚えられるスキルがありません。"
    );
  }
}


function finishLevelUp(message) {

  levelUpWaiting = false;

  $("levelChoices")
    .classList.add("hidden");

  log(message);

  updateStatus();

  checkLevelUp();
}


function openSkills() {

  let text = "";

  if (player.skills.length === 0) {

    text = "まだスキルを覚えていません。";

  } else {

    for (const skill of player.skills) {

      text +=
        `${skill}：${SKILLS[skill]}ダメージ<br>`;
    }
  }

  showInfo(
    "✨ スキル情報",
    text
  );
}


function openLevel() {

  showInfo(
    "⬆️ レベル確認",
    `
    レベル：${player.level}<br>
    XP：${player.xp}<br>
    次のレベルまで：${getNextXP()}XP<br>
    HP：${player.hp}/${player.maxHp}<br>
    攻撃：${player.attack}
    `
  );
}


function openBook() {

  let html = `
    <table>
      <tr>
        <th>怪物</th>
        <th>HP</th>
        <th>Lv</th>
        <th>エリア</th>
        <th>XP</th>
      </tr>
  `;

  for (const monster of MONSTERS) {

    html += `
      <tr>
        <td>${monster.name}</td>
        <td>${monster.hp}</td>
        <td>${monster.min}～${monster.max}</td>
        <td>${monster.area}</td>
        <td>${monster.xp}</td>
      </tr>
    `;
  }

  html += "</table>";

  showInfo(
    "📚 図鑑表確認",
    html
  );
}


function openBag() {

  const items =
    player.inventory.length
      ? player.inventory.join("<br>")
      : "空っぽ";

  showInfo(
    "🎒 バック",
    `
    ${items}
    <hr>
    装備中：${player.weapon}
    `
  );
}


function showInfo(title, content) {

  $("infoTitle").textContent = title;

  $("infoContent").innerHTML =
    content;

  $("infoPanel")
    .classList.remove("hidden");
}


function closeInfo() {

  $("infoPanel")
    .classList.add("hidden");
}


function normalGacha() {

  const cost = 50;

  if (player.money < cost) {

    log(
      "お金が足りない！"
    );

    return;
  }

  player.money -= cost;

  const result =
    Math.random() < 0.5
      ? "タガー"
      : "剣";

  player.inventory.push(result);

  log(
    "ノーマルガチャを回した！"
  );

  if (result === "タガー") {

    log(
      "タガーを手に入れた！"
    );

  } else {

    log(
      "剣を手に入れた！"
    );
  }

  updateStatus();
}


function goTown() {

  if (!player.townUnlocked) {

    log(
      "町へ行くには3体の敵を倒してください。"
    );

    return;
  }

  player.area = "町";

  log(
    "町に到着した！"
  );

  log(
    "お手軽にショップで買い物ができる！"
  );

  log(
    "ランダムで何かを譲ってくれる人がいる…?"
  );

  log(
    "町の信頼度：15"
  );

  updateStatus();
}


function goCity() {

  if (!player.cityUnlocked) {

    log(
      "都市へ行くには10体の敵を倒してください。"
    );

    return;
  }

  player.area = "都市";

  log(
    "都市に到着した！"
  );

  log(
    "超お手軽に買い物できる！"
  );

  log(
    "時々強い敵が現れるため注意！"
  );

  log(
    "都市の信頼度：50"
  );

  updateStatus();
}


function healPlayer() {

  const cost = 30;

  if (player.hp >= player.maxHp) {

    log(
      "HPは満タンです！"
    );

    return;
  }

  if (player.money < cost) {

    log(
      "回復するお金が足りない！"
    );

    return;
  }

  player.money -= cost;

  player.hp =
    player.maxHp;

  log(
    "HPを全回復した！"
  );

  updateStatus();
}


function gameOver() {

  battle = null;

  $("gameScreen")
    .classList.add("hidden");

  $("gameOverScreen")
    .classList.remove("hidden");

  player = {
    name: "勇者",
    job: "勇者",

    level: 0,
    xp: 0,

    hp: 30,
    maxHp: 30,

    attack: 0,

    money: 250,
    bounty: 0,

    weapon: "タガー",

    inventory: ["タガー"],

    skills: [],

    defeats: 0,

    area: "草原",

    townUnlocked: false,
    cityUnlocked: false
  };

  localStorage.removeItem(SAVE_KEY);
}


function restartGame() {

  $("gameOverScreen")
    .classList.add("hidden");

  $("startScreen")
    .classList.remove("hidden");
}


function createRoom() {

  const name =
    $("nameInput").value.trim() || "勇者";

  socket.emit(
    "createRoom",
    { name }
  );
}


function joinRoom() {

  const roomId =
    $("roomCodeInput")
      .value
      .trim();

  const name =
    $("nameInput").value.trim() || "勇者";

  socket.emit(
    "joinRoom",
    {
      roomId,
      name
    }
  );
}


function leaveRoom() {

  socket.emit("leaveRoom");

  currentRoom = null;

  $("roomStatus").textContent =
    "未接続";

  $("roomInfo").textContent =
    "ルームなし";

  $("roomPlayers").innerHTML = "";

  $("connectionStatus").textContent =
    "🔴 オフライン";
}


function sendChat() {

  const input =
    $("chatInput");

  const message =
    input.value.trim();

  if (!message) return;

  if (!currentRoom) {

    chatLog(
      "システム",
      "先にオンラインルームへ参加してください。"
    );

    return;
  }

  socket.emit(
    "chat",
    message
  );

  input.value = "";
}


function renderPlayers(players) {

  const box =
    $("roomPlayers");

  box.innerHTML = "";

  if (!players || players.length === 0) {

    box.textContent =
      "プレイヤーはいません。";

    return;
  }

  for (const p of players) {

    const card =
      document.createElement("div");

    card.className =
      "player-card";

    card.innerHTML = `
      <div class="player-name">
        👤 ${escapeHtml(p.name)}
      </div>

      <div class="player-details">
        ${escapeHtml(p.job)}
        ／ Lv.${p.level}
        ／ HP ${p.hp}/${p.maxHp}
        ／ 💰${p.money}円
        ／ 💰懸賞金${p.bounty}円
        ／ ${escapeHtml(p.area)}
      </div>
    `;

    box.appendChild(card);
  }
}


/* =========================
   Socket.IO
========================= */

socket.on("connect", () => {

  $("connectionStatus").textContent =
    "🟢 オンライン";

});


socket.on("disconnect", () => {

  $("connectionStatus").textContent =
    "🔴 オフライン";

});


socket.on("roomCreated", data => {

  currentRoom =
    data.roomId;

  $("roomStatus").textContent =
    `ルーム作成成功：${data.roomId}`;

  $("roomInfo").textContent =
    `ルームID：${data.roomId}`;

  renderPlayers(data.players);

  log(
    `オンラインルーム「${data.roomId}」を作成しました！`
  );

});


socket.on("roomJoined", data => {

  currentRoom =
    data.roomId;

  $("roomStatus").textContent =
    `参加中：${data.roomId}`;

  $("roomInfo").textContent =
    `ルームID：${data.roomId}`;

  renderPlayers(data.players);

  log(
    `ルーム「${data.roomId}」に参加しました！`
  );

});


socket.on("roomError", message => {

  $("roomStatus").textContent =
    message;

  log(
    `オンライン：${message}`
  );

});


socket.on("playersUpdate", players => {

  renderPlayers(players);

});


socket.on("publicMessage", data => {

  chatLog(
    data.name,
    data.message
  );

});


socket.on("onlineBattleLog", data => {

  if (!data) return;

  log(
    `🌐 ${data.name}：${data.message}`
  );

});


/* =========================
   ボタン
========================= */

$("startBtn")
  .addEventListener(
    "click",
    startGame
  );


$("createRoomBtn")
  .addEventListener(
    "click",
    createRoom
  );


$("joinRoomBtn")
  .addEventListener(
    "click",
    joinRoom
  );


$("leaveRoomBtn")
  .addEventListener(
    "click",
    leaveRoom
  );


$("chatSendBtn")
  .addEventListener(
    "click",
    sendChat
  );


$("chatInput")
  .addEventListener(
    "keydown",
    e => {

      if (e.key === "Enter") {
        sendChat();
      }

    }
  );


$("attackBtn")
  .addEventListener(
    "click",
    attackEnemy
  );


$("defendBtn")
  .addEventListener(
    "click",
    defend
  );


$("skillBtn")
  .addEventListener(
    "click",
    useSkill
  );


$("inspectBtn")
  .addEventListener(
    "click",
    inspectEnemy
  );


$("runBtn")
  .addEventListener(
    "click",
    runBattle
  );


$("hpLevelBtn")
  .addEventListener(
    "click",
    chooseHPLevel
  );


$("attackLevelBtn")
  .addEventListener(
    "click",
    chooseAttackLevel
  );


$("skillLevelBtn")
  .addEventListener(
    "click",
    chooseSkillLevel
  );


$("skillsBtn")
  .addEventListener(
    "click",
    openSkills
  );


$("levelBtn")
  .addEventListener(
    "click",
    openLevel
  );


$("bookBtn")
  .addEventListener(
    "click",
    openBook
  );


$("bagBtn")
  .addEventListener(
    "click",
    openBag
  );


$("gachaBtn")
  .addEventListener(
    "click",
    normalGacha
  );


$("townBtn")
  .addEventListener(
    "click",
    goTown
  );


$("cityBtn")
  .addEventListener(
    "click",
    goCity
  );


$("healBtn")
  .addEventListener(
    "click",
    healPlayer
  );


$("bossBtn")
  .addEventListener(
    "click",
    startBossBattle
  );


$("closeInfoBtn")
  .addEventListener(
    "click",
    closeInfo
  );


$("restartBtn")
  .addEventListener(
    "click",
    restartGame
  );


/* セーブデータ読み込み */
loadGame();
updateStatus();
