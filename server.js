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

const rooms = new Map();

function makeRoomId() {
  let id;

  do {
    id = Math.random()
      .toString(36)
      .substring(2, 7)
      .toUpperCase();
  } while (rooms.has(id));

  return id;
}

function getPlayers(roomId) {
  const room = rooms.get(roomId);

  if (!room) return [];

  return [...room.players.values()].map(player => ({
    id: player.id,
    name: player.name,
    hp: player.hp,
    maxHp: player.maxHp,
    level: player.level,
    bounty: player.bounty,
    money: player.money,
    job: player.job,
    area: player.area
  }));
}

function broadcastPlayers(roomId) {
  io.to(roomId).emit(
    "playersUpdate",
    getPlayers(roomId)
  );
}

function leaveRoom(socket) {

  const roomId =
    socket.data.roomId;

  if (!roomId) return;

  const room =
    rooms.get(roomId);

  if (!room) {
    socket.data.roomId = null;
    return;
  }

  const player =
    room.players.get(socket.id);

  room.players.delete(socket.id);

  socket.leave(roomId);

  if (player) {

    io.to(roomId).emit(
      "publicMessage",
      {
        name: "システム",
        message:
          `${player.name} が退出しました。`
      }
    );
  }

  if (room.players.size === 0) {

    rooms.delete(roomId);

  } else {

    broadcastPlayers(roomId);
  }

  socket.data.roomId = null;
}


/* =========================
   接続
========================= */

io.on("connection", socket => {

  console.log(
    "接続:",
    socket.id
  );


  /* =========================
     ルーム作成
  ========================= */

  socket.on(
    "createRoom",
    data => {

      const name =
        typeof data?.name === "string" &&
        data.name.trim()
          ? data.name.trim().slice(0, 16)
          : "勇者";

      const roomId =
        makeRoomId();

      const room = {
        players: new Map()
      };

      rooms.set(
        roomId,
        room
      );

      const player = {

        id: socket.id,

        name,

        hp: 30,
        maxHp: 30,

        level: 0,

        bounty: 0,

        money: 250,

        job: "勇者",

        area: "草原"
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
        "roomCreated",
        {
          roomId,
          players:
            getPlayers(roomId)
        }
      );

      broadcastPlayers(roomId);

      console.log(
        `${name} が ${roomId} を作成`
      );
    }
  );


  /* =========================
     ルーム参加
  ========================= */

  socket.on(
    "joinRoom",
    data => {

      const roomId =
        typeof data?.roomId === "string"
          ? data.roomId
              .trim()
              .toUpperCase()
          : "";

      const name =
        typeof data?.name === "string" &&
        data.name.trim()
          ? data.name.trim().slice(0, 16)
          : "勇者";


      if (!roomId) {

        socket.emit(
          "roomError",
          "ルームIDを入力してください。"
        );

        return;
      }


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


      const player = {

        id: socket.id,

        name,

        hp: 30,
        maxHp: 30,

        level: 0,

        bounty: 0,

        money: 250,

        job: "勇者",

        area: "草原"
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
            getPlayers(roomId)
        }
      );


      socket.to(roomId).emit(
        "publicMessage",
        {
          name: "システム",
          message:
            `${name} が参加しました。`
        }
      );


      broadcastPlayers(roomId);

      console.log(
        `${name} が ${roomId} に参加`
      );
    }
  );


  /* =========================
     プレイヤー情報同期
  ========================= */

  socket.on(
    "playerUpdate",
    data => {

      const roomId =
        socket.data.roomId;

      if (!roomId) return;

      const room =
        rooms.get(roomId);

      if (!room) return;

      const player =
        room.players.get(socket.id);

      if (!player) return;


      if (
        typeof data?.name ===
        "string"
      ) {

        player.name =
          data.name
            .trim()
            .slice(0, 16);

        socket.data.name =
          player.name;
      }


      if (
        Number.isFinite(data?.hp)
      ) {

        player.hp =
          Math.max(
            0,
            Math.floor(data.hp)
          );
      }


      if (
        Number.isFinite(data?.maxHp)
      ) {

        player.maxHp =
          Math.max(
            1,
            Math.floor(data.maxHp)
          );
      }


      if (
        Number.isFinite(data?.level)
      ) {

        player.level =
          Math.max(
            0,
            Math.floor(data.level)
          );
      }


      if (
        Number.isFinite(data?.bounty)
      ) {

        player.bounty =
          Math.max(
            0,
            Math.floor(data.bounty)
          );
      }


      if (
        Number.isFinite(data?.money)
      ) {

        player.money =
          Math.max(
            0,
            Math.floor(data.money)
          );
      }


      if (
        typeof data?.job ===
        "string"
      ) {

        player.job =
          data.job
            .trim()
            .slice(0, 20);
      }


      if (
        typeof data?.area ===
        "string"
      ) {

        player.area =
          data.area
            .trim()
            .slice(0, 20);
      }


      broadcastPlayers(roomId);
    }
  );


  /* =========================
     戦闘ログ同期
  ========================= */

  socket.on(
    "battleLog",
    message => {

      const roomId =
        socket.data.roomId;

      if (!roomId) return;

      if (
        typeof message !==
        "string"
      ) {
        return;
      }


      const text =
        message
          .trim()
          .slice(0, 200);


      if (!text) return;


      io.to(roomId).emit(
        "onlineBattleLog",
        {
          name:
            socket.data.name ||
            "勇者",

          message: text
        }
      );
    }
  );


  /* =========================
     公開チャット
  ========================= */

  socket.on(
    "chat",
    message => {

      const roomId =
        socket.data.roomId;

      if (!roomId) return;

      if (
        typeof message !==
        "string"
      ) {
        return;
      }


      const text =
        message
          .trim()
          .slice(0, 200);


      if (!text) return;


      io.to(roomId).emit(
        "publicMessage",
        {
          name:
            socket.data.name ||
            "勇者",

          message: text
        }
      );
    }
  );


  /* =========================
     退出
  ========================= */

  socket.on(
    "leaveRoom",
    () => {

      leaveRoom(socket);
    }
  );


  /* =========================
     切断
  ========================= */

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


/* =========================
   トップページ
========================= */

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


/* =========================
   起動
========================= */

server.listen(
  PORT,
  () => {

    console.log(
      `勇者の懸賞金RPG ONLINE SERVER : ${PORT}`
    );

  }
);
