const socket = io();

/* =========================
   プレイヤー
========================= */

let player = {
  name: "",
  job: "勇者",

  hp: 100,
  maxHp: 100,

  level: 1,
  maxLevel: 100,

  attack: 10,
  maxAttack: 9999,

  xp: 0,

  money: 100,
  bounty: 0,

  weapon: "木の剣",

  area: "村",

  defeats: 0,

  skillCount: 1,
  maxSkillCount: 100,

  admin: false
};


/* =========================
   戦闘状態
========================= */

let enemy = null;
let defending = false;
let battleBusy = false;

let pvpBattle = false;
let pvpOpponent = null;
let pvpMyTurn = false;


/* =========================
   モンスター
========================= */

const monsters = [
  {
    name: "怪物猫",
    hp: 40,
    attack: 8,
    xp: 20,
    money: 15
  },
  {
    name: "スライム",
    hp: 55,
    attack: 10,
    xp: 25,
    money: 20
  },
  {
    name: "ゴブリン",
    hp: 75,
    attack: 14,
    xp: 35,
    money: 30
  },
  {
    name: "オオカミ",
    hp: 100,
    attack: 18,
    xp: 50,
    money: 40
  },
  {
    name: "オーク",
    hp: 150,
    attack: 25,
    xp: 80,
    money: 60
  }
];


/* =========================
   ボス
========================= */

const boss = {
  name: "懸賞金王",
  hp: 800,
  attack: 55,
  xp: 500,
  money: 500,
  bounty: 1000
};


/* =========================
   スキル
========================= */

const skills = [
  {
    name: "斬撃",
    multiplier: 1.8
  },
  {
    name: "高速切り",
    multiplier: 2.4
  }
];


/* =========================
   DOM取得
========================= */

const $ = id => document.getElementById(id);


/* =========================
   ログ
========================= */

function logMessage(message) {
  const log = $("log");

  if (!log) return;

  const line = document.createElement("div");

  line.textContent = message;

  log.appendChild(line);

  while (log.children.length > 80) {
    log.removeChild(log.firstChild);
  }

  log.scrollTop = log.scrollHeight;
}


/* =========================
   保存
========================= */

function saveGame() {
  try {
    localStorage.setItem(
      "yuusha_bounty_rpg",
      JSON.stringify(player)
    );
  } catch (e) {
    console.warn("セーブ失敗", e);
  }
}


/* =========================
   読み込み
========================= */

function loadGame() {
  try {
    const saved = localStorage.getItem(
      "yuusha_bounty_rpg"
    );

    if (!saved) return;

    const data = JSON.parse(saved);

    player = {
      ...player,
      ...data
    };

  } catch (e) {
    console.warn("ロード失敗", e);
  }
}


/* =========================
   ステータス表示
========================= */

function updateStatus() {

  if ($("playerName")) {
    $("playerName").textContent =
      player.name || "---";
  }

  if ($("job")) {
    $("job").textContent =
      player.job || "---";
  }

  if ($("level")) {
    $("level").textContent =
      player.level;
  }

  if ($("hp")) {
    $("hp").textContent =
      Math.max(0, player.hp);
  }

  if ($("maxHp")) {
    $("maxHp").textContent =
      player.maxHp;
  }

  if ($("attack")) {
    $("attack").textContent =
      player.attack;
  }

  if ($("xp")) {
    $("xp").textContent =
      player.xp;
  }

  if ($("money")) {
    $("money").textContent =
      player.money;
  }

  if ($("bounty")) {
    $("bounty").textContent =
      player.bounty;
  }

  if ($("weapon")) {
    $("weapon").textContent =
      player.weapon;
  }

  if ($("area")) {
    $("area").textContent =
      player.area;
  }

  if ($("defeats")) {
    $("defeats").textContent =
      player.defeats;
  }

  const hpBar = $("hpBar");

  if (hpBar) {
    const percent =
      player.maxHp > 0
        ? (player.hp / player.maxHp) * 100
        : 0;

    hpBar.style.width =
      Math.max(0, Math.min(100, percent)) + "%";
  }
}


/* =========================
   プレイヤー情報送信
========================= */

function sendPlayerUpdate() {

  if (!socket) return;

  socket.emit("playerUpdate", {
    name: player.name,
    job: player.job,
    level: player.level,
    hp: player.hp,
    maxHp: player.maxHp,
    attack: player.attack,
    area: player.area,
    bounty: player.bounty
  });
}


/* =========================
   パネル表示
========================= */

function showPanel(id) {
  const panel = $(id);

  if (panel) {
    panel.classList.remove("hidden");
  }
}


function hidePanel(id) {
  const panel = $(id);

  if (panel) {
    panel.classList.add("hidden");
  }
}


/* =========================
   戦闘中判定
========================= */

function isBusy() {
  return battleBusy || pvpBattle;
}


/* =========================
   敵との戦闘開始
========================= */

function startBattle() {

  if (isBusy()) {
    logMessage("⚠️ すでに戦闘中です！");
    return;
  }

  const base =
    monsters[
      Math.floor(Math.random() * monsters.length)
    ];

  enemy = {
    name: base.name,
    hp: base.hp + player.level * 4,
    maxHp: base.hp + player.level * 4,
    attack: base.attack + Math.floor(player.level * 1.5),
    xp: base.xp + player.level * 2,
    money: base.money + player.level
  };

  battleBusy = true;
  defending = false;

  showPanel("battleScreen");

  updateEnemyDisplay();

  logMessage(
    `⚔️ ${enemy.name}が現れた！`
  );
}


/* =========================
   敵表示
========================= */

function updateEnemyDisplay() {

  if (!enemy) return;

  if ($("enemyName")) {
    $("enemyName").textContent =
      enemy.name;
  }

  if ($("enemyHp")) {
    $("enemyHp").textContent =
      Math.max(0, enemy.hp);
  }

  if ($("enemyMaxHp")) {
    $("enemyMaxHp").textContent =
      enemy.maxHp;
  }

  if ($("enemyHpBar")) {

    const percent =
      enemy.maxHp > 0
        ? (enemy.hp / enemy.maxHp) * 100
        : 0;

    $("enemyHpBar").style.width =
      Math.max(0, Math.min(100, percent)) + "%";
  }
}


/* =========================
   プレイヤー攻撃
========================= */

function attackEnemy() {

  if (!battleBusy || !enemy) return;

  if (enemy.hp <= 0) return;

  defending = false;

  const damage =
    Math.max(
      1,
      player.attack +
      Math.floor(Math.random() * 6)
    );

  enemy.hp -= damage;

  logMessage(
    `⚔️ ${enemy.name}に${damage}ダメージ！`
  );

  updateEnemyDisplay();

  if (enemy.hp <= 0) {
    winBattle();
    return;
  }

  enemyAttack();
}


/* =========================
   防御
========================= */

function defend() {

  if (!battleBusy || !enemy) return;

  defending = true;

  logMessage(
    "🛡️ 防御態勢に入った！"
  );

  enemyAttack();
}


/* =========================
   敵攻撃
========================= */

function enemyAttack() {

  if (!enemy || !battleBusy) return;

  setTimeout(() => {

    if (!battleBusy || !enemy) return;

    let damage =
      enemy.attack +
      Math.floor(Math.random() * 5);

    if (defending) {
      damage =
        Math.max(
          1,
          Math.floor(damage / 2)
        );

      logMessage(
        `🛡️ 防御でダメージ半減！`
      );
    }

    defending = false;

    player.hp -= damage;

    logMessage(
      `💥 ${enemy.name}の攻撃！${damage}ダメージ！`
    );

    updateStatus();

    if (player.hp <= 0) {
      player.hp = 0;

      updateStatus();

      gameOver();

      return;
    }

  }, 450);
}


/* =========================
   スキル
========================= */

function useSkill() {

  if (!battleBusy || !enemy) return;

  if (enemy.hp <= 0) return;

  const skill =
    skills[
      Math.min(
        player.skillCount - 1,
        skills.length - 1
      )
    ];

  const multiplier =
    skill ? skill.multiplier : 2;

  const damage =
    Math.max(
      1,
      Math.floor(
        player.attack *
        multiplier
      ) +
      Math.floor(Math.random() * 10)
    );

  enemy.hp -= damage;

  logMessage(
    `✨ ${skill ? skill.name : "必殺技"}！${damage}ダメージ！`
  );

  updateEnemyDisplay();

  if (enemy.hp <= 0) {
    winBattle();
    return;
  }

  enemyAttack();
}


/* =========================
   敵を調べる
========================= */

function inspectEnemy() {

  if (!enemy) return;

  logMessage(
    `👁️ ${enemy.name} HP:${enemy.hp}/${enemy.maxHp} 攻撃:${enemy.attack}`
  );
}


/* =========================
   逃げる
========================= */

function runBattle() {

  if (!battleBusy) return;

  if (Math.random() < 0.75) {

    logMessage(
      "🏃 戦闘から逃げた！"
    );

    battleBusy = false;
    enemy = null;

    hidePanel("battleScreen");

  } else {

    logMessage(
      "❌ 逃げられなかった！"
    );

    enemyAttack();
  }
}


/* =========================
   戦闘勝利
========================= */

function winBattle() {

  if (!enemy) return;

  const defeatedEnemy = enemy;

  battleBusy = false;
  enemy = null;

  hidePanel("battleScreen");

  player.defeats++;

  player.xp += defeatedEnemy.xp;

  player.money += defeatedEnemy.money;

  player.bounty +=
    Math.floor(defeatedEnemy.money / 2);

  logMessage(
    `🏆 ${defeatedEnemy.name}を倒した！`
  );

  logMessage(
    `⭐ 経験値 +${defeatedEnemy.xp}`
  );

  logMessage(
    `💰 ${defeatedEnemy.money}円獲得！`
  );

  checkLevelUp();

  updateStatus();

  saveGame();

  sendPlayerUpdate();
}


/* =========================
   レベルアップ
========================= */

function checkLevelUp() {

  while (
    player.level < player.maxLevel &&
    player.xp >= player.level * 100
  ) {

    player.xp -=
      player.level * 100;

    player.level++;

    showPanel("levelChoices");

    logMessage(
      `🆙 レベル${player.level}になった！`
    );
  }
}


/* =========================
   HP強化
========================= */

function levelUpHp() {

  if (player.level <= 1) return;

  player.maxHp += 20;

  player.hp = player.maxHp;

  logMessage(
    "❤️ 最大HPが20上昇した！"
  );

  hidePanel("levelChoices");

  updateStatus();

  saveGame();
}


/* =========================
   攻撃力強化
========================= */

function levelUpAttack() {

  if (player.level <= 1) return;

  player.attack += 5;

  logMessage(
    "⚔️ 攻撃力が5上昇した！"
  );

  hidePanel("levelChoices");

  updateStatus();

  saveGame();
}


/* =========================
   スキル強化
========================= */

function levelUpSkill() {

  player.skillCount =
    Math.min(
      player.maxSkillCount,
      player.skillCount + 1
    );

  logMessage(
    "✨ スキルレベルが上昇した！"
  );

  hidePanel("levelChoices");

  updateStatus();

  saveGame();
}


/* =========================
   町
========================= */

function goTown() {

  if (isBusy()) {
    logMessage(
      "⚠️ 戦闘中は町へ行けません！"
    );
    return;
  }

  if (player.defeats < 3) {
    logMessage(
      "🔒 町へ行くには敵を3体倒してください！"
    );
    return;
  }

  player.area = "町";

  player.hp = player.maxHp;

  logMessage(
    "🏘️ 町に到着した！"
  );

  logMessage(
    `❤️ 宿で休んだ！HPが${player.maxHp}まで全回復した！`
  );

  if (Math.random() < 0.35) {

    const gift = 20 +
      Math.floor(Math.random() * 51);

    player.money += gift;

    logMessage(
      `🎁 町の人から${gift}円もらった！`
    );
  }

  updateStatus();

  saveGame();

  sendPlayerUpdate();
}


/* =========================
   都市
========================= */

function goCity() {

  if (isBusy()) {
    logMessage(
      "⚠️ 戦闘中は都市へ行けません！"
    );
    return;
  }

  if (player.defeats < 10) {

    logMessage(
      "🔒 都市へ行くには敵を10体倒してください！"
    );

    return;
  }

  player.area = "都市";

  logMessage(
    "🏙️ 都市へ到着した！"
  );

  updateStatus();

  saveGame();

  sendPlayerUpdate();
}


/* =========================
   回復
========================= */

function heal() {

  if (player.hp >= player.maxHp) {

    logMessage(
      "❤️ HPはすでに満タンです！"
    );

    return;
  }

  if (player.area === "町") {

    player.hp =
      player.maxHp;

    logMessage(
      "🏘️ 町の宿で無料回復した！"
    );

    updateStatus();

    saveGame();

    sendPlayerUpdate();

    return;
  }

  if (player.money < 30) {

    logMessage(
      "💰 回復には30円必要です！"
    );

    return;
  }

  player.money -= 30;

  player.hp =
    player.maxHp;

  logMessage(
    "❤️ 30円払って全回復した！"
  );

  updateStatus();

  saveGame();

  sendPlayerUpdate();
}


/* =========================
   ボス
========================= */

function startBoss() {

  if (isBusy()) {

    logMessage(
      "⚠️ 戦闘中です！"
    );

    return;
  }

  if (player.defeats < 20) {

    logMessage(
      "🔒 ボス戦には20体以上の撃破が必要です！"
    );

    return;
  }

  enemy = {
    name: boss.name,
    hp:
      boss.hp +
      player.level * 15,
    maxHp:
      boss.hp +
      player.level * 15,
    attack:
      boss.attack +
      player.level * 2,
    xp:
      boss.xp,
    money:
      boss.money,
    bounty:
      boss.bounty
  };

  battleBusy = true;
  defending = false;

  showPanel("battleScreen");

  updateEnemyDisplay();

  logMessage(
    `👑 ボス ${enemy.name} が現れた！`
  );
}


/* =========================
   ガチャ
========================= */

function gacha() {

  if (player.money < 100) {

    logMessage(
      "💰 ガチャには100円必要です！"
    );

    return;
  }

  player.money -= 100;

  const rewards = [
    {
      name: "鉄の剣",
      attack: 25
    },
    {
      name: "炎の剣",
      attack: 50
    },
    {
      name: "勇者の剣",
      attack: 100
    },
    {
      name: "伝説の剣",
      attack: 250
    }
  ];

  const reward =
    rewards[
      Math.floor(
        Math.random() *
        rewards.length
      )
    ];

  player.weapon =
    reward.name;

  player.attack =
    Math.max(
      player.attack,
      reward.attack
    );

  logMessage(
    `🎰 ガチャ結果：${reward.name}！`
  );

  updateStatus();

  saveGame();

  sendPlayerUpdate();
}


/* =========================
   ゲームオーバー
========================= */

function gameOver() {

  battleBusy = false;
  enemy = null;

  hidePanel("battleScreen");
  hidePanel("pvpBattleScreen");

  showPanel("gameOverPanel");

  logMessage(
    "💀 勇者は力尽きた……"
  );
}


/* =========================================================
   管理者機能
========================================================= */

const ADMIN_CODE = "3487";


/* =========================
   管理者パネル
========================= */

function openAdminPanel() {

  if ($("adminPanel")) {
    $("adminPanel").classList.remove("hidden");
  }

  if (player.admin) {
    showAdminControls();
  } else {
    hideAdminControls();
  }
}


/* =========================
   管理者コントロール表示
========================= */

function showAdminControls() {

  if ($("adminLoginArea")) {
    $("adminLoginArea").classList.add("hidden");
  }

  if ($("adminControls")) {
    $("adminControls").classList.remove("hidden");
  }
}


function hideAdminControls() {

  if ($("adminLoginArea")) {
    $("adminLoginArea").classList.remove("hidden");
  }

  if ($("adminControls")) {
    $("adminControls").classList.add("hidden");
  }
}


/* =========================
   管理者認証
========================= */

function adminLogin() {

  const input =
    $("adminCodeInput");

  if (!input) return;

  const code =
    input.value.trim();

  if (code === ADMIN_CODE) {

    player.admin = true;

    logMessage(
      "🔓 管理者認証成功！"
    );

    logMessage(
      "👑 管理者メニューが解放された！"
    );

    showAdminControls();

    input.value = "";

    saveGame();

    return;
  }

  logMessage(
    "❌ 管理者コードが違います！"
  );

  input.value = "";
}


/* =========================
   レベルMAX
========================= */

function adminMaxLevel() {

  if (!player.admin) return;

  player.level =
    player.maxLevel;

  player.xp = 0;

  logMessage(
    `👑 管理者：レベル${player.maxLevel} MAX！`
  );

  updateStatus();

  saveGame();

  sendPlayerUpdate();
}


/* =========================
   ステータスMAX
========================= */

function adminMaxStatus() {

  if (!player.admin) return;

  player.maxHp = 999999;

  player.hp = 999999;

  player.attack = 999999;

  player.skillCount =
    player.maxSkillCount;

  logMessage(
    "👑 管理者：ステータスMAX！"
  );

  logMessage(
    "❤️ HP MAX"
  );

  logMessage(
    "⚔️ 攻撃力 MAX"
  );

  logMessage(
    "✨ スキル MAX"
  );

  updateStatus();

  saveGame();

  sendPlayerUpdate();
}


/* =========================
   全部MAX
========================= */

function adminMaxAll() {

  if (!player.admin) return;

  player.level =
    player.maxLevel;

  player.xp = 0;

  player.maxHp = 999999;

  player.hp = 999999;

  player.attack = 999999;

  player.skillCount =
    player.maxSkillCount;

  player.money = 999999999;

  player.bounty = 999999999;

  player.defeats = 999999;

  player.weapon =
    "管理者の剣";

  logMessage(
    "👑👑 管理者：全ステータスMAX！"
  );

  logMessage(
    "🆙 レベルMAX"
  );

  logMessage(
    "❤️ HP MAX"
  );

  logMessage(
    "⚔️ 攻撃力 MAX"
  );

  logMessage(
    "✨ スキルMAX"
  );

  logMessage(
    "💰 お金MAX"
  );

  logMessage(
    "💀 撃破数MAX"
  );

  updateStatus();

  saveGame();

  sendPlayerUpdate();
}


/* =========================================================
   PvP
========================================================= */


/* =========================
   PvP開始
========================= */

function startPvP(opponent) {

  if (!opponent) return;

  if (isBusy()) return;

  pvpBattle = true;

  pvpOpponent =
    opponent;

  pvpMyTurn = true;

  showPanel(
    "pvpBattleScreen"
  );

  updatePvPDisplay();

  logMessage(
    `⚔️ ${opponent.name}とのPvP開始！`
  );
}


/* =========================
   PvP表示
========================= */

function updatePvPDisplay() {

  if (!pvpOpponent) return;

  if ($("pvpOpponentName")) {
    $("pvpOpponentName").textContent =
      pvpOpponent.name;
  }

  if ($("pvpOpponentHp")) {
    $("pvpOpponentHp").textContent =
      pvpOpponent.hp;
  }

  if ($("pvpOpponentMaxHp")) {
    $("pvpOpponentMaxHp").textContent =
      pvpOpponent.maxHp;
  }

  if ($("pvpOpponentHpBar")) {

    const percent =
      pvpOpponent.maxHp > 0
        ? (
            pvpOpponent.hp /
            pvpOpponent.maxHp
          ) * 100
        : 0;

    $("pvpOpponentHpBar").style.width =
      Math.max(
        0,
        Math.min(
          100,
          percent
        )
      ) + "%";
  }

  if ($("pvpTurnText")) {

    $("pvpTurnText").textContent =
      pvpMyTurn
        ? "あなたのターン"
        : "相手のターン";
  }
}


/* =========================
   PvP攻撃
========================= */

function pvpAttack() {

  if (!pvpBattle) return;

  if (!pvpMyTurn) return;

  const damage =
    player.attack +
    Math.floor(
      Math.random() * 6
    );

  socket.emit(
    "pvpAttack",
    {
      damage
    }
  );

  pvpMyTurn = false;

  updatePvPDisplay();
}


/* =========================
   PvP防御
========================= */

function pvpDefend() {

  if (!pvpBattle) return;

  if (!pvpMyTurn) return;

  socket.emit(
    "pvpDefend"
  );

  pvpMyTurn = false;

  updatePvPDisplay();
}


/* =========================
   PvPスキル
========================= */

function pvpSkill() {

  if (!pvpBattle) return;

  if (!pvpMyTurn) return;

  const skill =
    skills[
      Math.min(
        player.skillCount - 1,
        skills.length - 1
      )
    ];

  const multiplier =
    skill
      ? skill.multiplier
      : 2;

  const damage =
    Math.floor(
      player.attack *
      multiplier
    );

  socket.emit(
    "pvpSkill",
    {
      damage
    }
  );

  pvpMyTurn = false;

  updatePvPDisplay();
}


/* =========================
   PvP調べる
========================= */

function pvpInspect() {

  if (!pvpOpponent) return;

  logMessage(
    `👁️ ${pvpOpponent.name} HP:${pvpOpponent.hp}/${pvpOpponent.maxHp}`
  );
}


/* =========================
   PvP逃走
========================= */

function pvpRun() {

  if (!pvpBattle) return;

  socket.emit(
    "pvpRun"
  );

  endPvP();
}


/* =========================
   PvP終了
========================= */

function endPvP() {

  pvpBattle = false;
  pvpOpponent = null;
  pvpMyTurn = false;

  hidePanel(
    "pvpBattleScreen"
  );

  updateStatus();
}


/* =========================================================
   オンライン・ルーム
========================================================= */


/* =========================
   ルーム作成
========================= */

function createRoom() {

  socket.emit(
    "createRoom",
    {
      name: player.name
    }
  );
}


/* =========================
   ルーム参加
========================= */

function joinRoom() {

  const input =
    $("roomCodeInput");

  if (!input) return;

  const code =
    input.value.trim();

  if (!code) {

    logMessage(
      "⚠️ ルームコードを入力してください！"
    );

    return;
  }

  socket.emit(
    "joinRoom",
    {
      code,
      name: player.name
    }
  );
}


/* =========================
   ルーム退出
========================= */

function leaveRoom() {

  socket.emit(
    "leaveRoom"
  );

  if ($("roomStatus")) {
    $("roomStatus").textContent =
      "未接続";
  }

  if ($("roomInfo")) {
    $("roomInfo").textContent =
      "";
  }

  if ($("roomPlayers")) {
    $("roomPlayers").textContent =
      "";
  }
}


/* =========================
   オンライン表示
========================= */

function openOnline() {

  showPanel(
    "onlinePanel"
  );
}


function closeOnline() {

  hidePanel(
    "onlinePanel"
  );
}


/* =========================
   チャット
========================= */

function sendChat() {

  const input =
    $("chatInput");

  if (!input) return;

  const message =
    input.value.trim();

  if (!message) return;

  socket.emit(
    "chatMessage",
    {
      message
    }
  );

  input.value = "";
}


/* =========================
   チャット表示
========================= */

function addChatMessage(
  name,
  message
) {

  const chat =
    $("chatLog");

  if (!chat) return;

  const line =
    document.createElement("div");

  line.textContent =
    `${name}: ${message}`;

  chat.appendChild(line);

  chat.scrollTop =
    chat.scrollHeight;
}


/* =========================================================
   Socket.IOイベント
========================================================= */

socket.on(
  "roomCreated",
  data => {

    if ($("roomStatus")) {
      $("roomStatus").textContent =
        "ルーム作成済み";
    }

    if ($("roomInfo")) {
      $("roomInfo").textContent =
        `ルームコード：${data.code}`;
    }

    logMessage(
      `🏠 ルームを作成しました！コード：${data.code}`
    );
  }
);


socket.on(
  "roomJoined",
  data => {

    if ($("roomStatus")) {
      $("roomStatus").textContent =
        "ルーム参加中";
    }

    if ($("roomInfo")) {
      $("roomInfo").textContent =
        `ルームコード：${data.code}`;
    }

    logMessage(
      "🚪 ルームに参加しました！"
    );
  }
);


socket.on(
  "roomPlayers",
  players => {

    const container =
      $("roomPlayers");

    if (!container) return;

    container.innerHTML = "";

    players.forEach(p => {

      const div =
        document.createElement("div");

      div.textContent =
        `${p.name} Lv.${p.level}`;

      container.appendChild(div);
    });
  }
);


socket.on(
  "chatMessage",
  data => {

    addChatMessage(
      data.name,
      data.message
    );
  }
);


socket.on(
  "pvpChallenge",
  data => {

    const ok =
      confirm(
        `${data.name}からPvP対戦を申し込まれました。\n対戦しますか？`
      );

    if (ok) {

      socket.emit(
        "pvpAccept",
        {
          opponentId:
            data.id
        }
      );

    } else {

      socket.emit(
        "pvpReject",
        {
          opponentId:
            data.id
        }
      );
    }
  }
);


socket.on(
  "pvpStart",
  data => {

    startPvP(
      data.opponent
    );
  }
);


socket.on(
  "pvpUpdate",
  data => {

    if (!pvpBattle) return;

    pvpOpponent =
      data.opponent;

    player.hp =
      data.myHp;

    pvpMyTurn =
      data.turn === socket.id;

    updatePvPDisplay();
    updateStatus();
  }
);


socket.on(
  "pvpEnd",
  data => {

    if (data && data.message) {

      logMessage(
        data.message
      );
    }

    endPvP();
  }
);


/* =========================================================
   ボタン設定
========================================================= */

function bindButtons() {

  if ($("battleStartBtn")) {
    $("battleStartBtn").onclick =
      startBattle;
  }

  if ($("attackBtn")) {
    $("attackBtn").onclick =
      attackEnemy;
  }

  if ($("defendBtn")) {
    $("defendBtn").onclick =
      defend;
  }

  if ($("skillBtn")) {
    $("skillBtn").onclick =
      useSkill;
  }

  if ($("inspectBtn")) {
    $("inspectBtn").onclick =
      inspectEnemy;
  }

  if ($("runBtn")) {
    $("runBtn").onclick =
      runBattle;
  }

  if ($("hpLevelBtn")) {
    $("hpLevelBtn").onclick =
      levelUpHp;
  }

  if ($("attackLevelBtn")) {
    $("attackLevelBtn").onclick =
      levelUpAttack;
  }

  if ($("skillLevelBtn")) {
    $("skillLevelBtn").onclick =
      levelUpSkill;
  }

  if ($("townBtn")) {
    $("townBtn").onclick =
      goTown;
  }

  if ($("cityBtn")) {
    $("cityBtn").onclick =
      goCity;
  }

  if ($("healBtn")) {
    $("healBtn").onclick =
      heal;
  }

  if ($("bossBtn")) {
    $("bossBtn").onclick =
      startBoss;
  }

  if ($("gachaBtn")) {
    $("gachaBtn").onclick =
      gacha;
  }

  if ($("onlineBtn")) {
    $("onlineBtn").onclick =
      openOnline;
  }

  if ($("createRoomBtn")) {
    $("createRoomBtn").onclick =
      createRoom;
  }

  if ($("joinRoomBtn")) {
    $("joinRoomBtn").onclick =
      joinRoom;
  }

  if ($("leaveRoomBtn")) {
    $("leaveRoomBtn").onclick =
      leaveRoom;
  }

  if ($("chatSendBtn")) {
    $("chatSendBtn").onclick =
      sendChat;
  }

  if ($("closeOnlineBtn")) {
    $("closeOnlineBtn").onclick =
      closeOnline;
  }

  if ($("adminBtn")) {
    $("adminBtn").onclick =
      openAdminPanel;
  }

  if ($("adminLoginBtn")) {
    $("adminLoginBtn").onclick =
      adminLogin;
  }

  if ($("adminMaxLevelBtn")) {
    $("adminMaxLevelBtn").onclick =
      adminMaxLevel;
  }

  if ($("adminMaxStatusBtn")) {
    $("adminMaxStatusBtn").onclick =
      adminMaxStatus;
  }

  if ($("adminMaxAllBtn")) {
    $("adminMaxAllBtn").onclick =
      adminMaxAll;
  }

  if ($("adminCloseBtn")) {
    $("adminCloseBtn").onclick =
      () => hidePanel("adminPanel");
  }

  if ($("pvpAttackBtn")) {
    $("pvpAttackBtn").onclick =
      pvpAttack;
  }

  if ($("pvpDefendBtn")) {
    $("pvpDefendBtn").onclick =
      pvpDefend;
  }

  if ($("pvpSkillBtn")) {
    $("pvpSkillBtn").onclick =
      pvpSkill;
  }

  if ($("pvpInspectBtn")) {
    $("pvpInspectBtn").onclick =
      pvpInspect;
  }

  if ($("pvpRunBtn")) {
    $("pvpRunBtn").onclick =
      pvpRun;
  }
}


/* =========================================================
   Enterキー対応
========================================================= */

function setupKeyboard() {

  document.addEventListener(
    "keydown",
    event => {

      if (
        event.key === "Enter" &&
        document.activeElement === $("roomCodeInput")
      ) {

        joinRoom();
      }

      if (
        event.key === "Enter" &&
        document.activeElement === $("chatInput")
      ) {

        sendChat();
      }

      if (
        event.key === "Enter" &&
        document.activeElement === $("adminCodeInput")
      ) {

        adminLogin();
      }
    }
  );
}


/* =========================================================
   ゲーム開始
========================================================= */

function startGame() {

  const nameInput =
    $("nameInput");

  const jobInput =
    $("jobInput");

  player.name =
    nameInput
      ? nameInput.value.trim()
      : "";

  player.job =
    jobInput
      ? jobInput.value
      : "勇者";

  if (!player.name) {
    player.name = "勇者";
  }

  player.hp =
    player.maxHp;

  $("startScreen")
    ?.classList.add("hidden");

  $("gameScreen")
    ?.classList.remove("hidden");

  updateStatus();

  saveGame();

  sendPlayerUpdate();

  logMessage(
    `⚔️ ${player.name}の冒険が始まった！`
  );
}


/* =========================================================
   リスタート
========================================================= */

function restartGame() {

  localStorage.removeItem(
    "yuusha_bounty_rpg"
  );

  location.reload();
}


/* =========================================================
   初期化
========================================================= */

function init() {

  loadGame();

  bindButtons();

  setupKeyboard();

  updateStatus();

  if ($("startBtn")) {
    $("startBtn").onclick =
      startGame;
  }

  if ($("restartBtn")) {
    $("restartBtn").onclick =
      restartGame;
  }

  hidePanel("battleScreen");
  hidePanel("pvpBattleScreen");
  hidePanel("levelChoices");
  hidePanel("onlinePanel");
  hidePanel("adminPanel");
  hidePanel("gameOverPanel");

  if (player.name) {

    $("startScreen")
      ?.classList.add("hidden");

    $("gameScreen")
      ?.classList.remove("hidden");

    updateStatus();

    logMessage(
      `👋 ${player.name}のデータを読み込みました！`
    );
  }
}


init();
