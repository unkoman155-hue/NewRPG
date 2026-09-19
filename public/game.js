const SAVE_KEY = "yuusha_bounty_rpg_online_final";

/* =========================
   オンライン接続
========================= */

let socket = null;
let onlineEnabled = false;

try {
  if (typeof io === "function") {
    socket = io();
    onlineEnabled = true;
  }
} catch (error) {
  console.log("オンライン接続なしで起動します。");
}


/* =========================
   ボス
========================= */

const BOSS = {
  name: "懸賞金王",
  hp: 500,
  attack: 45,
  xp: 1000,
  money: 1000
};


/* =========================
   スキル
========================= */

const SKILLS = {
  "斬撃": 35,
  "高速切り": 65
};


/* =========================
   職業
========================= */

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


/* =========================
   モンスター
========================= */

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


/* =========================
   プレイヤー
========================= */

function createNewPlayer() {
  return {
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

    inventory: [
      "タガー"
    ],

    skills: [],

    defeats: 0,

    area: "草原",

    townUnlocked: false,
    cityUnlocked: false
  };
}

let player = createNewPlayer();

let battle = null;
let currentRoom = null;
let defending = false;
let levelUpWaiting = false;


/* =========================
   要素取得
========================= */

function $(id) {
  return document.getElementById(id);
}


/* =========================
   メッセージ
========================= */

function log(message) {

  const box = $("log");

  if (!box) return;

  const line =
    document.createElement("div");

  line.textContent =
    message;

  box.appendChild(line);

  box.scrollTop =
    box.scrollHeight;
}


/* =========================
   チャット
========================= */

function escapeHtml(text) {

  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function chatLog(name, message) {

  const box =
    $("chatLog");

  if (!box) return;

  const div =
    document.createElement("div");

  div.className =
    "chat-message";

  div.innerHTML =
    `<span class="chat-name">${escapeHtml(name)}</span>：${escapeHtml(message)}`;

  box.appendChild(div);

  box.scrollTop =
    box.scrollHeight;
}


/* =========================
   セーブ
========================= */

function saveGame() {

  try {

    localStorage.setItem(
      SAVE_KEY,
      JSON.stringify(player)
    );

  } catch (error) {

    console.log(
      "セーブできませんでした。"
    );
  }
}


function loadGame() {

  try {

    const saved =
      JSON.parse(
        localStorage.getItem(
          SAVE_KEY
        )
      );

    if (!saved) return;

    player = {
      ...createNewPlayer(),
      ...saved
    };

  } catch (error) {

    console.log(
      "セーブデータ読み込み失敗"
    );
  }
}


/* =========================
   ステータス
========================= */

function updateStatus() {

  if (!$("playerName")) return;

  $("playerName").textContent =
    player.name;

  $("job").textContent =
    player.job;

  $("level").textContent =
    player.level;

  $("hp").textContent =
    player.hp;

  $("maxHp").textContent =
    player.maxHp;

  $("attack").textContent =
    player.attack;

  $("xp").textContent =
    player.xp;

  $("money").textContent =
    player.money;

  $("bounty").textContent =
    player.bounty;

  $("weapon").textContent =
    player.weapon;

  $("area").textContent =
    player.area;

  $("defeats").textContent =
    player.defeats;

  const percent =
    Math.max(
      0,
      Math.min(
        100,
        player.hp /
          player.maxHp *
          100
      )
    );

  $("hpBar").style.width =
    `${percent}%`;

  saveGame();

  sendPlayerUpdate();
}


/* =========================
   オンラインログ
========================= */

function onlineBattleLog(message) {

  log(message);

  if (
    socket &&
    onlineEnabled &&
    currentRoom
  ) {

    try {

      socket.emit(
        "battleLog",
        message
      );

    } catch (error) {

      console.log(
        "オンラインログ送信失敗"
      );
    }
  }
}


/* =========================
   プレイヤー情報送信
========================= */

function sendPlayerUpdate() {

  if (
    !socket ||
    !onlineEnabled ||
    !currentRoom
  ) {
    return;
  }

  try {

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

  } catch (error) {

    console.log(
      "プレイヤー情報送信失敗"
    );
  }
}


/* =========================
   ゲーム開始
========================= */

function startGame() {

  const name =
    $("nameInput")
      ? $("nameInput")
          .value
          .trim() || "勇者"
      : "勇者";

  const job =
    $("jobInput")
      ? $("jobInput").value
      : "勇者";

  const jobData =
    JOBS[job] ||
    JOBS["勇者"];

  player =
    createNewPlayer();

  player.name =
    name;

  player.job =
    job;

  player.maxHp =
    jobData.hp;

  player.hp =
    jobData.hp;

  player.attack =
    jobData.attack;

  $("startScreen")
    .classList.add("hidden");

  $("gameScreen")
    .classList.remove("hidden");

  log(
    "勇者の懸賞金RPGを開始しました！"
  );

  log(
    `名前：「${player.name}」`
  );

  log(
    `役職「${player.job}」を選択しました。`
  );

  log(
    "現在HP30、レベル0、スキルなし。"
  );

  log(
    "敵を倒してレベルを上げよう！"
  );

  updateStatus();
}


/* =========================
   戦闘開始
========================= */

function startBattle() {

  if (battle) {

    log(
      "現在すでに戦闘中です！"
    );

    return;
  }

  let possible =
    MONSTERS.filter(
      monster =>
        player.level >= monster.min &&
        player.level <= monster.max &&
        monster.area === player.area
    );

  if (
    possible.length === 0
  ) {

    possible =
      MONSTERS.filter(
        monster =>
          monster.area === player.area
      );
  }

  if (
    possible.length === 0
  ) {

    possible =
      MONSTERS;
  }

  const base =
    possible[
      Math.floor(
        Math.random() *
        possible.length
      )
    ];

  battle = {

    type: "normal",

    enemy: {
      ...base,
      maxHp: base.hp
    }
  };

  defending = false;

  $("battleScreen")
    .classList.remove("hidden");

  updateBattleUI();

  onlineBattleLog(
    `${battle.enemy.name}が現れた！`
  );
}


/* =========================
   ボス
========================= */

function startBossBattle() {

  if (battle) {

    log(
      "現在すでに戦闘中です！"
    );

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

  $("battleScreen")
    .classList.remove("hidden");

  updateBattleUI();

  onlineBattleLog(
    `${BOSS.name}が現れた！`
  );
}


/* =========================
   戦闘UI
========================= */

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
        battle.enemy.hp /
          battle.enemy.maxHp *
          100
      )
    );

  $("enemyHpBar").style.width =
    `${percent}%`;
}


/* =========================
   武器
========================= */

function getWeaponDamage() {

  if (
    player.weapon ===
    "タガー"
  ) {
    return 15;
  }

  if (
    player.weapon ===
    "剣"
  ) {
    return 5;
  }

  return 0;
}


/* =========================
   ダメージ計算
========================= */

function calculateDamage(
  skillPower = 0
) {

  let damage =
    player.attack +
    getWeaponDamage() +
    skillPower;

  if (damage < 1) {
    damage = 1;
  }

  let critical = false;

  if (
    Math.random() < 0.15
  ) {

    critical = true;

    damage += 5;
  }

  return {
    damage,
    critical
  };
}


/* =========================
   攻撃
========================= */

function attackEnemy() {

  if (!battle) {

    startBattle();

    return;
  }

  const result =
    calculateDamage();

  battle.enemy.hp -=
    result.damage;

  if (
    battle.enemy.hp < 0
  ) {

    battle.enemy.hp = 0;
  }

  let message =
    `${battle.enemy.name}に${result.damage}ダメージを与えた！`;

  if (
    result.critical
  ) {

    message +=
      " クリティカルヒット！";
  }

  onlineBattleLog(
    message
  );

  updateBattleUI();

  if (
    battle.enemy.hp <= 0
  ) {

    winBattle();

    return;
  }

  enemyTurn();
}


/* =========================
   防御
========================= */

function defend() {

  if (!battle) {

    log(
      "敵がいません。"
    );

    return;
  }

  defending = true;

  onlineBattleLog(
    "ボウギョした！"
  );

  enemyTurn();
}


/* =========================
   スキル
========================= */

function useSkill() {

  if (!battle) {

    log(
      "敵がいません。"
    );

    return;
  }

  if (
    player.skills.length === 0
  ) {

    onlineBattleLog(
      "まだスキルを覚えていない！"
    );

    return;
  }

  const skill =
    player.skills[0];

  const power =
    SKILLS[skill] || 0;

  const result =
    calculateDamage(
      power
    );

  battle.enemy.hp -=
    result.damage;

  if (
    battle.enemy.hp < 0
  ) {

    battle.enemy.hp = 0;
  }

  let message =
    `スキル「${skill}」！ ${battle.enemy.name}に${result.damage}ダメージ！`;

  if (
    result.critical
  ) {

    message +=
      " クリティカルヒット！";
  }

  onlineBattleLog(
    message
  );

  updateBattleUI();

  if (
    battle.enemy.hp <= 0
  ) {

    winBattle();

    return;
  }

  enemyTurn();
}


/* =========================
   調べる
========================= */

function inspectEnemy() {

  if (!battle) {

    log(
      "調べる敵がいません。"
    );

    return;
  }

  onlineBattleLog(
    `${battle.enemy.name} HP:${battle.enemy.hp}/${battle.enemy.maxHp} 攻撃:${battle.enemy.attack}`
  );
}


/* =========================
   逃げる
========================= */

function runBattle() {

  if (!battle) {

    log(
      "戦闘していません。"
    );

    return;
  }

  if (
    battle.type === "boss"
  ) {

    onlineBattleLog(
      "ボスからは逃げられない！"
    );

    return;
  }

  if (
    Math.random() < 0.7
  ) {

    onlineBattleLog(
      "逃げ出した！"
    );

    battle = null;

    $("battleScreen")
      .classList.add("hidden");

  } else {

    onlineBattleLog(
      "逃げられなかった！"
    );

    enemyTurn();
  }
}


/* =========================
   敵の攻撃
========================= */

function enemyTurn() {

  if (!battle) return;

  let damage =
    battle.enemy.attack;

  if (defending) {

    damage =
      Math.floor(
        damage / 2
      );

    defending = false;

    onlineBattleLog(
      "ボウギョでダメージを半減した！"
    );
  }

  player.hp -=
    damage;

  if (
    player.hp < 0
  ) {

    player.hp = 0;
  }

  onlineBattleLog(
    `${battle.enemy.name}から${damage}ダメージを受けた！`
  );

  updateStatus();

  if (
    player.hp <= 0
  ) {

    gameOver();
  }
}


/* =========================
   勝利
========================= */

function winBattle() {

  if (!battle) return;

  const enemy =
    battle.enemy;

  player.xp +=
    enemy.xp;

  player.money +=
    enemy.money;

  player.bounty +=
    enemy.money;

  player.defeats++;

  onlineBattleLog(
    `${enemy.name}を倒した！`
  );

  onlineBattleLog(
    `${enemy.name}は${enemy.money}円を落とした！`
  );

  onlineBattleLog(
    `${enemy.xp}XPを獲得した！`
  );

  battle = null;

  $("battleScreen")
    .classList.add("hidden");

  updateStatus();

  checkUnlocks();

  checkLevelUp();
}


/* =========================
   解放
========================= */

function checkUnlocks() {

  if (
    player.defeats >= 3 &&
    !player.townUnlocked
  ) {

    player.townUnlocked =
      true;

    log(
      "町へ行けるようになった！"
    );
  }

  if (
    player.defeats >= 10 &&
    !player.cityUnlocked
  ) {

    player.cityUnlocked =
      true;

    log(
      "都市へ行けるようになった！"
    );
  }
}


/* =========================
   レベルアップ
========================= */

function getNextXP() {

  return 50 +
    player.level * 50;
}


function checkLevelUp() {

  const needed =
    getNextXP();

  if (
    player.xp >= needed
  ) {

    player.xp -=
      needed;

    player.level++;

    levelUpWaiting =
      true;

    $("levelChoices")
      .classList.remove("hidden");

    log(
      `レベル${player.level}になった！`
    );

    log(
      "どれを選びますか？"
    );

    updateStatus();
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
    "攻撃が20増えた！"
  );
}


function chooseSkillLevel() {

  if (!levelUpWaiting) return;

  let nextSkill = null;

  if (
    !player.skills.includes(
      "斬撃"
    )
  ) {

    nextSkill =
      "斬撃";

  } else if (
    !player.skills.includes(
      "高速切り"
    )
  ) {

    nextSkill =
      "高速切り";
  }

  if (!nextSkill) {

    log(
      "覚えられるスキルがありません。"
    );

    return;
  }

  player.skills.push(
    nextSkill
  );

  finishLevelUp(
    `スキル「${nextSkill}」を覚えた！`
  );
}


function finishLevelUp(message) {

  levelUpWaiting =
    false;

  $("levelChoices")
    .classList.add("hidden");

  log(message);

  updateStatus();

  checkLevelUp();
}


/* =========================
   スキル情報
========================= */

function openSkills() {

  let html = "";

  if (
    player.skills.length === 0
  ) {

    html =
      "まだスキルを覚えていません。";

  } else {

    for (
      const skill of player.skills
    ) {

      html +=
        `${skill}：${SKILLS[skill]}ダメージ<br>`;
    }
  }

  showInfo(
    "✨ スキル情報",
    html
  );
}


/* =========================
   レベル確認
========================= */

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


/* =========================
   図鑑
========================= */

function openBook() {

  let html = `
    <table>
      <tr>
        <th>怪物</th>
        <th>HP</th>
        <th>Lv</th>
        <th>出現エリア</th>
        <th>XP</th>
      </tr>
  `;

  for (
    const monster of MONSTERS
  ) {

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

  html +=
    "</table>";

  showInfo(
    "📚 図鑑表確認",
    html
  );
}


/* =========================
   バッグ
========================= */

function openBag() {

  const items =
    player.inventory.length > 0
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


/* =========================
   情報画面
========================= */

function showInfo(
  title,
  content
) {

  $("infoTitle").textContent =
    title;

  $("infoContent").innerHTML =
    content;

  $("infoPanel")
    .classList.remove("hidden");
}


function closeInfo() {

  $("infoPanel")
    .classList.add("hidden");
}


/* =========================
   ガチャ
========================= */

function normalGacha() {

  const cost = 50;

  if (
    player.money < cost
  ) {

    log(
      "お金が足りない！"
    );

    return;
  }

  player.money -=
    cost;

  const result =
    Math.random() < 0.5
      ? "タガー"
      : "剣";

  player.inventory.push(
    result
  );

  log(
    "ノーマルガチャを回した！"
  );

  log(
    `${result}を手に入れた！`
  );

  updateStatus();
}


/* =========================
   町
========================= */

function goTown() {

  if (
    !player.townUnlocked
  ) {

    log(
      "町へ行くには3体の敵を倒してください。"
    );

    return;
  }

  player.area =
    "町";

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


/* =========================
   都市
========================= */

function goCity() {

  if (
    !player.cityUnlocked
  ) {

    log(
      "都市へ行くには10体の敵を倒してください。"
    );

    return;
  }

  player.area =
    "都市";

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


/* =========================
   回復
========================= */

function healPlayer() {

  const cost = 30;

  if (
    player.hp >=
    player.maxHp
  ) {

    log(
      "HPは満タンです！"
    );

    return;
  }

  if (
    player.money < cost
  ) {

    log(
      "回復するお金が足りない！"
    );

    return;
  }

  player.money -=
    cost;

  player.hp =
    player.maxHp;

  log(
    "HPを全回復した！"
  );

  updateStatus();
}


/* =========================
   ゲームオーバー
========================= */

function gameOver() {

  battle = null;

  $("gameScreen")
    .classList.add("hidden");

  $("gameOverScreen")
    .classList.remove("hidden");

  player =
    createNewPlayer();

  localStorage.removeItem(
    SAVE_KEY
  );
}


function restartGame() {

  $("gameOverScreen")
    .classList.add("hidden");

  $("startScreen")
    .classList.remove("hidden");
}


/* =========================
   ルーム作成
========================= */

function createRoom() {

  if (
    !socket ||
    !onlineEnabled
  ) {

    $("roomStatus").textContent =
      "オンライン接続できません。";

    log(
      "オンラインサーバーに接続できません。"
    );

    return;
  }

  const name =
    $("nameInput")
      .value
      .trim() ||
    "勇者";

  socket.emit(
    "createRoom",
    {
      name
    }
  );
}


/* =========================
   ルーム参加
========================= */

function joinRoom() {

  if (
    !socket ||
    !onlineEnabled
  ) {

    $("roomStatus").textContent =
      "オンライン接続できません。";

    log(
      "オンラインサーバーに接続できません。"
    );

    return;
  }

  const roomId =
    $("roomCodeInput")
      .value
      .trim();

  const name =
    $("nameInput")
      .value
      .trim() ||
    "勇者";

  socket.emit(
    "joinRoom",
    {
      roomId,
      name
    }
  );
}


/* =========================
   ルーム退出
========================= */

function leaveOnlineRoom() {

  if (
    socket &&
    onlineEnabled
  ) {

    socket.emit(
      "leaveRoom"
    );
  }

  currentRoom =
    null;

  $("roomStatus").textContent =
    "未接続";

  $("roomInfo").textContent =
    "ルームなし";

  $("roomPlayers").innerHTML =
    "";

  $("connectionStatus").textContent =
    onlineEnabled
      ? "🟢 オンライン"
      : "🔴 オフライン";
}


/* =========================
   チャット
========================= */

function sendChat() {

  const input =
    $("chatInput");

  const message =
    input.value.trim();

  if (!message) return;

  if (
    !currentRoom ||
    !socket
  ) {

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


/* =========================
   プレイヤー一覧
========================= */

function renderPlayers(players) {

  const box =
    $("roomPlayers");

  box.innerHTML = "";

  if (
    !players ||
    players.length === 0
  ) {

    box.textContent =
      "プレイヤーはいません。";

    return;
  }

  for (
    const p of players
  ) {

    const card =
      document.createElement(
        "div"
      );

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
        ／ 懸賞金${p.bounty}円
        ／ ${escapeHtml(p.area)}
      </div>
    `;

    box.appendChild(card);
  }
}


/* =========================
   Socket.IOイベント
========================= */

if (socket) {

  socket.on(
    "connect",
    () => {

      onlineEnabled =
        true;

      $("connectionStatus").textContent =
        "🟢 オンライン";

      log(
        "オンラインサーバーに接続しました！"
      );
    }
  );


  socket.on(
    "disconnect",
    () => {

      onlineEnabled =
        false;

      $("connectionStatus").textContent =
        "🔴 オフライン";
    }
  );


  socket.on(
    "roomCreated",
    data => {

      currentRoom =
        data.roomId;

      $("roomStatus").textContent =
        `ルーム作成成功：${data.roomId}`;

      $("roomInfo").textContent =
        `ルームID：${data.roomId}`;

      renderPlayers(
        data.players
      );

      log(
        `オンラインルーム「${data.roomId}」を作成しました！`
      );

      updateStatus();
    }
  );


  socket.on(
    "roomJoined",
    data => {

      currentRoom =
        data.roomId;

      $("roomStatus").textContent =
        `参加中：${data.roomId}`;

      $("roomInfo").textContent =
        `ルームID：${data.roomId}`;

      renderPlayers(
        data.players
      );

      log(
        `ルーム「${data.roomId}」に参加しました！`
      );

      updateStatus();
    }
  );


  socket.on(
    "roomError",
    message => {

      $("roomStatus").textContent =
        message;

      log(
        `オンライン：${message}`
      );
    }
  );


  socket.on(
    "playersUpdate",
    players => {

      renderPlayers(
        players
      );
    }
  );


  socket.on(
    "publicMessage",
    data => {

      chatLog(
        data.name,
        data.message
      );
    }
  );


  socket.on(
    "onlineBattleLog",
    data => {

      if (!data) return;

      log(
        `🌐 ${data.name}：${data.message}`
      );
    }
  );
}


/* =========================
   ボタン
========================= */

function bindButton(
  id,
  event
) {

  const element =
    $(id);

  if (!element) {

    console.error(
      `ボタンがありません：${id}`
    );

    return;
  }

  element.addEventListener(
    "click",
    event
  );
}


bindButton(
  "startBtn",
  startGame
);

bindButton(
  "createRoomBtn",
  createRoom
);

bindButton(
  "joinRoomBtn",
  joinRoom
);

bindButton(
  "leaveRoomBtn",
  leaveOnlineRoom
);

bindButton(
  "chatSendBtn",
  sendChat
);

bindButton(
  "attackBtn",
  attackEnemy
);

bindButton(
  "defendBtn",
  defend
);

bindButton(
  "skillBtn",
  useSkill
);

bindButton(
  "inspectBtn",
  inspectEnemy
);

bindButton(
  "runBtn",
  runBattle
);

bindButton(
  "hpLevelBtn",
  chooseHPLevel
);

bindButton(
  "attackLevelBtn",
  chooseAttackLevel
);

bindButton(
  "skillLevelBtn",
  chooseSkillLevel
);

bindButton(
  "skillsBtn",
  openSkills
);

bindButton(
  "levelBtn",
  openLevel
);

bindButton(
  "bookBtn",
  openBook
);

bindButton(
  "bagBtn",
  openBag
);

bindButton(
  "gachaBtn",
  normalGacha
);

bindButton(
  "townBtn",
  goTown
);

bindButton(
  "cityBtn",
  goCity
);

bindButton(
  "healBtn",
  healPlayer
);

bindButton(
  "bossBtn",
  startBossBattle
);

bindButton(
  "closeInfoBtn",
  closeInfo
);

bindButton(
  "restartBtn",
  restartGame
);


/* =========================
   チャットEnter
========================= */

if ($("chatInput")) {

  $("chatInput")
    .addEventListener(
      "keydown",
      event => {

        if (
          event.key === "Enter"
        ) {

          sendChat();
        }
      }
    );
}


/* =========================
   起動
========================= */

loadGame();

updateStatus();
