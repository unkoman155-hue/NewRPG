const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "public")));


// ========================================
// ルーム管理
// ========================================

const rooms = new Map();


// ========================================
// ルームID作成
// ========================================

function createRoomId() {
  let id;

  do {
    id = Math.random()
      .toString(36)
      .substring(2, 7)
      .toUpperCase();
  } while (rooms.has(id));

  return id;
}


// ========================================
// プレイヤー公開データ
// ========================================

function publicPlayer(player) {
  return {
    id: player.id,
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

    skillCount: player.skillCount,

    pvp: player.pvp
      ? {
          opponentId: player.pvp.opponentId,
          opponentName: player.pvp.opponentName,
          turn: player.pvp.turn,
          defending: player.pvp.defending
        }
      : null
  };
}


// ========================================
// ルームプレイヤー一覧
// ========================================

function getRoomPlayers(roomId) {
  const room = rooms.get(roomId);

  if (!room) {
    return [];
  }

  return [...room.players.values()]
    .map(publicPlayer);
}


// ========================================
// ルームプレイヤー更新
// ========================================

function updateRoomPlayers(roomId) {
  io.to(roomId).emit(
    "roomPlayersUpdate",
    getRoomPlayers(roomId)
  );
}


// ========================================
// システムメッセージ
// ========================================

function systemMessage(roomId, message) {
  io.to(roomId).emit(
    "publicMessage",
    {
      name: "システム",
      message
    }
  );
}


// ========================================
// プレイヤー取得
// ========================================

function getPlayer(socket) {
  const roomId = socket.data.roomId;

  if (!roomId) {
    return null;
  }

  const room = rooms.get(roomId);

  if (!room) {
    return null;
  }

  const player = room.players.get(socket.id);

  if (!player) {
    return null;
  }

  return {
    roomId,
    room,
    player
  };
}


// ========================================
// PvP解除
// ========================================

function clearPvp(player) {
  if (!player) {
    return;
  }

  player.pvp = null;
}


// ========================================
// PvP相手取得
// ========================================

function getPvpOpponent(room, player) {
  if (!room || !player || !player.pvp) {
    return null;
  }

  return room.players.get(
    player.pvp.opponentId
  ) || null;
}


// ========================================
// 新規プレイヤー作成
// ========================================

function createPlayer(socket, name) {
  return {
    id: socket.id,

    name,

    job: "勇者",

    hp: 100,
    maxHp: 100,

    level: 1,

    attack: 10,

    xp: 0,

    money: 100,

    bounty: 0,

    weapon: "木の剣",

    area: "村",

    defeats: 0,

    skillCount: 1,

    pvp: null,

    pvpRequest: null
  };
}


// ========================================
// ルーム退出
// ========================================

function leaveRoom(socket) {
  const roomId = socket.data.roomId;

  if (!roomId) {
    return;
  }

  const room = rooms.get(roomId);

  if (!room) {
    socket.data.roomId = null;
    return;
  }

  const player = room.players.get(socket.id);

  // PvP中なら相手を解除
  if (player && player.pvp) {
    const opponent =
      getPvpOpponent(room, player);

    if (opponent) {
      clearPvp(opponent);

      io.to(opponent.id).emit(
        "pvpEnded",
        {
          reason:
            `${player.name} がルームから退出しました。`
        }
      );
    }
  }

  // PvP申請を削除
  if (player) {
    for (const other of room.players.values()) {
      if (
        other.pvpRequest &&
        other.pvpRequest.fromId === player.id
      ) {
        other.pvpRequest = null;
      }
    }
  }

  room.players.delete(socket.id);

  socket.leave(roomId);

  if (player) {
    systemMessage(
      roomId,
      `${player.name} がルームから退出しました。`
    );
  }

  if (room.players.size === 0) {
    rooms.delete(roomId);
  } else {
    updateRoomPlayers(roomId);
  }

  socket.data.roomId = null;
  socket.data.name = null;

  socket.emit("leftRoom");
}


// ========================================
// Socket.IO接続
// ========================================

io.on("connection", socket => {

  console.log(
    "================================"
  );

  console.log(
    "プレイヤー接続:",
    socket.id
  );

  console.log(
    "================================"
  );


  // 接続成功
  socket.emit("onlineReady");


  // ======================================
  // 接続確認
  // ======================================

  socket.on("pingServer", () => {
    socket.emit("pongServer");
  });


  // ======================================
  // ルーム作成
  // ======================================

  socket.on("createRoom", data => {

    if (socket.data.roomId) {
      socket.emit(
        "roomError",
        "すでにルームに参加しています。"
      );
      return;
    }

    let name =
      typeof data?.name === "string"
        ? data.name.trim()
        : "勇者";

    if (!name) {
      name = "勇者";
    }

    name = name.substring(0, 16);

    const roomId = createRoomId();

    const room = {
      id: roomId,

      players: new Map(),

      createdAt: Date.now()
    };

    const player =
      createPlayer(
        socket,
        name
      );

    room.players.set(
      socket.id,
      player
    );

    rooms.set(
      roomId,
      room
    );

    socket.join(roomId);

    socket.data.roomId =
      roomId;

    socket.data.name =
      name;


    socket.emit(
      "roomCreated",
      {
        roomId,

        player:
          publicPlayer(player),

        players:
          getRoomPlayers(roomId)
      }
    );


    systemMessage(
      roomId,
      `${name} がルームを作成しました！`
    );


    updateRoomPlayers(
      roomId
    );


    console.log(
      `${name} がルーム ${roomId} を作成`
    );

  });


  // ======================================
  // ルーム参加
  // ======================================

  socket.on("joinRoom", data => {

    if (socket.data.roomId) {
      socket.emit(
        "roomError",
        "すでにルームに参加しています。"
      );
      return;
    }

    const roomId =
      typeof data?.roomId === "string"
        ? data.roomId
            .trim()
            .toUpperCase()
        : "";

    let name =
      typeof data?.name === "string"
        ? data.name.trim()
        : "勇者";


    if (!roomId) {
      socket.emit(
        "roomError",
        "ルームIDを入力してください。"
      );
      return;
    }


    if (!name) {
      name = "勇者";
    }

    name =
      name.substring(0, 16);


    const room =
      rooms.get(roomId);


    if (!room) {
      socket.emit(
        "roomError",
        "そのルームは存在しません。"
      );
      return;
    }


    if (room.players.size >= 20) {
      socket.emit(
        "roomError",
        "ルームが満員です。"
      );
      return;
    }


    const player =
      createPlayer(
        socket,
        name
      );


    room.players.set(
      socket.id,
      player
    );


    socket.join(roomId);

    socket.data.roomId =
      roomId;

    socket.data.name =
      name;


    socket.emit(
      "roomJoined",
      {
        roomId,

        player:
          publicPlayer(player),

        players:
          getRoomPlayers(roomId)
      }
    );


    systemMessage(
      roomId,
      `${name} がルームに参加しました！`
    );


    updateRoomPlayers(
      roomId
    );


    console.log(
      `${name} がルーム ${roomId} に参加`
    );

  });


  // ======================================
  // プレイヤー情報更新
  // ======================================

  socket.on("playerUpdate", data => {

    const result =
      getPlayer(socket);

    if (!result) {
      return;
    }

    const {
      roomId,
      player
    } = result;


    if (
      typeof data?.name === "string"
    ) {

      const newName =
        data.name
          .trim()
          .substring(0, 16);

      if (newName) {
        player.name = newName;
        socket.data.name = newName;
      }
    }


    if (
      typeof data?.job === "string"
    ) {

      player.job =
        data.job
          .trim()
          .substring(0, 20);
    }


    const numberFields = [
      "hp",
      "maxHp",
      "level",
      "attack",
      "xp",
      "money",
      "bounty",
      "defeats",
      "skillCount"
    ];


    for (
      const field of numberFields
    ) {

      if (
        Number.isFinite(
          data?.[field]
        )
      ) {

        player[field] =
          Math.max(
            0,
            Math.floor(
              data[field]
            )
          );
      }
    }


    if (
      typeof data?.weapon === "string"
    ) {

      player.weapon =
        data.weapon
          .substring(0, 30);
    }


    if (
      typeof data?.area === "string"
    ) {

      player.area =
        data.area
          .substring(0, 30);
    }


    updateRoomPlayers(
      roomId
    );

  });


  // ======================================
  // PvP挑戦
  // ======================================

  socket.on("pvpChallenge", targetId => {

    const result =
      getPlayer(socket);

    if (!result) {
      return;
    }

    const {
      roomId,
      room,
      player
    } = result;


    if (
      typeof targetId !== "string"
    ) {
      return;
    }


    if (
      targetId === socket.id
    ) {

      socket.emit(
        "pvpError",
        "自分自身とは戦えません。"
      );

      return;
    }


    if (player.pvp) {

      socket.emit(
        "pvpError",
        "すでにPvP中です。"
      );

      return;
    }


    const target =
      room.players.get(
        targetId
      );


    if (!target) {

      socket.emit(
        "pvpError",
        "相手が見つかりません。"
      );

      return;
    }


    if (target.pvp) {

      socket.emit(
        "pvpError",
        "そのプレイヤーは現在PvP中です。"
      );

      return;
    }


    if (target.pvpRequest) {

      socket.emit(
        "pvpError",
        "そのプレイヤーには別のPvP申請があります。"
      );

      return;
    }


    if (
      player.hp <= 0 ||
      target.hp <= 0
    ) {

      socket.emit(
        "pvpError",
        "HPが0のプレイヤーとは戦えません。"
      );

      return;
    }


    target.pvpRequest = {
      fromId: player.id,
      fromName: player.name
    };


    io.to(target.id).emit(
      "pvpRequest",
      {
        fromId: player.id,
        fromName: player.name
      }
    );


    socket.emit(
      "pvpChallengeSent",
      {
        targetId: target.id,
        targetName: target.name
      }
    );

  });


  // ======================================
  // PvP承認
  // ======================================

  socket.on("pvpAccept", fromId => {

    const result =
      getPlayer(socket);

    if (!result) {
      return;
    }

    const {
      roomId,
      room,
      player
    } = result;


    if (
      typeof fromId !== "string"
    ) {
      return;
    }


    const target =
      room.players.get(
        fromId
      );


    if (!target) {
      return;
    }


    if (
      !player.pvpRequest ||
      player.pvpRequest.fromId !== fromId
    ) {
      return;
    }


    if (
      player.pvp ||
      target.pvp
    ) {
      return;
    }


    if (
      player.hp <= 0 ||
      target.hp <= 0
    ) {
      return;
    }


    player.pvpRequest = null;


    target.pvpRequest = null;


    player.pvp = {
      opponentId: target.id,
      opponentName: target.name,
      turn: target.id,
      defending: false
    };


    target.pvp = {
      opponentId: player.id,
      opponentName: player.name,
      turn: target.id,
      defending: false
    };


    io.to(player.id).emit(
      "pvpStarted",
      {
        opponentId: target.id,
        opponentName: target.name,
        yourTurn: false
      }
    );


    io.to(target.id).emit(
      "pvpStarted",
      {
        opponentId: player.id,
        opponentName: player.name,
        yourTurn: true
      }
    );


    systemMessage(
      roomId,
      `${player.name} と ${target.name} のPvPが始まった！`
    );


    updateRoomPlayers(
      roomId
    );

  });


  // ======================================
  // PvP拒否
  // ======================================

  socket.on("pvpReject", fromId => {

    const result =
      getPlayer(socket);

    if (!result) {
      return;
    }

    const {
      room,
      player
    } = result;


    if (
      typeof fromId !== "string"
    ) {
      return;
    }


    const target =
      room.players.get(
        fromId
      );


    if (!target) {
      return;
    }


    if (
      !player.pvpRequest ||
      player.pvpRequest.fromId !== fromId
    ) {
      return;
    }


    player.pvpRequest = null;


    io.to(target.id).emit(
      "pvpRejectedByTarget",
      {
        targetName: player.name
      }
    );


    socket.emit(
      "pvpRejected",
      {
        targetName: target.name
      }
    );

  });


  // ======================================
  // PvP攻撃
  // ======================================

  socket.on("pvpAttack", () => {

    const result =
      getPlayer(socket);

    if (!result) {
      return;
    }

    const {
      roomId,
      room,
      player
    } = result;


    if (!player.pvp) {

      socket.emit(
        "pvpError",
        "PvP中ではありません。"
      );

      return;
    }


    if (
      player.pvp.turn !== player.id
    ) {

      socket.emit(
        "pvpError",
        "相手のターンです。"
      );

      return;
    }


    const target =
      getPvpOpponent(
        room,
        player
      );


    if (!target) {

      clearPvp(player);

      socket.emit(
        "pvpEnded",
        {
          reason:
            "相手がいなくなりました。"
        }
      );

      updateRoomPlayers(roomId);

      return;
    }


    let damage =
      5 + player.attack;


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
      damage *= 2;
    }


    if (
      target.pvp &&
      target.pvp.defending
    ) {

      damage =
        Math.floor(
          damage * 0.5
        );

      target.pvp.defending =
        false;
    }


    target.hp =
      Math.max(
        0,
        target.hp - damage
      );


    player.pvp.turn =
      target.id;

    target.pvp.turn =
      target.id;


    io.to(roomId).emit(
      "pvpAttackResult",
      {
        attackerId: player.id,
        attackerName: player.name,

        targetId: target.id,
        targetName: target.name,

        damage,
        critical,

        targetHp: target.hp,
        targetMaxHp: target.maxHp
      }
    );


    if (target.hp <= 0) {

      player.bounty += 100;

      player.money += 100;

      player.xp += 100;

      player.defeats += 1;


      clearPvp(player);
      clearPvp(target);


      io.to(roomId).emit(
        "pvpFinished",
        {
          winnerId: player.id,
          winnerName: player.name,

          loserId: target.id,
          loserName: target.name
        }
      );


      updateRoomPlayers(
        roomId
      );

      return;
    }


    io.to(roomId).emit(
      "pvpTurn",
      {
        turnId: target.id
      }
    );


    updateRoomPlayers(
      roomId
    );

  });


  // ======================================
  // PvP防御
  // ======================================

  socket.on("pvpDefend", () => {

    const result =
      getPlayer(socket);

    if (!result) {
      return;
    }

    const {
      roomId,
      room,
      player
    } = result;


    if (!player.pvp) {

      socket.emit(
        "pvpError",
        "PvP中ではありません。"
      );

      return;
    }


    if (
      player.pvp.turn !== player.id
    ) {

      socket.emit(
        "pvpError",
        "相手のターンです。"
      );

      return;
    }


    const target =
      getPvpOpponent(
        room,
        player
      );


    if (!target) {
      return;
    }


    player.pvp.defending =
      true;


    player.pvp.turn =
      target.id;

    target.pvp.turn =
      target.id;


    io.to(player.id).emit(
      "pvpDefended"
    );


    io.to(target.id).emit(
      "pvpOpponentDefended",
      {
        playerName:
          player.name
      }
    );


    io.to(roomId).emit(
      "pvpTurn",
      {
        turnId:
          target.id
      }
    );


    updateRoomPlayers(
      roomId
    );

  });


  // ======================================
  // PvPスキル
  // ======================================

  socket.on("pvpSkill", data => {

    const result =
      getPlayer(socket);

    if (!result) {
      return;
    }

    const {
      roomId,
      room,
      player
    } = result;


    if (!player.pvp) {

      socket.emit(
        "pvpError",
        "PvP中ではありません。"
      );

      return;
    }


    if (
      player.pvp.turn !== player.id
    ) {

      socket.emit(
        "pvpError",
        "相手のターンです。"
      );

      return;
    }


    const target =
      getPvpOpponent(
        room,
        player
      );


    if (!target) {
      return;
    }


    const skillName =
      typeof data?.skillName === "string"
        ? data.skillName
        : "斬撃";


    let damage = 35;


    if (
      skillName === "高速切り"
    ) {

      damage = 65;
    }


    if (
      target.pvp &&
      target.pvp.defending
    ) {

      damage =
        Math.floor(
          damage * 0.5
        );

      target.pvp.defending =
        false;
    }


    target.hp =
      Math.max(
        0,
        target.hp - damage
      );


    player.pvp.turn =
      target.id;

    target.pvp.turn =
      target.id;


    io.to(roomId).emit(
      "pvpSkillResult",
      {
        attackerId: player.id,
        attackerName: player.name,

        targetId: target.id,
        targetName: target.name,

        skillName,
        damage,

        targetHp: target.hp,
        targetMaxHp: target.maxHp
      }
    );


    if (target.hp <= 0) {

      player.bounty += 100;

      player.money += 100;

      player.xp += 100;

      player.defeats += 1;


      clearPvp(player);
      clearPvp(target);


      io.to(roomId).emit(
        "pvpFinished",
        {
          winnerId: player.id,
          winnerName: player.name,

          loserId: target.id,
          loserName: target.name
        }
      );


      updateRoomPlayers(
        roomId
      );

      return;
    }


    io.to(roomId).emit(
      "pvpTurn",
      {
        turnId:
          target.id
      }
    );


    updateRoomPlayers(
      roomId
    );

  });


  // ======================================
  // PvP逃走
  // ======================================

  socket.on("pvpRun", () => {

    const result =
      getPlayer(socket);

    if (!result) {
      return;
    }

    const {
      roomId,
      room,
      player
    } = result;


    if (!player.pvp) {
      return;
    }


    const target =
      getPvpOpponent(
        room,
        player
      );


    clearPvp(player);


    if (target) {

      clearPvp(target);


      io.to(roomId).emit(
        "pvpFinished",
        {
          winnerId:
            target.id,

          winnerName:
            target.name,

          loserId:
            player.id,

          loserName:
            player.name,

          reason:
            `${player.name} が逃げた！`
        }
      );
    }


    updateRoomPlayers(
      roomId
    );

  });


  // ======================================
  // 公開チャット
  // ======================================

  socket.on("chat", message => {

    const roomId =
      socket.data.roomId;


    if (!roomId) {

      socket.emit(
        "roomError",
        "先にルームへ参加してください。"
      );

      return;
    }


    if (
      typeof message !== "string"
    ) {
      return;
    }


    const text =
      message
        .trim()
        .substring(0, 200);


    if (!text) {
      return;
    }


    io.to(roomId).emit(
      "publicMessage",
      {
        name:
          socket.data.name ||
          "勇者",

        message:
          text
      }
    );

  });


  // ======================================
  // オンライン戦闘ログ
  // ======================================

  socket.on("battleLog", message => {

    const roomId =
      socket.data.roomId;


    if (!roomId) {
      return;
    }


    if (
      typeof message !== "string"
    ) {
      return;
    }


    const text =
      message
        .trim()
        .substring(0, 200);


    if (!text) {
      return;
    }


    io.to(roomId).emit(
      "onlineBattleLog",
      {
        name:
          socket.data.name ||
          "勇者",

        message:
          text
      }
    );

  });


  // ======================================
  // ルーム退出
  // ======================================

  socket.on("leaveRoom", () => {

    leaveRoom(socket);

  });


  // ======================================
  // 切断
  // ======================================

  socket.on("disconnect", reason => {

    console.log(
      "プレイヤー切断:",
      socket.id,
      "理由:",
      reason
    );

    leaveRoom(socket);

  });

});


// ========================================
// トップページ
// ========================================

app.get("/", (req, res) => {

  res.sendFile(
    path.join(
      __dirname,
      "public",
      "index.html"
    )
  );

});


// ========================================
// 起動
// ========================================

server.listen(
  PORT,
  () => {

    console.log(
      "================================"
    );

    console.log(
      "勇者の懸賞金RPG ONLINE"
    );

    console.log(
      "Socket.IO ONLINE"
    );

    console.log(
      `PORT: ${PORT}`
    );

    console.log(
      "================================"
    );

  }
);
