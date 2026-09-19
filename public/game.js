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


/* =========================
   管理者コード
========================= */

const ADMIN_CODE = "3487";


/* =========================
   戦闘
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
   DOM
========================= */

const $ = id => document.getElementById(id);


/* =========================
   ログ
========================= */

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

  } catch (error) {

    console.warn(
      "セーブ失敗",
      error
    );
  }
}


/* =========================
   読み込み
========================= */

function loadGame() {

  try {

    const saved =
      localStorage.getItem(
        "yuusha_bounty_rpg"
      );

    if (!saved) return;

    const data =
      JSON.parse(saved);

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
      Math.max(
        0,
        Math.min(100, percent)
      ) + "%";
  }
}


/* =========================
   オンライン送信
========================= */

function sendPlayerUpdate() {

  if (!socket) return;

  socket.emit(
    "playerUpdate",
    {
      name: player.name,
      job: player.job,
      level: player.level,
      hp: player.hp,
      maxHp: player.maxHp,
      attack: player.attack,
      area: player.area,
      bounty: player.bounty
    }
  );
}


/* =========================
   パネル
========================= */

function showPanel(id) {

  const panel = $(id);

  if (!panel) return;

  panel.classList.remove("hidden");
  panel.style.display = "";
}


function hidePanel(id) {

  const panel = $(id);

  if (!panel) return;

  panel.classList.add("hidden");
}


/* =========================
   戦闘判定
========================= */

function isBusy() {
  return battleBusy || pvpBattle;
}


/* =========================
   敵戦闘開始
========================= */

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

    name: base.name,

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
        ? enemy.hp / enemy.maxHp * 100
        : 0;

    $("enemyHpBar").style.width =
      Math.max(
        0,
        Math.min(100, percent)
      ) + "%";
  }
}


/* =========================
   攻撃
========================= */

function attackEnemy() {

  if (!battleBusy || !enemy) return;

  if (enemy.hp <= 0) return;

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

    if (!enemy || !battleBusy) return;

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

    player.hp -= damage;

    logMessage(
      `💥 ${enemy.name}の攻撃！${damage}ダメージ！`
    );

    updateStatus();

    if (player.hp <= 0) {

      player.hp = 0;

      updateStatus();

      gameOver();
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
   調べる
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


/* =========================
   勝利
========================= */

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

    showPanel(
      "levelChoices"
    );

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
}


/* =========================
   攻撃強化
========================= */

function levelUpAttack() {

  if (player.level <= 1) return;

  player.attack += 5;

  logMessage(
    "⚔️ 攻撃力が5上昇した！"
  );

  hidePanel(
    "levelChoices"
  );

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

  hidePanel(
    "levelChoices"
  );

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

  if (
    player.defeats < 3 &&
    !player.admin
  ) {

    logMessage(
      "🔒 町へ行くには敵を3体倒してください！"
    );

    return;
  }

  player.area = "町";

  player.hp =
    player.maxHp;

  logMessage(
    "🏘️ 町に到着した！"
  );

  logMessage(
    `❤️ 宿で休んだ！HPが${player.maxHp}まで全回復した！`
  );

  if (Math.random() < 0.35) {

    const gift =
      20 +
      Math.floor(
        Math.random() * 51
      );

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


/* =========================
   回復
========================= */

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

    xp: boss.xp,

    money: boss.money,

    bounty: boss.bounty
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


/* =========================
   ガチャ
========================= */

function gacha() {

  if (player.admin) {

    player.weapon =
      "管理者の剣";

    player.attack =
      Math.max(
        player.attack,
        999999
      );

    logMessage(
      "👑 管理者なので管理者の剣を取得！"
    );

    updateStatus();

    saveGame();

    return;
  }

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


/* =========================================================
   管理者機能
========================================================= */


/* =========================
   管理者MAX処理
========================= */

function activateAdmin() {

  player.admin = true;

  /* レベルMAX */

  player.level =
    player.maxLevel;

  player.xp = 0;


  /* HP MAX */

  player.maxHp =
    999999;

  player.hp =
    999999;


  /* 攻撃 MAX */

  player.attack =
    999999;


  /* スキル MAX */

  player.skillCount =
    player.maxSkillCount;


  /* お金 MAX */

  player.money =
    999999999;


  /* 懸賞金 MAX */

  player.bounty =
    999999999;


  /* 撃破数 MAX */

  player.defeats =
    999999;


  /* 武器 */

  player.weapon =
    "管理者の剣";


  /* 管理者なら町・都市・ボスも解放 */

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
    "✨ スキルレベルMAX！"
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

  /* 管理者パネルがある場合は表示 */

  if ($("adminLoginArea")) {
    $("adminLoginArea")
      .classList.add("hidden");
  }

  if ($("adminControls")) {
    $("adminControls")
      .classList.remove("hidden");
  }
}


/* =========================
   管理者コード入力
========================= */

function adminLogin() {

  const input =
    $("adminCodeInput");

  let code = "";

  if (input) {
    code =
      input.value.trim();
  }

  /*
    入力欄が存在しない場合でも
    promptで入力できるようにする
  */

  if (!code) {

    code =
      prompt(
        "🔐 管理者コードを入力してください"
      );

    if (code === null) {
      return;
    }

    code =
      String(code).trim();
  }


  /* =========================
     コード確認
  ========================== */

  if (code === ADMIN_CODE) {

    activateAdmin();

    if (input) {
      input.value = "";
    }

    alert(
      "👑 管理者認証成功！\n\nレベル・ステータスがMAXになりました！"
    );

    return;
  }


  /* =========================
     間違い
  ========================== */

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


/* =========================
   管理者ボタン
========================= */

function openAdminPanel() {

  /*
    まず管理者になっているか確認
  */

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


  /*
    パネルが存在する場合
  */

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


  /*
    パネルがない場合でも動作
  */

  adminLogin();
}


/* =========================
   管理者レベルMAX
========================= */

function adminMaxLevel() {

  if (!player.admin) {

    adminLogin();

    return;
  }

  player.level =
    player.maxLevel;

  player.xp = 0;

  logMessage(
    "👑 レベル100 MAX！"
  );

  updateStatus();

  saveGame();
}


/* =========================
   管理者ステータスMAX
========================= */

function adminMaxStatus() {

  if (!player.admin) {

    adminLogin();

    return;
  }

  player.maxHp =
    999999;

  player.hp =
    999999;

  player.attack =
    999999;

  player.skillCount =
    player.maxSkillCount;

  logMessage(
    "👑 ステータスMAX！"
  );

  updateStatus();

  saveGame();

  sendPlayerUpdate();
}


/* =========================
   管理者全部MAX
========================= */

function adminMaxAll() {

  if (!player.admin) {

    adminLogin();

    return;
  }

  activateAdmin();
}


/* =========================================================
   PvP
========================================================= */

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


function updatePvPDisplay() {

  if (!pvpOpponent) return;

  if ($("pvpOpponentName")) {

    $("pvpOpponentName")
      .textContent =
      pvpOpponent.name;
  }

  if ($("pvpOpponentHp")) {

    $("pvpOpponentHp")
      .textContent =
      pvpOpponent.hp;
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
        Math.min(100, percent)
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


function pvpDefend() {

  if (!pvpBattle) return;

  if (!pvpMyTurn) return;

  socket.emit(
    "pvpDefend"
  );

  pvpMyTurn = false;

  updatePvPDisplay();
}


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


function pvpInspect() {

  if (!pvpOpponent) return;

  logMessage(
    `👁️ ${pvpOpponent.name} HP:${pvpOpponent.hp}/${pvpOpponent.maxHp}`
  );
}


function pvpRun() {

  if (!pvpBattle) return;

  socket.emit(
    "pvpRun"
  );

  endPvP();
}


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

  socket.emit(
    "createRoom",
    {
      name: player.name
    }
  );
}


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
   Socket.IO
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

    players.forEach(
      p => {

        const div =
          document.createElement(
            "div"
          );

        div.textContent =
          `${p.name} Lv.${p.level}`;

        container.appendChild(div);
      }
    );
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

    if (
      data &&
      data.message
    ) {

      logMessage(
        data.message
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


  /* =========================
     管理者
  ========================== */

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


  /* =========================
     PvP
  ========================== */

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
    player.name = "勇者";
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


  /* =========================
     保存済みゲーム
  ========================== */

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


    /* 管理者データも復元 */

    if (player.admin) {

      logMessage(
        "👑 管理者モードが復元されました！"
      );
    }
  }
}


/* =========================
   起動
========================= */

init();
