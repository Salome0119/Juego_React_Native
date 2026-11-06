import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { COW_HEIGHT, COW_WIDTH, Cow } from '../components/atoms/Cow';
import { Enemy, BOSS_ASPECT_RATIO, ENEMY_ASPECT_RATIO, PIRANHA_ASPECT_RATIO, getEnemySpriteSize } from '../components/atoms/Enemy';
import { CurrentScore } from '../components/molecules/CurrentScore';
import { TouchControls } from '../components/molecules/TouchControls';
import { GameOverModal } from '../components/organisms/GameOverModal';
import { COLORS, SCREEN_HEIGHT, SCREEN_WIDTH } from '../constants/theme';

const FALLBACK_SCREEN_WIDTH = 360;
const FALLBACK_SCREEN_HEIGHT = 640;

const PLAYER_START_X = 50;
const GROUND_HEIGHT = 100;
const MOVE_SPEED = 265;
const AIR_MOVE_SPEED = 305;
const GRAVITY = 1900;
const JUMP_SPEED = 720;
const MAX_FALL_SPEED = 950;
const APEX_VELOCITY_THRESHOLD = 140;
const APEX_GRAVITY_FACTOR = 0.55;
const MAX_JUMPS = 2;
const CAMERA_OFFSET_X = SCREEN_WIDTH * 0.32;
const INITIAL_NEXT_OBSTACLE_X = 1380;
const OBSTACLE_GAP_MIN = 380;
const OBSTACLE_GAP_MAX = 520;
const SPAWN_GAP = 200;
const GENERATION_AHEAD = 760;
const CRATE_MIN_WIDTH = 110;
const CRATE_MAX_WIDTH = 170;
const CRATE_MIN_HEIGHT = 70;
const CRATE_MAX_HEIGHT = 100;
const SPIKE_MIN_WIDTH = 115;
const SPIKE_MAX_WIDTH = 150;
const SPIKE_HEIGHT = 60;
const ENEMY_WIDTH = 78;
const ENEMY_HEIGHT = 78;
const BOSS_WIDTH = 135;
const BOSS_HEIGHT = 135;
const ENEMY_SPEED = 62;
const ENEMY_PATROL_RANGE = 160;
const ENEMY_ALERT_DISTANCE = 200;
const ENEMY_ANGRY_ASPECT_RATIO = 500 / 500;
const FLOATING_MIN_WIDTH = 40;
const FLOATING_MAX_WIDTH = 80;
const FLOATING_MIN_HEIGHT = 20;
const FLOATING_MAX_HEIGHT = 40;
const FLOATING_MIN_SPEED = 30;
const FLOATING_MAX_SPEED = 70;
const FLOATING_RANGE_MIN = 100;
const FLOATING_RANGE_MAX = 200;
const DESTRUCTIBLE_MIN_WIDTH = 50;
const DESTRUCTIBLE_MAX_WIDTH = 90;
const DESTRUCTIBLE_MIN_HEIGHT = 30;
const DESTRUCTIBLE_MAX_HEIGHT = 60;
const MOVING_MIN_WIDTH = 60;
const MOVING_MAX_WIDTH = 100;
const MOVING_MIN_HEIGHT = 30;
const MOVING_MAX_HEIGHT = 50;
const MOVING_MIN_SPEED = 40;
const MOVING_MAX_SPEED = 80;
const MOVING_RANGE_MIN = 150;
const MOVING_RANGE_MAX = 250;
const BULLET_RADIUS = 4;

// Monedas
const COIN_WIDTH = 20;
const COIN_HEIGHT = 20;
const COIN_COLLECT_RADIUS = 22;

// Agua / fosas
const WATER_HEIGHT = 90;

// Trampa con pinchos
const TRAP_ARM_DELAY = 0.3; // segundos antes de activar pinchos

// Plataformas mÃ³viles en Y
const MOVING_PLATFORM_SPEED = 40;
const MOVING_PLATFORM_RANGE = 90;

// Plataformas desvanecibles
const VANISH_DELAY = 1.5; // segundos tras ser pisadas

// Lodo (ralentiza)
const MUD_SLOW_FACTOR = 0.4; // factor de velocidad sobre lodo (40% de velocidad normal)

// Nube trampa (se resquebraja)
const CLOUD_TRAP_CRACK_DELAY = 0.5; // segundos antes de caer

// Planta PiraÃ±a
// Planta Piraña: sube cuando la vaquita salte sobre ella.
const PIRANHA_HEIGHT = 64;

// Trampa de pÃºas periÃ³dica

// Meta / bandera
const GOAL_HEIGHT = 96;

// Sprites de obstÃ¡culos (de assets/trampas.jpg, fondo eliminado)
const IMG_STONE = require('../../assets/obstacle-stone.png');
const IMG_SPIKES = require('../../assets/obstacle-spikes.png');
const IMG_BENCH = require('../../assets/obstacle-bench.png');
const IMG_STONE_TRAP = require('../../assets/obstacle-stone_trampa.png');
const IMG_STONE_TRAP_INACTIVE = require('../../assets/obstacle-stone_trampa_estado inicial.png');
const IMG_CLOUD = require('../../assets/nubes.png');
const IMG_CLOUD_TRAP = require('../../assets/nube_trampa.png');
const IMG_MUD = require('../../assets/lodod.png');
const IMG_MONSTER_GREEN_ANGRY = require('../../assets/monster-green_enojado.png');
const IMG_BENCH_TRAP = require('../../assets/obstacle-bench_trampa.png');
const IMG_BENCH_TRAP_INACTIVE = require('../../assets/obstacle-bench_trampa_estado_inicial.png');

// Sprites de la vaquita (animaciÃ³n por estados)
const IMG_COW_IDLE = require('../../assets/caminando1.png');
const IMG_COW_ATTACK = require('../../assets/ataque.png');
const IMG_COW_JUMP = require('../../assets/salto.png');
const IMG_COW_WALK_1 = require('../../assets/caminando1.png');
const IMG_COW_WALK_2 = require('../../assets/caminar2.png');
const IMG_COW_DEATH = require('../../assets/muerte.png');

const COIN_BONUS_PER_KILL = 5;
const WEAPON_UPGRADE_COIN_THRESHOLDS = [10, 25, 50]; // Coin thresholds for weapon upgrades

interface WeaponConfig {
  name: string;
  speed: number;
  radius: number;
  lifetime: number;
  cooldown: number;
  damage: number;
  pierce: number;
  multiShot: number;
  spread: number;
}

const WEAPONS: WeaponConfig[] = [
  {
    name: 'Escopeta',
    speed: 980,
    radius: 4,
    lifetime: 3.5,
    cooldown: 0.28,
    damage: 1,
    pierce: 1,
    multiShot: 1,
    spread: 0,
  },
  {
    name: 'Rifle',
    speed: 1280,
    radius: 3,
    lifetime: 4.5,
    cooldown: 0.16,
    damage: 1,
    pierce: 2,
    multiShot: 1,
    spread: 0,
  },
  {
    name: 'Lanzador',
    speed: 760,
    radius: 7,
    lifetime: 2.8,
    cooldown: 0.42,
    damage: 1,
    pierce: 1,
    multiShot: 1,
    spread: 0,
  },
  {
    name: 'Plasma',
    speed: 1420,
    radius: 5,
    lifetime: 5.0,
    cooldown: 0.12,
    damage: 1,
    pierce: 3,
    multiShot: 2,
    spread: 0.18,
  },
];

// ---- Sistema de Niveles ----
interface LevelConfig {
  id: number;
  name: string;
  width: number;
  obstacles: InitialObstacleSpec[];
  water?: { x: number; width: number; bottom: number; height: number };
  goal?: { x: number; bottom: number; width: number; height: number };
}

const LEVELS: LevelConfig[] = [
  {
    id: 1,
    name: 'Nivel 1: Praderas',
    width: 4400,
    water: { x: 3200, width: 600, bottom: GROUND_HEIGHT, height: 60 },
    goal: { x: 3900, bottom: GROUND_HEIGHT, width: 60, height: 100 },
obstacles: [
      { type: 'crate', x: 300, width: 140, height: 70 },
      { type: 'spike', x: 590, width: 125, height: SPIKE_HEIGHT },
      { type: 'enemy', x: 850, width: ENEMY_WIDTH, height: ENEMY_HEIGHT },
      { type: 'bench_trap', x: 1000, width: 150, height: 70 },
      { type: 'spike_trap', x: 1300, width: 125, height: SPIKE_HEIGHT },
      { type: 'destructible', x: 1600, width: 120, height: 70 },
      { type: 'floating', x: 1850, width: 120, height: 60 },
      { type: 'moving', x: 2050, width: 140, height: 70 },
      { type: 'spike_trap', x: 2300, width: 125, height: SPIKE_HEIGHT },
      { type: 'enemy', x: 2550, width: BOSS_WIDTH, height: BOSS_HEIGHT, isBoss: true },
      { type: 'trap_platform', x: 2950, width: 190, height: 70 },
      { type: 'moving_platform', x: 3200, bottom: 220, width: 180, height: 60 },
      { type: 'piranha', x: 3400, width: 110, height: 110 },
      { type: 'stone_trap', x: 3600, bottom: 150, width: 150, height: 38 },
      { type: 'vanishing_platform', x: 3800, bottom: 150, width: 150, height: 38 },
      { type: 'stone_trap', x: 4050, bottom: 150, width: 150, height: 38 },
      // Lodo SOLO debajo de nubes fijas
      { type: 'mud', x: 1850, bottom: GROUND_HEIGHT, width: 120, height: 30 },
      { type: 'mud', x: 2700, bottom: GROUND_HEIGHT, width: 160, height: 30 },
      // Nube trampa en el aire (se resquebraja al pisarse)
      { type: 'cloud_trap', x: 2700, bottom: 200, width: 160, height: 40 },
    ],
  },
  {
    id: 2,
    name: 'Nivel 2: Cuevas',
    width: 5400,
    water: { x: 4200, width: 700, bottom: GROUND_HEIGHT, height: 60 },
    goal: { x: 4900, bottom: GROUND_HEIGHT, width: 60, height: 100 },
    obstacles: [
      { type: 'stone_trap', x: 400, width: 150, height: 80 },
      { type: 'spike_trap', x: 640, width: 125, height: SPIKE_HEIGHT },
      { type: 'spike', x: 780, width: 125, height: SPIKE_HEIGHT },
      { type: 'enemy', x: 1000, width: ENEMY_WIDTH, height: ENEMY_HEIGHT },
      { type: 'stone_trap', x: 1400, width: 210, height: 70 },
      { type: 'moving_platform', x: 2000, bottom: 220, width: 180, height: 60 },
      { type: 'vanishing_platform', x: 2400, width: 160, height: 60 },
      { type: 'piranha', x: 2800, width: 110, height: 110 },
      { type: 'spike_trap', x: 3100, width: 125, height: SPIKE_HEIGHT },
      { type: 'stone_trap', x: 3500, width: 140, height: 70 },
      { type: 'piranha', x: 3850, width: 110, height: 110 },
      { type: 'destructible', x: 4150, width: 120, height: 70 },
      { type: 'enemy', x: 4550, width: BOSS_WIDTH, height: BOSS_HEIGHT, isBoss: true },
      { type: 'crate', x: 4850, width: 150, height: 38 },
      { type: 'vanishing_platform', x: 5050, bottom: 150, width: 150, height: 38 },
      { type: 'stone_trap', x: 5300, width: 150, height: 38 },
      // Lodo SOLO debajo de nubes trampa
      { type: 'mud', x: 2200, bottom: GROUND_HEIGHT, width: 140, height: 30 },
      { type: 'mud', x: 3600, bottom: GROUND_HEIGHT, width: 120, height: 30 },
      { type: 'mud', x: 4400, bottom: GROUND_HEIGHT, width: 150, height: 30 },
      // Nubes trampa en secuencia
      { type: 'cloud_trap', x: 2200, bottom: 250, width: 140, height: 38 },
      { type: 'cloud_trap', x: 3600, bottom: 300, width: 120, height: 35 },
      { type: 'cloud_trap', x: 4400, bottom: 200, width: 150, height: 40 },
    ],
  },
];

const getLevelConfig = (levelId: number): LevelConfig =>
  LEVELS.find((l) => l.id === levelId) ?? LEVELS[0];

const TERRAIN_SEGMENTS = 12;

type Facing = 'left' | 'right';
type ObstacleType =
  | 'crate'
  | 'spike'
  | 'enemy'
  | 'floating'
  | 'destructible'
  | 'moving'
  | 'trap_platform'
  | 'moving_platform'
  | 'vanishing_platform'
  | 'water'
  | 'piranha'
  | 'spike_trap'
  | 'stone_trap'
  | 'bench_trap'
  | 'mud'
  | 'cloud_trap'
  | 'goal';

interface BossConfig {
  health: number;
  maxHealth: number;
  vx: number;
  healthBarHeight: number;
  color: string;
}

interface Obstacle {
  id: number;
  type: ObstacleType;
  x: number;
  bottom: number;
  width: number;
  height: number;
  scored: boolean;
  isBoss?: boolean;
  lastHitTime?: number;
  speed?: number;
  facing?: Facing;
  vx?: number;
  vy?: number;
  range?: number;
  startX?: number;
  startBottom?: number;
  destructible?: boolean;
  destructibleHp?: number;
  health?: number;
  maxHealth?: number;
  isDead?: boolean;
  bulletDamage?: number;
  bossConfig?: BossConfig;
  // Trampa con pinchos
  trapArmed?: boolean;
  trapTriggered?: boolean;
  trapTriggerTime?: number;
  // Visuales calculados en el game loop para que el render sea puro
  hitFlash?: boolean;
  trapShakeY?: number;
  // Plataforma mÃ³vil en Y
  moveYSpeed?: number;
  moveYRange?: number;
  moveYStart?: number;
  moveYDir?: number;
  // Plataforma desvanecible
  vanishStartTime?: number;
  vanishDelay?: number;
  vanished?: boolean;
  // Planta piraÃ±a
  piranhaUp?: boolean;
  piranhaTime?: number;
  piranhaDir?: number;
  // Trampa de pÃºas que salen periÃ³dicamente
  spikeTrapVisible?: boolean;
  spikeTrapTimer?: number;
  // Piedra trampa (se activa al pisarla)
  stoneTrapActive?: boolean;
// Banco trampa (se activa al pisarlo)
  benchTrapActive?: boolean;
  // Zona de lodo (ralentiza)
  isMud?: boolean;
  // Nube trampa (se resquebraja)
  cloudTrapCracked?: boolean;
  cloudTrapCrackTime?: number;
  // Meta
  isGoal?: boolean;
}

interface Bullet {
  id: number;
  x: number;
  y: number;
  dir: Facing;
  vx: number;
  width: number;
  height: number;
  born: number;
}

interface FloatingCoin {
  id: number;
  x: number;
  y: number;
  born: number;
}

interface Coin {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  collected: boolean;
}

interface InitialObstacleSpec {
  type: ObstacleType;
  x: number;
  width: number;
  height: number;
  bottom?: number;
  isBoss?: boolean;
}

interface TerrainSegment {
  id: number;
  x: number;
  width: number;
  bottom: number;
  kind: 'ground' | 'platform' | 'hole';
}

interface ViewState {
  cowScreenX: number;
  cowBottom: number;
  cameraX: number;
  now: number;
  isMoving: boolean;
  isGrounded: boolean;
}

interface GameScreenProps {
  onExit: () => void;
}

interface ObstacleViewProps {
  obstacle: Obstacle;
  left: number;
}

const randomBetween = (min: number, max: number): number =>
  min + Math.random() * (max - min);

const createObstacle = (id: number, x: number, terrainBottom: number = GROUND_HEIGHT): Obstacle => {
  const roll = Math.random();

  if (roll < 0.22) {
    // Caja estÃ¡ndar (reducida de 35% a 22%)
    return {
      id,
      type: 'crate',
      x,
      bottom: terrainBottom,
      width: randomBetween(CRATE_MIN_WIDTH, CRATE_MAX_WIDTH),
      height: randomBetween(CRATE_MIN_HEIGHT, CRATE_MAX_HEIGHT),
      scored: false,
    };
  }

  if (roll < 0.42) {
    // Pincho (aumentado de 20% a 20% - mantiene importancia)
    return {
      id,
      type: 'spike',
      x,
      bottom: terrainBottom,
      width: randomBetween(SPIKE_MIN_WIDTH, SPIKE_MAX_WIDTH),
      height: SPIKE_HEIGHT,
      scored: false,
    };
  }

  if (roll < 0.54) {
    // Bloque destructible (reducido de 15% a 12%)
    const destructibleHeight = randomBetween(DESTRUCTIBLE_MIN_HEIGHT, DESTRUCTIBLE_MAX_HEIGHT);
    return {
      id,
      type: 'destructible',
      x,
      bottom: terrainBottom,
      width: randomBetween(DESTRUCTIBLE_MIN_WIDTH, DESTRUCTIBLE_MAX_WIDTH),
      height: destructibleHeight,
      scored: false,
      destructible: true,
      destructibleHp: 1,
    };
  }

  if (roll < 0.62) {
    // ObstÃ¡culo mÃ³vil en el suelo (reducido de 12% a 8%)
    const movingHeight = randomBetween(MOVING_MIN_HEIGHT, MOVING_MAX_HEIGHT);
    return {
      id,
      type: 'moving',
      x,
      bottom: terrainBottom,
      width: randomBetween(MOVING_MIN_WIDTH, MOVING_MAX_WIDTH),
      height: movingHeight,
      scored: false,
      speed: randomBetween(MOVING_MIN_SPEED, MOVING_MAX_SPEED),
      facing: Math.random() < 0.5 ? 'left' : 'right',
      range: randomBetween(MOVING_RANGE_MIN, MOVING_RANGE_MAX),
      startX: x,
    };
  }

  if (roll < 0.63) {
    // Plataforma de nubes en el aire (solo nubes, muy pocas) - probabilidad muy baja
    const floatingHeight = randomBetween(FLOATING_MIN_HEIGHT, FLOATING_MAX_HEIGHT);
    const floatingAltitude = GROUND_HEIGHT + randomBetween(100, 200); // Altura flotante sobre el suelo
    return {
      id,
      type: 'floating',
      x,
      bottom: floatingAltitude,
      width: randomBetween(FLOATING_MIN_WIDTH, FLOATING_MAX_WIDTH),
      height: floatingHeight,
      scored: false,
      vy: randomBetween(FLOATING_MIN_SPEED, FLOATING_MAX_SPEED),
      range: randomBetween(FLOATING_RANGE_MIN, FLOATING_RANGE_MAX),
      startBottom: floatingAltitude,
    };
  }

  // Monstruo con variaciones de altura y velocidad (aumentado de 10% a 32% total)
  const enemyHeightVariation = randomBetween(0.7, 1.3);
  const enemySpeedVariation = randomBetween(0.6, 1.4);
  const enemyHeight = Math.round(ENEMY_HEIGHT * enemyHeightVariation);

  // Boss spawn: ~5% chance, larger size, more health, boss health bar config
  const isBoss = Math.random() < 0.05;
  if (isBoss) {
    const bossHealth = 10;
    const bossWidth = BOSS_WIDTH;
    const bossHeight = BOSS_HEIGHT;
    const bossFacing: Facing = Math.random() < 0.5 ? 'left' : 'right';
    const bossSpeed = ENEMY_SPEED * 0.7;
    return {
      id,
      type: 'enemy',
      x,
      bottom: terrainBottom,
      width: bossWidth,
      height: bossHeight,
      scored: false,
      isBoss: true,
      speed: bossSpeed,
      facing: bossFacing,
      vx: bossFacing === 'left' ? -bossSpeed : bossSpeed,
      startX: x,
      range: ENEMY_PATROL_RANGE * 1.5,
      health: bossHealth,
      maxHealth: bossHealth,
      isDead: false,
      bulletDamage: 1,
      vy: 0,
      bossConfig: {
        health: bossHealth,
        maxHealth: bossHealth,
        vx: bossFacing === 'left' ? -bossSpeed : bossSpeed,
        healthBarHeight: 6,
        color: '#ff3b30',
      },
    };
  }

  const enemyFacing: Facing = Math.random() < 0.5 ? 'left' : 'right';
  const enemySpeed = ENEMY_SPEED * enemySpeedVariation;
  return {
    id,
    type: 'enemy',
    x,
    bottom: terrainBottom,
    width: ENEMY_WIDTH,
    height: enemyHeight,
    scored: false,
    speed: enemySpeed,
    facing: enemyFacing,
    vx: enemyFacing === 'left' ? -enemySpeed : enemySpeed,
    startX: x,
    range: ENEMY_PATROL_RANGE,
    health: 1,
    maxHealth: 1,
    isDead: false,
    bulletDamage: 1,
    vy: 0,
  };
};

const createInitialObstacles = (levelId: number): Obstacle[] => {
  const level = getLevelConfig(levelId);
  const obstacles: Obstacle[] = [];
  let id = 1;

  for (const spec of level.obstacles) {
    const isEnemy = spec.type === 'enemy';
    const enemyFacing: Facing = Math.random() < 0.5 ? 'left' : 'right';
    const baseBottom = GROUND_HEIGHT;

    if (spec.isBoss) {
      const bossHealth = 10;
      const bossSpeed = ENEMY_SPEED * 0.75;
      obstacles.push({
        id: id++,
        type: 'enemy',
        x: spec.x,
        bottom: baseBottom,
        width: spec.width,
        height: spec.height,
        scored: false,
        isBoss: true,
        speed: bossSpeed,
        facing: enemyFacing,
        vx: enemyFacing === 'left' ? -bossSpeed : bossSpeed,
        startX: spec.x,
        range: ENEMY_PATROL_RANGE * 2,
        vy: 0,
        health: bossHealth,
        maxHealth: bossHealth,
        isDead: false,
        bulletDamage: 1,
        bossConfig: {
          health: bossHealth,
          maxHealth: bossHealth,
          vx: enemyFacing === 'left' ? -bossSpeed : bossSpeed,
          healthBarHeight: 6,
          color: '#ff3b30',
        },
      });
      continue;
    }

    switch (spec.type) {
      case 'trap_platform': {
        obstacles.push({
          id: id++,
          type: 'trap_platform',
          x: spec.x,
          bottom: spec.bottom ?? baseBottom,
          width: spec.width,
          height: spec.height,
          scored: false,
          trapArmed: false,
          trapTriggered: false,
        });
        break;
      }
      case 'spike_trap': {
        obstacles.push({
          id: id++,
          type: 'spike_trap',
          x: spec.x,
          bottom: spec.bottom ?? baseBottom,
          width: spec.width,
          height: spec.height,
          scored: false,
          spikeTrapVisible: false,
        });
        break;
      }
      case 'stone_trap': {
        obstacles.push({
          id: id++,
          type: 'stone_trap',
          x: spec.x,
          bottom: spec.bottom ?? baseBottom,
          width: spec.width,
          height: spec.height,
          scored: false,
          stoneTrapActive: false,
        });
        break;
      }
      case 'bench_trap': {
        obstacles.push({
          id: id++,
          type: 'bench_trap',
          x: spec.x,
          bottom: spec.bottom ?? baseBottom,
          width: spec.width,
          height: spec.height,
          scored: false,
          benchTrapActive: false,
        });
        break;
      }
      case 'mud': {
        obstacles.push({
          id: id++,
          type: 'mud',
          x: spec.x,
          bottom: spec.bottom ?? baseBottom,
          width: spec.width,
          height: spec.height,
          scored: false,
          isMud: true,
        });
        break;
      }
      case 'cloud_trap': {
        obstacles.push({
          id: id++,
          type: 'cloud_trap',
          x: spec.x,
          bottom: spec.bottom ?? baseBottom,
          width: spec.width,
          height: spec.height,
          scored: false,
          cloudTrapCracked: false,
        });
        break;
      }
      case 'moving_platform': {
        const mpBottom = spec.bottom ?? baseBottom;
        obstacles.push({
          id: id++,
          type: 'moving_platform',
          x: spec.x,
          bottom: mpBottom,
          width: spec.width,
          height: spec.height,
          scored: false,
          moveYSpeed: MOVING_PLATFORM_SPEED,
          moveYRange: MOVING_PLATFORM_RANGE,
          moveYStart: mpBottom,
          moveYDir: 1,
          vy: 0,
        });
        break;
      }
      case 'vanishing_platform': {
        obstacles.push({
          id: id++,
          type: 'vanishing_platform',
          x: spec.x,
          bottom: spec.bottom ?? baseBottom,
          width: spec.width,
          height: spec.height,
          scored: false,
          vanished: false,
        });
        break;
      }
      case 'water': {
        obstacles.push({
          id: id++,
          type: 'water',
          x: spec.x,
          bottom: spec.bottom ?? baseBottom - 10,
          width: spec.width,
          height: spec.height ?? WATER_HEIGHT,
          scored: false,
        });
        break;
      }
      case 'piranha': {
        obstacles.push({
          id: id++,
          type: 'piranha',
          x: spec.x,
          bottom: spec.bottom ?? baseBottom,
          width: spec.width,
          height: spec.height,
          scored: false,
          piranhaUp: false,
        });
        break;
      }
      case 'floating': {
        const floatVY = randomBetween(20, 40);
        const floatRange = randomBetween(30, 60);
        const floatVX = randomBetween(-8, 8); // Drift horizontal suave independiente
        obstacles.push({
          id: id++,
          type: 'floating',
          x: spec.x,
          bottom: spec.bottom ?? baseBottom,
          width: spec.width,
          height: spec.height,
          scored: false,
          vy: floatVY,
          range: floatRange,
          startBottom: spec.bottom ?? baseBottom,
          vx: floatVX,
        });
        break;
      }
      case 'goal': {
        obstacles.push({
          id: id++,
          type: 'goal',
          x: spec.x,
          bottom: spec.bottom ?? baseBottom,
          width: spec.width,
          height: spec.height,
          scored: false,
          isGoal: true,
        });
        break;
      }
      default: {
        obstacles.push({
          id: id++,
          type: spec.type,
          x: spec.x,
          bottom: spec.bottom ?? baseBottom,
          width: spec.width,
          height: spec.height,
          scored: false,
          speed: isEnemy ? ENEMY_SPEED : undefined,
          facing: isEnemy ? enemyFacing : undefined,
          vx: isEnemy ? (enemyFacing === 'left' ? -ENEMY_SPEED : ENEMY_SPEED) : undefined,
          startX: isEnemy ? spec.x : undefined,
          range: isEnemy ? ENEMY_PATROL_RANGE : undefined,
          vy: isEnemy ? 0 : undefined,
        });
      }
    }
  }

  // Agua y meta desde la configuraciÃ³n del nivel
  if (level.water) {
    obstacles.push({
      id: id++,
      type: 'water',
      x: level.water.x,
      bottom: level.water.bottom,
      width: level.water.width,
      height: level.water.height,
      scored: false,
    });
  }
  if (level.goal) {
    obstacles.push({
      id: id++,
      type: 'goal',
      x: level.goal.x,
      bottom: level.goal.bottom,
      width: level.goal.width,
      height: level.goal.height,
      scored: false,
      isGoal: true,
    });
  }

  return obstacles;
};

const createLevelCoins = (levelId: number): Coin[] => {
  const level = getLevelConfig(levelId);
  const coins: Coin[] = [];
  let id = 1;
  const placeCoin = (x: number, y: number) => {
    coins.push({ id: id++, x, y, width: COIN_WIDTH, height: COIN_HEIGHT, collected: false });
  };

  for (const spec of level.obstacles) {
    if (spec.type === 'crate' || spec.type === 'moving_platform' || spec.type === 'vanishing_platform') {
      placeCoin(spec.x + spec.width / 2 - COIN_WIDTH / 2, GROUND_HEIGHT + spec.height + 10);
    }
    if (spec.type === 'floating') {
      placeCoin(spec.x + spec.width / 2 - COIN_WIDTH / 2, GROUND_HEIGHT + spec.height + 40);
    }
  }

  // Monedas hacia la meta
  if (level.goal) {
    for (let i = 0; i < 5; i++) {
      placeCoin(level.goal.x + i * 24 - 40, GROUND_HEIGHT + 20);
    }
  }

  return coins;
};

const createInitialTerrain = (): TerrainSegment[] => {
  const segments: TerrainSegment[] = [];
  let x = 0;
  let id = 0;
  const MAX_SEGMENTS = 100;

  for (let i = 0; i < TERRAIN_SEGMENTS && segments.length < MAX_SEGMENTS; i++) {
    const width = randomBetween(80, 180);
    segments.push({
      id: id++,
      x,
      width,
      bottom: GROUND_HEIGHT,
      kind: 'ground',
    });
    x += width;
  }

  return segments;
};

interface HasBounds {
  x: number;
  width: number;
}

interface Rect {
  x: number;
  bottom: number;
  width: number;
  height: number;
}

const aabbOverlap = (a: Rect, b: Rect): boolean =>
  a.x < b.x + b.width &&
  a.x + a.width > b.x &&
  a.bottom < b.bottom + b.height &&
  a.bottom + a.height > b.bottom;

const hasHorizontalOverlap = (
  x: number,
  width: number,
  target: HasBounds,
  inset = 0
): boolean =>
  x + width - inset > target.x &&
  x + inset < target.x + target.width;

const getTerrainSupport = (
  x: number,
  width: number,
  terrain: TerrainSegment[]
): number => {
  let support = 0;

  for (const segment of terrain) {
    if (segment.kind === 'hole') {
      continue;
    }

    if (hasHorizontalOverlap(x, width, segment, 6)) {
      if (segment.bottom > support) {
        support = segment.bottom;
      }
    }
  }

  return support;
};

const getTerrainBottomAt = (x: number, terrain: TerrainSegment[]): number => {
  for (const segment of terrain) {
    if (segment.kind === 'hole') {
      continue;
    }
    if (x >= segment.x && x < segment.x + segment.width) {
      return segment.bottom;
    }
  }
  return GROUND_HEIGHT;
};

const getSupportBottom = (
  x: number,
  width: number,
  bottom: number,
  obstacles: Obstacle[]
): number => {
  let support = GROUND_HEIGHT;

  for (const obstacle of obstacles) {
    const solid =
      obstacle.type === 'crate' ||
      obstacle.type === 'destructible' ||
      obstacle.type === 'moving' ||
      obstacle.type === 'moving_platform' ||
      obstacle.type === 'vanishing_platform' ||
      obstacle.type === 'trap_platform' ||
      obstacle.type === 'floating' ||
      obstacle.type === 'cloud_trap';
    if (!solid || !hasHorizontalOverlap(x, width, obstacle, 6)) {
      continue;
    }
    if (obstacle.type === 'vanishing_platform' && obstacle.vanished) {
      continue;
    }
    if (obstacle.type === 'cloud_trap' && obstacle.vanished) {
      continue;
    }

    const top = obstacle.bottom + obstacle.height;
    // Only a crate the entity is standing on (or falling onto) can support it.
    if (top > support && bottom >= top - 0.5) {
      support = top;
    }
  }

  return support;
};

const getBossCollisionBox = (obstacle: Obstacle): Rect => {
  if (obstacle.isBoss || obstacle.bossConfig) {
    // Ãrea de colisiÃ³n independiente y ligeramente mÃ¡s ajustada o insets para mejor jugabilidad
    const sprite = getEnemySpriteSize(
      obstacle.width,
      obstacle.height,
      BOSS_ASPECT_RATIO
    );
    return {
      x: obstacle.x + (obstacle.width - sprite.width) / 2,
      bottom: obstacle.bottom,
      width: sprite.width,
      height: sprite.height,
    };
  }
  if (obstacle.type === 'piranha') {
    const spriteWidth = PIRANHA_HEIGHT * PIRANHA_ASPECT_RATIO;
    return {
      x: obstacle.x + (PIRANHA_HEIGHT - spriteWidth) / 2,
      bottom: obstacle.bottom,
      width: spriteWidth,
      height: PIRANHA_HEIGHT,
    };
  }
  const sprite = getEnemySpriteSize(
    obstacle.width,
    obstacle.height,
    ENEMY_ASPECT_RATIO
  );
  return {
    x: obstacle.x + (obstacle.width - sprite.width) / 2,
    bottom: obstacle.bottom,
    width: sprite.width,
    height: sprite.height,
  };
};

const cowRect = (x: number, bottom: number): Rect => ({
  x,
  bottom,
  width: COW_WIDTH,
  height: COW_HEIGHT,
});

const intersectsHazard = (
  x: number,
  bottom: number,
  obstacle: Obstacle
): boolean => aabbOverlap(cowRect(x, bottom), obstacle);

const intersectsEnemy = (
  x: number,
  bottom: number,
  enemy: Obstacle
): boolean => aabbOverlap(cowRect(x, bottom), getBossCollisionBox(enemy));

const CrateObstacle = React.memo(function CrateObstacle({
  obstacle,
  left,
}: ObstacleViewProps) {
  return (
    <View
      style={[
        styles.obstacle,
        {
          left: Number(left),
          bottom: Number(obstacle.bottom),
          width: obstacle.width,
          height: obstacle.height,
        },
      ]}
    >
      <Image source={IMG_STONE} style={styles.obstacleImg} />
    </View>
  );
});

const StoneTrapObstacle = React.memo(function StoneTrapObstacle({
  obstacle,
  left,
}: ObstacleViewProps) {
  const active = obstacle.stoneTrapActive === true;
  return (
    <View
      style={[
        styles.obstacle,
        {
          left: Number(left),
          bottom: Number(obstacle.bottom),
          width: obstacle.width,
          height: obstacle.height,
        },
      ]}
    >
      <Image source={active ? IMG_STONE_TRAP : IMG_STONE_TRAP_INACTIVE} style={styles.obstacleImg} />
    </View>
  );
});

const BenchTrapObstacle = React.memo(function BenchTrapObstacle({
  obstacle,
  left,
}: ObstacleViewProps) {
  const active = obstacle.benchTrapActive === true;
  return (
    <View
      style={[
        styles.obstacle,
        {
          left: Number(left),
          bottom: Number(obstacle.bottom),
          width: obstacle.width,
          height: obstacle.height,
        },
      ]}
    >
      <Image source={active ? IMG_BENCH_TRAP : IMG_BENCH_TRAP_INACTIVE} style={styles.obstacleImg} />
    </View>
  );
});
const MudZone = React.memo(function MudZone({
  obstacle,
  left,
}: ObstacleViewProps) {
  return (
    <View
      style={[
        styles.obstacle,
        {
          left: Number(left),
          bottom: Number(obstacle.bottom),
          width: obstacle.width,
          height: obstacle.height,
        },
      ]}
    >
      <Image source={IMG_MUD} style={styles.obstacleImg} resizeMode="stretch" />
      {/* Capa superior oscura para mejor contraste bajo nubes */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(80, 50, 30, 0.35)',
        }}
      />
      {/* Brillo superior sutil para efecto húmedo */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          backgroundColor: 'rgba(160, 120, 80, 0.25)',
        }}
      />
    </View>
  );
});

const CloudTrapPlatform = React.memo(function CloudTrapPlatform({
  obstacle,
  left,
  now,
}: ObstacleViewProps & { now: number }) {
  const cracked = obstacle.cloudTrapCracked === true;
  return (
    <View
      style={[
        styles.obstacle,
        {
          left: Number(left),
          bottom: Number(obstacle.bottom),
          width: obstacle.width,
          height: obstacle.height,
        },
      ]}
    >
      <Image
        source={cracked ? IMG_CLOUD_TRAP : IMG_CLOUD}
        style={[
          styles.obstacleImg,
          cracked && { transform: [{ translateX: Math.sin(now / 50) * 3 }] },
        ]}
        resizeMode="stretch"
      />
    </View>
  );
});

const SpikeObstacle = React.memo(function SpikeObstacle({
  obstacle,
  left,
}: {
  obstacle: Obstacle;
  left: number;
}) {
  return (
    <View
      style={{
        position: 'absolute',
        left: left,
        bottom: obstacle.bottom,
        width: obstacle.width,
        height: obstacle.height,
      }}
    >
      <Image source={IMG_SPIKES} style={styles.obstacleImg} resizeMode="stretch" />
    </View>
  );
});

const EnemyObstacle = React.memo(function EnemyObstacle({
  obstacle,
  left,
  cowScreenX,
}: ObstacleViewProps & { cowScreenX?: number }) {
  const isBoss = obstacle.isBoss || obstacle.bossConfig;
  const health = obstacle.health ?? 1;
  const maxHealth = obstacle.maxHealth ?? 1;
  const healthPercent = Math.max(0, Math.min(100, (health / maxHealth) * 100));
  const isHit = obstacle.hitFlash === true;
  const isAngry =
    !isBoss &&
    cowScreenX !== undefined &&
    Math.abs(cowScreenX + COW_WIDTH / 2 - (left + obstacle.width / 2)) <
      ENEMY_ALERT_DISTANCE;

  return (
    <View style={[styles.obstacle, { left, bottom: obstacle.bottom, width: obstacle.width, height: obstacle.height }]}>
      {isBoss && (
        <View
          style={{
            position: 'absolute',
            top: -16,
            left: -10,
            right: -10,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#ff3b30', fontSize: 10, fontWeight: '900', marginBottom: 2 }}>
            JEFE ({health}/{maxHealth})
          </Text>
          <View
            style={{
              width: obstacle.width + 20,
              height: 6,
              backgroundColor: 'rgba(0,0,0,0.6)',
              borderRadius: 3,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.4)',
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                width: `${healthPercent}%`,
                height: '100%',
                backgroundColor: healthPercent > 50 ? '#ff3b30' : '#ff9500',
              }}
            />
          </View>
        </View>
      )}
      <Enemy
        facing={obstacle.facing ?? 'right'}
        width={obstacle.width}
        height={obstacle.height}
        aspectRatio={
          isBoss
            ? BOSS_ASPECT_RATIO
            : isAngry
              ? ENEMY_ANGRY_ASPECT_RATIO
              : ENEMY_ASPECT_RATIO
        }
        imageSource={
          isBoss
            ? isHit
              ? IMG_MONSTER_GREEN_ANGRY
              : require('../../assets/monster-green.png')
            : isAngry
              ? require('../../assets/mosntruo_enojado.png')
              : require('../../assets/monstruo.png')
        }
        style={{
          width: obstacle.width,
          height: obstacle.height,
          opacity: isHit ? 0.5 : 1,
          transform: isHit ? [{ scale: 1.1 }] : undefined,
        }}
      />
    </View>
  );
});

const DestructibleObstacle = React.memo(function DestructibleObstacle({
  obstacle,
  left,
}: ObstacleViewProps) {
  return (
    <View
      style={[
        styles.obstacle,
        {
          left: Number(left),
          bottom: Number(obstacle.bottom),
          width: obstacle.width,
          height: obstacle.height,
        },
      ]}
    >
      <Image source={IMG_STONE} style={styles.obstacleImg} />
    </View>
  );
});

const MovingObstacle = React.memo(function MovingObstacle({
  obstacle,
  left,
}: ObstacleViewProps) {
  return (
    <View
      style={[
        styles.obstacle,
        {
          left: Number(left),
          bottom: Number(obstacle.bottom),
          width: obstacle.width,
          height: obstacle.height,
        },
      ]}
    >
      <Image source={IMG_BENCH} style={styles.obstacleImg} />
    </View>
  );
});

const FloatingObstacle = React.memo(function FloatingObstacle({
  obstacle,
  left,
}: ObstacleViewProps) {
  return (
    <View
      style={[
        styles.obstacle,
        {
          left: Number(left),
          bottom: Number(obstacle.bottom),
          width: obstacle.width,
          height: obstacle.height,
        },
      ]}
    >
      <Image source={IMG_CLOUD} style={styles.obstacleImg} resizeMode="stretch" />
    </View>
  );
});

// ---- Nuevos obstÃ¡culos y trampas ----

interface PlatformViewProps {
  obstacle: Obstacle;
  left: number;
}

const TrapPlatform = React.memo(function TrapPlatform({
  obstacle,
  left,
}: PlatformViewProps) {
  const triggered = obstacle.trapTriggered;
  const flash = obstacle.trapShakeY ?? 0;

  return (
    <View
      style={[
        styles.obstacle,
        {
          left: Number(left),
          bottom: Number(obstacle.bottom),
          width: obstacle.width,
          height: obstacle.height,
        },
      ]}
    >
      <Image source={IMG_BENCH} style={styles.obstacleImg} />
      {triggered && (
        <View style={[styles.trapSpikes, { transform: [{ translateY: flash }] }]}>
          <Image source={IMG_SPIKES} style={[styles.obstacleImg, { opacity: 1 }]}/>
        </View>
      )}
    </View>
  );
});

const MovingPlatform = React.memo(function MovingPlatform({
  obstacle,
  left,
}: PlatformViewProps) {
  return (
    <View
      style={[
        styles.obstacle,
        {
          left: Number(left),
          bottom: Number(obstacle.bottom),
          width: obstacle.width,
          height: obstacle.height,
        },
      ]}
    >
      <Image source={IMG_CLOUD} style={styles.obstacleImg} resizeMode="stretch" />
    </View>
  );
});

const VanishingPlatform = React.memo(function VanishingPlatform({
  obstacle,
  left,
}: PlatformViewProps) {
  if (obstacle.vanished) {
    return null;
  }
  return (
    <View
      style={[
        styles.obstacle,
        {
          left: left,
          bottom: obstacle.bottom || 0,
          width: obstacle.width,
          height: obstacle.height,
        },
      ]}
    >
      <Image source={IMG_CLOUD} style={styles.obstacleImg} resizeMode="stretch" />
    </View>
  );
});

const WaterZone = React.memo(function WaterZone({
  obstacle,
  left,
}: PlatformViewProps) {
  return (
    <View
      style={[
        styles.waterZone,
        {
          left: Number(left),
          bottom: Number(obstacle.bottom),
          width: obstacle.width,
          height: obstacle.height,
        },
      ]}
    >
      <View style={styles.waterSurface} />
      <Text style={styles.waterText}>AGUA</Text>
    </View>
  );
});

const Piranha = React.memo(function Piranha({
  obstacle,
  left,
}: PlatformViewProps) {
  const up = obstacle.piranhaUp;
  const yOffset = up ? 0 : -PIRANHA_HEIGHT + 10;

  return (
    <View
      style={[
        styles.piranhaContainer,
        { left: Number(left), bottom: Number(obstacle.bottom + yOffset) },
      ]}
    >
      <Image
        source={require('../../assets/planta.png')}
        style={styles.piranhaImg}
        resizeMode="contain"
        fadeDuration={0}
      />
    </View>
  );
});

const SpikeTrap = React.memo(function SpikeTrap({
  obstacle,
  left,
}: PlatformViewProps) {
  const visible = obstacle.spikeTrapVisible;

  if (!visible) {
    return null;
  }

  return (
    <View
      style={[
        styles.obstacle,
        {
          left: Number(left),
          bottom: GROUND_HEIGHT,
          width: obstacle.width,
          height: obstacle.height,
        },
      ]}
    >
      <Image source={IMG_SPIKES} style={styles.obstacleImg} resizeMode="stretch" />
    </View>
  );
});

const Goal = React.memo(function Goal({
  obstacle,
  left,
}: PlatformViewProps) {
  return (
    <View
      style={[
        styles.goalContainer,
        { left: Number(left), bottom: Number(obstacle.bottom) },
      ]}
    >
      <View style={styles.goalPole} />
      <View style={styles.goalFlag} />
      <View style={styles.savePoint} />
      <Text style={styles.goalText}>META</Text>
    </View>
  );
});

const FloatingCoinComponent = React.memo(function FloatingCoinComponent({
  coin,
  cameraX,
  now,
}: {
  coin: FloatingCoin;
  cameraX: number;
  now: number;
}) {
  const age = Math.max(0, now - coin.born);
  const opacity = Math.max(0, 1 - age / 2.5);
  const rise = age * 18;
  const bob = Math.sin(now * 5 + coin.id) * 3;
  const scale = 1 + Math.sin(now * 7 + coin.id) * 0.08;

  return (
    <>
      <View
        style={[
          styles.coinHalo,
          {
            left: Number(coin.x - cameraX - 17),
            bottom: Number(coin.y + rise + bob - 7),
            opacity,
          },
        ]}
      />
      <View
        style={[
          styles.coin,
          {
            left: Number(coin.x - cameraX - 10),
            bottom: Number(coin.y + rise + bob),
            opacity,
            transform: [{ scale }],
          },
        ]}
      />
    </>
  );
});

export default function GameScreen({ onExit }: GameScreenProps) {  const screenWidth =
    Number.isFinite(SCREEN_WIDTH) && SCREEN_WIDTH > 0
      ? SCREEN_WIDTH
      : FALLBACK_SCREEN_WIDTH;
  const screenHeight =
    Number.isFinite(SCREEN_HEIGHT) && SCREEN_HEIGHT > 0
      ? SCREEN_HEIGHT
      : FALLBACK_SCREEN_HEIGHT;

  const [obstacles, setObstacles] = useState<Obstacle[]>(() => createInitialObstacles(1));
  const [terrain, setTerrain] = useState<TerrainSegment[]>(createInitialTerrain);
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [floatingCoins, setFloatingCoins] = useState<FloatingCoin[]>([]);
  const [levelCoins, setLevelCoins] = useState<Coin[]>(() => createLevelCoins(1));
  const [view, setView] = useState<ViewState>({
    cowScreenX: PLAYER_START_X,
    cowBottom: GROUND_HEIGHT,
    cameraX: 0,
    now: 0,
    isMoving: false,
    isGrounded: true,
  });
  const [facing, setFacing] = useState<Facing>('right');
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [cowDead, setCowDead] = useState(false);
  const [levelCompleted, setLevelCompleted] = useState(false);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [currentWeapon, setCurrentWeapon] = useState(0);
  const [muzzleFlashBorn, setMuzzleFlashBorn] = useState(0);
  const [deathEffects, setDeathEffects] = useState<
    { x: number; y: number; born: number; id: number }[]
  >([]);
  const cowXRef = useRef(PLAYER_START_X);
  const cowBottomRef = useRef(GROUND_HEIGHT);
  const cameraXRef = useRef(0);
  const velocityXRef = useRef(0);
  const velocityYRef = useRef(0);
  const isGroundedRef = useRef(true);
  const jumpCountRef = useRef(0);

  useLayoutEffect(() => {
    if (cowBottomRef.current >= GROUND_HEIGHT - 0.5) {
      isGroundedRef.current = true;
      velocityYRef.current = 0;
      jumpCountRef.current = 0;
    }
  }, []);
  const leftHeldRef = useRef(false);
  const rightHeldRef = useRef(false);
  const isPressingLeftRef = useRef(false);
  const isPressingRightRef = useRef(false);
  const isMovingRightRef = useRef(false);
  const isMovingLeftRef = useRef(false);
  const obstaclesRef = useRef<Obstacle[]>(obstacles);
  const terrainRef = useRef<TerrainSegment[]>(terrain);
  const bulletsRef = useRef<Bullet[]>([]);
  const floatingCoinsRef = useRef<FloatingCoin[]>([]);
  const coinsRef = useRef<Coin[]>([]);
  const bulletIdRef = useRef(0);
  const lastShotRef = useRef(0);
  const scoreRef = useRef(0);
  const coinsRefCount = useRef(0);
  const weaponRef = useRef(0);
  const levelRef = useRef(1);
  const nextObstacleXRef = useRef(INITIAL_NEXT_OBSTACLE_X);
  const obstacleIdRef = useRef(obstacles.length);
  const gameOverRef = useRef(false);
  const startLoopRef = useRef<(() => void) | null>(null);
  const deathEffectsRef = useRef<{ x: number; y: number; born: number; id: number }[]>([]);
  const deathEffectIdRef = useRef(0);
  const coinsRefState = useRef<Coin[]>([]);
  const levelCompletedRef = useRef(false);

  const checkWeaponUpgrade = (currentCoins: number) => {
    let targetWeaponIndex = 0;
    for (let i = 0; i < WEAPON_UPGRADE_COIN_THRESHOLDS.length; i++) {
      if (currentCoins >= WEAPON_UPGRADE_COIN_THRESHOLDS[i]) {
        targetWeaponIndex = Math.min(WEAPONS.length - 1, i + 1);
      }
    }
    if (targetWeaponIndex > weaponRef.current) {
      weaponRef.current = targetWeaponIndex;
      setCurrentWeapon(targetWeaponIndex);
    }
  };

  useEffect(() => {
    let frameId = 0;
    let running = false;
    let lastTime = 0;

    if (coinsRefState.current.length === 0) {
      const initialCoins = createLevelCoins(levelRef.current);
      coinsRefState.current = initialCoins;
      setLevelCoins([...initialCoins]);
    }

    const updateView = () => {
      setView({
        cowScreenX: cowXRef.current - cameraXRef.current,
        cowBottom: cowBottomRef.current,
        cameraX: cameraXRef.current,
        now: performance.now() / 1000,
        isMoving: isMovingRightRef.current || isMovingLeftRef.current,
        isGrounded: isGroundedRef.current,
      });
    };

    const triggerGameOver = () => {
      if (gameOverRef.current) {
        return;
      }

      gameOverRef.current = true;
      velocityXRef.current = 0;
      velocityYRef.current = 0;
      leftHeldRef.current = false;
      rightHeldRef.current = false;
      isMovingRightRef.current = false;
      isMovingLeftRef.current = false;
      isPressingLeftRef.current = false;
      isPressingRightRef.current = false;
      setGameOver(true);
      setCowDead(true);
      setBestScore((currentBest) => Math.max(currentBest, scoreRef.current));
    };

    const loop = (time: number) => {
      if (!running) {
        return;
      }

      const delta =
        lastTime === 0
          ? 0
          : Math.max(0, Math.min((time - lastTime) / 1000, 0.05));
      lastTime = time;

      if (gameOverRef.current) {
        running = false;
        return;
      }

      // Persistent directional state: the jump must never cancel horizontal
      // velocity while a direction button is still held. When no direction
      // is active, force a full stop so the cow never keeps walking alone.
      if (isMovingRightRef.current) {
        const baseSpeed = !isGroundedRef.current ? AIR_MOVE_SPEED : MOVE_SPEED;
        // Check if cow is on mud to apply slow factor
        let onMud = false;
        if (isGroundedRef.current) {
          for (const obstacle of obstaclesRef.current) {
            if (obstacle.isMud) {
              const mudLeft = obstacle.x;
              const mudRight = obstacle.x + obstacle.width;
              if (
                cowXRef.current + COW_WIDTH > mudLeft &&
                cowXRef.current < mudRight &&
                cowBottomRef.current >= obstacle.bottom - 5 &&
                cowBottomRef.current <= obstacle.bottom + 5
              ) {
                onMud = true;
                break;
              }
            }
          }
        }
        velocityXRef.current = onMud ? baseSpeed * MUD_SLOW_FACTOR : baseSpeed;
      } else if (isMovingLeftRef.current) {
        const baseSpeed = !isGroundedRef.current ? AIR_MOVE_SPEED : MOVE_SPEED;
        let onMud = false;
        if (isGroundedRef.current) {
          for (const obstacle of obstaclesRef.current) {
            if (obstacle.isMud) {
              const mudLeft = obstacle.x;
              const mudRight = obstacle.x + obstacle.width;
              if (
                cowXRef.current + COW_WIDTH > mudLeft &&
                cowXRef.current < mudRight &&
                cowBottomRef.current >= obstacle.bottom - 5 &&
                cowBottomRef.current <= obstacle.bottom + 5
              ) {
                onMud = true;
                break;
              }
            }
          }
        }
        velocityXRef.current = onMud ? -baseSpeed * MUD_SLOW_FACTOR : -baseSpeed;
      } else {
        velocityXRef.current = 0;
      }

      const velocityX = velocityXRef.current;

      // Movimiento horizontal de la vaquita con colisiÃ³n sÃ³lida contra plataformas.
      // Si camina de lado choca sin traspasar; si cae, aterriza sobre la superficie superior.
      const solidTypes = [
        'crate',
        'destructible',
        'moving',
        'moving_platform',
        'vanishing_platform',
        'trap_platform',
        'floating',
        'cloud_trap',
      ];

      if (velocityX !== 0) {
        let nextX = cowXRef.current + velocityX * delta;

        for (const obstacle of obstaclesRef.current) {
          if (!solidTypes.includes(obstacle.type)) {
            continue;
          }
          if (obstacle.type === 'vanishing_platform' && obstacle.vanished) {
            continue;
          }
          if (obstacle.type === 'cloud_trap' && obstacle.vanished) {
            continue;
          }

          const obstacleTop = obstacle.bottom + obstacle.height;
          const overlapsVertically =
            cowBottomRef.current < obstacleTop - 2 &&
            cowBottomRef.current + COW_HEIGHT > obstacle.bottom + 2;

          if (!overlapsVertically) {
            continue;
          }

          if (
            velocityX > 0 &&
            nextX + COW_WIDTH > obstacle.x &&
            nextX < obstacle.x + obstacle.width
          ) {
            nextX = Math.min(nextX, obstacle.x - COW_WIDTH);
          } else if (
            velocityX < 0 &&
            nextX < obstacle.x + obstacle.width &&
            nextX + COW_WIDTH > obstacle.x
          ) {
            nextX = Math.max(nextX, obstacle.x + obstacle.width);
          }
        }

        cowXRef.current = Math.max(0, nextX);
      }

      // Agua / fosa: cae dentro â†’ Game Over inmediato
      // Meta: tocar la bandera => nivel completado
      if (!gameOverRef.current && !levelCompletedRef.current) {
        for (const obstacle of obstaclesRef.current) {
          if (!obstacle.isGoal) {
            continue;
          }
          if (
            cowXRef.current < obstacle.x + obstacle.width &&
            cowXRef.current + COW_WIDTH > obstacle.x &&
            cowBottomRef.current + COW_HEIGHT > obstacle.bottom &&
            cowBottomRef.current < obstacle.bottom + obstacle.height
          ) {
            levelCompletedRef.current = true;
            setLevelCompleted(true);
          }
        }
      }

      for (const obstacle of obstaclesRef.current) {
        if (obstacle.type !== 'water') {
          continue;
        }
        if (
          cowXRef.current < obstacle.x + obstacle.width &&
          cowXRef.current + COW_WIDTH > obstacle.x &&
          cowBottomRef.current + COW_HEIGHT > obstacle.bottom &&
          cowBottomRef.current < obstacle.bottom + obstacle.height
        ) {
          triggerGameOver();
        }
      }

      if (gameOverRef.current) {
        updateView();
        running = false;
        return;
      }

      if (isGroundedRef.current) {
        const supportBottom = Math.max(
          getTerrainSupport(cowXRef.current, COW_WIDTH, terrainRef.current),
          getSupportBottom(
            cowXRef.current,
            COW_WIDTH,
            cowBottomRef.current,
            obstaclesRef.current
          )
        );

        if (supportBottom >= cowBottomRef.current - 0.5) {
          cowBottomRef.current = supportBottom;
          velocityYRef.current = 0;
        } else {
          isGroundedRef.current = false;
        }
      }

      if (!isGroundedRef.current) {
        const previousBottom = cowBottomRef.current;
        const isApex =
          Math.abs(velocityYRef.current) <= APEX_VELOCITY_THRESHOLD;
        const gravity = isApex
          ? GRAVITY * APEX_GRAVITY_FACTOR
          : GRAVITY;

        velocityYRef.current = Math.max(
          velocityYRef.current - gravity * delta,
          -MAX_FALL_SPEED
        );

        let nextBottom = previousBottom + velocityYRef.current * delta;
        let landingBottom: number | null = null;

        if (velocityYRef.current <= 0) {
          // Check terrain support (platforms)
          for (const segment of terrainRef.current) {
            if (segment.kind === 'hole') {
              continue;
            }

            if (!hasHorizontalOverlap(cowXRef.current, COW_WIDTH, segment, 6)) {
              continue;
            }

            const segmentTop = segment.bottom;

            if (
              previousBottom >= segmentTop - 1 &&
              nextBottom <= segmentTop + 0.5
            ) {
              if (landingBottom === null || segmentTop > landingBottom) {
                landingBottom = segmentTop;
              }
            }
          }

          // Check obstacle/crate support for landing
          for (const obstacle of obstaclesRef.current) {
            if (
              !solidTypes.includes(obstacle.type) ||
              (obstacle.type === 'vanishing_platform' && obstacle.vanished) ||
              !hasHorizontalOverlap(cowXRef.current, COW_WIDTH, obstacle, 6)
            ) {
              continue;
            }

            const obstacleTop = obstacle.bottom + obstacle.height;

            if (
              previousBottom >= obstacleTop - 1.5 &&
              nextBottom <= obstacleTop + 0.5
            ) {
              if (landingBottom === null || obstacleTop > landingBottom) {
                landingBottom = obstacleTop;
              }
            }
          }

          if (nextBottom <= GROUND_HEIGHT) {
            if (landingBottom === null || GROUND_HEIGHT > landingBottom) {
              landingBottom = GROUND_HEIGHT;
            }
          }

          if (landingBottom !== null) {
            nextBottom = landingBottom;
            velocityYRef.current = 0;
            isGroundedRef.current = true;
            jumpCountRef.current = 0;
          }
        }

        cowBottomRef.current = nextBottom;
      }

      // Patrol enemies horizontally with strict AABB collision and gravity.
      for (const obstacle of obstaclesRef.current) {
        if (obstacle.type !== 'enemy') {
          continue;
        }

        const baseSpeed = obstacle.speed ?? ENEMY_SPEED;
        if (!obstacle.vx) {
          obstacle.vx = obstacle.facing === 'left' ? -baseSpeed : baseSpeed;
        }

        if (obstacle.startX === undefined) {
          obstacle.startX = obstacle.x;
        }
        if (obstacle.range === undefined) {
          obstacle.range = obstacle.bossConfig ? ENEMY_PATROL_RANGE * 2 : ENEMY_PATROL_RANGE;
        }

        // LÃ³gica de patrullaje independiente basada en coordenadas fijas de inicio y rango
        const minX = obstacle.startX - obstacle.range;
        const maxX = obstacle.startX + obstacle.range;

        if (obstacle.x <= minX) {
          obstacle.vx = Math.abs(baseSpeed);
          obstacle.x = minX + 4; // Margen de empuje limpio para evitar loops
        } else if (obstacle.x >= maxX) {
          obstacle.vx = -Math.abs(baseSpeed);
          obstacle.x = maxX - 4; // Margen de empuje limpio para evitar loops
        }

        // LÃ­mites del mundo izquierdo
        if (obstacle.x < 0) {
          obstacle.x = 4;
          obstacle.vx = Math.abs(baseSpeed);
        }

        // Movimiento horizontal con colisiÃ³n sÃ³lida contra plataformas.
        // El monstruo no puede atravesar cajas ni plataformas: rebota al chocar.
        const enemySolidTypes = [
          'crate',
          'destructible',
          'moving',
          'moving_platform',
          'vanishing_platform',
          'trap_platform',
          'floating',
          'cloud_trap',
        ];
        let nextEnemyX = obstacle.x + obstacle.vx * delta;

        for (const other of obstaclesRef.current) {
          if (other.id === obstacle.id) {
            continue;
          }
          if (!enemySolidTypes.includes(other.type)) {
            continue;
          }
          if (other.type === 'vanishing_platform' && other.vanished) {
            continue;
          }
          if (other.type === 'cloud_trap' && other.vanished) {
            continue;
          }

          const otherTop = other.bottom + other.height;
          const overlapsVertically =
            obstacle.bottom < otherTop - 2 &&
            obstacle.bottom + obstacle.height > other.bottom + 2;
          if (!overlapsVertically) {
            continue;
          }

          if (obstacle.vx > 0) {
            // Se aproxima desde la izquierda: choca contra el lado izquierdo
            if (
              obstacle.x < other.x &&
              nextEnemyX + obstacle.width > other.x
            ) {
              nextEnemyX = other.x - obstacle.width;
              obstacle.vx = -Math.abs(obstacle.vx);
            }
          } else if (obstacle.vx < 0) {
            // Se aproxima desde la derecha: choca contra el lado derecho
            if (
              obstacle.x + obstacle.width > other.x + other.width &&
              nextEnemyX < other.x + other.width
            ) {
              nextEnemyX = other.x + other.width;
              obstacle.vx = Math.abs(obstacle.vx);
            }
          }
        }

        obstacle.x = nextEnemyX;

        obstacle.facing = obstacle.vx < 0 ? 'left' : 'right';
        if (obstacle.bossConfig) {
          obstacle.bossConfig.vx = obstacle.vx;
        }

        // Gravity: enemies fall until resting on the ground or on a crate.
        const supportBottom = Math.max(
          getTerrainSupport(obstacle.x, obstacle.width, terrainRef.current),
          getSupportBottom(
            obstacle.x,
            obstacle.width,
            obstacle.bottom,
            obstaclesRef.current
          )
        );

        if (obstacle.bottom <= supportBottom + 0.5) {
          obstacle.bottom = supportBottom;
          obstacle.vy = 0;
        } else {
          const vy = (obstacle.vy ?? 0) - GRAVITY * delta;
          obstacle.vy = Math.max(vy, -MAX_FALL_SPEED);
          obstacle.bottom += obstacle.vy * delta;
          if (obstacle.bottom <= supportBottom) {
            obstacle.bottom = supportBottom;
            obstacle.vy = 0;
          }
        }
      }

      // Update moving platforms (Y), floating, vanishing, trap platforms, piranhas, and goal.
      let cowRidingMovingPlatform = false;
      for (const obstacle of obstaclesRef.current) {
        // Plataforma mÃ³vil en Y (sube y baja suavemente) - MOVIMIENTO AUTÓNOMO 100%
        if (obstacle.type === 'moving_platform' && obstacle.moveYSpeed && obstacle.moveYRange && obstacle.moveYStart !== undefined) {
          const dir = obstacle.moveYDir ?? 1;
          obstacle.bottom += dir * obstacle.moveYSpeed * delta;

          if (obstacle.bottom - obstacle.moveYStart >= obstacle.moveYRange) {
            obstacle.moveYDir = -1;
          } else if (obstacle.bottom <= obstacle.moveYStart - obstacle.moveYRange) {
            obstacle.moveYDir = 1;
          }

          // Si la vaquita estÃ¡ pisando esta plataforma, arrÃ¡ncala consigo (soporte sÃ³lido)
          const onPlatform = 
            isGroundedRef.current &&
            cowBottomRef.current >= obstacle.bottom + obstacle.height - 2 &&
            cowBottomRef.current <= obstacle.bottom + obstacle.height + 2 &&
            cowXRef.current + COW_WIDTH > obstacle.x + 4 &&
            cowXRef.current < obstacle.x + obstacle.width - 4;
          if (onPlatform) {
            cowBottomRef.current = obstacle.bottom + obstacle.height;
            cowRidingMovingPlatform = true;
          }
        }

        // Plataforma flotante existente
        if (obstacle.type === 'floating' && obstacle.vy && obstacle.range && obstacle.startBottom !== undefined) {
          // Movimiento vertical oscilante
          obstacle.bottom += obstacle.vy * delta;
          if (Math.abs(obstacle.bottom - obstacle.startBottom) >= obstacle.range) {
            obstacle.vy *= -1;
          }
          // Drift horizontal suave e independiente (parallax continuo)
          if (obstacle.vx !== undefined) {
            obstacle.x += obstacle.vx * delta;
            // Rebote suave en límites del mundo para mantenerlas en pantalla
            if (obstacle.x < -200) {
              obstacle.x = -200;
              obstacle.vx = Math.abs(obstacle.vx);
            } else if (obstacle.x > 6000) {
              obstacle.x = 6000;
              obstacle.vx = -Math.abs(obstacle.vx);
            }
          }
        }

        // Plataforma desvanecible: desaparece tras ser pisada VANISH_DELAY segundos
        if (obstacle.type === 'vanishing_platform' && !obstacle.vanished) {
          if (
            isGroundedRef.current &&
            cowBottomRef.current === obstacle.bottom + obstacle.height &&
            cowXRef.current + COW_WIDTH > obstacle.x &&
            cowXRef.current < obstacle.x + obstacle.width
          ) {
            if (obstacle.vanishStartTime === undefined) {
              obstacle.vanishStartTime = performance.now() / 1000;
            }
            const now = performance.now() / 1000;
            if (now - obstacle.vanishStartTime >= VANISH_DELAY) {
              obstacle.vanished = true;
            }
          }
        }

        // Nube trampa: se resquebraja al pisarse y cae tras CRACK_DELAY
        if (obstacle.type === 'cloud_trap' && !obstacle.cloudTrapCracked) {
          if (
            isGroundedRef.current &&
            cowBottomRef.current >= obstacle.bottom + obstacle.height - 2 &&
            cowBottomRef.current <= obstacle.bottom + obstacle.height + 2 &&
            cowXRef.current + COW_WIDTH > obstacle.x &&
            cowXRef.current < obstacle.x + obstacle.width
          ) {
            obstacle.cloudTrapCracked = true;
            obstacle.cloudTrapCrackTime = performance.now() / 1000;
          }
        } else if (obstacle.type === 'cloud_trap' && obstacle.cloudTrapCracked) {
          const now = performance.now() / 1000;
          if (now - (obstacle.cloudTrapCrackTime ?? now) >= CLOUD_TRAP_CRACK_DELAY) {
            obstacle.vanished = true; // desactiva colisión y render
          }
        }

        // Trampa con pinchos: se activa TRAP_ARM_DELAY segundos tras ser pisada
        if (obstacle.type === 'trap_platform' && !obstacle.trapTriggered) {
          if (
            isGroundedRef.current &&
            cowBottomRef.current >= obstacle.bottom + obstacle.height - 1 &&
            cowBottomRef.current <= obstacle.bottom + obstacle.height + 1 &&
            cowXRef.current + COW_WIDTH > obstacle.x &&
            cowXRef.current < obstacle.x + obstacle.width
          ) {
            if (obstacle.trapTriggerTime === undefined) {
              obstacle.trapTriggerTime = performance.now() / 1000;
              obstacle.trapArmed = true;
            }
            const now = performance.now() / 1000;
            if (now - obstacle.trapTriggerTime >= TRAP_ARM_DELAY) {
              obstacle.trapTriggered = true;
              triggerGameOver();
            }
          } else if (obstacle.trapTriggerTime !== undefined) {
            // Se soltÃ³ antes de armar: resetear
            obstacle.trapTriggerTime = undefined;
            obstacle.trapArmed = false;
          }
        }

        // Planta PiraÃ±a: sube y baja verticalmente desde una tuberÃ­a/plataforma
        // Planta Piraña: solo aparece (sube) cuando la vaquita salte sobre ella.
        // Mientras la vaquita pase por el suelo a su lado, la planta permanece
        // retraída en la tubería y es segura.
        if (obstacle.type === 'piranha') {
          const cowLeft = cowXRef.current;
          const cowRight = cowXRef.current + COW_WIDTH;
          const plantLeft = obstacle.x + 6;
          const plantRight = obstacle.x + obstacle.width - 6;
          const cowInAirAbovePlant =
            cowRight > plantLeft &&
            cowLeft < plantRight &&
            !isGroundedRef.current &&
            cowBottomRef.current > obstacle.bottom + 2;

          obstacle.piranhaUp = cowInAirAbovePlant;
        }

        // Trampa de púas: visible cuando la vaquita se acerca
        if (obstacle.type === 'spike_trap') {
          const now = performance.now() / 1000;
          const cowRight = cowXRef.current + COW_WIDTH;
          const cowLeft = cowXRef.current;
          const trapRight = obstacle.x + obstacle.width;
          const trapLeft = obstacle.x;
          const proximity = 220;

          const nearTrap = cowRight + proximity > trapLeft && cowLeft - proximity < trapRight;

          if (nearTrap) {
            if (obstacle.spikeTrapVisible !== true) {
              obstacle.spikeTrapVisible = true;
              obstacle.spikeTrapTimer = now;
            }
          } else if (obstacle.spikeTrapVisible === true) {
            if (obstacle.spikeTrapTimer === undefined) {
              obstacle.spikeTrapTimer = now;
            }
            if (now - obstacle.spikeTrapTimer > 0.5) {
              obstacle.spikeTrapVisible = false;
              obstacle.spikeTrapTimer = undefined;
            }
          }
        }
      }

      // Piedra trampa: se activa cuando la vaquita se para encima
      for (const obstacle of obstaclesRef.current) {
        if (obstacle.type !== 'stone_trap' || obstacle.stoneTrapActive) {
          continue;
        }
        const cowLeft = cowXRef.current;
        const cowRight = cowXRef.current + COW_WIDTH;
        const stoneLeft = obstacle.x;
        const stoneRight = obstacle.x + obstacle.width;
        const stoneTop = obstacle.bottom + obstacle.height;

        const onStone =
          cowRight > stoneLeft &&
          cowLeft < stoneRight &&
          cowBottomRef.current >= stoneTop - 8 &&
          cowBottomRef.current <= stoneTop + 8;

        if (onStone) {
          obstacle.stoneTrapActive = true;
        }
      }

      // Banco trampa: se activa cuando la vaquita se para encima
      for (const obstacle of obstaclesRef.current) {
        if (obstacle.type !== 'bench_trap' || obstacle.benchTrapActive) {
          continue;
        }
        const cowLeft = cowXRef.current;
        const cowRight = cowXRef.current + COW_WIDTH;
        const benchLeft = obstacle.x;
        const benchRight = obstacle.x + obstacle.width;
        const benchTop = obstacle.bottom + obstacle.height;

        const onBench =
          cowRight > benchLeft &&
          cowLeft < benchRight &&
          cowBottomRef.current >= benchTop - 8 &&
          cowBottomRef.current <= benchTop + 8;

        if (onBench) {
          obstacle.benchTrapActive = true;
        }
      }

      // Si la vaquita no estÃ¡ en el suelo y se moviÃ³ con plataforma, mantener grounded
      if (cowRidingMovingPlatform) {
        isGroundedRef.current = true;
        velocityYRef.current = 0;
      }

      // Update bullets: move them always to the right and resolve collisions.
      const bulletNowSeconds = performance.now() / 1000;
      if (bulletsRef.current.length > 0) {
        const weapon = WEAPONS[weaponRef.current];
        for (const bullet of bulletsRef.current) {
          // La bala viaja Ãºnicamente hacia la derecha hasta impactar.
          bullet.x += bullet.vx * delta;
        }

        const remainingBullets: Bullet[] = [];
        for (const bullet of bulletsRef.current) {
          const bulletRect: Rect = {
            x: bullet.x,
            bottom: bullet.y,
            width: bullet.width,
            height: bullet.height,
          };

          // --- DaÃ±o exclusivo a distancia contra el Boss ---
          // Contacto fÃ­sico del jugador con el Boss causa Game Over (no daÃ±o al Boss).
          // El Boss solo recibe daÃ±o por impacto de bala.
          let hitBoss: Obstacle | null = null;
          for (const obstacle of obstaclesRef.current) {
            if (!(obstacle.isBoss || obstacle.bossConfig)) {
              continue;
            }
            if (
              bullet.x >= obstacle.x &&
              bullet.x <= obstacle.x + obstacle.width &&
              bullet.y >= obstacle.bottom &&
              bullet.y <= obstacle.bottom + obstacle.height
            ) {
              hitBoss = obstacle;
              break;
            }
          }

          if (hitBoss) {
            const now = performance.now() / 1000;
            const bossHp = (hitBoss.health ?? 1) - 1;

            // Registrar tiempo de impacto para efecto visual de destello
            const idx = obstaclesRef.current.findIndex(
              (o) => o.id === hitBoss.id
            );
            if (idx !== -1) {
              obstaclesRef.current[idx].lastHitTime = now;
            }

            // Spawn effect at position
            deathEffectIdRef.current += 1;
            deathEffectsRef.current.push({
              id: deathEffectIdRef.current,
              x: hitBoss.x + hitBoss.width / 2,
              y: hitBoss.bottom + hitBoss.height / 2,
              born: now,
            });

            if (bossHp <= 0) {
              // El Boss es eliminado del mapa
              obstaclesRef.current = obstaclesRef.current.filter(
                (o) => o.id !== hitBoss.id
              );
              setObstacles([...obstaclesRef.current]);

              const coinReward = 25;
              const scoreReward = 15;
              const coinsToSpawn = 5;
              for (let c = 0; c < coinsToSpawn; c++) {
                floatingCoinsRef.current.push({
                  id: Date.now() + c,
                  x: hitBoss.x + hitBoss.width / 2 + (c - 2) * 12,
                  y: hitBoss.bottom + hitBoss.height / 2 + (c % 2) * 15,
                  born: now,
                });
              }
              setFloatingCoins([...floatingCoinsRef.current]);

              scoreRef.current += scoreReward;
              setScore(scoreRef.current);
              coinsRefCount.current += coinReward;
              setCoins(coinsRefCount.current);
              checkWeaponUpgrade(coinsRefCount.current);
            } else {
              if (idx !== -1) {
                obstaclesRef.current[idx].health = bossHp;
                setObstacles([...obstaclesRef.current]);
              }
            }
            // Remover la bala que impactÃ³ al Boss; no sigue viaje
            continue;
          }

          let hitEnemy: Obstacle | null = null;
          let hitSolid: Obstacle | null = null;

          for (const obstacle of obstaclesRef.current) {
            const checkRect =
              obstacle.type === 'enemy' || obstacle.type === 'piranha'
                ? getBossCollisionBox(obstacle)
                : obstacle;
            if (aabbOverlap(bulletRect, checkRect)) {
              if (
                obstacle.type === 'enemy' ||
                obstacle.type === 'piranha' ||
                obstacle.type === 'destructible' ||
                obstacle.type === 'moving'
              ) {
                hitEnemy = obstacle;
                break;
              } else if (!hitSolid) {
                hitSolid = obstacle;
              }
            }
          }

          const hitObstacle = hitEnemy || hitSolid;

          if (hitObstacle) {
            const isDestroyable =
              hitObstacle.type === 'enemy' ||
              hitObstacle.type === 'piranha' ||
              hitObstacle.type === 'destructible' ||
              hitObstacle.type === 'moving';

            if (isDestroyable) {
              const now = performance.now() / 1000;
              const currentHealth = hitObstacle.health ?? 1;
              const bulletDamage = weapon.damage ?? 1;
              const newHealth = currentHealth - bulletDamage;

              // Registrar tiempo de impacto para efecto visual de destello
              const idx = obstaclesRef.current.findIndex(
                (o) => o.id === hitObstacle.id
              );
              if (idx !== -1) {
                obstaclesRef.current[idx].lastHitTime = now;
              }

              // Spawn effect at position
              deathEffectIdRef.current += 1;
              deathEffectsRef.current.push({
                id: deathEffectIdRef.current,
                x: hitObstacle.x + hitObstacle.width / 2,
                y: hitObstacle.bottom + hitObstacle.height / 2,
                born: now,
              });

              if (newHealth <= 0) {
                hitObstacle.isDead = true;
                obstaclesRef.current = obstaclesRef.current.filter(
                  (o) => o.id !== hitObstacle.id
                );
                setObstacles([...obstaclesRef.current]);

                const isBossDefeated = hitObstacle.isBoss || hitObstacle.bossConfig;
                const coinReward = isBossDefeated ? 25 : COIN_BONUS_PER_KILL;
                const scoreReward = isBossDefeated ? 15 : 1;

                // Spawneo de monedas de recompensa (mÃºltiples si es jefe)
                const coinsToSpawn = isBossDefeated ? 5 : 1;
                for (let c = 0; c < coinsToSpawn; c++) {
                  floatingCoinsRef.current.push({
                    id: Date.now() + c,
                    x: hitObstacle.x + hitObstacle.width / 2 + (c - 2) * 12,
                    y: hitObstacle.bottom + hitObstacle.height / 2 + (c % 2) * 15,
                    born: now,
                  });
                }
                setFloatingCoins([...floatingCoinsRef.current]);

                scoreRef.current += scoreReward;
                setScore(scoreRef.current);
                coinsRefCount.current += coinReward;
                setCoins(coinsRefCount.current);
                checkWeaponUpgrade(coinsRefCount.current);
              } else {
                if (idx !== -1) {
                  obstaclesRef.current[idx].health = newHealth;
                }
                setObstacles([...obstaclesRef.current]);
              }
            }
            continue;
          }

          if (
            bullet.x < cameraXRef.current - 80 ||
            bullet.x + bullet.width > cameraXRef.current + screenWidth + 80 ||
            bulletNowSeconds - bullet.born > weapon.lifetime
          ) {
            continue;
          }

          remainingBullets.push(bullet);
        }

        bulletsRef.current = remainingBullets;
        setBullets([...remainingBullets]);
      }

      // Clean up old floating coins
      const now = performance.now() / 1000;
      floatingCoinsRef.current = floatingCoinsRef.current.filter(
        (coin) => now - coin.born < 2.5
      );
      setFloatingCoins([...floatingCoinsRef.current]);

      // Clean up old death effects
      deathEffectsRef.current = deathEffectsRef.current.filter(
        (effect) => now - effect.born < 0.6
      );
      setDeathEffects([...deathEffectsRef.current]);

cameraXRef.current = Math.max(0, cowXRef.current - CAMERA_OFFSET_X);

      // Player vs patrolling enemy collision (AABB).
      // Nota: El daÃ±o al jefe y monstruos ahora se realiza EXCLUSIVAMENTE a distancia mediante disparos (proyectiles/balas).
      // El contacto fÃ­sico del monstruo con la vaquita sigue provocando Game Over.
      for (const obstacle of obstaclesRef.current) {
        if (obstacle.type !== 'enemy' && obstacle.type !== 'piranha') {
          continue;
        }

        // La piraÃ±a solo daÃ±a cuando estÃ¡ visible (saliÃ³ de la tuberÃ­a).
        if (obstacle.type === 'piranha' && !obstacle.piranhaUp) {
          continue;
        }

        if (intersectsEnemy(cowXRef.current, cowBottomRef.current, obstacle)) {
          triggerGameOver();
          break;
        }
      }

      // Contacto con trampa con pinchos activada â†’ Game Over
      for (const obstacle of obstaclesRef.current) {
        if (obstacle.type !== 'trap_platform' || !obstacle.trapTriggered) {
          continue;
        }

        if (intersectsHazard(cowXRef.current, cowBottomRef.current, obstacle)) {
          triggerGameOver();
          break;
        }
      }

      // Only spikes are lethal obstacles; platforms and crates are safe.
      for (const obstacle of obstaclesRef.current) {
        const isTrapSpike = obstacle.type === 'spike_trap' && obstacle.spikeTrapVisible;
        const isActiveStoneTrap = obstacle.type === 'stone_trap' && obstacle.stoneTrapActive;
        const isActiveBenchTrap = obstacle.type === 'bench_trap' && obstacle.benchTrapActive;
        if (
          obstacle.type !== 'spike' &&
          !isActiveStoneTrap &&
          !isActiveBenchTrap &&
          !isTrapSpike
        ) {
          continue;
        }

        if (isTrapSpike) {
          const hazard: Obstacle = {
            ...obstacle,
            bottom: obstacle.bottom,
            height: obstacle.height,
          };
          if (intersectsHazard(cowXRef.current, cowBottomRef.current, hazard)) {
            triggerGameOver();
            break;
          }
          continue;
        }

        if (intersectsHazard(cowXRef.current, cowBottomRef.current, obstacle)) {
          triggerGameOver();
          break;
        }
      }

      if (gameOverRef.current) {
        updateView();
        running = false;
        return;
      }

      for (const obstacle of obstaclesRef.current) {
        if (!obstacle.scored && obstacle.x + obstacle.width < cowXRef.current) {
          obstacle.scored = true;
          scoreRef.current += 1;
          setScore(scoreRef.current);
        }
      }

      // Collect static coins (AABB collision with cow)
      const cowLeft = cowXRef.current;
      const cowRight = cowXRef.current + COW_WIDTH;
      const cowTop = cowBottomRef.current;
      const cowBottom = cowBottomRef.current + COW_HEIGHT;

      let staticCoinsCollected = 0;
      coinsRefState.current = coinsRefState.current.filter((coin) => {
        if (coin.collected) {
          return false;
        }
        const r = COIN_COLLECT_RADIUS;
        const coinLeft = coin.x - r;
        const coinRight = coin.x + r;
        const coinTop = coin.y - r;
        const coinBottom = coin.y + r;

        if (
          cowLeft < coinRight &&
          cowRight > coinLeft &&
          cowTop < coinBottom &&
          cowBottom > coinTop
        ) {
          staticCoinsCollected += 1;
          return false; // Remove collected coin
        }
        return true;
      });
      setLevelCoins([...coinsRefState.current]);

      // Collect floating coins (AABB collision with cow)

      let coinsCollected = staticCoinsCollected;
      const remainingCoins = floatingCoinsRef.current.filter((coin) => {
        const r = COIN_COLLECT_RADIUS;
        const coinLeft = coin.x - r;
        const coinRight = coin.x + r;
        const coinTop = coin.y - r;
        const coinBottom = coin.y + r;

        if (
          cowLeft < coinRight &&
          cowRight > coinLeft &&
          cowTop < coinBottom &&
          cowBottom > coinTop
        ) {
          coinsCollected += 1;
          return false; // Remove collected coin
        }
        return true;
      });

      floatingCoinsRef.current = remainingCoins;
      setFloatingCoins([...remainingCoins]);

      if (coinsCollected > 0) {
        coinsRefCount.current += coinsCollected;
        setCoins(coinsRefCount.current);
        checkWeaponUpgrade(coinsRefCount.current);
      }

      let generatedObstacle = false;

      while (
        nextObstacleXRef.current <
        cameraXRef.current + screenWidth + GENERATION_AHEAD
      ) {
        const lastObstacleX = obstaclesRef.current.length > 0
          ? Math.max(...obstaclesRef.current.map((o) => o.x))
          : 0;

        if (nextObstacleXRef.current - lastObstacleX < SPAWN_GAP) {
          nextObstacleXRef.current = lastObstacleX + SPAWN_GAP;
          continue;
        }

        const terrainBottom = getTerrainBottomAt(
          nextObstacleXRef.current,
          terrainRef.current
        );
        obstacleIdRef.current += 1;
        const newObstacle = createObstacle(
          obstacleIdRef.current,
          nextObstacleXRef.current,
          terrainBottom
        );
        obstaclesRef.current.push(newObstacle);

        // Extra spacing after enemies so they don't spawn glued to crates/spikes
        if (newObstacle.type === 'enemy') {
          nextObstacleXRef.current += SPAWN_GAP;
        } else {
          nextObstacleXRef.current += randomBetween(
            OBSTACLE_GAP_MIN,
            OBSTACLE_GAP_MAX
          );
        }
        generatedObstacle = true;
      }

      // Generate terrain segments ahead of the camera
      let generatedTerrain = false;
      const lastTerrain = terrainRef.current[terrainRef.current.length - 1];
      let terrainEnd = lastTerrain ? lastTerrain.x + lastTerrain.width : 0;
      const targetEnd = cameraXRef.current + screenWidth + GENERATION_AHEAD;
      const MAX_TERRAIN_SEGMENTS = 100;

      while (terrainEnd < targetEnd && terrainRef.current.length < MAX_TERRAIN_SEGMENTS) {
        const width = randomBetween(80, 180);
        terrainRef.current.push({
          id: terrainRef.current.length,
          x: terrainEnd,
          width,
          bottom: GROUND_HEIGHT,
          kind: 'ground',
        });
        terrainEnd += width;
        generatedTerrain = true;
      }

      // Clean up terrain segments that are far behind the camera
      const cleanupThreshold = cameraXRef.current - 200;
      terrainRef.current = terrainRef.current.filter(
        (segment) => segment.x + segment.width > cleanupThreshold
      );

      if (generatedObstacle) {
        setObstacles([...obstaclesRef.current]);
      }
      if (generatedTerrain) {
        setTerrain([...terrainRef.current]);
      }

      // Check for weapon upgrade based on coins
      checkWeaponUpgrade(coinsRefCount.current);

      // Visuales con tiempo: se calculan aquí (dentro del loop) para que los
      // componentes de render sigan siendo puros (react-hooks/purity).
      const visualNow = performance.now() / 1000;
      for (const obstacle of obstaclesRef.current) {
        obstacle.hitFlash =
          obstacle.lastHitTime !== undefined && visualNow - obstacle.lastHitTime < 0.2;
        obstacle.trapShakeY = obstacle.trapTriggered ? Math.sin(visualNow * 20) * 10 : 0;
      }

      updateView();

      frameId = requestAnimationFrame(loop);
    };

    const start = () => {
      if (running) {
        return;
      }

      running = true;
      lastTime = 0;
      frameId = requestAnimationFrame(loop);
    };

    startLoopRef.current = start;
    start();

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [screenHeight, screenWidth]);

  const requestStart = useCallback(() => {
    startLoopRef.current?.();
  }, []);

  const updateHorizontalVelocity = useCallback(() => {
    if (gameOverRef.current) {
      velocityXRef.current = 0;
      return;
    }

    if (leftHeldRef.current === rightHeldRef.current) {
      // No direction held: stop instantly on the ground, but keep air
      // inertia in the loop instead of cutting momentum abruptly.
      if (isGroundedRef.current) {
        velocityXRef.current = 0;
      }
      return;
    }

    const targetSpeed = !isGroundedRef.current ? AIR_MOVE_SPEED : MOVE_SPEED;
    velocityXRef.current = leftHeldRef.current ? -targetSpeed : targetSpeed;
  }, []);

  const handleLeftPressIn = useCallback(() => {
    if (gameOverRef.current) {
      return;
    }

    isPressingLeftRef.current = true;
    isMovingLeftRef.current = true;
    leftHeldRef.current = true;
    setFacing('left');
    updateHorizontalVelocity();
    requestStart();
  }, [requestStart, updateHorizontalVelocity]);

  const handleLeftPressOut = useCallback(() => {
    isPressingLeftRef.current = false;
    isMovingLeftRef.current = false;
    leftHeldRef.current = false;
    updateHorizontalVelocity();
  }, [updateHorizontalVelocity]);

  const handleRightPressIn = useCallback(() => {
    if (gameOverRef.current) {
      return;
    }

    isPressingRightRef.current = true;
    isMovingRightRef.current = true;
    rightHeldRef.current = true;
    setFacing('right');
    updateHorizontalVelocity();
    requestStart();
  }, [requestStart, updateHorizontalVelocity]);

  const handleRightPressOut = useCallback(() => {
    isPressingRightRef.current = false;
    isMovingRightRef.current = false;
    rightHeldRef.current = false;
    updateHorizontalVelocity();
  }, [updateHorizontalVelocity]);

  const handleJumpPressIn = useCallback(() => {
    if (gameOverRef.current) {
      return;
    }

    if (isGroundedRef.current) {
      velocityYRef.current = JUMP_SPEED;
      isGroundedRef.current = false;
      jumpCountRef.current = 0;
    } else if (jumpCountRef.current < MAX_JUMPS) {
      velocityYRef.current = JUMP_SPEED;
      jumpCountRef.current += 1;
    }
    requestStart();
  }, [requestStart]);

  const shoot = useCallback(() => {
    if (gameOverRef.current) {
      return;
    }

    const weapon = WEAPONS[weaponRef.current];
    const now = performance.now() / 1000;
    if (now - lastShotRef.current < weapon.cooldown) {
      return;
    }

    lastShotRef.current = now;
    setMuzzleFlashBorn(now);

    const muzzleX =
      facing === 'right'
        ? cowXRef.current + COW_WIDTH + 10
        : cowXRef.current - 24;
    const muzzleY = cowBottomRef.current + COW_HEIGHT * 0.45;

    // Multi-shot: fire multiple projectiles with spread
    for (let i = 0; i < weapon.multiShot; i++) {
      const spreadOffset =
        weapon.multiShot > 1
          ? (i - (weapon.multiShot - 1) / 2) * weapon.spread
          : 0;

      bulletIdRef.current += 1;
      const bullet: Bullet = {
        id: bulletIdRef.current,
        x: muzzleX + spreadOffset * 50,
        y: muzzleY + spreadOffset * 20,
        dir: facing,
        vx: facing === 'right' ? weapon.speed : -weapon.speed,
        width: BULLET_RADIUS * 3,
        height: BULLET_RADIUS * 2,
        born: now,
      };

      bulletsRef.current.push(bullet);
    }

    setBullets([...bulletsRef.current]);
    requestStart();
  }, [facing, requestStart]);

  const handleShootPressIn = useCallback(() => {
    shoot();
  }, [shoot]);

  // Keyboard controls for PC/Web
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (gameOverRef.current) {
        return;
      }

      switch (event.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          event.preventDefault();
          handleLeftPressIn();
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          event.preventDefault();
          handleRightPressIn();
          break;
        case ' ':
        case 'ArrowUp':
        case 'w':
        case 'W':
          event.preventDefault();
          handleJumpPressIn();
          break;
        case 'f':
        case 'F':
          event.preventDefault();
          handleShootPressIn();
          break;
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          handleLeftPressOut();
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          handleRightPressOut();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleLeftPressIn, handleLeftPressOut, handleRightPressIn, handleRightPressOut, handleJumpPressIn, handleShootPressIn]);

  const restart = useCallback(() => {
    const levelId = levelRef.current;
    const initialObstacles = createInitialObstacles(levelId);
    const initialTerrain = createInitialTerrain();
    const initialCoins = createLevelCoins(levelId);

    cowXRef.current = PLAYER_START_X;
    cowBottomRef.current = GROUND_HEIGHT;
    cameraXRef.current = 0;
    velocityXRef.current = 0;
    velocityYRef.current = 0;
    isGroundedRef.current = true;
    leftHeldRef.current = false;
    rightHeldRef.current = false;
    isMovingRightRef.current = false;
    isMovingLeftRef.current = false;
    isPressingLeftRef.current = false;
    isPressingRightRef.current = false;
    obstaclesRef.current = initialObstacles;
    terrainRef.current = initialTerrain;
    bulletsRef.current = [];
    floatingCoinsRef.current = [];
    coinsRefState.current = initialCoins;
    coinsRef.current = [];
    deathEffectsRef.current = [];
    bulletIdRef.current = 0;
    lastShotRef.current = 0;
    scoreRef.current = 0;
    coinsRefCount.current = 0;
    weaponRef.current = 0;
    nextObstacleXRef.current = INITIAL_NEXT_OBSTACLE_X;
    obstacleIdRef.current = initialObstacles.length;
    gameOverRef.current = false;

    setGameOver(false);
    setCowDead(false);
    levelCompletedRef.current = false;
    setLevelCompleted(false);
    setObstacles(initialObstacles);
    setTerrain(initialTerrain);
    setBullets([]);
    setFloatingCoins([]);
    setLevelCoins(initialCoins);
    setDeathEffects([]);
    setMuzzleFlashBorn(0);
    setView({
      cowScreenX: PLAYER_START_X,
      cowBottom: GROUND_HEIGHT,
      cameraX: 0,
      now: performance.now() / 1000,
      isMoving: false,
      isGrounded: true,
    });
    setFacing('right');
    setScore(0);
    setCoins(0);
    setCurrentWeapon(0);

    requestStart();
  }, [requestStart]);

  const advanceLevel = useCallback(() => {
    const nextLevelId = Math.min(LEVELS.length, levelRef.current + 1);
    levelRef.current = nextLevelId;
    setCurrentLevel(nextLevelId);

    const initialObstacles = createInitialObstacles(nextLevelId);
    const initialTerrain = createInitialTerrain();
    const initialCoins = createLevelCoins(nextLevelId);

    cowXRef.current = PLAYER_START_X;
    cowBottomRef.current = GROUND_HEIGHT;
    cameraXRef.current = 0;
    velocityXRef.current = 0;
    velocityYRef.current = 0;
    isGroundedRef.current = true;
    leftHeldRef.current = false;
    rightHeldRef.current = false;
    isMovingRightRef.current = false;
    isMovingLeftRef.current = false;
    isPressingLeftRef.current = false;
    isPressingRightRef.current = false;
    obstaclesRef.current = initialObstacles;
    terrainRef.current = initialTerrain;
    bulletsRef.current = [];
    floatingCoinsRef.current = [];
    coinsRefState.current = initialCoins;
    coinsRef.current = [];
    deathEffectsRef.current = [];
    bulletIdRef.current = 0;
    lastShotRef.current = 0;
    scoreRef.current = 0;
    coinsRefCount.current = 0;
    weaponRef.current = 0;
    nextObstacleXRef.current = INITIAL_NEXT_OBSTACLE_X;
    obstacleIdRef.current = initialObstacles.length;
    gameOverRef.current = false;

    setGameOver(false);
    setCowDead(false);
    levelCompletedRef.current = false;
    setLevelCompleted(false);
    setObstacles(initialObstacles);
    setTerrain(initialTerrain);
    setBullets([]);
    setFloatingCoins([]);
    setLevelCoins(initialCoins);
    setDeathEffects([]);
    setMuzzleFlashBorn(0);
    setView({
      cowScreenX: PLAYER_START_X,
      cowBottom: GROUND_HEIGHT,
      cameraX: 0,
      now: performance.now() / 1000,
      isMoving: false,
      isGrounded: true,
    });
    setFacing('right');
    setScore(0);
    setCoins(0);
    setCurrentWeapon(0);

    requestStart();
  }, [requestStart]);


  // Al alcanzar la meta: pasar al siguiente nivel automÃ¡ticamente (si queda alguno)
  useEffect(() => {
    if (!levelCompleted || levelRef.current >= LEVELS.length) {
      return;
    }
    const timer = setTimeout(() => advanceLevel(), 1800);
    return () => clearTimeout(timer);
  }, [levelCompleted, advanceLevel]);

  const visibleObstacles = obstacles.filter(
    (obs) => obs.x + obs.width > view.cameraX && obs.x < view.cameraX + screenWidth
  );
  const visibleBullets = bullets.filter(
    (b) => b.x + 5 > view.cameraX && b.x - 5 < view.cameraX + screenWidth
  );
  const visibleCoins = levelCoins.filter(
    (c) => !c.collected && c.x + c.width > view.cameraX && c.x < view.cameraX + screenWidth
  );

  // ---- SelecciÃ³n de sprite de la vaquita ----
  // Prioridad: disparando > en el aire > caminando > reposo
  const isShooting = muzzleFlashBorn > 0 && view.now - muzzleFlashBorn < 0.2;
  const walkFrame = Math.floor(view.now * 4) % 2; // alterna cada 250ms
  const cowSprite = cowDead
    ? IMG_COW_DEATH
    : isShooting
      ? IMG_COW_ATTACK
      : !view.isGrounded
        ? IMG_COW_JUMP
        : view.isMoving
          ? walkFrame === 0
            ? IMG_COW_WALK_1
            : IMG_COW_WALK_2
          : IMG_COW_IDLE;
  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/fondo.jpg')}
        style={styles.bgImage}
        resizeMode="cover"
      />

      {currentLevel > 0 && (
        <Text style={styles.levelText}>
          NIVEL {currentLevel}{' '}
          {levelCompleted ? '🟢 COMPLETADO' : ''}
        </Text>
      )}

      {visibleObstacles.map((obstacle) => {
        const left = Number(obstacle.x - view.cameraX);
        switch (obstacle.type) {
          case 'crate':
            return <CrateObstacle key={obstacle.id} obstacle={obstacle} left={left} />;
          case 'spike':
            return <SpikeObstacle key={obstacle.id} obstacle={obstacle} left={left} />;
          case 'stone_trap':
            return <StoneTrapObstacle key={obstacle.id} obstacle={obstacle} left={left} />;
          case 'bench_trap':
            return <BenchTrapObstacle key={obstacle.id} obstacle={obstacle} left={left} />;
          case 'mud':
            return <MudZone key={obstacle.id} obstacle={obstacle} left={left} />;
          case 'cloud_trap':
            return <CloudTrapPlatform key={obstacle.id} obstacle={obstacle} left={left} now={view.now} />;
          case 'enemy':
            return (
              <EnemyObstacle
                key={obstacle.id}
                obstacle={obstacle}
                left={left}
                cowScreenX={view.cowScreenX}
              />
            );
          case 'destructible':
            return <DestructibleObstacle key={obstacle.id} obstacle={obstacle} left={left} />;
          case 'moving':
            return <MovingObstacle key={obstacle.id} obstacle={obstacle} left={left} />;
          case 'floating':
            return <FloatingObstacle key={obstacle.id} obstacle={obstacle} left={left} />;
          case 'trap_platform':
            return <TrapPlatform key={obstacle.id} obstacle={obstacle} left={left} />;
          case 'moving_platform':
            return <MovingPlatform key={obstacle.id} obstacle={obstacle} left={left} />;
          case 'vanishing_platform':
            return <VanishingPlatform key={obstacle.id} obstacle={obstacle} left={left} />;
          case 'water':
            return <WaterZone key={obstacle.id} obstacle={obstacle} left={left} />;
          case 'piranha':
            return <Piranha key={obstacle.id} obstacle={obstacle} left={left} />;
          case 'spike_trap':
            return <SpikeTrap key={obstacle.id} obstacle={obstacle} left={left} />;
          case 'goal':
            return <Goal key={obstacle.id} obstacle={obstacle} left={left} />;
          default:
            return null;
        }
      })}

      {visibleBullets.map((bullet) => (
        <View
          key={bullet.id}
          style={[
            styles.bullet,
            {
              left: Number(bullet.x - view.cameraX),
              bottom: Number(bullet.y - BULLET_RADIUS),
            },
          ]}
        >
          <View style={styles.bulletCore} />
          <View style={styles.bulletTrail} />
        </View>
      ))}

      {floatingCoins.map((coin) => (
        <FloatingCoinComponent
          key={coin.id}
          coin={coin}
          cameraX={view.cameraX}
          now={view.now}
        />
      ))}

      {visibleCoins.map((coin) => (
        <View
          key={coin.id}
          style={[
            styles.coin,
            {
              left: Number(coin.x - view.cameraX),
              bottom: Number(coin.y),
            },
          ]}
        >
          <View style={styles.coinShine} />
        </View>
      ))}

      {deathEffects.map((effect) => {
        const age = Math.max(0, view.now - effect.born);
        const opacity = Math.max(0, 1 - age / 0.6);
        const scale = Math.max(0.3, 1 - age / 0.6);
        const left = Number(effect.x - view.cameraX - 12);
        const bottom = Number(effect.y + 16);
        return (
          <View
            key={effect.id}
            style={[
              styles.deathEffect,
              {
                left,
                bottom,
                opacity,
                transform: [{ scale }],
              },
            ]}
          >
            <View style={styles.deathParticle} />
            <View style={[styles.deathParticle, { left: 6 }]} />
            <View style={[styles.deathParticle, { left: 12 }]} />
          </View>
        );
      })}

      {view.now - muzzleFlashBorn < 0.12 && (
        <View
          style={[
            styles.muzzleFlash,
            {
              left: Number(
                facing === 'right'
                  ? view.cowScreenX + COW_WIDTH - 6
                  : view.cowScreenX - 16
              ),
              bottom: Number(view.cowBottom + COW_HEIGHT * 0.45),
            },
          ]}
        />
      )}

      <Cow
        facing={facing}
        width={COW_WIDTH}
        height={COW_HEIGHT}
        isMoving={view.isMoving}
        isJumping={!view.isGrounded}
        spriteSource={cowSprite}
        resizeMode={cowDead ? 'cover' : 'contain'}
        style={[
          styles.cow,
          {
            left: Number(view.cowScreenX),
            bottom: Number(view.cowBottom),
          },
        ]}
      />

      <CurrentScore score={score} />

      {/* Weapon and coins HUD */}
      <View style={styles.hud}>
        <View style={styles.hudWeapon}>
          <View
            style={[
              styles.hudWeaponRow,
              {
                borderLeftWidth: currentWeapon > 0 ? 4 : 0,
                borderLeftColor: currentWeapon > 0 ? '#ffe14d' : 'transparent',
              },
            ]}
          >
            <Text
              style={[
                styles.hudWeaponText,
                currentWeapon > 0 && styles.hudWeaponUpgraded,
              ]}
            >
              {currentWeapon > 0 ? 'â­ ' : ''}
              {WEAPONS[currentWeapon].name} · Nv.{currentWeapon + 1}
            </Text>
          </View>
          <View style={styles.hudCoinRow}>
            <View style={styles.hudCoinDot} />
            <Text style={styles.hudCoinsText}>{coins}</Text>
          </View>
          {currentWeapon > 0 && (
            <Text style={styles.hudUpgradeText}>ARMA MEJORADA</Text>
          )}
        </View>
      </View>

      <View style={styles.ground}>
        <View style={styles.stoneRow}>
          {Array.from({ length: 8 }).map((_, index) => (
            <View key={index} style={styles.stoneBlock} />
          ))}
        </View>
        <View style={styles.grass}>
          <View style={styles.grassHighlight} />
          <View style={styles.grassTufts}>
            {Array.from({ length: 16 }).map((_, index) => (
              <View key={index} style={styles.grassTufts} />
            ))}
          </View>
        </View>
      </View>

      <TouchControls
        key={gameOver ? 'game-over' : 'playing'}
        disabled={gameOver}
        onLeftPressIn={handleLeftPressIn}
        onLeftPressOut={handleLeftPressOut}
        onRightPressIn={handleRightPressIn}
        onRightPressOut={handleRightPressOut}
        onJumpPressIn={handleJumpPressIn}
        onShootPressIn={handleShootPressIn}
      />

      <GameOverModal
        visible={gameOver}
        score={score}
        bestScore={bestScore}
        onRestart={restart}
        onExit={onExit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  backgroundLayer: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    zIndex: -1,
  },
  bgImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    zIndex: -1,
  },
  landscape: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'column',
    overflow: 'hidden',
  },
  skyBand: {
    flex: 1,
  },
  hill: {
    position: 'absolute',
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999,
  },
  hillFarOne: {
    left: '-30%',
    bottom: GROUND_HEIGHT - 6,
    width: '85%',
    height: 180,
    backgroundColor: '#b3e094',
  },
  hillFarTwo: {
    left: '30%',
    bottom: GROUND_HEIGHT - 4,
    width: '95%',
    height: 205,
    backgroundColor: '#a3d787',
  },
  hillMidOne: {
    left: '-20%',
    bottom: GROUND_HEIGHT - 10,
    width: '70%',
    height: 145,
    backgroundColor: '#83ca67',
  },
  hillMidTwo: {
    left: '42%',
    bottom: GROUND_HEIGHT - 8,
    width: '80%',
    height: 165,
    backgroundColor: '#72be56',
  },
  horizonHaze: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: GROUND_HEIGHT,
    height: 34,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
  },
  forestRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: GROUND_HEIGHT - 2,
    height: 54,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    paddingHorizontal: 2,
  },
  tree: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  treeFoliage: {
    width: 0,
    height: 0,
    borderLeftWidth: 9,
    borderRightWidth: 9,
    borderBottomWidth: 26,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#2f7d3a',
  },
  treeTrunk: {
    width: 4,
    height: 8,
    backgroundColor: '#5b3d27',
    borderBottomLeftRadius: 1,
    borderBottomRightRadius: 1,
  },
  loadingText: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 24,
  },
  cow: {
    position: 'absolute',
    width: COW_WIDTH,
    height: COW_HEIGHT,
  },
  obstacle: {
    position: 'absolute',
    bottom: 0,
  },
  obstacleImg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  stonePlatform: {
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#4b4238',
    backgroundColor: '#6f6559',
    shadowColor: '#0a1a12',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.45,
    shadowRadius: 9,
    elevation: 8,
  },
  stoneShade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '38%',
    backgroundColor: 'rgba(38, 32, 26, 0.28)',
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  stoneHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  stoneSeamHorizontal: {
    position: 'absolute',
    left: 8,
    right: 8,
    top: '46%',
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(40, 35, 29, 0.4)',
  },
  stoneSeamVertical: {
    position: 'absolute',
    top: '46%',
    bottom: 8,
    left: '50%',
    width: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(40, 35, 29, 0.35)',
  },
  stoneMossLeft: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    width: '38%',
    height: '40%',
    backgroundColor: 'rgba(110, 180, 70, 0.32)',
    borderTopRightRadius: 26,
  },
  stoneMossRight: {
    position: 'absolute',
    right: 0,
    top: '30%',
    width: '26%',
    height: '34%',
    backgroundColor: 'rgba(110, 180, 70, 0.22)',
    borderBottomLeftRadius: 18,
  },
  woodPlatform: {
    borderRadius: 10,
    borderWidth: 3,
    borderColor: '#5a381c',
    backgroundColor: '#8a5a2f',
    shadowColor: '#1e1206',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.45,
    shadowRadius: 9,
    elevation: 8,
  },
  woodPlankLineOne: {
    position: 'absolute',
    left: 6,
    right: 6,
    top: '34%',
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(70, 42, 20, 0.55)',
  },
  woodPlankLineTwo: {
    position: 'absolute',
    left: 6,
    right: 6,
    top: '68%',
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(70, 42, 20, 0.5)',
  },
  woodGrainOne: {
    position: 'absolute',
    left: '16%',
    width: '52%',
    top: '22%',
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(60, 35, 15, 0.32)',
    transform: [{ rotate: '-2deg' }],
  },
  woodGrainTwo: {
    position: 'absolute',
    right: '14%',
    width: '40%',
    top: '80%',
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(60, 35, 15, 0.28)',
    transform: [{ rotate: '2deg' }],
  },
  woodTopHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 5,
    backgroundColor: 'rgba(255, 210, 150, 0.28)',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  woodMoss: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    width: '34%',
    height: '30%',
    backgroundColor: 'rgba(110, 180, 70, 0.26)',
    borderTopRightRadius: 20,
  },
  platformGrass: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 14,
    backgroundColor: '#7ed957',
    borderBottomWidth: 3,
    borderBottomColor: '#4f9e2f',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  platformGrassThin: {
    height: 8,
    borderBottomWidth: 2,
  },
  platformGrassHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.32)',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  spikeSlot: {
    position: 'absolute',
    bottom: 0,
  },
  spike: {
    borderRadius: 10,
    shadowColor: '#ff2d2d',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 12,
    elevation: 8,
  },
  spikeDirt: {
    position: 'absolute',
    left: -4,
    right: -4,
    bottom: 0,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3f2a1b',
  },
  spikeGlow: {
    position: 'absolute',
    top: -10,
    left: -8,
    right: -8,
    bottom: -2,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 120, 100, 0.35)',
  },
  spikeTriangle: {
    width: 0,
    height: 0,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#ff2b2b',
    borderTopWidth: 0,
  },
  spikeHighlight: {
    position: 'absolute',
    bottom: 0,
    width: 0,
    height: 0,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#ff8a6b',
    borderTopWidth: 0,
  },
  spikeBase: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#7a1f16',
  },
  ground: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: GROUND_HEIGHT,
    backgroundColor: '#7b6650',
    borderTopWidth: 4,
    borderTopColor: '#4f3f2f',
  },
  stoneRow: {
    position: 'absolute',
    top: 26,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingHorizontal: 4,
  },
  stoneBlock: {
    flex: 1,
    marginHorizontal: 3,
    marginVertical: 4,
    backgroundColor: '#8d765c',
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#5f4c39',
    borderTopColor: '#a8927a',
  },
  grass: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 26,
    backgroundColor: '#74c947',
    borderBottomWidth: 4,
    borderBottomColor: '#4a8c2a',
  },
  grassHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 7,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  bullet: {
    position: 'absolute',
    width: 16,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(225, 245, 254, 0.95)',
    borderWidth: 1.5,
    borderColor: '#4fc3f7',
    shadowColor: '#00bcd4',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 8,
  },
  bulletCore: {
    position: 'absolute',
    left: 3,
    top: 2,
    width: 8,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ffffff',
  },
  bulletTrail: {
    position: 'absolute',
    left: -7,
    top: 2,
    width: 9,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(129, 212, 250, 0.75)',
  },
  muzzleFlash: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(225, 245, 254, 0.9)',
    borderWidth: 2,
    borderColor: '#4fc3f7',
    shadowColor: '#00bcd4',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 14,
    zIndex: 20,
  },
  coin: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ffe14d',
    borderWidth: 2,
    borderColor: '#ffb020',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ffd54a',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 8,
  },
  coinHalo: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 225, 77, 0.35)',
    zIndex: 9,
  },
  coinShine: {
    position: 'absolute',
    top: 3,
    left: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  terrainSegment: {
    position: 'absolute',
    backgroundColor: COLORS.ground,
    borderTopWidth: 4,
    borderTopColor: '#a7661c',
  },
  terrainHole: {
    position: 'absolute',
    backgroundColor: '#3a2414',
    opacity: 0.7,
  },
  hud: {
    position: 'absolute',
    top: 14,
    right: 10,
    backgroundColor: 'rgba(12, 40, 58, 0.45)',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    paddingVertical: 10,
    paddingHorizontal: 12,
    minWidth: 118,
    shadowColor: '#062033',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 10,
  },
  hudWeapon: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  hudWeaponText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'right',
  },
  hudCoinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  hudCoinDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 6,
    backgroundColor: '#ffe14d',
    borderWidth: 2,
    borderColor: '#ffb020',
    shadowColor: '#ffd54a',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 4,
    elevation: 4,
  },
  hudCoinsText: {
    color: '#ffe14d',
    fontSize: 14,
    fontWeight: '800',
  },
  destructibleCrack: {
    position: 'absolute',
    left: '24%',
    top: '28%',
    width: 4,
    height: '42%',
    backgroundColor: 'rgba(38, 32, 26, 0.55)',
    transform: [{ rotate: '12deg' }],
  },
  destructibleCrackSmall: {
    position: 'absolute',
    left: '52%',
    top: '52%',
    width: 3,
    height: '24%',
    backgroundColor: 'rgba(38, 32, 26, 0.45)',
    transform: [{ rotate: '-18deg' }],
  },
  bossHealthBarBackground: {
    position: 'absolute',
    height: 6,
    backgroundColor: '#333333',
    borderRadius: 3,
    zIndex: 20,
  },
  bossHealthBarFill: {
    position: 'absolute',
    height: 6,
    borderRadius: 3,
    zIndex: 21,
  },
  floatingGlow: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 245, 210, 0.45)',
    backgroundColor: 'rgba(255, 245, 210, 0.08)',
  },
  hudWeaponRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  hudWeaponUpgraded: {
    color: '#ffe14d',
    fontWeight: '700',
  },
  hudUpgradeText: {
    color: '#ffe14d',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  deathEffect: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 15,
  },
  deathParticle: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff4444',
    marginHorizontal: 2,
    shadowColor: '#ff0000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 6,
  },

  grassTufts: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 6,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },

  // ---- Estilos nuevos obstÃ¡culos ----
  levelText: {
    position: 'absolute',
    left: 10,
    top: 10,
    zIndex: 25,
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  trapPlatformBase: {
    backgroundColor: '#8d6e63',
    borderWidth: 2,
    borderColor: '#5d4037',
    borderRadius: 4,
  },
  trapHazardStrip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: '#ffeb3b',
    borderTopWidth: 2,
    borderTopColor: '#000',
    borderBottomWidth: 2,
    borderBottomColor: '#000',
  },
  trapWarning: {
    position: 'absolute',
    top: -22,
    left: '50%',
    alignItems: 'center',
    transform: [{ translateX: -10 }],
  },
  trapText: {
    color: '#ffeb3b',
    fontSize: 14,
    fontWeight: '900',
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  trapTriggered: {
    borderColor: '#b71c1c',
    backgroundColor: '#ef5350',
  },
  trapSpikes: {
    position: 'absolute',
    top: -18,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  trapSpike: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 12,
    borderRightWidth: 12,
    borderBottomWidth: 18,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#b71c1c',
    marginHorizontal: 4,
  },
  spikeTrapBase: {
    backgroundColor: '#5d4037',
    borderWidth: 2,
    borderColor: '#3e2723',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spikeTrapHole: {
    width: '60%',
    height: 4,
    borderRadius: 2,
    backgroundColor: '#2b1a17',
  },
  movingPlatform: {
    backgroundColor: '#aed581',
    borderWidth: 2,
    borderColor: '#689f38',
    borderRadius: 6,
  },
  platformRope: {
    position: 'absolute',
    top: -14,
    left: '50%',
    width: 2,
    height: 14,
    backgroundColor: '#5d4037',
    transform: [{ translateX: -1 }],
  },
  platformRopeLeft: {
    position: 'absolute',
    top: -14,
    left: '50%',
    width: 2,
    height: 14,
    backgroundColor: '#5d4037',
    transform: [{ translateX: -11 }],
  },
  vanishingPlatform: {
    backgroundColor: '#cfd8dc',
    borderWidth: 2,
    borderColor: '#90a4ae',
    borderRadius: 6,
  },
  vanishCrack: {
    position: 'absolute',
    top: '30%',
    left: '20%',
    width: 2,
    height: '40%',
    backgroundColor: 'rgba(0,0,0,0.25)',
    transform: [{ rotate: '15deg' }],
  },
  waterZone: {
    backgroundColor: '#4fc3f7',
    borderWidth: 2,
    borderColor: '#0277bd',
    borderRadius: 8,
    opacity: 0.85,
  },
  waterSurface: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 6,
  },
  waterText: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
    transform: [{ translateX: -50 }, { translateY: 6 }],
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  piranhaContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  piranhaImg: {
    width: PIRANHA_HEIGHT,
    height: PIRANHA_HEIGHT,
    backgroundColor: 'transparent',
  },
  piranhaPipe: {
    width: 22,
    height: 26,
    backgroundColor: '#795548',
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#4e342e',
  },
  piranha: {
    position: 'absolute',
    top: 24,
    width: PIRANHA_HEIGHT,
    height: PIRANHA_HEIGHT,
    backgroundColor: '#4caf50',
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#2e7d32',
    overflow: 'hidden',
  },
  piranhaUp: {
    top: 8,
  },
  piranhaMouth: {
    position: 'absolute',
    bottom: 6,
    left: 14,
    width: 20,
    height: 6,
    backgroundColor: '#000',
    borderRadius: 3,
  },
  piranhaEye: {
    position: 'absolute',
    top: 18,
    left: 40,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
  piranhaShadow: {
    position: 'absolute',
    top: 30,
    left: '50%',
    width: 40,
    height: 6,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 3,
    transform: [{ translateX: -20 }],
  },
  goalContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  goalPole: {
    width: 6,
    height: GOAL_HEIGHT,
    backgroundColor: '#bdbdbd',
  },
  goalFlag: {
    position: 'absolute',
    top: 6,
    left: 8,
    width: 24,
    height: 16,
    backgroundColor: '#e53935',
    borderRadius: 2,
  },
  goalText: {
    position: 'absolute',
    top: -20,
    left: '50%',
    color: '#e53935',
    fontSize: 12,
    fontWeight: '900',
    transform: [{ translateX: -50 }],
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  savePoint: {
    position: 'absolute',
    bottom: -6,
    left: '50%',
    width: 18,
    height: 18,
    backgroundColor: '#ffeb3b',
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#f57f17',
    transform: [{ translateX: -9 }],
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
});
