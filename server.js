const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "public")));


// ========================================
// ルーム管理
// ========================================

const rooms = new Map();


// ========================================
// ルームID生成
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
// プレイヤー情報
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

    defeats: player.defeats
  };
}


// ========================================
// ルーム内プレイヤー一覧
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
// プレイヤー一覧送信
// ========================================

function updateRoomPlayers(roomId) {

  const players = getRoomPlayers(roomId);

  io.to(roomId).emit(
    "roomPlayersUpdate",
    players
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

  socket.emit(
    "leftRoom"
  );

  socket.data.roomId = null;
}


// ========================================
// Socket.IO
// ========================================

io.on("connection", socket => {

  console.log(
    "接続:",
    socket.id
  );


  // ======================================
  // 接続成功
  // ======================================

  socket.emit(
    "onlineReady"
  );


  // ======================================
  // ルーム作成
  // ======================================

  socket.on("createRoom", data => {

    // すでにルームにいる場合
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


    name =
      name.substring(0, 16);


    const roomId =
      createRoomId();


    const room = {

      id: roomId,

      players: new Map(),

      createdAt: Date.now()

    };


    const player = {

      id: socket.id,

      name,

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

      defeats: 0

    };


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
        players:
          getRoomPlayers(roomId)
      }
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


    let roomId =
      typeof data?.roomId === "string"
        ? data.roomId.trim().toUpperCase()
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


    // 最大20人
    if (room.players.size >= 20) {

      socket.emit(
        "roomError",
        "ルームが満員です。"
      );

      return;
    }


    const player = {

      id: socket.id,

      name,

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

      defeats: 0

    };


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
  // 自分のゲーム情報更新
  // ======================================

  socket.on("playerUpdate", data => {

    const roomId =
      socket.data.roomId;


    if (!roomId) {
      return;
    }


    const room =
      rooms.get(roomId);


    if (!room) {
      return;
    }


    const player =
      room.players.get(socket.id);


    if (!player) {
      return;
    }


    if (
      typeof data?.name === "string"
    ) {

      player.name =
        data.name
          .trim()
          .substring(0, 16);

      socket.data.name =
        player.name;

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

      "defeats"

    ];


    for (
      const field
      of numberFields
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
      message.trim();


    if (!text) {
      return;
    }


    // 最大200文字
    const safeText =
      text.substring(0, 200);


    io.to(roomId).emit(
      "publicMessage",
      {
        name:
          socket.data.name ||
          "勇者",

        message:
          safeText
      }
    );

  });


  // ======================================
  // 戦闘ログ共有
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
      message.trim()
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

  socket.on(
    "leaveRoom",
    () => {

      leaveRoom(socket);

    }
  );


  // ======================================
  // 切断
  // ======================================

  socket.on(
    "disconnect",
    () => {

      console.log(
        "切断:",
        socket.id
      );

      leaveRoom(socket);

    }
  );

});


// ========================================
// メインページ
// ========================================

app.get(
  "/",
  (req, res) => {

    res.sendFile(
      path.join(
        __dirname,
        "public",
        "index.html"
      )
    );

  }
);


// ========================================
// サーバー起動
// ========================================

server.listen(
  PORT,
  () => {

    console.log(
      `勇者の懸賞金RPG ONLINE`
    );

    console.log(
      `PORT: ${PORT}`
    );

  }
);
