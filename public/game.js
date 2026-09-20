const socket = io();

/* =========================================================
   プレイヤー
========================================================= */

let player = {
  name: "",
  job: "勇者",

  hp: 100,
  maxHp: 100,

  level: 1,
  maxLevel: 100,

  attack: 10,
  maxAttack: 999999,

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


/* =========================================================
   管理者
========================================================= */

const ADMIN_CODE = "3487";


/* =========================================================
   戦闘
========================================================= */

let enemy = null;
let defending = false;
let battleBusy = false;

let pvpBattle = false;
let pvpOpponent = null;
let pvpMyTurn = false;


/* =========================================================
   オンライン状態
========================================================= */

let onlineConnected = false;
let currentRoomId = null;


/* =========================================================
   モンスター
========================================================= */

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


/* =========================================================
   ボス
========================================================= */

const boss = {
  name: "懸賞金王",
  hp: 800,
  attack: 55,
  xp: 500,
  money: 500,
  bounty: 1000
};


/* =========================================================
   スキル
========================================================= */

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


/* =========================================================
   DOM
========================================================= */

const $ = id => document.getElementById(id);


/* =========================================================
   ログ
========================================================= */

function logMessage(message) {

  const log = $("log");

  if (!log) return;

  const line =
    document.createElement("div");

  line.textContent = message;

  log.appendChild(line);

  while (log.children.length > 80) {
    log.removeChild(log.firstChild);
  }

  log.scrollTop =
    log.scrollHeight;
}


/* =========================================================
   セーブ
========================================================= */

function saveGame() {

  try {

    localStorage.setItem(
      "yuusha_bounty_rpg",
      JSON.stringify(player)
    );

  } catch (error) {

    console.warn(
      "セーブ失敗",
      error
    );
  }
}


/* =========================================================
   ロード
========================================================= */

function loadGame() {

  try {

    const saved =
      localStorage.getItem(
        "yuusha_bounty_rpg"
      );

    if (!saved) return;

    const data =
      JSON.parse(saved);

    if (
      !data ||
      typeof data !== "object"
    ) {
      return;
    }

    player = {
      ...player,
      ...data
    };

  } catch (error) {

    console.warn(
      "ロード失敗",
      error
    );
  }
}


/* =========================================================
   ステータス表示
========================================================= */

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
      Math.max(
        0,
        player.hp
      );
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

  const hpBar =
    $("hpBar");

  if (hpBar) {

    const percent =
      player.maxHp > 0
        ? player.hp /
          player.maxHp *
          100
        : 0;

    hpBar.style.width =
      Math.max(
        0,
        Math.min(
          100,
          percent
        )
      ) + "%";
  }
}


/* =========================================================
   オンライン接続状態表示
========================================================= */

function updateOnlineStatus(text, connected) {

  onlineConnected =
    connected;

  const status =
    $("roomStatus");

  if (status) {
    status.textContent =
      text;
  }
}


/* =========================================================
   オンラインプレイヤー更新
========================================================= */

function sendPlayerUpdate() {

  if (
    !socket ||
    !socket.connected ||
    !currentRoomId
  ) {
    return;
  }

  socket.emit(
    "playerUpdate",
    {
      name:
        player.name,

      job:
        player.job,

      level:
        player.level,

      hp:
        player.hp,

      maxHp:
        player.maxHp,

      attack:
        player.attack,

      xp:
        player.xp,

      money:
        player.money,

      bounty:
        player.bounty,

      weapon:
        player.weapon,

      area:
        player.area,

      defeats:
        player.defeats,

      skillCount:
        player.skillCount
    }
  );
}


/* =========================================================
   パネル
========================================================= */

function showPanel(id) {

  const panel =
    $(id);

  if (!panel) return;

  panel.classList.remove(
    "hidden"
  );

  panel.style.display = "";
}


function hidePanel(id) {

  const panel =
    $(id);

  if (!panel) return;

  panel.classList.add(
    "hidden"
  );
}


/* =========================================================
   戦闘判定
========================================================= */

function isBusy() {

  return (
    battleBusy ||
    pvpBattle
  );
}


/* =========================================================
   通常戦闘開始
========================================================= */

function startBattle() {

  if (isBusy()) {

    logMessage(
      "⚠️ すでに戦闘中です！"
    );

    return;
  }

  const base =
    monsters[
      Math.floor(
        Math.random() *
        monsters.length
      )
    ];

  enemy = {

    name:
      base.name,

    hp:
      base.hp +
      player.level * 4,

    maxHp:
      base.hp +
      player.level * 4,

    attack:
      base.attack +
      Math.floor(
        player.level * 1.5
      ),

    xp:
      base.xp +
      player.level * 2,

    money:
      base.money +
      player.level
  };

  battleBusy = true;

  defending = false;

  showPanel(
    "battleScreen"
  );

  updateEnemyDisplay();

  logMessage(
    `⚔️ ${enemy.name}が現れた！`
  );
}


/* =========================================================
   敵表示
========================================================= */

function updateEnemyDisplay() {

  if (!enemy) return;

  if ($("enemyName")) {
    $("enemyName").textContent =
      enemy.name;
  }

  if ($("enemyHp")) {
    $("enemyHp").textContent =
      Math.max(
        0,
        enemy.hp
      );
  }

  if ($("enemyMaxHp")) {
    $("enemyMaxHp").textContent =
      enemy.maxHp;
  }

  if ($("enemyHpBar")) {

    const percent =
      enemy.maxHp > 0
        ? enemy.hp /
          enemy.maxHp *
          100
        : 0;

    $("enemyHpBar").style.width =
      Math.max(
        0,
        Math.min(
          100,
          percent
        )
      ) + "%";
  }
}


/* =========================================================
   通常攻撃
========================================================= */

function attackEnemy() {

  if (
    !battleBusy ||
    !enemy ||
    enemy.hp <= 0
  ) {
    return;
  }

  defending = false;

  const damage =
    Math.max(
      1,
      player.attack +
      Math.floor(
        Math.random() * 6
      )
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


/* =========================================================
   防御
========================================================= */

function defend() {

  if (
    !battleBusy ||
    !enemy
  ) {
    return;
  }

  defending = true;

  logMessage(
    "🛡️ 防御態勢に入った！"
  );

  enemyAttack();
}


/* =========================================================
   敵攻撃
========================================================= */

function enemyAttack() {

  if (
    !enemy ||
    !battleBusy
  ) {
    return;
  }

  setTimeout(() => {

    if (
      !enemy ||
      !battleBusy
    ) {
      return;
    }

    let damage =
      enemy.attack +
      Math.floor(
        Math.random() * 5
      );

    if (defending) {

      damage =
        Math.max(
          1,
          Math.floor(
            damage / 2
          )
        );

      logMessage(
        "🛡️ 防御でダメージ半減！"
      );
    }

    defending = false;

    player.hp -=
      damage;

    logMessage(
      `💥 ${enemy.name}の攻撃！${damage}ダメージ！`
    );

    updateStatus();

    saveGame();

    if (player.hp <= 0) {

      player.hp = 0;

      updateStatus();

      gameOver();
    }

  }, 450);
}


/* =========================================================
   スキル
========================================================= */

function useSkill() {

  if (
    !battleBusy ||
    !enemy ||
    enemy.hp <= 0
  ) {
    return;
  }

  const index =
    Math.max(
      0,
      Math.min(
        player.skillCount - 1,
        skills.length - 1
      )
    );

  const skill =
    skills[index];

  const multiplier =
    skill
      ? skill.multiplier
      : 2;

  const damage =
    Math.max(
      1,
      Math.floor(
        player.attack *
        multiplier
      ) +
      Math.floor(
        Math.random() * 10
      )
    );

  enemy.hp -=
    damage;

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


/* =========================================================
   敵を調べる
========================================================= */

function inspectEnemy() {

  if (!enemy) return;

  logMessage(
    `👁️ ${enemy.name} HP:${enemy.hp}/${enemy.maxHp} 攻撃:${enemy.attack}`
  );
}


/* =========================================================
   逃走
========================================================= */

function runBattle() {

  if (!battleBusy) return;

  if (
    Math.random() <
    0.75
  ) {

    logMessage(
      "🏃 戦闘から逃げた！"
    );

    battleBusy = false;

    enemy = null;

    hidePanel(
      "battleScreen"
    );

  } else {

    logMessage(
      "❌ 逃げられなかった！"
    );

    enemyAttack();
  }
}


/* =========================================================
   戦闘勝利
========================================================= */

function winBattle() {

  if (!enemy) return;

  const defeatedEnemy =
    enemy;

  battleBusy = false;

  enemy = null;

  hidePanel(
    "battleScreen"
  );

  player.defeats++;

  player.xp +=
    defeatedEnemy.xp;

  player.money +=
    defeatedEnemy.money;

  player.bounty +=
    Math.floor(
      defeatedEnemy.money / 2
    );

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


/* =========================================================
   レベルアップ
========================================================= */

function checkLevelUp() {

  while (
    player.level <
      player.maxLevel &&
    player.xp >=
      player.level * 100
  ) {

    player.xp -=
      player.level * 100;

    player.level++;

    showPanel(
      "levelChoices"
    );

    logMessage(
      `🆙 レベル${player.level}になった！`
    );
  }
}


/* =========================================================
   HP強化
========================================================= */

function levelUpHp() {

  if (
    player.level <= 1
  ) {
    return;
  }

  player.maxHp += 20;

  player.hp =
    player.maxHp;

  logMessage(
    "❤️ 最大HPが20上昇した！"
  );

  hidePanel(
    "levelChoices"
  );

  updateStatus();

  saveGame();

  sendPlayerUpdate();
}


/* =========================================================
   攻撃強化
========================================================= */

function levelUpAttack() {

  if (
    player.level <= 1
  ) {
    return;
  }

  player.attack += 5;

  logMessage(
    "⚔️ 攻撃力が5上昇した！"
  );

  hidePanel(
    "levelChoices"
  );

  updateStatus();

  saveGame();

  sendPlayerUpdate();
}


/* =========================================================
   スキル強化
========================================================= */

function levelUpSkill() {

  player.skillCount =
    Math.min(
      player.maxSkillCount,
      player.skillCount + 1
    );

  logMessage(
    "✨ スキルレベルが上昇した！"
  );

  hidePanel(
    "levelChoices"
  );

  updateStatus();

  saveGame();

  sendPlayerUpdate();
}


/* =========================================================
   町
========================================================= */

function goTown() {

  if (isBusy()) {

    logMessage(
      "⚠️ 戦闘中は町へ行けません！"
    );

    return;
  }

  if (
    player.defeats < 3 &&
    !player.admin
  ) {

    logMessage(
      "🔒 町へ行くには敵を3体倒してください！"
    );

    return;
  }

  player.area =
    "町";

  player.hp =
    player.maxHp;

  logMessage(
    "🏘️ 町に到着した！"
  );

  logMessage(
    `❤️ HPが${player.maxHp}まで全回復した！`
  );

  if (
    Math.random() <
    0.35
  ) {

    const gift =
      20 +
      Math.floor(
        Math.random() * 51
      );

    player.money +=
      gift;

    logMessage(
      `🎁 町の人から${gift}円もらった！`
    );
  }

  updateStatus();

  saveGame();

  sendPlayerUpdate();
}


/* =========================================================
   都市
========================================================= */

function goCity() {

  if (isBusy()) {

    logMessage(
      "⚠️ 戦闘中は都市へ行けません！"
    );

    return;
  }

  if (
    player.defeats < 10 &&
    !player.admin
  ) {

    logMessage(
      "🔒 都市へ行くには敵を10体倒してください！"
    );

    return;
  }

  player.area =
    "都市";

  logMessage(
    "🏙️ 都市へ到着した！"
  );

  updateStatus();

  saveGame();

  sendPlayerUpdate();
}


/* =========================================================
   回復
========================================================= */

function heal() {

  if (
    player.hp >=
    player.maxHp
  ) {

    logMessage(
      "❤️ HPはすでに満タンです！"
    );

    return;
  }

  if (
    player.area === "町" ||
    player.admin
  ) {

    player.hp =
      player.maxHp;

    logMessage(
      "❤️ 無料で全回復した！"
    );

  } else {

    if (
      player.money < 30
    ) {

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
  }

  updateStatus();

  saveGame();

  sendPlayerUpdate();
}


/* =========================================================
   ボス
========================================================= */

function startBoss() {

  if (isBusy()) {

    logMessage(
      "⚠️ 戦闘中です！"
    );

    return;
  }

  if (
    player.defeats < 20 &&
    !player.admin
  ) {

    logMessage(
      "🔒 ボス戦には20体以上の撃破が必要です！"
    );

    return;
  }

  enemy = {

    name:
      boss.name,

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

  showPanel(
    "battleScreen"
  );

  updateEnemyDisplay();

  logMessage(
    `👑 ボス ${enemy.name} が現れた！`
  );
}


/* =========================================================
   ガチャ
========================================================= */

function gacha() {

  if (player.admin) {

    player.weapon =
      "管理者の剣";

    player.attack =
      player.maxAttack;

    logMessage(
      "👑 管理者の剣を取得！"
    );

    updateStatus();

    saveGame();

    sendPlayerUpdate();

    return;
  }

  if (
    player.money < 100
  ) {

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


/* =========================================================
   管理者
========================================================= */

function activateAdmin() {

  player.admin = true;

  player.level =
    player.maxLevel;

  player.xp = 0;

  player.maxHp =
    999999;

  player.hp =
    player.maxHp;

  player.attack =
    player.maxAttack;

  player.skillCount =
    player.maxSkillCount;

  player.money =
    999999999;

  player.bounty =
    999999999;

  player.defeats =
    999999;

  player.weapon =
    "管理者の剣";

  logMessage(
    "🔓 管理者認証成功！"
  );

  logMessage(
    "👑 管理者モードON！"
  );

  logMessage(
    "🆙 レベルMAX！"
  );

  logMessage(
    "❤️ HP MAX！"
  );

  logMessage(
    "⚔️ 攻撃力MAX！"
  );

  logMessage(
    "✨ スキルMAX！"
  );

  logMessage(
    "💰 お金MAX！"
  );

  logMessage(
    "💰 懸賞金MAX！"
  );

  logMessage(
    "💀 撃破数MAX！"
  );

  logMessage(
    "🗡️ 管理者の剣を取得！"
  );

  updateStatus();

  saveGame();

  sendPlayerUpdate();

  if ($("adminLoginArea")) {

    $("adminLoginArea")
      .classList.add("hidden");
  }

  if ($("adminControls")) {

    $("adminControls")
      .classList.remove("hidden");
  }
}


/* =========================================================
   管理者ログイン
========================================================= */

function adminLogin() {

  const input =
    $("adminCodeInput");

  let code = "";

  if (input) {

    code =
      input.value.trim();
  }

  if (!code) {

    code =
      prompt(
        "🔐 管理者コードを入力してください"
      );

    if (
      code === null
    ) {
      return;
    }

    code =
      String(code).trim();
  }

  if (
    code === ADMIN_CODE
  ) {

    activateAdmin();

    if (input) {
      input.value = "";
    }

    alert(
      "👑 管理者認証成功！\n\nレベル・ステータスがMAXになりました！"
    );

    return;
  }

  logMessage(
    "❌ 管理者コードが違います！"
  );

  alert(
    "❌ 管理者コードが違います！"
  );

  if (input) {
    input.value = "";
  }
}


/* =========================================================
   管理者パネル
========================================================= */

function openAdminPanel() {

  if (player.admin) {

    if ($("adminPanel")) {

      showPanel(
        "adminPanel"
      );

      if ($("adminLoginArea")) {

        $("adminLoginArea")
          .classList.add("hidden");
      }

      if ($("adminControls")) {

        $("adminControls")
          .classList.remove("hidden");
      }

    } else {

      alert(
        "👑 管理者モードはONです！"
      );
    }

    return;
  }

  if ($("adminPanel")) {

    showPanel(
      "adminPanel"
    );

    if ($("adminLoginArea")) {

      $("adminLoginArea")
        .classList.remove("hidden");
    }

    if ($("adminControls")) {

      $("adminControls")
        .classList.add("hidden");
    }

    return;
  }

  adminLogin();
}


/* =========================================================
   管理者レベルMAX
========================================================= */

function adminMaxLevel() {

  if (!player.admin) {

    adminLogin();

    return;
  }

  player.level =
    player.maxLevel;

  player.xp = 0;

  logMessage(
    `👑 レベル${player.maxLevel} MAX！`
  );

  updateStatus();

  saveGame();

  sendPlayerUpdate();
}


/* =========================================================
   管理者ステータスMAX
========================================================= */

function adminMaxStatus() {

  if (!player.admin) {

    adminLogin();

    return;
  }

  player.maxHp =
    999999;

  player.hp =
    player.maxHp;

  player.attack =
    player.maxAttack;

  player.skillCount =
    player.maxSkillCount;

  logMessage(
    "👑 ステータスMAX！"
  );

  updateStatus();

  saveGame();

  sendPlayerUpdate();
}


/* =========================================================
   管理者全部MAX
========================================================= */

function adminMaxAll() {

  if (!player.admin) {

    adminLogin();

    return;
  }

  activateAdmin();
}


/* =========================================================
   PvP開始
========================================================= */

function startPvP(opponent) {

  if (!opponent) {
    return;
  }

  if (isBusy()) {
    return;
  }

  pvpBattle = true;

  pvpOpponent =
    opponent;

  showPanel(
    "pvpBattleScreen"
  );

  updatePvPDisplay();

  logMessage(
    `⚔️ ${opponent.name}とのPvP開始！`
  );
}


/* =========================================================
   PvP表示
========================================================= */

function updatePvPDisplay() {

  if (!pvpOpponent) {
    return;
  }

  if ($("pvpOpponentName")) {

    $("pvpOpponentName")
      .textContent =
      pvpOpponent.name;
  }

  if ($("pvpOpponentHp")) {

    $("pvpOpponentHp")
      .textContent =
      Math.max(
        0,
        pvpOpponent.hp
      );
  }

  if ($("pvpOpponentMaxHp")) {

    $("pvpOpponentMaxHp")
      .textContent =
      pvpOpponent.maxHp;
  }

  if ($("pvpOpponentHpBar")) {

    const percent =
      pvpOpponent.maxHp > 0
        ? pvpOpponent.hp /
          pvpOpponent.maxHp *
          100
        : 0;

    $("pvpOpponentHpBar")
      .style.width =
      Math.max(
        0,
        Math.min(
          100,
          percent
        )
      ) + "%";
  }

  if ($("pvpTurnText")) {

    $("pvpTurnText")
      .textContent =
      pvpMyTurn
        ? "あなたのターン"
        : "相手のターン";
  }
}


/* =========================================================
   PvP攻撃
========================================================= */

function pvpAttack() {

  if (
    !pvpBattle ||
    !pvpMyTurn
  ) {
    return;
  }

  socket.emit(
    "pvpAttack"
  );

  pvpMyTurn = false;

  updatePvPDisplay();
}


/* =========================================================
   PvP防御
========================================================= */

function pvpDefend() {

  if (
    !pvpBattle ||
    !pvpMyTurn
  ) {
    return;
  }

  socket.emit(
    "pvpDefend"
  );

  pvpMyTurn = false;

  updatePvPDisplay();
}


/* =========================================================
   PvPスキル
========================================================= */

function pvpSkill() {

  if (
    !pvpBattle ||
    !pvpMyTurn
  ) {
    return;
  }

  const index =
    Math.max(
      0,
      Math.min(
        player.skillCount - 1,
        skills.length - 1
      )
    );

  const skill =
    skills[index];

  socket.emit(
    "pvpSkill",
    {
      skillName:
        skill
          ? skill.name
          : "斬撃"
    }
  );

  pvpMyTurn = false;

  updatePvPDisplay();
}


/* =========================================================
   PvP調査
========================================================= */

function pvpInspect() {

  if (!pvpOpponent) {
    return;
  }

  logMessage(
    `👁️ ${pvpOpponent.name} HP:${pvpOpponent.hp}/${pvpOpponent.maxHp}`
  );
}


/* =========================================================
   PvP逃走
========================================================= */

function pvpRun() {

  if (!pvpBattle) {
    return;
  }

  socket.emit(
    "pvpRun"
  );
}


/* =========================================================
   PvP終了
========================================================= */

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
   オンライン
========================================================= */

function createRoom() {

  if (!socket.connected) {

    logMessage(
      "🔴 オンライン未接続です。"
    );

    return;
  }

  socket.emit(
    "createRoom",
    {
      name:
        player.name ||
        "勇者"
    }
  );
}


function joinRoom() {

  const input =
    $("roomCodeInput");

  if (!input) {
    return;
  }

  const code =
    input.value
      .trim()
      .toUpperCase();

  if (!code) {

    logMessage(
      "⚠️ ルームコードを入力してください！"
    );

    return;
  }

  if (!socket.connected) {

    logMessage(
      "🔴 オンライン未接続です。"
    );

    return;
  }

  socket.emit(
    "joinRoom",
    {
      roomId:
        code,

      name:
        player.name ||
        "勇者"
    }
  );
}


function leaveRoom() {

  if (
    socket.connected &&
    currentRoomId
  ) {

    socket.emit(
      "leaveRoom"
    );
  }

  currentRoomId =
    null;

  updateOnlineStatus(
    "未接続",
    onlineConnected
  );

  if ($("roomInfo")) {

    $("roomInfo")
      .textContent =
      "";
  }

  if ($("roomPlayers")) {

    $("roomPlayers")
      .innerHTML =
      "";
  }
}


function openOnline() {

  showPanel(
    "onlinePanel"
  );

  if (socket.connected) {

    updateOnlineStatus(
      currentRoomId
        ? "🟢 ルーム参加中"
        : "🟢 オンライン接続済み",
      true
    );

  } else {

    updateOnlineStatus(
      "🔴 オンライン未接続",
      false
    );
  }
}


function closeOnline() {

  hidePanel(
    "onlinePanel"
  );
}


/* =========================================================
   チャット
========================================================= */

function sendChat() {

  const input =
    $("chatInput");

  if (!input) {
    return;
  }

  const message =
    input.value.trim();

  if (!message) {
    return;
  }

  if (!currentRoomId) {

    logMessage(
      "⚠️ 先にルームへ参加してください。"
    );

    return;
  }

  socket.emit(
    "chat",
    message
  );

  input.value = "";
}


function addChatMessage(
  name,
  message
) {

  const chat =
    $("chatLog");

  if (!chat) {
    return;
  }

  const line =
    document.createElement(
      "div"
    );

  line.textContent =
    `${name}: ${message}`;

  chat.appendChild(line);

  chat.scrollTop =
    chat.scrollHeight;
}


/* =========================================================
   Socket.IO 接続
========================================================= */

socket.on(
  "connect",
  () => {

    onlineConnected =
      true;

    updateOnlineStatus(
      "🟢 オンライン接続済み",
      true
    );

    logMessage(
      "🟢 オンラインサーバーに接続しました！"
    );

    console.log(
      "Socket.IO 接続成功:",
      socket.id
    );
  }
);


socket.on(
  "onlineReady",
  () => {

    onlineConnected =
      true;

    updateOnlineStatus(
      currentRoomId
        ? "🟢 ルーム参加中"
        : "🟢 オンライン接続済み",
      true
    );

    console.log(
      "オンライン準備完了"
    );
  }
);


socket.on(
  "disconnect",
  reason => {

    onlineConnected =
      false;

    currentRoomId =
      null;

    updateOnlineStatus(
      "🔴 オンライン未接続",
      false
    );

    logMessage(
      "🔴 オンラインサーバーから切断されました。"
    );

    console.log(
      "Socket.IO切断:",
      reason
    );
  }
);


socket.on(
  "connect_error",
  error => {

    onlineConnected =
      false;

    updateOnlineStatus(
      "🔴 オンライン未接続",
      false
    );

    console.error(
      "Socket.IO接続エラー:",
      error
    );

    logMessage(
      "❌ オンライン接続に失敗しました。"
    );
  }
);


/* =========================================================
   ルーム作成成功
========================================================= */

socket.on(
  "roomCreated",
  data => {

    currentRoomId =
      data.roomId;

    updateOnlineStatus(
      "🟢 ルーム参加中",
      true
    );

    if ($("roomInfo")) {

      $("roomInfo")
        .textContent =
        `ルームコード：${data.roomId}`;
    }

    logMessage(
      `🏠 ルームを作成しました！コード：${data.roomId}`
    );

    if (data.player) {

      player = {
        ...player,
        ...data.player
      };

      updateStatus();
    }

    renderRoomPlayers(
      data.players || []
    );
  }
);


/* =========================================================
   ルーム参加成功
========================================================= */

socket.on(
  "roomJoined",
  data => {

    currentRoomId =
      data.roomId;

    updateOnlineStatus(
      "🟢 ルーム参加中",
      true
    );

    if ($("roomInfo")) {

      $("roomInfo")
        .textContent =
        `ルームコード：${data.roomId}`;
    }

    logMessage(
      `🚪 ルーム ${data.roomId} に参加しました！`
    );

    if (data.player) {

      player = {
        ...player,
        ...data.player
      };

      updateStatus();
    }

    renderRoomPlayers(
      data.players || []
    );
  }
);


/* =========================================================
   ルームプレイヤー一覧
========================================================= */

function renderRoomPlayers(players) {

  const container =
    $("roomPlayers");

  if (!container) {
    return;
  }

  container.innerHTML = "";

  players.forEach(
    p => {

      const div =
        document.createElement(
          "div"
        );

      div.className =
        "room-player";

      div.textContent =
        `${p.name}　Lv.${p.level}　HP:${p.hp}/${p.maxHp}`;

      container.appendChild(
        div
      );
    }
  );
}


socket.on(
  "roomPlayersUpdate",
  players => {

    renderRoomPlayers(
      players
    );
  }
);


/* =========================================================
   ルームエラー
========================================================= */

socket.on(
  "roomError",
  message => {

    logMessage(
      `❌ ${message}`
    );

    alert(
      `❌ ${message}`
    );
  }
);


/* =========================================================
   ルーム退出
========================================================= */

socket.on(
  "leftRoom",
  () => {

    currentRoomId =
      null;

    updateOnlineStatus(
      "🟢 オンライン接続済み",
      socket.connected
    );

    if ($("roomInfo")) {

      $("roomInfo")
        .textContent =
        "";
    }

    if ($("roomPlayers")) {

      $("roomPlayers")
        .innerHTML =
        "";
    }

    logMessage(
      "🚪 ルームから退出しました。"
    );
  }
);


/* =========================================================
   公開チャット
========================================================= */

socket.on(
  "publicMessage",
  data => {

    if (!data) {
      return;
    }

    addChatMessage(
      data.name ||
        "勇者",

      data.message ||
        ""
    );
  }
);


/* =========================================================
   オンライン戦闘ログ
========================================================= */

socket.on(
  "onlineBattleLog",
  data => {

    if (!data) {
      return;
    }

    logMessage(
      `⚔️ ${data.name || "勇者"}: ${data.message || ""}`
    );
  }
);


/* =========================================================
   PvP申請
========================================================= */

socket.on(
  "pvpRequest",
  data => {

    if (!data) {
      return;
    }

    const ok =
      confirm(
        `${data.fromName || "プレイヤー"}からPvP対戦を申し込まれました。\n\n対戦しますか？`
      );

    if (ok) {

      socket.emit(
        "pvpAccept",
        data.fromId
      );

    } else {

      socket.emit(
        "pvpReject",
        data.fromId
      );
    }
  }
);


/* =========================================================
   PvP申請送信
========================================================= */

socket.on(
  "pvpChallengeSent",
  data => {

    logMessage(
      `⚔️ ${data.targetName}へPvP対戦を申し込みました。`
    );
  }
);


/* =========================================================
   PvP開始
========================================================= */

socket.on(
  "pvpStarted",
  data => {

    if (!data) {
      return;
    }

    pvpBattle = true;

    pvpMyTurn =
      !!data.yourTurn;

    pvpOpponent = {
      id:
        data.opponentId,

      name:
        data.opponentName,

      hp:
        100,

      maxHp:
        100
    };

    showPanel(
      "pvpBattleScreen"
    );

    updatePvPDisplay();

    logMessage(
      `⚔️ ${data.opponentName}とのPvPが始まった！`
    );
  }
);


/* =========================================================
   PvP攻撃結果
========================================================= */

socket.on(
  "pvpAttackResult",
  data => {

    if (!data) {
      return;
    }

    if (
      pvpOpponent &&
      data.targetId ===
        pvpOpponent.id
    ) {

      pvpOpponent.hp =
        data.targetHp;

      pvpOpponent.maxHp =
        data.targetMaxHp;
    }

    if (
      data.attackerId ===
      socket.id
    ) {

      logMessage(
        `⚔️ ${data.targetName}に${data.damage}ダメージ！`
      );

    } else {

      player.hp =
        Math.max(
          0,
          player.hp -
          data.damage
        );

      logMessage(
        `💥 ${data.attackerName}から${data.damage}ダメージ！`
      );

      updateStatus();
    }

    updatePvPDisplay();
  }
);


/* =========================================================
   PvPスキル結果
========================================================= */

socket.on(
  "pvpSkillResult",
  data => {

    if (!data) {
      return;
    }

    if (
      pvpOpponent &&
      data.targetId ===
        pvpOpponent.id
    ) {

      pvpOpponent.hp =
        data.targetHp;

      pvpOpponent.maxHp =
        data.targetMaxHp;
    }

    if (
      data.attackerId ===
      socket.id
    ) {

      logMessage(
        `✨ ${data.skillName}！${data.damage}ダメージ！`
      );

    } else {

      player.hp =
        Math.max(
          0,
          player.hp -
          data.damage
        );

      logMessage(
        `💥 ${data.attackerName}の${data.skillName}！${data.damage}ダメージ！`
      );

      updateStatus();
    }

    updatePvPDisplay();
  }
);


/* =========================================================
   PvPターン
========================================================= */

socket.on(
  "pvpTurn",
  data => {

    if (!data) {
      return;
    }

    pvpMyTurn =
      data.turnId ===
      socket.id;

    updatePvPDisplay();
  }
);


/* =========================================================
   PvP防御
========================================================= */

socket.on(
  "pvpDefended",
  () => {

    logMessage(
      "🛡️ 防御態勢！"
    );
  }
);


socket.on(
  "pvpOpponentDefended",
  data => {

    logMessage(
      `🛡️ ${data.playerName}が防御した！`
    );
  }
);


/* =========================================================
   PvPエラー
========================================================= */

socket.on(
  "pvpError",
  message => {

    logMessage(
      `❌ PvP：${message}`
    );

    alert(
      `❌ ${message}`
    );
  }
);


/* =========================================================
   PvP拒否
========================================================= */

socket.on(
  "pvpRejected",
  data => {

    logMessage(
      `❌ ${data.targetName}とのPvP申請を拒否しました。`
    );
  }
);


socket.on(
  "pvpRejectedByTarget",
  data => {

    logMessage(
      `❌ ${data.targetName}にPvPを拒否されました。`
    );
  }
);


/* =========================================================
   PvP終了
========================================================= */

socket.on(
  "pvpFinished",
  data => {

    if (!data) {
      endPvP();
      return;
    }

    if (
      data.winnerId ===
      socket.id
    ) {

      logMessage(
        `🏆 ${data.winnerName}がPvPに勝利！`
      );

    } else {

      logMessage(
        `💀 ${data.loserName}が敗北！`
      );
    }

    if (
      data.loserId ===
      socket.id
    ) {

      player.hp = 0;

      updateStatus();
    }

    endPvP();
  }
);


/* =========================================================
   PvP強制終了
========================================================= */

socket.on(
  "pvpEnded",
  data => {

    if (
      data &&
      data.reason
    ) {

      logMessage(
        `⚠️ ${data.reason}`
      );
    }

    endPvP();
  }
);


/* =========================================================
   ボタン
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


  /* 管理者 */

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
      () => {
        hidePanel(
          "adminPanel"
        );
      };
  }


  /* PvP */

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


  /* データ削除 */

  if ($("deleteDataBtn")) {

    $("deleteDataBtn").onclick =
      deleteGameData;
  }
}


/* =========================================================
   データ完全削除
========================================================= */

function deleteGameData() {

  const ok =
    confirm(
      "⚠️ 本当にゲームデータを全部削除しますか？\n\n" +
      "レベル・HP・攻撃力・お金・懸賞金・装備・管理者状態など、\n" +
      "保存されているゲームデータがすべて消えます。\n\n" +
      "この操作は元に戻せません。"
    );

  if (!ok) {
    return;
  }


  /* セーブデータ削除 */

  localStorage.removeItem(
    "yuusha_bounty_rpg"
  );

  /* 念のため関連キーも削除 */

  localStorage.removeItem(
    "yuusha_bounty_rpg_save"
  );

  localStorage.removeItem(
    "yuusha_bounty_rpg_data"
  );


  /* PvP終了 */

  pvpBattle = false;

  pvpOpponent = null;

  pvpMyTurn = false;


  /* 通常戦闘終了 */

  battleBusy = false;

  enemy = null;

  defending = false;


  /* オンライン退出 */

  if (
    socket.connected &&
    currentRoomId
  ) {

    socket.emit(
      "leaveRoom"
    );
  }

  currentRoomId =
    null;


  alert(
    "🗑️ ゲームデータを削除しました！\n\n" +
    "ゲームを初期状態に戻します。"
  );


  location.reload();
}


/* =========================================================
   キーボード
========================================================= */

function setupKeyboard() {

  document.addEventListener(
    "keydown",
    event => {

      if (
        event.key === "Enter" &&
        document.activeElement ===
          $("roomCodeInput")
      ) {

        joinRoom();
      }

      if (
        event.key === "Enter" &&
        document.activeElement ===
          $("chatInput")
      ) {

        sendChat();
      }

      if (
        event.key === "Enter" &&
        document.activeElement ===
          $("adminCodeInput")
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
    player.name =
      "勇者";
  }

  player.hp =
    player.maxHp;


  if ($("startScreen")) {

    $("startScreen")
      .classList.add("hidden");
  }

  if ($("gameScreen")) {

    $("gameScreen")
      .classList.remove("hidden");
  }


  updateStatus();

  saveGame();

  logMessage(
    `⚔️ ${player.name}の冒険が始まった！`
  );


  /*
    ルームに入っている場合だけ
    サーバーへ送信
  */

  sendPlayerUpdate();
}


/* =========================================================
   リスタート
========================================================= */

function restartGame() {

  deleteGameData();
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


  hidePanel(
    "battleScreen"
  );

  hidePanel(
    "pvpBattleScreen"
  );

  hidePanel(
    "levelChoices"
  );

  hidePanel(
    "onlinePanel"
  );

  hidePanel(
    "adminPanel"
  );

  hidePanel(
    "gameOverPanel"
  );


  /* 保存データ復元 */

  if (player.name) {

    if ($("startScreen")) {

      $("startScreen")
        .classList.add("hidden");
    }

    if ($("gameScreen")) {

      $("gameScreen")
        .classList.remove("hidden");
    }

    updateStatus();

    logMessage(
      `👋 ${player.name}のデータを読み込みました！`
    );


    if (player.admin) {

      logMessage(
        "👑 管理者モードが復元されました！"
      );
    }
  }


  /* 最初の接続状態 */

  if (socket.connected) {

    updateOnlineStatus(
      "🟢 オンライン接続済み",
      true
    );

  } else {

    updateOnlineStatus(
      "🔴 オンライン未接続",
      false
    );
  }
}


/* =========================================================
   起動
========================================================= */

init();
