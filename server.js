const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;


/* =========================================================
   静的ファイル
========================================================= */

app.use(
  express.static(
    path.join(__dirname, "public")
  )
);


/* =========================================================
   ルート
========================================================= */

app.get("/", (req, res) => {

  res.sendFile(
    path.join(
      __dirname,
      "public",
      "index.html"
    )
  );
});


/* =========================================================
   ルーム
========================================================= */

const rooms = new Map();


/* =========================================================
   ルームコード作成
========================================================= */

function createRoomId() {

  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

  let id = "";

  do {

    id = "";

    for (
      let i = 0;
      i < 5;
      i++
    ) {

      id +=
        chars[
          Math.floor(
            Math.random() *
            chars.length
          )
        ];
    }

  } while (
    rooms.has(id)
  );

  return id;
}


/* =========================================================
   プレイヤー初期データ
========================================================= */

function createPlayer(
  socket,
  name
) {

  return {

    id:
      socket.id,

    name:
      name ||
      "勇者",

    job:
      "勇者",

    hp:
      100,

    maxHp:
      100,

    level:
      1,

    attack:
      10,

    xp:
      0,

    money:
      100,

    bounty:
      0,

    weapon:
      "木の剣",

    area:
      "村",

    defeats:
      0,

    skillCount:
      1,

    pvp: null,

    pvpRequest: null
  };
}


/* =========================================================
   公開用プレイヤーデータ
========================================================= */

function publicPlayer(player) {

  return {

    id:
      player.id,

    name:
      player.name,

    job:
      player.job,

    hp:
      player.hp,

    maxHp:
      player.maxHp,

    level:
      player.level,

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
      player.skillCount,

    pvp:
      player.pvp
        ? {
            opponentId:
              player.pvp.opponentId,

            opponentName:
              player.pvp.opponentName,

            turn:
              player.pvp.turn,

            defending:
              player.pvp.defending
          }
        : null
  };
}


/* =========================================================
   ルームプレイヤー一覧
========================================================= */

function getRoomPlayers(room) {

  return Array.from(
    room.players.values()
  ).map(
    publicPlayer
  );
}


/* =========================================================
   プレイヤー一覧更新
========================================================= */

function updateRoomPlayers(roomId) {

  const room =
    rooms.get(roomId);

  if (!room) {
    return;
  }

  io.to(roomId).emit(
    "roomPlayersUpdate",
    getRoomPlayers(room)
  );
}


/* =========================================================
   システムメッセージ
========================================================= */

function systemMessage(
  roomId,
  message
) {

  io.to(roomId).emit(
    "publicMessage",
    {
      name:
        "システム",

      message
    }
  );
}


/* =========================================================
   Socketプレイヤー取得
========================================================= */

function getPlayer(socket) {

  if (!socket.roomId) {
    return null;
  }

  const room =
    rooms.get(
      socket.roomId
    );

  if (!room) {
    return null;
  }

  return room.players.get(
    socket.id
  ) || null;
}


/* =========================================================
   PvP相手取得
========================================================= */

function getPvpOpponent(
  player
) {

  if (
    !player ||
    !player.pvp ||
    !player.pvp.opponentId
  ) {
    return null;
  }

  return player.pvp.opponentId;
}


/* =========================================================
   PvP解除
========================================================= */

function clearPvp(
  player
) {

  if (!player) {
    return;
  }

  player.pvp = null;
  player.pvpRequest = null;
}


/* =========================================================
   接続
========================================================= */

io.on(
  "connection",
  socket => {

    console.log(
      "🟢 接続:",
      socket.id
    );


    /* -----------------------------------------
       接続確認
    ----------------------------------------- */

    socket.emit(
      "onlineReady"
    );


    /* -----------------------------------------
       ping
    ----------------------------------------- */

    socket.on(
      "pingServer",
      () => {

        socket.emit(
          "pongServer"
        );
      }
    );


    /* =====================================================
       ルーム作成
    ===================================================== */

    socket.on(
      "createRoom",
      data => {

        const name =
          data &&
          typeof data.name === "string"
            ? data.name.trim()
            : "勇者";

        const roomId =
          createRoomId();

        const player =
          createPlayer(
            socket,
            name
          );

        const room = {

          id:
            roomId,

          players:
            new Map(),

          createdAt:
            Date.now()
        };

        room.players.set(
          socket.id,
          player
        );

        rooms.set(
          roomId,
          room
        );

        socket.join(
          roomId
        );

        socket.roomId =
          roomId;


        console.log(
          `🏠 ルーム作成: ${roomId} / ${name}`
        );


        socket.emit(
          "roomCreated",
          {
            roomId,

            player:
              publicPlayer(
                player
              ),

            players:
              getRoomPlayers(
                room
              )
          }
        );


        updateRoomPlayers(
          roomId
        );


        systemMessage(
          roomId,
          `${name}がルームを作成しました！`
        );
      }
    );


    /* =====================================================
       ルーム参加
    ===================================================== */

    socket.on(
      "joinRoom",
      data => {

        const roomId =
          data &&
          typeof data.roomId === "string"
            ? data.roomId
                .trim()
                .toUpperCase()
            : "";

        const name =
          data &&
          typeof data.name === "string"
            ? data.name.trim()
            : "勇者";


        if (!roomId) {

          socket.emit(
            "roomError",
            "ルームコードがありません。"
          );

          return;
        }


        const room =
          rooms.get(
            roomId
          );


        if (!room) {

          socket.emit(
            "roomError",
            "そのルームは存在しません。"
          );

          return;
        }


        if (
          room.players.size >= 20
        ) {

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

        socket.join(
          roomId
        );

        socket.roomId =
          roomId;


        console.log(
          `🚪 ルーム参加: ${roomId} / ${name}`
        );


        socket.emit(
          "roomJoined",
          {
            roomId,

            player:
              publicPlayer(
                player
              ),

            players:
              getRoomPlayers(
                room
              )
          }
        );


        updateRoomPlayers(
          roomId
        );


        systemMessage(
          roomId,
          `${name}が参加しました！`
        );
      }
    );


    /* =====================================================
       プレイヤー同期
    ===================================================== */

    socket.on(
      "playerUpdate",
      data => {

        const player =
          getPlayer(socket);

        if (!player) {
          return;
        }

        if (
          data &&
          typeof data.name === "string"
        ) {
          player.name =
            data.name;
        }

        if (
          data &&
          typeof data.job === "string"
        ) {
          player.job =
            data.job;
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
          const field
          of numberFields
        ) {

          if (
            data &&
            Number.isFinite(
              data[field]
            )
          ) {

            player[field] =
              data[field];
          }
        }


        if (
          data &&
          typeof data.weapon === "string"
        ) {
          player.weapon =
            data.weapon;
        }

        if (
          data &&
          typeof data.area === "string"
        ) {
          player.area =
            data.area;
        }


        updateRoomPlayers(
          socket.roomId
        );
      }
    );


    /* =====================================================
       PvP申請
    ===================================================== */

    socket.on(
      "pvpChallenge",
      targetId => {

        const player =
          getPlayer(socket);

        if (!player) {
          return;
        }


        if (
          typeof targetId !== "string"
        ) {
          return;
        }


        const room =
          rooms.get(
            socket.roomId
          );

        if (!room) {
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


        if (
          target.id ===
          player.id
        ) {

          socket.emit(
            "pvpError",
            "自分とは戦えません。"
          );

          return;
        }


        if (
          player.pvp ||
          target.pvp
        ) {

          socket.emit(
            "pvpError",
            "どちらかがすでにPvP中です。"
          );

          return;
        }


        target.pvpRequest = {
          fromId:
            player.id,

          fromName:
            player.name
        };


        io.to(
          target.id
        ).emit(
          "pvpRequest",
          {
            fromId:
              player.id,

            fromName:
              player.name
          }
        );


        socket.emit(
          "pvpChallengeSent",
          {
            targetId:
              target.id,

            targetName:
              target.name
          }
        );
      }
    );


    /* =====================================================
       PvP承認
    ===================================================== */

    socket.on(
      "pvpAccept",
      fromId => {

        const player =
          getPlayer(socket);

        if (!player) {
          return;
        }


        const room =
          rooms.get(
            socket.roomId
          );

        if (!room) {
          return;
        }


        const opponent =
          room.players.get(
            fromId
          );

        if (!opponent) {
          return;
        }


        if (
          player.pvp ||
          opponent.pvp
        ) {

          socket.emit(
            "pvpError",
            "すでにPvP中です。"
          );

          return;
        }


        player.pvp = {

          opponentId:
            opponent.id,

          opponentName:
            opponent.name,

          turn:
            player.id,

          defending:
            false
        };


        opponent.pvp = {

          opponentId:
            player.id,

          opponentName:
            player.name,

          turn:
            player.id,

          defending:
            false
        };


        player.pvpRequest =
          null;

        opponent.pvpRequest =
          null;


        io.to(
          player.id
        ).emit(
          "pvpStarted",
          {
            opponentId:
              opponent.id,

            opponentName:
              opponent.name,

            yourTurn:
              player.pvp.turn ===
              player.id
          }
        );


        io.to(
          opponent.id
        ).emit(
          "pvpStarted",
          {
            opponentId:
              player.id,

            opponentName:
              player.name,

            yourTurn:
              opponent.pvp.turn ===
              opponent.id
          }
        );
      }
    );


    /* =====================================================
       PvP拒否
    ===================================================== */

    socket.on(
      "pvpReject",
      fromId => {

        const player =
          getPlayer(socket);

        if (!player) {
          return;
        }


        const room =
          rooms.get(
            socket.roomId
          );

        if (!room) {
          return;
        }


        const opponent =
          room.players.get(
            fromId
          );

        if (!opponent) {
          return;
        }


        player.pvpRequest =
          null;


        io.to(
          opponent.id
        ).emit(
          "pvpRejectedByTarget",
          {
            targetName:
              player.name
          }
        );
      }
    );


    /* =====================================================
       PvP攻撃
    ===================================================== */

    socket.on(
      "pvpAttack",
      () => {

        const player =
          getPlayer(socket);

        if (
          !player ||
          !player.pvp
        ) {
          return;
        }


        const room =
          rooms.get(
            socket.roomId
          );

        if (!room) {
          return;
        }


        const opponent =
          room.players.get(
            player.pvp.opponentId
          );

        if (!opponent) {
          return;
        }


        if (
          player.pvp.turn !==
          player.id
        ) {

          socket.emit(
            "pvpError",
            "あなたのターンではありません。"
          );

          return;
        }


        let damage =
          player.attack +
          Math.floor(
            Math.random() * 6
          );


        if (
          opponent.pvp &&
          opponent.pvp.defending
        ) {

          damage =
            Math.max(
              1,
              Math.floor(
                damage / 2
              )
            );

          opponent.pvp.defending =
            false;
        }


        opponent.hp =
          Math.max(
            0,
            opponent.hp -
            damage
          );


        io.to(
          player.id
        ).emit(
          "pvpAttackResult",
          {
            attackerId:
              player.id,

            attackerName:
              player.name,

            targetId:
              opponent.id,

            targetName:
              opponent.name,

            damage,

            targetHp:
              opponent.hp,

            targetMaxHp:
              opponent.maxHp
          }
        );


        io.to(
          opponent.id
        ).emit(
          "pvpAttackResult",
          {
            attackerId:
              player.id,

            attackerName:
              player.name,

            targetId:
              opponent.id,

            targetName:
              opponent.name,

            damage,

            targetHp:
              opponent.hp,

            targetMaxHp:
              opponent.maxHp
          }
        );


        if (
          opponent.hp <= 0
        ) {

          finishPvP(
            room,
            player,
            opponent
          );

          return;
        }


        player.pvp.turn =
          opponent.id;

        opponent.pvp.turn =
          opponent.id;


        io.to(
          room.id
        ).emit(
          "pvpTurn",
          {
            turnId:
              opponent.id
          }
        );
      }
    );


    /* =====================================================
       PvP防御
    ===================================================== */

    socket.on(
      "pvpDefend",
      () => {

        const player =
          getPlayer(socket);

        if (
          !player ||
          !player.pvp
        ) {
          return;
        }


        const room =
          rooms.get(
            socket.roomId
          );

        if (!room) {
          return;
        }


        const opponent =
          room.players.get(
            player.pvp.opponentId
          );

        if (!opponent) {
          return;
        }


        if (
          player.pvp.turn !==
          player.id
        ) {

          socket.emit(
            "pvpError",
            "あなたのターンではありません。"
          );

          return;
        }


        player.pvp.defending =
          true;


        socket.emit(
          "pvpDefended"
        );


        io.to(
          opponent.id
        ).emit(
          "pvpOpponentDefended",
          {
            playerName:
              player.name
          }
        );


        player.pvp.turn =
          opponent.id;

        opponent.pvp.turn =
          opponent.id;


        io.to(
          room.id
        ).emit(
          "pvpTurn",
          {
            turnId:
              opponent.id
          }
        );
      }
    );


    /* =====================================================
       PvPスキル
    ===================================================== */

    socket.on(
      "pvpSkill",
      data => {

        const player =
          getPlayer(socket);

        if (
          !player ||
          !player.pvp
        ) {
          return;
        }


        const room =
          rooms.get(
            socket.roomId
          );

        if (!room) {
          return;
        }


        const opponent =
          room.players.get(
            player.pvp.opponentId
          );

        if (!opponent) {
          return;
        }


        if (
          player.pvp.turn !==
          player.id
        ) {

          socket.emit(
            "pvpError",
            "あなたのターンではありません。"
          );

          return;
        }


        const skillName =
          data &&
          typeof data.skillName === "string"
            ? data.skillName
            : "斬撃";


        let multiplier =
          1.8;


        if (
          skillName ===
          "高速切り"
        ) {

          multiplier =
            2.4;
        }


        let damage =
          Math.floor(
            player.attack *
            multiplier
          ) +
          Math.floor(
            Math.random() * 10
          );


        if (
          opponent.pvp &&
          opponent.pvp.defending
        ) {

          damage =
            Math.max(
              1,
              Math.floor(
                damage / 2
              )
            );

          opponent.pvp.defending =
            false;
        }


        opponent.hp =
          Math.max(
            0,
            opponent.hp -
            damage
          );


        io.to(
          room.id
        ).emit(
          "pvpSkillResult",
          {
            attackerId:
              player.id,

            attackerName:
              player.name,

            targetId:
              opponent.id,

            targetName:
              opponent.name,

            skillName,

            damage,

            targetHp:
              opponent.hp,

            targetMaxHp:
              opponent.maxHp
          }
        );


        if (
          opponent.hp <= 0
        ) {

          finishPvP(
            room,
            player,
            opponent
          );

          return;
        }


        player.pvp.turn =
          opponent.id;

        opponent.pvp.turn =
          opponent.id;


        io.to(
          room.id
        ).emit(
          "pvpTurn",
          {
            turnId:
              opponent.id
          }
        );
      }
    );


    /* =====================================================
       PvP逃走
    ===================================================== */

    socket.on(
      "pvpRun",
      () => {

        const player =
          getPlayer(socket);

        if (
          !player ||
          !player.pvp
        ) {
          return;
        }


        const room =
          rooms.get(
            socket.roomId
          );

        if (!room) {
          return;
        }


        const opponent =
          room.players.get(
            player.pvp.opponentId
          );

        if (!opponent) {
          clearPvp(
            player
          );

          return;
        }


        io.to(
          room.id
        ).emit(
          "pvpFinished",
          {
            winnerId:
              opponent.id,

            winnerName:
              opponent.name,

            loserId:
              player.id,

            loserName:
              player.name
          }
        );


        clearPvp(
          player
        );

        clearPvp(
          opponent
        );


        updateRoomPlayers(
          room.id
        );
      }
    );


    /* =====================================================
       公開チャット
    ===================================================== */

    socket.on(
      "chat",
      message => {

        const player =
          getPlayer(socket);

        if (!player) {
          return;
        }


        if (
          typeof message !==
          "string"
        ) {
          return;
        }


        const text =
          message.trim();


        if (!text) {
          return;
        }


        if (
          text.length > 300
        ) {
          return;
        }


        io.to(
          socket.roomId
        ).emit(
          "publicMessage",
          {
            name:
              player.name,

            message:
              text
          }
        );
      }
    );


    /* =====================================================
       戦闘ログ
    ===================================================== */

    socket.on(
      "battleLog",
      message => {

        const player =
          getPlayer(socket);

        if (!player) {
          return;
        }


        if (
          typeof message !==
          "string"
        ) {
          return;
        }


        io.to(
          socket.roomId
        ).emit(
          "onlineBattleLog",
          {
            name:
              player.name,

            message:
              message.slice(
                0,
                300
              )
          }
        );
      }
    );


    /* =====================================================
       ルーム退出
    ===================================================== */

    socket.on(
      "leaveRoom",
      () => {

        leaveRoom(
          socket
        );
      }
    );


    /* =====================================================
       切断
    ===================================================== */

    socket.on(
      "disconnect",
      () => {

        console.log(
          "🔴 切断:",
          socket.id
        );

        leaveRoom(
          socket
        );
      }
    );
  }
);


/* =========================================================
   PvP終了
========================================================= */

function finishPvP(
  room,
  winner,
  loser
) {

  winner.money += 50;

  winner.bounty +=
    Math.max(
      0,
      loser.bounty
    );


  io.to(
    room.id
  ).emit(
    "pvpFinished",
    {
      winnerId:
        winner.id,

      winnerName:
        winner.name,

      loserId:
        loser.id,

      loserName:
        loser.name
    }
  );


  loser.hp =
    Math.max(
      1,
      Math.floor(
        loser.maxHp * 0.3
      )
    );


  clearPvp(
    winner
  );

  clearPvp(
    loser
  );


  updateRoomPlayers(
    room.id
  );
}


/* =========================================================
   ルーム退出処理
========================================================= */

function leaveRoom(
  socket
) {

  const roomId =
    socket.roomId;

  if (!roomId) {
    return;
  }


  const room =
    rooms.get(
      roomId
    );

  if (!room) {

    socket.roomId =
      null;

    return;
  }


  const player =
    room.players.get(
      socket.id
    );


  if (player) {

    const opponentId =
      getPvpOpponent(
        player
      );


    if (opponentId) {

      const opponent =
        room.players.get(
          opponentId
        );

      if (opponent) {

        clearPvp(
          opponent
        );

        io.to(
          opponent.id
        ).emit(
          "pvpEnded",
          {
            reason:
              `${player.name}が退出しました。`
          }
        );
      }
    }


    room.players.delete(
      socket.id
    );


    systemMessage(
      roomId,
      `${player.name}がルームから退出しました。`
    );
  }


  socket.leave(
    roomId
  );

  socket.roomId =
    null;


  if (
    room.players.size === 0
  ) {

    rooms.delete(
      roomId
    );

    console.log(
      `🗑️ ルーム削除: ${roomId}`
    );

  } else {

    updateRoomPlayers(
      roomId
    );
  }


  socket.emit(
    "leftRoom"
  );
}


/* =========================================================
   サーバー起動
========================================================= */

server.listen(
  PORT,
  () => {

    console.log(
      "================================="
    );

    console.log(
      "⚔️ 勇者の懸賞金RPG ONLINE"
    );

    console.log(
      `🌐 PORT: ${PORT}`
    );

    console.log(
      "🟢 Socket.IO ONLINE"
    );

    console.log(
      "================================="
    );
  }
);
