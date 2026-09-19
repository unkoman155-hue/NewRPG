"use strict";

/* ========================================
   共通
======================================== */

const $ = id => document.getElementById(id);

let socket = null;
let onlineEnabled = false;

try {
  if (typeof io === "function") {
    socket = io();
    onlineEnabled = true;
  }
} catch (e) {
  console.log("オンライン接続を開始できませんでした。", e);
}


/* ========================================
   プレイヤー
======================================== */

let player = {
  name: "勇者",
  job: "勇者",

  hp: 30,
  maxHp: 30,

  level: 0,
  attack: 0,
  xp: 0,

  money: 250,
  bounty: 0,

  weapon: "タガー",
  area: "草原",

  defeats: 0,
  skillCount: 0
};


/* ========================================
   通常戦闘
======================================== */

let enemy = null;
let defending = false;
let battleBusy = false;


/* ========================================
   PvP
======================================== */

let pvp = {
  active: false,
  opponentId: null,
  opponentName: "",
  opponentHp: 0,
  opponentMaxHp: 0,
  yourTurn: false,
  defending: false
};


/* ========================================
   モンスター
======================================== */

const monsters = [
  {
    name: "怪物猫",
    hp: 20,
    levelMin: 1,
    levelMax: 5,
    area: "草原",
    xp: 25
  },

  {
    name: "スライム",
    hp: 25,
    levelMin: 1,
    levelMax: 6,
    area: "草原",
    xp: 30
  },

  {
    name: "ゴブリン",
    hp: 35,
    levelMin: 2,
    levelMax: 8,
    area: "草原",
    xp: 45
  },

  {
    name: "オオカミ",
    hp: 45,
    levelMin: 3,
    levelMax: 10,
    area: "森",
    xp: 60
  },

  {
    name: "オーク",
    hp: 70,
    levelMin: 5,
    levelMax: 15,
    area: "都市周辺",
    xp: 100
  }
];


/* ========================================
   ボス
======================================== */

const BOSS = {
  name: "懸賞金王",
  hp: 500,
  attack: 45,
  xp: 1000,
  money: 1000
};


/* ========================================
   スキル
======================================== */

const skills = {
  "斬撃": {
    damage: 35
  },

  "高速切り": {
    damage: 65
  }
};


/* ========================================
   ログ
======================================== */

function log(message) {
  const box = $("log");

  if (!box) return;

  const line = document.createElement("div");
  line.textContent = message;

  box.appendChild(line);
  box.scrollTop = box.scrollHeight;
}


/* ========================================
   セーブ
======================================== */

function saveGame() {
  try {
    localStorage.setItem(
      "yuushaBountyRPG",
      JSON.stringify(player)
    );
  } catch (e) {
    console.log("セーブ失敗", e);
  }
}


/* ========================================
   ロード
======================================== */

function loadGame() {
  try {
    const saved = localStorage.getItem(
      "yuushaBountyRPG"
    );

    if (!saved) return;

    const data = JSON.parse(saved);

    if (!data || typeof data !== "object") {
      return;
    }

    player = {
      ...player,
      ...data
    };

    player.hp = Math.max(
      0,
      Math.min(
        Number(player.hp) || 30,
        Number(player.maxHp) || 30
      )
    );

  } catch (e) {
    console.log("ロード失敗", e);
  }
}


/* ========================================
   ステータス更新
======================================== */

function updateStatus() {

  const values = {
    playerName: player.name,
    job: player.job,
    level: player.level,
    hp: player.hp,
    maxHp: player.maxHp,
    attack: player.attack,
    xp: player.xp,
    money: player.money,
    bounty: player.bounty,
    weapon: player.weapon,
    area: player.area,
    defeats: player.defeats
  };

  Object.keys(values).forEach(id => {
    const el = $(id);

    if (el) {
      el.textContent = values[id];
    }
  });


  const hpBar = $("hpBar");

  if (hpBar) {

    const percent =
      Math.max(
        0,
        Math.min(
          100,
          player.hp /
          Math.max(1, player.maxHp) *
          100
        )
      );

    hpBar.style.width = percent + "%";
  }
}


/* ========================================
   サーバーへ送信
======================================== */

function sendPlayerUpdate() {

  if (!socket || !onlineEnabled) {
    return;
  }

  socket.emit("playerUpdate", {
    name: player.name,
    job: player.job,
    hp: player.hp,
    maxHp: player.maxHp,
    level: player.level,
    attack: player.attack,
    xp: player.xp,
    money: player.money,
    bounty: player.bounty,
    weapon: player.weapon,
    area: player.area,
    defeats: player.defeats,
    skillCount: player.skillCount
  });
}


/* ========================================
   情報パネル
======================================== */

function showInfo(title, content) {

  const titleEl = $("infoTitle");
  const contentEl = $("infoContent");
  const panel = $("infoPanel");

  if (!titleEl || !contentEl || !panel) {
    return;
  }

  titleEl.textContent = title;
  contentEl.innerHTML = content;

  panel.classList.remove("hidden");
}


function closeInfo() {

  const panel = $("infoPanel");

  if (panel) {
    panel.classList.add("hidden");
  }
}


/* ========================================
   オンライン
======================================== */

function openOnline() {

  const panel = $("onlinePanel");

  if (!panel) return;

  panel.classList.remove("hidden");
}


function closeOnline() {

  const panel = $("onlinePanel");

  if (!panel) return;

  panel.classList.add("hidden");
}


function setConnectionStatus(connected) {

  const status = $("connectionStatus");

  if (!status) return;

  status.textContent =
    connected
      ? "🟢 オンライン接続中"
      : "🔴 オフライン";
}


function setRoomStatus(message) {

  const el = $("roomStatus");

  if (el) {
    el.textContent = message;
  }
}


/* ========================================
   ルーム
======================================== */

function createRoom() {

  if (!socket || !onlineEnabled) {
    setRoomStatus("オンライン接続できません。");
    return;
  }

  socket.emit("createRoom", {
    name: player.name
  });
}


function joinRoom() {

  if (!socket || !onlineEnabled) {
    setRoomStatus("オンライン接続できません。");
    return;
  }

  const input = $("roomCodeInput");

  if (!input) return;

  const roomId =
    input.value.trim().toUpperCase();

  if (!roomId) {
    setRoomStatus("ルームIDを入力してください。");
    return;
  }

  socket.emit("joinRoom", {
    roomId,
    name: player.name
  });
}


function leaveRoom() {

  if (!socket || !onlineEnabled) {
    return;
  }

  socket.emit("leaveRoom");
}


/* ========================================
   ルームプレイヤー
======================================== */

function renderRoomPlayers(players) {

  const box = $("roomPlayers");

  if (!box) return;

  box.innerHTML = "";

  if (!Array.isArray(players) || players.length === 0) {
    box.innerHTML =
      "<div>プレイヤーはいません。</div>";
    return;
  }

  players.forEach(remotePlayer => {

    const card =
      document.createElement("div");

    card.className = "player-card";


    const name =
      document.createElement("div");

    name.className = "player-name";


    const isSelf =
      socket &&
      remotePlayer.id === socket.id;


    name.textContent =
      isSelf
        ? `🟢 ${remotePlayer.name}（自分）`
        : `👤 ${remotePlayer.name}`;


    card.appendChild(name);


    const details =
      document.createElement("div");

    details.className =
      "player-details";

    details.textContent =
      `役職: ${remotePlayer.job}　` +
      `Lv: ${remotePlayer.level}　` +
      `HP: ${remotePlayer.hp}/${remotePlayer.maxHp}　` +
      `攻撃: ${remotePlayer.attack}　` +
      `エリア: ${remotePlayer.area}`;

    card.appendChild(details);


    if (!isSelf) {

      const button =
        document.createElement("button");

      button.className =
        "pvp-button";

      button.textContent =
        remotePlayer.pvp
          ? "⚔️ PvP中"
          : "⚔️ 戦う";

      button.disabled =
        Boolean(remotePlayer.pvp) ||
        pvp.active;

      button.addEventListener(
        "click",
        () => challengePlayer(remotePlayer.id)
      );

      card.appendChild(button);
    }


    box.appendChild(card);
  });
}


/* ========================================
   PvP
======================================== */

function challengePlayer(targetId) {

  if (!socket || !onlineEnabled) {
    log("オンライン接続が必要です。");
    return;
  }

  if (pvp.active) {
    log("現在PvP中です。");
    return;
  }

  socket.emit("pvpChallenge", targetId);

  log("PvPを申し込みました。");
}


function showPvpRequest(data) {

  const ok =
    window.confirm(
      `${data.fromName} からPvPの申し込みが来ました。\n\n戦いますか？`
    );

  if (!socket) return;

  if (ok) {
    socket.emit("pvpAccept", data.fromId);
  } else {
    socket.emit("pvpReject", data.fromId);
  }
}


function startPvp(data) {

  pvp.active = true;
  pvp.opponentId = data.opponentId;
  pvp.opponentName = data.opponentName;
  pvp.yourTurn = Boolean(data.yourTurn);
  pvp.defending = false;

  const name = $("pvpOpponentName");
  const hp = $("pvpOpponentHp");
  const maxHp = $("pvpOpponentMaxHp");
  const screen = $("pvpBattleScreen");

  if (name) name.textContent = pvp.opponentName;
  if (hp) hp.textContent = "??";
  if (maxHp) maxHp.textContent = "??";

  if (screen) {
    screen.classList.remove("hidden");
  }

  updatePvpTurn();
  updatePvpButtons();

  log(`${pvp.opponentName} とのPvPが始まった！`);
}


function updatePvpTurn() {

  const text = $("pvpTurnText");

  if (!text) return;

  if (!pvp.active) {
    text.textContent = "PvP終了";
    return;
  }

  text.textContent =
    pvp.yourTurn
      ? "🟢 あなたのターン"
      : "🔴 相手のターン";
}


function updatePvpButtons() {

  [
    "pvpAttackBtn",
    "pvpDefendBtn",
    "pvpSkillBtn",
    "pvpInspectBtn",
    "pvpRunBtn"
  ].forEach(id => {

    const button = $(id);

    if (!button) return;

    button.disabled =
      !pvp.active ||
      !pvp.yourTurn;
  });
}


function pvpAttack() {

  if (!pvp.active || !pvp.yourTurn) return;

  if (!socket) return;

  socket.emit("pvpAttack");
}


function pvpDefend() {

  if (!pvp.active || !pvp.yourTurn) return;

  if (!socket) return;

  socket.emit("pvpDefend");
}


function pvpSkill() {

  if (!pvp.active || !pvp.yourTurn) return;

  if (!socket) return;

  if (player.skillCount <= 0) {
    log("まだスキルを解放していません。");
    return;
  }

  const names = Object.keys(skills);

  const index =
    Math.min(
      player.skillCount - 1,
      names.length - 1
    );

  socket.emit("pvpSkill", {
    skillName: names[index]
  });
}


function pvpInspect() {

  if (!pvp.active) return;

  if (pvp.opponentHp > 0) {
    log(
      `${pvp.opponentName} HP:${pvp.opponentHp}/${pvp.opponentMaxHp}`
    );
  } else {
    log(`${pvp.opponentName} の情報を確認中...`);
  }
}


function pvpRun() {

  if (!pvp.active || !pvp.yourTurn) return;

  if (socket) {
    socket.emit("pvpRun");
  }
}


function finishPvp() {

  pvp.active = false;
  pvp.opponentId = null;
  pvp.opponentName = "";
  pvp.opponentHp = 0;
  pvp.opponentMaxHp = 0;
  pvp.yourTurn = false;
  pvp.defending = false;

  const screen = $("pvpBattleScreen");

  if (screen) {
    screen.classList.add("hidden");
  }

  updatePvpButtons();
}


/* ========================================
   チャット
======================================== */

function addChatMessage(data) {

  const box = $("chatLog");

  if (!box) return;

  const line =
    document.createElement("div");

  line.className =
    "chat-message";


  const name =
    document.createElement("span");

  name.className =
    "chat-name";

  name.textContent =
    `${data.name}: `;


  const message =
    document.createElement("span");

  message.textContent =
    data.message;


  line.appendChild(name);
  line.appendChild(message);

  box.appendChild(line);

  box.scrollTop =
    box.scrollHeight;
}


function sendChat() {

  if (!socket || !onlineEnabled) {
    return;
  }

  const input = $("chatInput");

  if (!input) return;

  const message =
    input.value.trim();

  if (!message) return;

  socket.emit("chat", message);

  input.value = "";
}


/* ========================================
   ★ 敵との戦闘開始
======================================== */

function startBattle(monster = null) {

  if (enemy) {
    log("⚠️ すでに敵と戦闘中です！");
    return;
  }

  if (pvp.active) {
    log("⚠️ PvP中はモンスターと戦えません。");
    return;
  }

  if (player.hp <= 0) {
    log("HPが0です。");
    return;
  }


  let selected = monster;


  if (!selected) {

    let pool =
      monsters.filter(
        m =>
          m.area === player.area ||
          player.area === "都市"
      );


    if (pool.length === 0) {
      pool = monsters;
    }


    selected =
      pool[
        Math.floor(
          Math.random() * pool.length
        )
      ];
  }


  const level =
    Math.max(
      selected.levelMin,
      Math.min(
        selected.levelMax,
        player.level + 1
      )
    );


  const hp =
    selected.hp +
    Math.max(
      0,
      level - 1
    ) * 5;


  enemy = {

    name: selected.name,

    level,

    hp,

    maxHp: hp,

    attack:
      Math.max(
        5,
        Math.floor(hp / 3)
      ),

    xp: selected.xp,

    money:
      Math.floor(selected.xp / 2),

    isBoss: false
  };


  defending = false;
  battleBusy = false;


  const battleScreen =
    $("battleScreen");

  if (battleScreen) {
    battleScreen.classList.remove("hidden");
  }


  updateEnemyStatus();


  log(
    `⚔️ 「${enemy.name}」が現れた！`
  );

  log(
    `敵Lv.${enemy.level}　HP:${enemy.hp}　攻撃:${enemy.attack}`
  );
}


/* ========================================
   戦闘表示
======================================== */

function showBattle() {

  const screen =
    $("battleScreen");

  if (screen) {
    screen.classList.remove("hidden");
  }
}


function hideBattle() {

  const screen =
    $("battleScreen");

  if (screen) {
    screen.classList.add("hidden");
  }
}


/* ========================================
   敵HP更新
======================================== */

function updateEnemyStatus() {

  if (!enemy) return;


  const name = $("enemyName");
  const hp = $("enemyHp");
  const maxHp = $("enemyMaxHp");
  const bar = $("enemyHpBar");


  if (name) {
    name.textContent =
      enemy.name;
  }


  if (hp) {
    hp.textContent =
      enemy.hp;
  }


  if (maxHp) {
    maxHp.textContent =
      enemy.maxHp;
  }


  if (bar) {

    const percent =
      Math.max(
        0,
        Math.min(
          100,
          enemy.hp /
          Math.max(
            1,
            enemy.maxHp
          ) *
          100
        )
      );

    bar.style.width =
      percent + "%";
  }
}


/* ========================================
   戦闘ボタン制御
======================================== */

function setBattleButtons(enabled) {

  [
    "attackBtn",
    "defendBtn",
    "skillBtn",
    "inspectBtn",
    "runBtn"
  ].forEach(id => {

    const button = $(id);

    if (!button) return;

    button.disabled =
      !enabled;
  });
}


/* ========================================
   ★ プレイヤー攻撃
======================================== */

function playerAttack() {

  if (!enemy) {
    log("戦う敵がいません。");
    return;
  }

  if (battleBusy) {
    return;
  }

  battleBusy = true;
  setBattleButtons(false);


  let damage =
    5 +
    Number(player.attack || 0);


  if (player.weapon === "タガー") {
    damage += 15;
  }
  else if (player.weapon === "剣") {
    damage += 5;
  }


  const critical =
    Math.random() < 0.15;


  if (critical) {
    damage += 5;

    log(
      "💥 クリティカルヒット！ +5ダメージ！"
    );
  }


  enemy.hp =
    Math.max(
      0,
      enemy.hp - damage
    );


  log(
    `⚔️ ${damage}ダメージを与えた！`
  );


  updateEnemyStatus();


  if (enemy.hp <= 0) {

    winBattle();

    return;
  }


  enemyAttack();
}


/* ========================================
   ★ 防御
======================================== */

function defend() {

  if (!enemy) {
    log("戦う敵がいません。");
    return;
  }

  if (battleBusy) {
    return;
  }


  battleBusy = true;
  defending = true;

  setBattleButtons(false);


  log(
    "🛡️ ボウギョした！"
  );


  enemyAttack();
}


/* ========================================
   ★ 敵攻撃
======================================== */

function enemyAttack() {

  if (!enemy) {
    battleBusy = false;
    setBattleButtons(true);
    return;
  }


  let damage =
    Number(enemy.attack || 5);


  if (defending) {

    damage =
      Math.floor(
        damage / 2
      );

    defending = false;

    log(
      "🛡️ 防御成功！ダメージ半減！"
    );
  }


  damage =
    Math.max(
      1,
      damage
    );


  player.hp =
    Math.max(
      0,
      player.hp - damage
    );


  log(
    `👹 ${enemy.name}の攻撃！ ${damage}ダメージ！`
  );


  updateStatus();
  sendPlayerUpdate();


  if (player.hp <= 0) {

    battleBusy = false;

    gameOver();

    return;
  }


  battleBusy = false;

  setBattleButtons(true);
}


/* ========================================
   ★ スキル
======================================== */

function useSkill() {

  if (!enemy) {
    log("戦う敵がいません。");
    return;
  }

  if (battleBusy) {
    return;
  }


  if (player.skillCount <= 0) {

    log(
      "✨ まだスキルを解放していません。"
    );

    return;
  }


  battleBusy = true;
  setBattleButtons(false);


  const names =
    Object.keys(skills);


  const index =
    Math.min(
      player.skillCount - 1,
      names.length - 1
    );


  const skillName =
    names[index];


  const skill =
    skills[skillName];


  const damage =
    skill.damage +
    Number(player.attack || 0);


  enemy.hp =
    Math.max(
      0,
      enemy.hp - damage
    );


  log(
    `✨ ${skillName}！ ${damage}ダメージ！`
  );


  updateEnemyStatus();


  if (enemy.hp <= 0) {

    winBattle();

    return;
  }


  enemyAttack();
}


/* ========================================
   敵を調べる
======================================== */

function inspectEnemy() {

  if (!enemy) {

    log(
      "戦う敵がいません。"
    );

    return;
  }


  log(
    `🔎 ${enemy.name} Lv.${enemy.level} ` +
    `HP:${enemy.hp}/${enemy.maxHp} ` +
    `攻撃:${enemy.attack}`
  );
}


/* ========================================
   ★ 逃げる
======================================== */

function runBattle() {

  if (!enemy) {
    return;
  }

  if (battleBusy) {
    return;
  }


  battleBusy = true;
  setBattleButtons(false);


  if (Math.random() < 0.7) {

    log(
      "🏃 うまく逃げ切った！"
    );


    enemy = null;
    defending = false;
    battleBusy = false;

    hideBattle();
    setBattleButtons(true);

  }
  else {

    log(
      "❌ 逃げられなかった！"
    );


    enemyAttack();
  }
}


/* ========================================
   ★ 戦闘勝利
======================================== */

function winBattle() {

  if (!enemy) {
    return;
  }


  const defeatedEnemy =
    { ...enemy };


  enemy = null;
  defending = false;
  battleBusy = false;


  hideBattle();
  setBattleButtons(true);


  player.defeats += 1;

  player.xp +=
    defeatedEnemy.xp;

  player.money +=
    defeatedEnemy.money;

  player.bounty +=
    defeatedEnemy.money;


  log(
    `🎉 ${defeatedEnemy.name}を倒した！`
  );


  log(
    `💰 ${defeatedEnemy.money}円を獲得！`
  );


  log(
    `✨ ${defeatedEnemy.xp} XPを獲得！`
  );


  checkLevelUp();


  updateStatus();
  saveGame();
  sendPlayerUpdate();


  if (defeatedEnemy.isBoss) {

    log(
      "👑 懸賞金王を撃破した！"
    );
  }
}


/* ========================================
   レベルアップ
======================================== */

function checkLevelUp() {

  const required =
    (player.level + 1) * 100;


  if (player.xp < required) {
    return;
  }


  player.xp -= required;
  player.level += 1;


  const choices =
    $("levelChoices");

  if (choices) {
    choices.classList.remove("hidden");
  }


  log(
    `⬆️ レベル${player.level}になった！`
  );
}


/* ========================================
   レベルアップ選択
======================================== */

function levelUpHP() {

  player.maxHp += 5;
  player.hp = player.maxHp;

  finishLevelChoice(
    "❤️ HPが5増えた！"
  );
}


function levelUpAttack() {

  player.attack += 20;

  finishLevelChoice(
    "⚔️ 攻撃が20増えた！"
  );
}


function levelUpSkill() {

  player.skillCount += 1;

  finishLevelChoice(
    "✨ スキルを1つ解放した！"
  );
}


function finishLevelChoice(message) {

  const choices =
    $("levelChoices");

  if (choices) {
    choices.classList.add("hidden");
  }

  log(message);

  updateStatus();
  saveGame();
  sendPlayerUpdate();
}


/* ========================================
   スキル情報
======================================== */

function showSkills() {

  showInfo(
    "✨ スキル情報",

    `
      <p>スキル解放数：${player.skillCount}</p>

      <table>
        <tr>
          <th>スキル</th>
          <th>ダメージ</th>
        </tr>

        <tr>
          <td>斬撃</td>
          <td>35 + 攻撃力</td>
        </tr>

        <tr>
          <td>高速切り</td>
          <td>65 + 攻撃力</td>
        </tr>
      </table>
    `
  );
}


/* ========================================
   レベル確認
======================================== */

function showLevel() {

  showInfo(
    "⬆️ レベル確認",

    `
      <p>レベル：${player.level}</p>
      <p>XP：${player.xp}</p>
      <p>HP：${player.hp}/${player.maxHp}</p>
      <p>攻撃：${player.attack}</p>
      <p>スキル：${player.skillCount}</p>
    `
  );
}


/* ========================================
   図鑑
======================================== */

function showBook() {

  let html = "<table>";

  html +=
    "<tr>" +
    "<th>怪物</th>" +
    "<th>HP</th>" +
    "<th>Lv</th>" +
    "<th>場所</th>" +
    "<th>XP</th>" +
    "</tr>";


  monsters.forEach(monster => {

    html += `
      <tr>
        <td>${monster.name}</td>
        <td>${monster.hp}</td>
        <td>
          ${monster.levelMin}～${monster.levelMax}
        </td>
        <td>${monster.area}</td>
        <td>${monster.xp}</td>
      </tr>
    `;
  });


  html += "</table>";


  showInfo(
    "📚 図鑑",
    html
  );
}


/* ========================================
   バッグ
======================================== */

function showBag() {

  showInfo(
    "🎒 バック",

    `
      <p>武器：${player.weapon}</p>
      <p>お金：${player.money}円</p>
    `
  );
}


/* ========================================
   ガチャ
======================================== */

function normalGacha() {

  if (player.money < 50) {

    log(
      "💰 お金が足りません。"
    );

    return;
  }


  player.money -= 50;


  const result =
    Math.random() < 0.5
      ? "タガー"
      : "剣";


  player.weapon = result;


  log(
    `🎰 ${result}を手に入れた！`
  );


  updateStatus();
  saveGame();
  sendPlayerUpdate();
}


/* ========================================
   町
======================================== */

function goTown() {

  if (player.defeats < 3) {

    log(
      "🏘️ 町へ行くには敵を3体倒してください。"
    );

    return;
  }


  player.area = "町";


  log(
    "🏘️ 町に到着した！"
  );


  if (Math.random() < 0.4) {

    const gift =
      50 +
      Math.floor(
        Math.random() * 100
      );

    player.money += gift;

    log(
      `町の人が${gift}円を譲ってくれた！`
    );
  }


  updateStatus();
  saveGame();
  sendPlayerUpdate();
}


/* ========================================
   都市
======================================== */

function goCity() {

  if (player.defeats < 3) {

    log(
      "🏙️ 都市へ行くには敵を3体倒してください。"
    );

    return;
  }


  player.area = "都市";


  log(
    "🏙️ 都市に到着した！"
  );


  if (Math.random() < 0.5) {

    log(
      "⚠️ 強い敵が現れた！"
    );

    startBattle();
  }


  updateStatus();
  saveGame();
  sendPlayerUpdate();
}


/* ========================================
   回復
======================================== */

function heal() {

  const cost = 30;


  if (player.money < cost) {

    log(
      "💰 回復するお金が足りません。"
    );

    return;
  }


  player.money -= cost;
  player.hp = player.maxHp;


  log(
    "❤️ 30円使ってHPを全回復した！"
  );


  updateStatus();
  saveGame();
  sendPlayerUpdate();
}


/* ========================================
   ボス
======================================== */

function startBoss() {

  if (enemy) {

    log(
      "⚠️ 現在戦闘中です。"
    );

    return;
  }


  if (pvp.active) {

    log(
      "⚠️ PvP中はボスと戦えません。"
    );

    return;
  }


  enemy = {

    name: BOSS.name,

    level: 20,

    hp: BOSS.hp,

    maxHp: BOSS.hp,

    attack: BOSS.attack,

    xp: BOSS.xp,

    money: BOSS.money,

    isBoss: true
  };


  defending = false;
  battleBusy = false;


  showBattle();
  updateEnemyStatus();


  log(
    `👑 「${BOSS.name}」が現れた！`
  );

  log(
    `HP:${enemy.hp}　攻撃:${enemy.attack}`
  );
}


/* ========================================
   ゲームオーバー
======================================== */

function gameOver() {

  enemy = null;
  defending = false;
  battleBusy = false;


  hideBattle();
  finishPvp();


  player = {

    name: player.name,
    job: player.job,

    hp: 30,
    maxHp: 30,

    level: 0,
    attack: 0,
    xp: 0,

    money: 250,
    bounty: 0,

    weapon: "タガー",
    area: "草原",

    defeats: 0,
    skillCount: 0
  };


  localStorage.removeItem(
    "yuushaBountyRPG"
  );


  updateStatus();


  const gameScreen =
    $("gameScreen");

  const gameOverScreen =
    $("gameOverScreen");


  if (gameScreen) {
    gameScreen.classList.add("hidden");
  }

  if (gameOverScreen) {
    gameOverScreen.classList.remove("hidden");
  }
}


/* ========================================
   ゲーム開始
======================================== */

function startGame() {

  const nameInput = $("nameInput");
  const jobInput = $("jobInput");


  const name =
    nameInput
      ? nameInput.value.trim()
      : "";


  const job =
    jobInput
      ? jobInput.value
      : "勇者";


  player.name =
    name || "勇者";

  player.job =
    job || "勇者";


  const startScreen =
    $("startScreen");

  const gameScreen =
    $("gameScreen");


  if (startScreen) {
    startScreen.classList.add("hidden");
  }

  if (gameScreen) {
    gameScreen.classList.remove("hidden");
  }


  updateStatus();


  log(
    `${player.name}としてゲームを開始した！`
  );

  log(
    `役職：${player.job}`
  );


  sendPlayerUpdate();
}


/* ========================================
   最初から
======================================== */

function restartGame() {

  localStorage.removeItem(
    "yuushaBountyRPG"
  );

  location.reload();
}


/* ========================================
   ボタン登録
======================================== */

function bindButton(id, fn) {

  const element = $(id);

  if (!element) {
    console.log(
      `ボタンが見つかりません: ${id}`
    );
    return;
  }

  element.addEventListener(
    "click",
    fn
  );
}


/* ========================================
   Socket.IO
======================================== */

if (socket) {

  socket.on("connect", () => {

    setConnectionStatus(true);

    setRoomStatus(
      "オンライン接続済み"
    );

    log(
      "オンラインサーバーに接続しました！"
    );

    sendPlayerUpdate();
  });


  socket.on("disconnect", () => {

    setConnectionStatus(false);

    setRoomStatus(
      "サーバーから切断されました。"
    );
  });


  socket.on("onlineReady", () => {
    setConnectionStatus(true);
  });


  socket.on("roomCreated", data => {

    const roomId =
      data.roomId;

    setRoomStatus(
      `ルーム作成成功！ ID：${roomId}`
    );


    const info =
      $("roomInfo");

    if (info) {
      info.textContent =
        `ルームID：${roomId}`;
    }


    const input =
      $("roomCodeInput");

    if (input) {
      input.value = roomId;
    }


    renderRoomPlayers(
      data.players
    );


    log(
      `オンラインルーム「${roomId}」を作成しました！`
    );
  });


  socket.on("roomJoined", data => {

    setRoomStatus(
      `ルーム参加中：${data.roomId}`
    );


    const info =
      $("roomInfo");

    if (info) {
      info.textContent =
        `ルームID：${data.roomId}`;
    }


    renderRoomPlayers(
      data.players
    );


    log(
      `ルーム「${data.roomId}」に参加しました！`
    );
  });


  socket.on(
    "roomPlayersUpdate",
    players => {

      renderRoomPlayers(players);


      if (pvp.active) {

        const opponent =
          players.find(
            p =>
              p.id ===
              pvp.opponentId
          );


        if (opponent) {

          pvp.opponentHp =
            opponent.hp;

          pvp.opponentMaxHp =
            opponent.maxHp;


          const hp =
            $("pvpOpponentHp");

          const maxHp =
            $("pvpOpponentMaxHp");

          const bar =
            $("pvpOpponentHpBar");


          if (hp) {
            hp.textContent =
              opponent.hp;
          }

          if (maxHp) {
            maxHp.textContent =
              opponent.maxHp;
          }


          if (bar) {

            const percent =
              Math.max(
                0,
                Math.min(
                  100,
                  opponent.hp /
                  Math.max(
                    1,
                    opponent.maxHp
                  ) *
                  100
                )
              );

            bar.style.width =
              percent + "%";
          }
        }
      }
    }
  );


  socket.on(
    "roomError",
    message => {

      setRoomStatus(message);

      log(
        `オンライン：${message}`
      );
    }
  );


  socket.on(
    "leftRoom",
    () => {

      setRoomStatus(
        "ルームから退出しました。"
      );


      const info =
        $("roomInfo");

      const players =
        $("roomPlayers");


      if (info) {
        info.textContent =
          "ルームなし";
      }

      if (players) {
        players.innerHTML = "";
      }


      log(
        "ルームから退出しました。"
      );
    }
  );


  socket.on(
    "publicMessage",
    data => {
      addChatMessage(data);
    }
  );


  socket.on(
    "onlineBattleLog",
    data => {

      log(
        `【${data.name}】${data.message}`
      );
    }
  );


  socket.on(
    "pvpRequest",
    data => {
      showPvpRequest(data);
    }
  );


  socket.on(
    "pvpChallengeSent",
    data => {

      log(
        `${data.targetName} にPvPを申し込みました。`
      );
    }
  );


  socket.on(
    "pvpRejectedByTarget",
    data => {

      log(
        `${data.targetName} にPvPを断られました。`
      );
    }
  );


  socket.on(
    "pvpStarted",
    data => {
      startPvp(data);
    }
  );


  socket.on(
    "pvpAttackResult",
    data => {

      if (data.critical) {

        log(
          "【PvP】クリティカルヒット！"
        );
      }


      log(
        `【PvP】${data.attackerName} → ` +
        `${data.targetName}：` +
        `${data.damage}ダメージ！`
      );


      if (
        data.targetId ===
        pvp.opponentId
      ) {

        pvp.opponentHp =
          data.targetHp;

        pvp.opponentMaxHp =
          data.targetMaxHp;


        const hp =
          $("pvpOpponentHp");

        const maxHp =
          $("pvpOpponentMaxHp");

        const bar =
          $("pvpOpponentHpBar");


        if (hp) {
          hp.textContent =
            data.targetHp;
        }

        if (maxHp) {
          maxHp.textContent =
            data.targetMaxHp;
        }


        if (bar) {

          const percent =
            Math.max(
              0,
              Math.min(
                100,
                data.targetHp /
                Math.max(
                  1,
                  data.targetMaxHp
                ) *
                100
              )
            );

          bar.style.width =
            percent + "%";
        }
      }
    }
  );


  socket.on(
    "pvpSkillResult",
    data => {

      log(
        `【PvP】${data.attackerName}の` +
        `${data.skillName}！ ` +
        `${data.damage}ダメージ！`
      );


      if (
        data.targetId ===
        pvp.opponentId
      ) {

        pvp.opponentHp =
          data.targetHp;

        pvp.opponentMaxHp =
          data.targetMaxHp;


        const hp =
          $("pvpOpponentHp");

        const maxHp =
          $("pvpOpponentMaxHp");

        const bar =
          $("pvpOpponentHpBar");


        if (hp) {
          hp.textContent =
            data.targetHp;
        }

        if (maxHp) {
          maxHp.textContent =
            data.targetMaxHp;
        }


        if (bar) {

          const percent =
            Math.max(
              0,
              Math.min(
                100,
                data.targetHp /
                Math.max(
                  1,
                  data.targetMaxHp
                ) *
                100
              )
            );

          bar.style.width =
            percent + "%";
        }
      }
    }
  );


  socket.on(
    "pvpTurn",
    data => {

      pvp.yourTurn =
        data.turnId === socket.id;

      updatePvpTurn();
      updatePvpButtons();
    }
  );


  socket.on(
    "pvpDefended",
    () => {

      log(
        "【PvP】ボウギョした！"
      );
    }
  );


  socket.on(
    "pvpOpponentDefended",
    data => {

      log(
        `【PvP】${data.playerName} がボウギョした！`
      );
    }
  );


  socket.on(
    "pvpFinished",
    data => {

      if (data.reason) {

        log(
          `【PvP】${data.reason}`
        );
      }


      log(
        `【PvP】${data.winnerName} の勝利！`
      );


      if (
        data.winnerId ===
        socket.id
      ) {

        log(
          "💰 100円、XP100、懸賞金100円を獲得！"
        );


        player.money += 100;
        player.xp += 100;
        player.bounty += 100;
        player.defeats += 1;


        checkLevelUp();

        updateStatus();
        saveGame();
        sendPlayerUpdate();
      }


      finishPvp();
    }
  );


  socket.on(
    "pvpEnded",
    data => {

      log(
        `【PvP】${data.reason}`
      );

      finishPvp();
    }
  );


  socket.on(
    "pvpError",
    message => {

      log(
        `【PvP】${message}`
      );
    }
  );
}


/* ========================================
   Enterキー
======================================== */

function setupEnterKey() {

  const roomInput =
    $("roomCodeInput");

  if (roomInput) {

    roomInput.addEventListener(
      "keydown",
      event => {

        if (event.key === "Enter") {
          joinRoom();
        }
      }
    );
  }


  const chatInput =
    $("chatInput");

  if (chatInput) {

    chatInput.addEventListener(
      "keydown",
      event => {

        if (event.key === "Enter") {
          sendChat();
        }
      }
    );
  }
}


/* ========================================
   ボタン
======================================== */

bindButton(
  "startBtn",
  startGame
);

bindButton(
  "restartBtn",
  restartGame
);


/* 通常戦闘 */

bindButton(
  "battleStartBtn",
  () => startBattle()
);

bindButton(
  "attackBtn",
  playerAttack
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


/* レベル */

bindButton(
  "hpLevelBtn",
  levelUpHP
);

bindButton(
  "attackLevelBtn",
  levelUpAttack
);

bindButton(
  "skillLevelBtn",
  levelUpSkill
);


/* メニュー */

bindButton(
  "skillsBtn",
  showSkills
);

bindButton(
  "levelBtn",
  showLevel
);

bindButton(
  "bookBtn",
  showBook
);

bindButton(
  "bagBtn",
  showBag
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
  heal
);

bindButton(
  "bossBtn",
  startBoss
);

bindButton(
  "onlineBtn",
  openOnline
);


/* オンライン */

bindButton(
  "closeOnlineBtn",
  closeOnline
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
  leaveRoom
);

bindButton(
  "chatSendBtn",
  sendChat
);


/* PvP */

bindButton(
  "pvpAttackBtn",
  pvpAttack
);

bindButton(
  "pvpDefendBtn",
  pvpDefend
);

bindButton(
  "pvpSkillBtn",
  pvpSkill
);

bindButton(
  "pvpInspectBtn",
  pvpInspect
);

bindButton(
  "pvpRunBtn",
  pvpRun
);


/* 情報 */

bindButton(
  "closeInfoBtn",
  closeInfo
);


/* ========================================
   初期化
======================================== */

loadGame();

updateStatus();

setupEnterKey();

setConnectionStatus(
  onlineEnabled &&
  socket &&
  socket.connected
);

updatePvpButtons();

setBattleButtons(
  true
);

console.log(
  "勇者の懸賞金RPG game.js 起動完了"
);
