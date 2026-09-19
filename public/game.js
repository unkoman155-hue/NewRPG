const socket = io();

const SAVE_KEY =
  "yuusha_bounty_rpg_online_v6";

const BOSS = {
  name: "懸賞金王",
  hp: 500,
  attack: 45,
  xp: 1000,
  money: 1000
};

const skills = {
  "斬撃": 35,
  "高速切り": 65
};

const jobs = {
  "勇者": {
    maxHp: 30,
    attack: 0,
    skill: "斬撃"
  },

  "ヒーラー": {
    maxHp: 30,
    attack: 0,
    skill: "ヒール"
  },

  "剣士": {
    maxHp: 30,
    attack: 0,
    skill: "斬撃"
  }
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

    townUnlocked: false,
    cityUnlocked: false
  };
}

let player = loadPlayer();

let enemy = null;
let defending = false;
let currentRoom = null;

function loadPlayer() {
  try {
    const saved =
      localStorage.getItem(SAVE_KEY);

    if (!saved) {
      return defaultPlayer();
    }

    return {
      ...defaultPlayer(),
      ...JSON.parse(saved)
    };
  } catch (error) {
    console.error(error);
    return defaultPlayer();
  }
}

function savePlayer() {
  localStorage.setItem(
    SAVE_KEY,
    JSON.stringify(player)
  );
}

function $(id) {
  return document.getElementById(id);
}

function show(id) {
  const el = $(id);

  if (el) {
    el.style.display = "";
  }
}

function hide(id) {
  const el = $(id);

  if (el) {
    el.style.display = "none";
  }
}

function setText(id, value) {
  const el = $(id);

  if (el) {
    el.textContent = value;
  }
}

/*
  中央のメッセージ欄
*/
function log(message) {
  const box =
    $("log") ||
    $("battleLog") ||
    $("message");

  if (!box) return;

  const line =
    document.createElement("div");

  line.textContent = message;

  box.appendChild(line);

  box.scrollTop = box.scrollHeight;
}

/*
  プレイヤー情報を更新
*/
function updateStatus() {
  setText("playerName", player.name);
  setText("job", player.job);
  setText("level", player.level);

  setText(
    "hp",
    `${player.hp} / ${player.maxHp}`
  );

  setText("xp", player.xp);
  setText("attack", player.attack);

  setText(
    "money",
    `${player.money}円`
  );

  setText(
    "bounty",
    `${player.bounty}円`
  );

  setText("weapon", player.weapon);
  setText("area", player.area);
  setText("defeats", player.defeats);

  savePlayer();

  /*
    オンラインにも自分の状態を送信
  */
  if (socket.connected && currentRoom) {
    socket.emit("playerUpdate", {
      name: player.name,
      hp: player.hp,
      maxHp: player.maxHp,
      level: player.level,
      bounty: player.bounty,
      money: player.money,
      job: player.job,
      area: player.area
    });
  }
}

/*
  戦闘結果をオンラインへ送信
*/
function onlineLog(message) {
  log(message);

  if (currentRoom) {
    socket.emit("battleLog", message);
  }
}

/*
  敵を選ぶ
*/
function getRandomMonster(stronger = false) {
  let list = monsters.filter(monster => {
    return (
      player.level >= monster.minLv &&
      player.level <= monster.maxLv
    );
  });

  if (list.length === 0) {
    list = monsters;
  }

  const base =
    list[Math.floor(Math.random() * list.length)];

  const multiplier =
    stronger ? 1.35 : 1;

  return {
    ...base,

    maxHp:
      Math.floor(base.hp * multiplier),

    hp:
      Math.floor(base.hp * multiplier),

    attack:
      Math.floor(base.attack * multiplier)
  };
}

/*
  戦闘開始
*/
function startBattle(stronger = false) {
  enemy = getRandomMonster(stronger);

  defending = false;

  show("battleScreen");

  setText(
    "enemyName",
    enemy.name
  );

  setText(
    "enemyHp",
    `${enemy.hp} / ${enemy.maxHp}`
  );

  onlineLog(
    `「${enemy.name}」が現れた！`
  );

  updateEnemyHp();
}

/*
  ボス
*/
function startBossBattle() {
  enemy = {
    ...BOSS,

    maxHp: BOSS.hp,
    hp: BOSS.hp,

    level: 50
  };

  defending = false;

  show("battleScreen");

  setText(
    "enemyName",
    enemy.name
  );

  setText(
    "enemyHp",
    `${enemy.hp} / ${enemy.maxHp}`
  );

  onlineLog(
    `「${enemy.name}」が現れた！`
  );

  onlineLog(
    "巨大な懸賞金がかかったボスだ！"
  );

  updateEnemyHp();
}

/*
  武器攻撃力
*/
function getWeaponPower() {
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

/*
  ダメージ計算
*/
function calculateDamage(skillName = null) {
  let damage =
    player.attack +
    getWeaponPower();

  if (
    skillName &&
    skills[skillName]
  ) {
    damage += skills[skillName];
  }

  damage = Math.max(1, damage);

  const critical =
    Math.random() < 0.15;

  if (critical) {
    damage += 5;
  }

  return {
    damage,
    critical
  };
}

/*
  コウゲキ
*/
function attackEnemy() {
  if (!enemy || enemy.hp <= 0) {
    return;
  }

  const result =
    calculateDamage();

  enemy.hp -= result.damage;

  if (result.critical) {
    onlineLog(
      `クリティカルヒット！ ${result.damage}ダメージ！`
    );
  } else {
    onlineLog(
      `${enemy.name}に${result.damage}ダメージを与えた！`
    );
  }

  updateEnemyHp();

  if (enemy.hp <= 0) {
    winBattle();
    return;
  }

  enemyTurn();
}

/*
  ボウギョ
*/
function defend() {
  if (!enemy || enemy.hp <= 0) {
    return;
  }

  defending = true;

  onlineLog("ボウギョした！");

  enemyTurn();
}

/*
  スキル
*/
function useSkill() {
  if (!enemy || enemy.hp <= 0) {
    return;
  }

  let skillName =
    player.skills[0];

  if (!skillName) {
    skillName =
      jobs[player.job]?.skill ||
      "斬撃";
  }

  if (skillName === "ヒール") {
    const heal = 25;

    player.hp =
      Math.min(
        player.maxHp,
        player.hp + heal
      );

    onlineLog(
      `ヒール！ HPが${heal}回復した！`
    );

    updateStatus();

    enemyTurn();

    return;
  }

  const result =
    calculateDamage(skillName);

  enemy.hp -= result.damage;

  if (result.critical) {
    onlineLog(
      `クリティカルヒット！ ${result.damage}ダメージ！`
    );
  }

  onlineLog(
    `${skillName}！ ${enemy.name}に${result.damage}ダメージを与えた！`
  );

  updateEnemyHp();

  if (enemy.hp <= 0) {
    winBattle();
    return;
  }

  enemyTurn();
}

/*
  シラベル
*/
function inspectEnemy() {
  if (!enemy) return;

  onlineLog(
    `${enemy.name} HP:${enemy.hp}/${enemy.maxHp} 攻撃:${enemy.attack}`
  );
}

/*
  ニゲル
*/
function runBattle() {
  if (!enemy) return;

  if (Math.random() < 0.7) {
    onlineLog("逃げ出した！");

    enemy = null;

    hide("battleScreen");

    return;
  }

  onlineLog("逃げられなかった！");

  enemyTurn();
}

/*
  敵ターン
*/
function enemyTurn() {
  if (!enemy || enemy.hp <= 0) {
    return;
  }

  let damage = enemy.attack;

  if (defending) {
    damage =
      Math.floor(damage / 2);

    defending = false;
  }

  damage = Math.max(1, damage);

  player.hp -= damage;

  onlineLog(
    `${enemy.name}の攻撃！ ${damage}ダメージ受けた！`
  );

  if (player.hp <= 0) {
    player.hp = 0;

    updateStatus();

    onlineLog(
      "勇者は倒れてしまった……"
    );

    setTimeout(
      gameOver,
      500
    );

    return;
  }

  updateStatus();
}

/*
  敵HP表示
*/
function updateEnemyHp() {
  if (!enemy) return;

  setText(
    "enemyHp",
    `${Math.max(0, enemy.hp)} / ${enemy.maxHp}`
  );

  const bar =
    $("enemyHpBar");

  if (bar) {
    const percent =
      enemy.maxHp > 0
        ? enemy.hp /
          enemy.maxHp *
          100
        : 0;

    bar.style.width =
      `${Math.max(0, percent)}%`;
  }
}

/*
  戦闘勝利
*/
function winBattle() {
  if (!enemy) return;

  const defeated =
    enemy;

  onlineLog(
    `${defeated.name}を倒した！`
  );

  onlineLog(
    `${defeated.name}が${defeated.money}円を落とした！`
  );

  onlineLog(
    `${defeated.xp}XPを獲得した！`
  );

  player.money +=
    defeated.money;

  player.xp +=
    defeated.xp;

  player.bounty +=
    defeated.xp;

  player.defeats++;

  if (player.defeats >= 3) {
    player.townUnlocked = true;
    player.cityUnlocked = true;
  }

  enemy = null;

  checkLevelUp();

  updateStatus();

  setTimeout(() => {
    hide("battleScreen");
  }, 700);
}

/*
  レベルアップ
*/
function checkLevelUp() {
  const need =
    100 +
    player.level * 50;

  if (player.xp < need) {
    return;
  }

  player.xp -= need;

  player.level++;

  onlineLog(
    `レベル${player.level}になった！`
  );

  showLevelChoices();
}

/*
  レベルアップ選択
*/
function showLevelChoices() {
  const box =
    $("levelChoices");

  if (!box) return;

  box.innerHTML = "";

  const hp =
    document.createElement("button");

  hp.textContent =
    "HP増加（5増える）";

  hp.onclick = () => {
    player.maxHp += 5;
    player.hp += 5;

    onlineLog(
      "最大HPが5増えた！"
    );

    hide("levelChoices");

    updateStatus();
  };

  const attack =
    document.createElement("button");

  attack.textContent =
    "攻撃増加（20増える）";

  attack.onclick = () => {
    player.attack += 20;

    onlineLog(
      "攻撃が20増えた！"
    );

    hide("levelChoices");

    updateStatus();
  };

  const skill =
    document.createElement("button");

  skill.textContent =
    "スキル解放（1増える）";

  skill.onclick = () => {
    const list =
      Object.keys(skills);

    const next =
      list.find(
        name =>
          !player.skills.includes(name)
      );

    if (next) {
      player.skills.push(next);

      onlineLog(
        `スキル「${next}」を解放した！`
      );
    } else {
      onlineLog(
        "解放できるスキルがありません。"
      );
    }

    hide("levelChoices");

    updateStatus();
  };

  box.appendChild(hp);
  box.appendChild(attack);
  box.appendChild(skill);

  show("levelChoices");
}

/*
  職業
*/
function chooseJob(jobName) {
  if (!jobs[jobName]) {
    return;
  }

  player.job =
    jobName;

  player.maxHp =
    jobs[jobName].maxHp;

  player.hp =
    player.maxHp;

  player.attack =
    jobs[jobName].attack;

  const firstSkill =
    jobs[jobName].skill;

  if (
    firstSkill &&
    !player.skills.includes(firstSkill)
  ) {
    player.skills.push(
      firstSkill
    );
  }

  onlineLog(
    `職業を「${jobName}」にした！`
  );

  hide("jobScreen");

  updateStatus();
}

/*
  ガチャ
*/
function gachaNormal() {
  const cost = 50;

  if (player.money < cost) {
    log("お金が足りない！");
    return;
  }

  player.money -= cost;

  const item =
    Math.random() < 0.5
      ? "タガー"
      : "剣";

  player.inventory.push(
    item
  );

  /*
    ここが中央ログに表示される
  */
  log(
    "ノーマルガチャを回した！"
  );

  log(
    `「${item}」を手に入れた！`
  );

  if (item === "タガー") {
    log(
      "タガー：15ダメージ"
    );

    log(
      "たまに出血で追加5ダメージ！"
    );
  }

  if (item === "剣") {
    log(
      "剣：5ダメージ"
    );
  }

  updateStatus();
}

/*
  町
*/
function goTown() {
  if (
    !player.townUnlocked &&
    player.defeats < 3
  ) {
    log(
      "町へ行くには敵を3体倒してください。"
    );

    return;
  }

  player.townUnlocked = true;
  player.area = "町";

  log(
    "町へ到着した！"
  );

  log(
    "お手軽にショップで買い物ができる！"
  );

  if (Math.random() < 0.35) {
    const gift =
      Math.floor(
        Math.random() * 51
      ) + 10;

    player.money +=
      gift;

    log(
      `町の人が${gift}円を譲ってくれた！`
    );
  }

  updateStatus();
}

/*
  都市
*/
function goCity() {
  if (
    !player.cityUnlocked &&
    player.defeats < 3
  ) {
    log(
      "都市へ行くには敵を3体倒してください。"
    );

    return;
  }

  player.cityUnlocked = true;
  player.area = "都市";

  log(
    "都市へ到着した！"
  );

  log(
    "超お手軽に買い物できる！"
  );

  log(
    "時々強い敵が現れるため注意！"
  );

  updateStatus();

  if (Math.random() < 0.5) {
    startBattle(true);
  }
}

/*
  町で回復
*/
function healAtTown() {
  const cost = 30;

  if (player.money < cost) {
    log("30円必要です！");
    return;
  }

  player.money -= cost;
  player.hp =
    player.maxHp;

  log(
    "HPが全回復した！"
  );

  updateStatus();
}

/*
  バッグ
*/
function openBag() {
  const box =
    $("bagList");

  if (!box) return;

  box.innerHTML = "";

  player.inventory.forEach(item => {
    const button =
      document.createElement("button");

    button.textContent =
      `装備：${item}`;

    button.onclick = () => {
      player.weapon =
        item;

      log(
        `${item}を装備した！`
      );

      updateStatus();
    };

    box.appendChild(button);
  });

  show("bagScreen");
}

/*
  図鑑
*/
function openBook() {
  const box =
    $("bookList");

  if (!box) return;

  box.innerHTML = "";

  monsters.forEach(monster => {
    const div =
      document.createElement("div");

    div.textContent =
      `${monster.name} / HP${monster.hp} / Lv${monster.minLv}～${monster.maxLv} / ${monster.area} / XP${monster.xp}`;

    box.appendChild(div);
  });

  const boss =
    document.createElement("div");

  boss.textContent =
    `${BOSS.name} / HP${BOSS.hp} / 攻撃${BOSS.attack} / XP${BOSS.xp}`;

  box.appendChild(boss);

  show("bookScreen");
}

/*
  スキル一覧
*/
function openSkills() {
  const box =
    $("skillsList");

  if (!box) return;

  box.innerHTML = "";

  Object.entries(skills)
    .forEach(([name, damage]) => {
      const div =
        document.createElement("div");

      const unlocked =
        player.skills.includes(name);

      div.textContent =
        `${name}：${damage}ダメージ ${unlocked ? "【解放済み】" : "【未解放】"}`;

      box.appendChild(div);
    });

  show("skillsScreen");
}

/*
  レベル確認
*/
function openLevel() {
  const box =
    $("levelInfo");

  if (box) {
    box.textContent =
      `レベル：${player.level}\nXP：${player.xp}`;
  }

  show("levelScreen");
}

/*
  オンライン
*/
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
    $("roomId");

  if (!input) return;

  socket.emit(
    "joinRoom",
    {
      roomId: input.value,
      name: player.name
    }
  );
}

function leaveRoom() {
  socket.emit(
    "leaveRoom"
  );

  currentRoom = null;

  setText(
    "roomCode",
    "未参加"
  );
}

function sendChat() {
  const input =
    $("chatInput");

  if (!input) return;

  const message =
    input.value.trim();

  if (!message) return;

  socket.emit(
    "chat",
    message
  );

  input.value = "";
}

/*
  ルーム作成成功
*/
socket.on(
  "roomCreated",
  data => {
    currentRoom =
      data.roomId;

    setText(
      "roomCode",
      data.roomId
    );

    log(
      `ルームを作成しました：${data.roomId}`
    );

    updateOnlinePlayers(
      data.players
    );
  }
);

/*
  ルーム参加成功
*/
socket.on(
  "roomJoined",
  data => {
    currentRoom =
      data.roomId;

    setText(
      "roomCode",
      data.roomId
    );

    log(
      `ルーム${data.roomId}に参加しました！`
    );

    updateOnlinePlayers(
      data.players
    );
  }
);

/*
  ルームエラー
*/
socket.on(
  "roomError",
  message => {
    log(
      `オンラインエラー：${message}`
    );
  }
);

/*
  他プレイヤー情報
*/
socket.on(
  "playersUpdate",
  players => {
    updateOnlinePlayers(
      players
    );
  }
);

function updateOnlinePlayers(players) {
  const box =
    $("roomPlayers");

  if (!box) return;

  box.innerHTML = "";

  players.forEach(other => {
    const div =
      document.createElement("div");

    div.textContent =
      `${other.name} / Lv${other.level} / HP${other.hp}/${other.maxHp} / ${other.job}`;

    box.appendChild(div);
  });
}

/*
  公開チャット
*/
socket.on(
  "publicMessage",
  data => {
    const box =
      $("chatLog");

    if (box) {
      const div =
        document.createElement("div");

      div.textContent =
        `${data.name}: ${data.message}`;

      box.appendChild(div);

      box.scrollTop =
        box.scrollHeight;
    }

    /*
      中央ログにも表示
    */
    log(
      `[公開] ${data.name}: ${data.message}`
    );
  }
);

/*
  オンライン戦闘ログ
*/
socket.on(
  "onlineBattleLog",
  data => {
    log(
      `[${data.name}] ${data.message}`
    );
  }
);

/*
  名前変更
*/
function saveName() {
  const input =
    $("nameInput");

  if (!input) return;

  const name =
    input.value.trim();

  if (!name) return;

  player.name =
    name.slice(0, 16);

  updateStatus();

  log(
    `名前を「${player.name}」に変更しました。`
  );
}

/*
  データリセット
*/
function resetGame() {
  if (
    !confirm(
      "本当にデータをリセットしますか？"
    )
  ) {
    return;
  }

  localStorage.removeItem(
    SAVE_KEY
  );

  player =
    defaultPlayer();

  enemy = null;

  location.reload();
}

/*
  死亡
*/
function gameOver() {
  player.hp =
    player.maxHp;

  player.money = 0;
  player.bounty = 0;

  player.level = 0;
  player.xp = 0;

  player.attack = 0;

  player.skills = [];

  player.inventory =
    ["タガー"];

  player.weapon =
    "タガー";

  player.defeats = 0;

  player.area =
    "草原";

  onlineLog(
    "勇者は倒れ、データがリセットされた……"
  );

  hide("battleScreen");

  updateStatus();
}

/*
  ボタン設定
*/
function setupButtons() {
  const events = {
    startBtn: startGame,

    attackBtn: attackEnemy,
    defendBtn: defend,
    skillBtn: useSkill,
    inspectBtn: inspectEnemy,
    runBtn: runBattle,

    bossBtn: startBossBattle,

    jobBtn: () => show("jobScreen"),
    skillsBtn: openSkills,
    levelBtn: openLevel,
    bookBtn: openBook,
    bagBtn: openBag,

    townBtn: goTown,
    cityBtn: goCity,
    townHealBtn: healAtTown,

    gachaBtn: gachaNormal,

    createRoomBtn: createRoom,
    joinRoomBtn: joinRoom,
    leaveRoomBtn: leaveRoom,

    chatSendBtn: sendChat,

    nameSaveBtn: saveName,

    resetBtn: resetGame
  };

  Object.entries(events)
    .forEach(([id, fn]) => {
      const button = $(id);

      if (button) {
        button.addEventListener(
          "click",
          fn
        );
      }
    });

  document
    .querySelectorAll("[data-job]")
    .forEach(button => {
      button.addEventListener(
        "click",
        () => {
          chooseJob(
            button.dataset.job
          );
        }
      );
    });

  document
    .querySelectorAll("[data-close]")
    .forEach(button => {
      button.addEventListener(
        "click",
        () => {
          hide(
            button.dataset.close
          );
        }
      );
    });
}

/*
  スタート
*/
function startGame() {
  hide("startScreen");
  show("gameScreen");

  updateStatus();

  log(
    "勇者の懸賞金RPGへようこそ！"
  );

  log(
    "敵を倒してXPとお金を集めよう！"
  );
}

/*
  初期化
*/
document.addEventListener(
  "DOMContentLoaded",
  () => {
    setupButtons();

    const nameInput =
      $("nameInput");

    if (nameInput) {
      nameInput.value =
        player.name;
    }

    updateStatus();

    hide("gameScreen");
    hide("battleScreen");
    hide("jobScreen");
    hide("skillsScreen");
    hide("levelScreen");
    hide("bookScreen");
    hide("bagScreen");
  }
);
