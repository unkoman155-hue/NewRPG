const socket = io();

const SAVE_KEY = "yuusha_bounty_rpg_online_final";

const BOSS = {
  name: "懸賞金王",
  hp: 500,
  attack: 45,
  xp: 1000,
  money: 1000
};

const SKILLS = {
  "斬撃": 35,
  "高速切り": 65
};

const JOBS = {
  "勇者": {
    hp: 30,
    attack: 0,
    skill: "斬撃"
  },

  "ヒーラー": {
    hp: 35,
    attack: 0,
    skill: "ヒール"
  },

  "剣士": {
    hp: 30,
    attack: 0,
    skill: "斬撃"
  }
};

const MONSTERS = [
  {
    name: "怪物猫",
    hp: 20,
    attack: 5,
    xp: 25,
    money: 20,
    min: 1,
    max: 5,
    area: "草原"
  },

  {
    name: "スライム",
    hp: 60,
    attack: 7,
    xp: 30,
    money: 25,
    min: 1,
    max: 6,
    area: "草原"
  },

  {
    name: "ゴブリン",
    hp: 80,
    attack: 10,
    xp: 45,
    money: 40,
    min: 2,
    max: 8,
    area: "草原"
  },

  {
    name: "オオカミ",
    hp: 100,
    attack: 13,
    xp: 60,
    money: 55,
    min: 3,
    max: 10,
    area: "草原"
  },

  {
    name: "スケルトン",
    hp: 120,
    attack: 15,
    xp: 75,
    money: 70,
    min: 4,
    max: 12,
    area: "遺跡"
  },

  {
    name: "オーク",
    hp: 150,
    attack: 18,
    xp: 100,
    money: 90,
    min: 6,
    max: 15,
    area: "山道"
  },

  {
    name: "ゴブリンキング",
    hp: 230,
    attack: 24,
    xp: 200,
    money: 220,
    min: 7,
    max: 20,
    area: "山道"
  },

  {
    name: "ミノタウロス",
    hp: 280,
    attack: 30,
    xp: 260,
    money: 300,
    min: 8,
    max: 25,
    area: "遺跡"
  },

  {
    name: "闇の騎士",
    hp: 180,
    attack: 20,
    xp: 130,
    money: 120,
    min: 7,
    max: 20,
    area: "都市周辺"
  },

  {
    name: "吸血鬼",
    hp: 220,
    attack: 25,
    xp: 180,
    money: 180,
    min: 10,
    max: 25,
    area: "都市周辺"
  },

  {
    name: "魔法使い",
    hp: 250,
    attack: 30,
    xp: 220,
    money: 230,
    min: 12,
    max: 30,
    area: "魔境"
  },

  {
    name: "デーモン",
    hp: 350,
    attack: 38,
    xp: 400,
    money: 500,
    min: 15,
    max: 40,
    area: "魔境"
  },

  {
    name: "ドラゴン",
    hp: 300,
    attack: 35,
    xp: 350,
    money: 400,
    min: 15,
    max: 35,
    area: "魔境"
  },

  {
    name: "古代竜",
    hp: 450,
    attack: 48,
    xp: 650,
    money: 800,
    min: 18,
    max: 45,
    area: "魔王城"
  },

  {
    name: "魔王",
    hp: 400,
    attack: 40,
    xp: 500,
    money: 600,
    min: 20,
    max: 50,
    area: "魔王城"
  }
];

let player = {
  name: "勇
