"use strict";

const $ = id => document.getElementById(id);

let socket = null;
let onlineEnabled = false;

try {
  if (typeof io === "function") {
    socket = io();
    onlineEnabled = true;
  }
} catch (error) {
  console.log("オンライン接続を開始できませんでした。", error);
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
   戦闘
======================================== */

let enemy = null;

let defending = false;


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

  if (!box) {
    return;
  }

  const line =
    document.createElement("div");

  line.textContent = message;

  box.appendChild(line);

  box.scrollTop =
    box.scrollHeight;
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

  } catch (error) {

    console.log(
      "セーブ失敗",
      error
    );

  }

}


/* ========================================
   ロード
======================================== */

function loadGame() {

  try {

    const saved =
      localStorage.getItem(
        "yuushaBountyRPG"
      );

    if (!saved) {
      return;
    }

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

    console.log(
      "ロード失敗",
      error
    );

  }

}


/* ========================================
   ステータス更新
======================================== */

function updateStatus() {

  if ($("playerName")) {
    $("playerName").textContent =
      player.name;
  }

  if ($("job")) {
    $("job").textContent =
      player.job;
  }

  if ($("level")) {
    $("level").textContent =
      player.level;
  }

  if ($("hp")) {
    $("hp").textContent =
      player.hp;
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


  if ($("hpBar")) {

    const percent =
      Math.max(
        0,
        Math.min(
          100,
          player.hp /
          Math.max(
            1,
            player.maxHp
          ) *
          100
        )
      );

    $("hpBar").style.width =
      percent + "%";

  }

}


/* ========================================
   サーバーへプレイヤー情報送信
======================================== */

function sendPlayerUpdate() {

  if (
    !socket ||
    !onlineEnabled
  ) {
    return;
  }

  socket.emit(
    "playerUpdate",
    {

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

      skillCount:
        player.skillCount

    }
  );

}


/* ========================================
   情報パネル
======================================== */

function showInfo(
  title,
  content
) {

  $("infoTitle").textContent =
    title;

  $("infoContent").innerHTML =
    content;

  $("infoPanel")
    .classList
    .remove("hidden");

  $("infoPanel")
    .scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

}


function closeInfo() {

  $("infoPanel")
    .classList
    .add("hidden");

}


/* ========================================
   オンライン画面
======================================== */

function openOnline() {

  $("onlinePanel")
    .classList
    .remove("hidden");

  $("onlinePanel")
    .scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

}


function closeOnline() {

  $("onlinePanel")
    .classList
    .add("hidden");

}


/* ========================================
   接続表示
======================================== */

function setConnectionStatus(
  connected
) {

  const status =
    $("connectionStatus");

  if (!status) {
    return;
  }

  if (connected) {

    status.textContent =
      "🟢 オンライン接続中";

  } else {

    status.textContent =
      "🔴 オフライン";

  }

}


/* ========================================
   ルーム状態
======================================== */

function setRoomStatus(
  message
) {

  if ($("roomStatus")) {

    $("roomStatus").textContent =
      message;

  }

}


/* ========================================
   ルーム作成
======================================== */

function createRoom() {

  if (
    !socket ||
    !onlineEnabled
  ) {

    setRoomStatus(
      "オンライン接続できません。"
    );

    return;
  }

  socket.emit(
    "createRoom",
    {
      name: player.name
    }
  );

}


/* ========================================
   ルーム参加
======================================== */

function joinRoom() {

  if (
    !socket ||
    !onlineEnabled
  ) {

    setRoomStatus(
      "オンライン接続できません。"
    );

    return;
  }


  const input =
    $("roomCodeInput");


  const roomId =
    input.value
      .trim()
      .toUpperCase();


  if (!roomId) {

    setRoomStatus(
      "ルームIDを入力してください。"
    );

    return;
  }


  socket.emit(
    "joinRoom",
    {

      roomId,

      name:
        player.name

    }
  );

}


/* ========================================
   ルーム退出
======================================== */

function leaveRoom() {

  if (
    !socket ||
    !onlineEnabled
  ) {
    return;
  }

  socket.emit(
    "leaveRoom"
  );

}


/* ========================================
   ルームプレイヤー表示
======================================== */

function renderRoomPlayers(
  players
) {

  const box =
    $("roomPlayers");

  if (!box) {
    return;
  }

  box.innerHTML = "";


  if (
    !players ||
    players.length === 0
  ) {

    box.innerHTML =
      "<div>プレイヤーはいません。</div>";

    return;
  }


  players.forEach(
    remotePlayer => {

      const card =
        document.createElement(
          "div"
        );

      card.className =
        "player-card";


      const name =
        document.createElement(
          "div"
        );

      name.className =
        "player-name";


      const isSelf =
        socket &&
        remotePlayer.id === socket.id;


      if (isSelf) {

        name.textContent =
          `🟢 ${remotePlayer.name}（自分）`;

      } else {

        name.textContent =
          `👤 ${remotePlayer.name}`;

      }


      card.appendChild(name);


      const details =
        document.createElement(
          "div"
        );

      details.className =
        "player-details";


      details.textContent =
        `役職: ${remotePlayer.job}　` +
        `Lv: ${remotePlayer.level}　` +
        `HP: ${remotePlayer.hp}/${remotePlayer.maxHp}　` +
        `攻撃: ${remotePlayer.attack}　` +
        `エリア: ${remotePlayer.area}`;


      card.appendChild(
        details
      );


      if (!isSelf) {

        const button =
          document.createElement(
            "button"
          );

        button.className =
          "pvp-button";

        button.textContent =
          "⚔️ 戦う";


        if (
          remotePlayer.pvp
        ) {

          button.disabled =
            true;

          button.textContent =
            "⚔️ PvP中";

        }


        if (
          pvp.active
        ) {

          button.disabled =
            true;

        }


        button.addEventListener(
          "click",
          () => {

            challengePlayer(
              remotePlayer.id
            );

          }
        );


        card.appendChild(
          button
        );

      }


      box.appendChild(
        card
      );

    }
  );

}


/* ========================================
   PvP挑戦
======================================== */

function challengePlayer(
  targetId
) {

  if (
    !socket ||
    !onlineEnabled
  ) {

    log(
      "オンライン接続が必要です。"
    );

    return;
  }


  if (pvp.active) {

    log(
      "現在PvP中です。"
    );

    return;
  }


  socket.emit(
    "pvpChallenge",
    targetId
  );


  log(
    "PvPを申し込みました。"
  );

}


/* ========================================
   PvP申し込み表示
======================================== */

function showPvpRequest(
  data
) {

  const ok =
    window.confirm(
      `${data.fromName} からPvPの申し込みが来ました。\n\n戦いますか？`
    );


  if (!socket) {
    return;
  }


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


/* ========================================
   PvP開始
======================================== */

function startPvp(
  data
) {

  pvp.active =
    true;

  pvp.opponentId =
    data.opponentId;

  pvp.opponentName =
    data.opponentName;

  pvp.yourTurn =
    Boolean(
      data.yourTurn
    );

  pvp.defending =
    false;


  $("pvpOpponentName")
    .textContent =
    pvp.opponentName;


  $("pvpOpponentHp")
    .textContent =
    "??";


  $("pvpOpponentMaxHp")
    .textContent =
    "??";


  $("pvpBattleScreen")
    .classList
    .remove("hidden");


  $("pvpBattleScreen")
    .scrollIntoView({
      behavior: "smooth",
      block: "start"
    });


  updatePvpTurn();


  log(
    `${pvp.opponentName} とのPvPが始まった！`
  );


  updatePvpButtons();

}


/* ========================================
   PvPターン表示
======================================== */

function updatePvpTurn() {

  const text =
    $("pvpTurnText");

  if (!text) {
    return;
  }


  if (!pvp.active) {

    text.textContent =
      "PvP終了";

    return;
  }


  if (pvp.yourTurn) {

    text.textContent =
      "🟢 あなたのターン";

  } else {

    text.textContent =
      "🔴 相手のターン";

  }

}


/* ========================================
   PvPボタン制御
======================================== */

function updatePvpButtons() {

  const ids = [

    "pvpAttackBtn",

    "pvpDefendBtn",

    "pvpSkillBtn",

    "pvpInspectBtn",

    "pvpRunBtn"

  ];


  ids.forEach(
    id => {

      const button =
        $(id);

      if (!button) {
        return;
      }

      button.disabled =
        !pvp.active ||
        !pvp.yourTurn;

    }
  );

}


/* ========================================
   PvP攻撃
======================================== */

function pvpAttack() {

  if (
    !pvp.active ||
    !pvp.yourTurn
  ) {
    return;
  }


  socket.emit(
    "pvpAttack"
  );

}


/* ========================================
   PvP防御
======================================== */

function pvpDefend() {

  if (
    !pvp.active ||
    !pvp.yourTurn
  ) {
    return;
  }


  socket.emit(
    "pvpDefend"
  );

}


/* ========================================
   PvPスキル
======================================== */

function pvpSkill() {

  if (
    !pvp.active ||
    !pvp.yourTurn
  ) {
    return;
  }


  if (
    player.skillCount <= 0
  ) {

    log(
      "まだスキルを解放していません。"
    );

    return;
  }


  const names =
    Object.keys(skills);


  const index =
    Math.min(
      player.skillCount - 1,
      names.length - 1
    );


  const skillName =
    names[index];


  socket.emit(
    "pvpSkill",
    {
      skillName
    }
  );

}


/* ========================================
   PvP調べる
======================================== */

function pvpInspect() {

  if (
    !pvp.active
  ) {
    return;
  }


  if (
    pvp.opponentHp > 0
  ) {

    log(
      `${pvp.opponentName} HP:${pvp.opponentHp}/${pvp.opponentMaxHp}`
    );

  } else {

    log(
      `${pvp.opponentName} の情報を確認中...`
    );

  }

}


/* ========================================
   PvP逃走
======================================== */

function pvpRun() {

  if (
    !pvp.active ||
    !pvp.yourTurn
  ) {
    return;
  }


  socket.emit(
    "pvpRun"
  );

}


/* ========================================
   PvP終了
======================================== */

function finishPvp() {

  pvp.active =
    false;

  pvp.opponentId =
    null;

  pvp.opponentName =
    "";

  pvp.opponentHp =
    0;

  pvp.opponentMaxHp =
    0;

  pvp.yourTurn =
    false;

  pvp.defending =
    false;


  $("pvpBattleScreen")
    .classList
    .add("hidden");


  updatePvpButtons();

}


/* ========================================
   チャット
======================================== */

function addChatMessage(
  data
) {

  const box =
    $("chatLog");

  if (!box) {
    return;
  }


  const line =
    document.createElement(
      "div"
    );

  line.className =
    "chat-message";


  const name =
    document.createElement(
      "span"
    );

  name.className =
    "chat-name";


  name.textContent =
    `${data.name}: `;


  const message =
    document.createElement(
      "span"
    );


  message.textContent =
    data.message;


  line.appendChild(
    name
  );

  line.appendChild(
    message
  );


  box.appendChild(
    line
  );


  box.scrollTop =
    box.scrollHeight;

}


/* ========================================
   チャット送信
======================================== */

function sendChat() {

  if (
    !socket ||
    !onlineEnabled
  ) {
    return;
  }


  const input =
    $("chatInput");


  const message =
    input.value.trim();


  if (!message) {
    return;
  }


  socket.emit(
    "chat",
    message
  );


  input.value =
    "";

}


/* ========================================
   モンスター戦闘開始
======================================== */

function startBattle(
  monster = null
) {

  if (enemy) {
    return;
  }


  if (pvp.active) {

    log(
      "PvP中はモンスターと戦えません。"
    );

    return;
  }


  let selected =
    monster;


  if (!selected) {

    const pool =
      monsters.filter(
        m =>
          m.area === player.area ||
          player.area === "都市"
      );


    selected =
      pool[
        Math.floor(
          Math.random() *
          pool.length
        )
      ];

  }


  if (!selected) {

    selected =
      monsters[0];

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

    name:
      selected.name,

    hp,

    maxHp:
      hp,

    attack:
      Math.max(
        5,
        Math.floor(
          hp / 3
        )
      ),

    xp:
      selected.xp,

    money:
      Math.floor(
        selected.xp / 2
      ),

    isBoss:
      false

  };


  showBattle();


  log(
    `「${enemy.name}」が現れた！`
  );


  updateEnemyStatus();

}


/* ========================================
   通常戦闘表示
======================================== */

function showBattle() {

  $("battleScreen")
    .classList
    .remove("hidden");

}


/* ========================================
   通常戦闘非表示
======================================== */

function hideBattle() {

  $("battleScreen")
    .classList
    .add("hidden");

}


/* ========================================
   敵ステータス
======================================== */

function updateEnemyStatus() {

  if (!enemy) {
    return;
  }


  $("enemyName")
    .textContent =
    enemy.name;


  $("enemyHp")
    .textContent =
    enemy.hp;


  $("enemyMaxHp")
    .textContent =
    enemy.maxHp;


  const percent =
    Math.max(
      0,
      Math.min(
        100,
        enemy.hp /
        enemy.maxHp *
        100
      )
    );


  $("enemyHpBar")
    .style.width =
    percent + "%";

}


/* ========================================
   通常攻撃
======================================== */

function playerAttack() {

  if (!enemy) {
    return;
  }


  let damage =
    5 +
    player.attack;


  if (
    player.weapon === "タガー"
  ) {

    damage += 15;

  } else if (
    player.weapon === "剣"
  ) {

    damage += 5;

  }


  const critical =
    Math.random() < 0.15;


  if (critical) {

    damage += 5;

    log(
      "クリティカルヒット！ +5ダメージ！"
    );

  }


  enemy.hp =
    Math.max(
      0,
      enemy.hp - damage
    );


  log(
    `${damage}ダメージを与えた！`
  );


  updateEnemyStatus();


  if (
    enemy.hp <= 0
  ) {

    winBattle();

    return;

  }


  enemyAttack();

}


/* ========================================
   防御
======================================== */

function defend() {

  if (!enemy) {
    return;
  }


  defending =
    true;


  log(
    "ボウギョした！"
  );


  enemyAttack();

}


/* ========================================
   敵攻撃
======================================== */

function enemyAttack() {

  if (!enemy) {
    return;
  }


  let damage =
    enemy.attack;


  if (defending) {

    damage =
      Math.floor(
        damage / 2
      );

    defending =
      false;

  }


  player.hp =
    Math.max(
      0,
      player.hp - damage
    );


  log(
    `${enemy.name}の攻撃！ ${damage}ダメージ！`
  );


  updateStatus();

  sendPlayerUpdate();


  if (
    player.hp <= 0
  ) {

    gameOver();

  }

}


/* ========================================
   通常スキル
======================================== */

function useSkill() {

  if (!enemy) {
    return;
  }


  if (
    player.skillCount <= 0
  ) {

    log(
      "まだスキルを解放していません。"
    );

    return;
  }


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
    skill.damage;


  enemy.hp =
    Math.max(
      0,
      enemy.hp - damage
    );


  log(
    `${skillName}！ ${damage}ダメージ！`
  );


  updateEnemyStatus();


  if (
    enemy.hp <= 0
  ) {

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
    return;
  }


  log(
    `${enemy.name} HP:${enemy.hp}/${enemy.maxHp} 攻撃:${enemy.attack}`
  );

}


/* ========================================
   逃げる
======================================== */

function runBattle() {

  if (!enemy) {
    return;
  }


  if (
    Math.random() < 0.7
  ) {

    log(
      "うまく逃げ切った！"
    );


    enemy =
      null;


    hideBattle();

  } else {

    log(
      "逃げられなかった！"
    );


    enemyAttack();

  }

}


/* ========================================
   戦闘勝利
======================================== */

function winBattle() {

  if (!enemy) {
    return;
  }


  const defeatedEnemy =
    enemy;


  enemy =
    null;


  hideBattle();


  player.defeats +=
    1;


  player.xp +=
    defeatedEnemy.xp;


  player.money +=
    defeatedEnemy.money;


  player.bounty +=
    defeatedEnemy.money;


  log(
    `${defeatedEnemy.name}を倒した！`
  );


  log(
    `${defeatedEnemy.name}が${defeatedEnemy.money}円を落とした！`
  );


  log(
    `${defeatedEnemy.xp} XPを獲得した！`
  );


  checkLevelUp();


  updateStatus();

  saveGame();

  sendPlayerUpdate();


  if (
    defeatedEnemy.isBoss
  ) {

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


  if (
    player.xp >= required
  ) {

    player.xp -=
      required;

    player.level +=
      1;


    $("levelChoices")
      .classList
      .remove("hidden");


    log(
      `レベル${player.level}になった！`
    );

  }

}


/* ========================================
   HPアップ
======================================== */

function levelUpHP() {

  player.maxHp +=
    5;

  player.hp =
    player.maxHp;


  finishLevelChoice(
    "HPが5増えた！"
  );

}


/* ========================================
   攻撃アップ
======================================== */

function levelUpAttack() {

  player.attack +=
    20;


  finishLevelChoice(
    "攻撃が20増えた！"
  );

}


/* ========================================
   スキル解放
======================================== */

function levelUpSkill() {

  player.skillCount +=
    1;


  finishLevelChoice(
    "スキルを1つ解放した！"
  );

}


/* ========================================
   レベル選択終了
======================================== */

function finishLevelChoice(
  message
) {

  $("levelChoices")
    .classList
    .add("hidden");


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
      <p>
        スキル解放数：
        ${player.skillCount}
      </p>

      <table>

        <tr>
          <th>スキル</th>
          <th>ダメージ</th>
        </tr>

        <tr>
          <td>斬撃</td>
          <td>35</td>
        </tr>

        <tr>
          <td>高速切り</td>
          <td>65</td>
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
      <p>
        レベル：
        ${player.level}
      </p>

      <p>
        XP：
        ${player.xp}
      </p>

      <p>
        HP：
        ${player.hp}/${player.maxHp}
      </p>

      <p>
        攻撃：
        ${player.attack}
      </p>

      <p>
        スキル：
        ${player.skillCount}
      </p>
    `
  );

}


/* ========================================
   図鑑
======================================== */

function showBook() {

  let html =
    "<table>";

  html +=
    "<tr>" +
    "<th>怪物</th>" +
    "<th>HP</th>" +
    "<th>Lv</th>" +
    "<th>場所</th>" +
    "<th>XP</th>" +
    "</tr>";


  monsters.forEach(
    monster => {

      html += `
        <tr>

          <td>
            ${monster.name}
          </td>

          <td>
            ${monster.hp}
          </td>

          <td>
            ${monster.levelMin}
            ～${monster.levelMax}
          </td>

          <td>
            ${monster.area}
          </td>

          <td>
            ${monster.xp}
          </td>

        </tr>
      `;

    }
  );


  html +=
    "</table>";


  showInfo(
    "📚 図鑑",
    html
  );

}


/* ========================================
   バック
======================================== */

function showBag() {

  showInfo(
    "🎒 バック",

    `
      <p>
        武器：
        ${player.weapon}
      </p>

      <p>
        お金：
        ${player.money}円
      </p>
    `
  );

}


/* ========================================
   ノーマルガチャ
======================================== */

function normalGacha() {

  if (
    player.money < 50
  ) {

    log(
      "お金が足りません。"
    );

    return;
  }


  player.money -=
    50;


  const result =
    Math.random() < 0.5
      ? "タガー"
      : "剣";


  if (
    result === "タガー"
  ) {

    player.weapon =
      "タガー";


    log(
      "タガーを手に入れた！"
    );

  } else {

    player.weapon =
      "剣";


    log(
      "剣を手に入れた！"
    );

  }


  updateStatus();

  saveGame();

  sendPlayerUpdate();

}


/* ========================================
   町
======================================== */

function goTown() {

  if (
    player.defeats < 3
  ) {

    log(
      "町へ行くには敵を3体倒してください。"
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


  if (
    Math.random() < 0.4
  ) {

    const gift =
      50 +
      Math.floor(
        Math.random() * 100
      );


    player.money +=
      gift;


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

  if (
    player.defeats < 3
  ) {

    log(
      "都市へ行くには敵を3体倒してください。"
    );

    return;
  }


  player.area =
    "都市";


  log(
    "都市に到着した！"
  );


  log(
    "超お手軽に買い物ができる！"
  );


  if (
    Math.random() < 0.5
  ) {

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

  const cost =
    30;


  if (
    player.money < cost
  ) {

    log(
      "回復するお金が足りません。"
    );

    return;
  }


  player.money -=
    cost;


  player.hp =
    player.maxHp;


  log(
    "30円使ってHPを全回復した！"
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
      "現在戦闘中です。"
    );

    return;
  }


  if (pvp.active) {

    log(
      "PvP中はボスと戦えません。"
    );

    return;
  }


  enemy = {

    name:
      BOSS.name,

    hp:
      BOSS.hp,

    maxHp:
      BOSS.hp,

    attack:
      BOSS.attack,

    xp:
      BOSS.xp,

    money:
      BOSS.money,

    isBoss:
      true

  };


  showBattle();


  log(
    `「${BOSS.name}」が現れた！`
  );


  updateEnemyStatus();

}


/* ========================================
   ゲームオーバー
======================================== */

function gameOver() {

  enemy =
    null;


  hideBattle();


  finishPvp();


  player = {

    name:
      player.name,

    job:
      player.job,

    hp:
      30,

    maxHp:
      30,

    level:
      0,

    attack:
      0,

    xp:
      0,

    money:
      250,

    bounty:
      0,

    weapon:
      "タガー",

    area:
      "草原",

    defeats:
      0,

    skillCount:
      0

  };


  localStorage.removeItem(
    "yuushaBountyRPG"
  );


  updateStatus();


  $("gameScreen")
    .classList
    .add("hidden");


  $("gameOverScreen")
    .classList
    .remove("hidden");

}


/* ========================================
   ゲーム開始
======================================== */

function startGame() {

  const name =
    $("nameInput")
      .value
      .trim();


  const job =
    $("jobInput")
      .value;


  player.name =
    name || "勇者";


  player.job =
    job || "勇者";


  $("startScreen")
    .classList
    .add("hidden");


  $("gameScreen")
    .classList
    .remove("hidden");


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
   ボタン
======================================== */

function bindButton(
  id,
  fn
) {

  const element =
    $(id);

  if (!element) {
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


  socket.on(
    "connect",
    () => {

      setConnectionStatus(
        true
      );


      setRoomStatus(
        "オンライン接続済み"
      );


      log(
        "オンラインサーバーに接続しました！"
      );


      sendPlayerUpdate();

    }
  );


  socket.on(
    "disconnect",
    () => {

      setConnectionStatus(
        false
      );


      setRoomStatus(
        "サーバーから切断されました。"
      );

    }
  );


  socket.on(
    "onlineReady",
    () => {

      setConnectionStatus(
        true
      );

    }
  );


  /* ====================================
     ルーム作成
  ==================================== */

  socket.on(
    "roomCreated",
    data => {

      const roomId =
        data.roomId;


      setRoomStatus(
        `ルーム作成成功！ ID：${roomId}`
      );


      $("roomInfo")
        .textContent =
        `ルームID：${roomId}`;


      if (
        $("roomCodeInput")
      ) {

        $("roomCodeInput")
          .value =
          roomId;

      }


      renderRoomPlayers(
        data.players
      );


      log(
        `オンラインルーム「${roomId}」を作成しました！`
      );


      addChatMessage(
        {
          name: "システム",
          message:
            "ルームを作成しました！"
        }
      );

    }
  );


  /* ====================================
     ルーム参加
  ==================================== */

  socket.on(
    "roomJoined",
    data => {

      const roomId =
        data.roomId;


      setRoomStatus(
        `ルーム参加中：${roomId}`
      );


      $("roomInfo")
        .textContent =
        `ルームID：${roomId}`;


      renderRoomPlayers(
        data.players
      );


      log(
        `ルーム「${roomId}」に参加しました！`
      );

    }
  );


  /* ====================================
     プレイヤー更新
  ==================================== */

  socket.on(
    "roomPlayersUpdate",
    players => {

      renderRoomPlayers(
        players
      );


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


          $("pvpOpponentHp")
            .textContent =
            opponent.hp;


          $("pvpOpponentMaxHp")
            .textContent =
            opponent.maxHp;


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


          $("pvpOpponentHpBar")
            .style.width =
            percent + "%";

        }

      }

    }
  );


  /* ====================================
     ルームエラー
  ==================================== */

  socket.on(
    "roomError",
    message => {

      setRoomStatus(
        message
      );


      log(
        `オンライン：${message}`
      );

    }
  );


  /* ====================================
     退出
  ==================================== */

  socket.on(
    "leftRoom",
    () => {

      setRoomStatus(
        "ルームから退出しました。"
      );


      $("roomInfo")
        .textContent =
        "ルームなし";


      $("roomPlayers")
        .innerHTML =
        "";


      log(
        "ルームから退出しました。"
      );

    }
  );


  /* ====================================
     チャット
  ==================================== */

  socket.on(
    "publicMessage",
    data => {

      addChatMessage(
        data
      );

    }
  );


  /* ====================================
     戦闘ログ
  ==================================== */

  socket.on(
    "onlineBattleLog",
    data => {

      log(
        `【${data.name}】${data.message}`
      );

    }
  );


  /* ====================================
     PvP申し込み
  ==================================== */

  socket.on(
    "pvpRequest",
    data => {

      showPvpRequest(
        data
      );

    }
  );


  /* ====================================
     PvP申し込み送信完了
  ==================================== */

  socket.on(
    "pvpChallengeSent",
    data => {

      log(
        `${data.targetName} にPvPを申し込みました。`
      );

    }
  );


  /* ====================================
     PvP拒否
  ==================================== */

  socket.on(
    "pvpRejectedByTarget",
    data => {

      log(
        `${data.targetName} にPvPを断られました。`
      );

    }
  );


  /* ====================================
     PvP開始
  ==================================== */

  socket.on(
    "pvpStarted",
    data => {

      startPvp(
        data
      );

    }
  );


  /* ====================================
     PvP攻撃結果
  ==================================== */

  socket.on(
    "pvpAttackResult",
    data => {

      if (
        data.critical
      ) {

        log(
          `【PvP】クリティカルヒット！ +5ダメージ！`
        );

      }


      log(
        `【PvP】${data.attackerName} → ${data.targetName}：${data.damage}ダメージ！`
      );


      if (
        data.targetId ===
        pvp.opponentId
      ) {

        pvp.opponentHp =
          data.targetHp;

        pvp.opponentMaxHp =
          data.targetMaxHp;


        $("pvpOpponentHp")
          .textContent =
          data.targetHp;


        $("pvpOpponentMaxHp")
          .textContent =
          data.targetMaxHp;


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


        $("pvpOpponentHpBar")
          .style.width =
          percent + "%";

      }

    }
  );


  /* ====================================
     PvPスキル結果
  ==================================== */

  socket.on(
    "pvpSkillResult",
    data => {

      log(
        `【PvP】${data.attackerName}の${data.skillName}！ ${data.damage}ダメージ！`
      );


      if (
        data.targetId ===
        pvp.opponentId
      ) {

        pvp.opponentHp =
          data.targetHp;

        pvp.opponentMaxHp =
          data.targetMaxHp;


        $("pvpOpponentHp")
          .textContent =
          data.targetHp;


        $("pvpOpponentMaxHp")
          .textContent =
          data.targetMaxHp;


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


        $("pvpOpponentHpBar")
          .style.width =
          percent + "%";

      }

    }
  );


  /* ====================================
     PvPターン
  ==================================== */

  socket.on(
    "pvpTurn",
    data => {

      pvp.yourTurn =
        data.turnId ===
        socket.id;


      updatePvpTurn();

      updatePvpButtons();

    }
  );


  /* ====================================
     PvP防御
  ==================================== */

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


  /* ====================================
     PvP終了
  ==================================== */

  socket.on(
    "pvpFinished",
    data => {

      if (
        data.reason
      ) {

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

        player.money +=
          100;

        player.xp +=
          100;

        player.bounty +=
          100;

        player.defeats +=
          1;


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


  /* ====================================
     PvPエラー
  ==================================== */

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

        if (
          event.key ===
          "Enter"
        ) {

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

        if (
          event.key ===
          "Enter"
        ) {

          sendChat();

        }

      }
    );

  }

}


/* ========================================
   ボタン接続
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
  () => {
    startBattle();
  }
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
