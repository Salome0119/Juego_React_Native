import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  ImageSourcePropType,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
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

// Nube trampa: plataforma flotante que se resquebraja al pisarla y desaparece
const CLOUD_TRAP_HEIGHT = 40;
const CLOUD_TRAP_ASPECT_RATIO = 669 / 373; // proporción real de nubes.png
const CLOUD_TRAP_CRACK_DELAY = 0.5; // segundos resquebrajada antes de desaparecer

// Planta PiraÃ±a
// Planta Piraña: sube cuando la vaquita salte sobre ella.
const PIRANHA_HEIGHT = 64;

// Portal entre niveles
const PORTAL_WIDTH = 140;
const PORTAL_HEIGHT = 140;
const PORTAL_ANIM_SPEED = 1.1; // velocidad del fundido entre sprites (rad/s)
const PORTAL_ROTATION_SPEED = 14; // grados por segundo del giro del portal
const PORTAL_CLEAR_ZONE = 320; // zona sin obstáculos antes/después del portal
const PORTAL_ABSORB_DURATION = 0.9; // segundos que tarda la vaquita en ser absorbida

// Meta / bandera
const GOAL_BOTTOM_PADDING = 13; // parte transparente del sprite que hay que hundir

// Sprites de obstÃ¡culos (de assets/trampas.jpg, fondo eliminado)
const IMG_STONE = require('../../assets/obstacle-stone.png');
const IMG_SPIKES = require('../../assets/obstacle-spikes.png');
const IMG_BENCH = require('../../assets/obstacle-bench.png');
const IMG_STONE_TRAP = require('../../assets/obstacle-stone_trampa.png');
const IMG_STONE_TRAP_INACTIVE = require('../../assets/obstacle-stone_trampa_estado inicial.png');
const IMG_BENCH_TRAP = require('../../assets/obstacle-bench_trampa.png');
const IMG_BENCH_TRAP_INACTIVE = require('../../assets/obstacle-bench_trampa_estado_inicial.png');
const IMG_CLOUD = require('../../assets/nubes.png');
const IMG_CLOUD_TRAP = require('../../assets/nube_trampa.png');
const IMG_LAKE = require('../../assets/lago_trampa.png');
const IMG_MONSTER_GREEN_ANGRY = require('../../assets/monster-green_enojado.png');

// Portal entre niveles y fondos por nivel
const IMG_PORTAL_1 = require('../../assets/portal_movimiento1.png');
const IMG_PORTAL_2 = require('../../assets/portal_movimiento2.png');
const IMG_BG_LEVEL_1 = require('../../assets/fondo.jpg');
const IMG_BG_LEVEL_2 = require('../../assets/fondo_nivel2.jpg');
const IMG_META = require('../../assets/meta.png');

// Sprites de la vaquita (animación por estados)
const IMG_COW_IDLE = require('../../assets/caminando1.png');
const IMG_COW_ATTACK = require('../../assets/ataque.png');
const IMG_COW_JUMP = require('../../assets/salto.png');
const IMG_COW_WALK_2 = require('../../assets/caminar2.png');
const IMG_COW_DEATH = require('../../assets/muerte.png');

// Sprites de la vaquita CON ARMA (2.0)
const IMG_COW_IDLE_WEAPON = require('../../assets/caminando2.0.png');
const IMG_COW_ATTACK_WEAPON = require('../../assets/ataque2.0.png');
const IMG_COW_JUMP_WEAPON = require('../../assets/saltando2.0.png');

const COIN_BONUS_PER_KILL = 5;

/**
 * Geometría de los sprites "2.0" de la vaquita (lienzos de 669×373 con mucho
 * relleno transparente). Cada entrada indica qué parte del PNG ocupa el dibujo
 * (`content`) y dónde está el puño que sostiene el arma (`fist`, en px del PNG).
 *
 * Con estos datos la vaquita se dibuja siempre del mismo tamaño (su contenido
 * ocupa COW_HEIGHT) y el arma se coloca exactamente sobre el puño, en vez de
 * depender de un factor de escala fijo.
 */
interface ArmedCowSprite {
  source: ImageSourcePropType;
  canvasWidth: number;
  canvasHeight: number;
  content: { x: number; y: number; width: number; height: number };
  fist: { x: number; y: number };
}

const ARMED_COW_SPRITES: Record<'idle' | 'attack' | 'jump', ArmedCowSprite> = {
  idle: {
    source: IMG_COW_IDLE_WEAPON,
    canvasWidth: 669,
    canvasHeight: 373,
    content: { x: 126, y: 16, width: 355, height: 354 },
    fist: { x: 455, y: 160 },
  },
  attack: {
    source: IMG_COW_ATTACK_WEAPON,
    canvasWidth: 669,
    canvasHeight: 373,
    content: { x: 91, y: 0, width: 372, height: 373 },
    fist: { x: 430, y: 168 },
  },
  jump: {
    source: IMG_COW_JUMP_WEAPON,
    canvasWidth: 669,
    canvasHeight: 373,
    content: { x: 131, y: 15, width: 396, height: 358 },
    fist: { x: 487, y: 105 },
  },
};

/** Ancho visible del arma respecto al ancho visible de la vaquita. */
const WEAPON_VISUAL_WIDTH_RATIO = 0.55;
/** Punto del arma (fracción de su dibujo) que queda dentro del puño. */
const WEAPON_GRIP = { x: 0.16, y: 0.8 };

/**
 * Superposición del arma: devuelve el recuadro (dentro de la caja del sprite
 * 2.0) donde debe dibujarse el PNG del arma para que el punto de agarre caiga
 * justo sobre el puño de la vaquita.
 *
 * `spriteScale` es la escala con la que el lienzo del sprite se dibuja dentro
 * de su caja; coincide con `armedScale * absorbScale` del render.
 */
function computeArmedWeaponOverlay(
  weapon: WeaponConfig,
  sprite: ArmedCowSprite,
  spriteScale: number
) {
  // El dibujo del arma ocupa esta fracción del ancho visible de la vaquita.
  const trimWidthOnScreen =
    sprite.content.width * spriteScale * WEAPON_VISUAL_WIDTH_RATIO;
  const gunScale = trimWidthOnScreen / weapon.trim.width;

  // Puño en coordenadas del lienzo ya escaladas.
  const fistX = sprite.fist.x * spriteScale;
  const fistY = sprite.fist.y * spriteScale;

  // Punto de agarre del arma, también en coordenadas del lienzo.
  const gripX = (weapon.trim.x + weapon.trim.width * WEAPON_GRIP.x) * gunScale;
  const gripY = (weapon.trim.y + weapon.trim.height * WEAPON_GRIP.y) * gunScale;

  return {
    width: weapon.canvasWidth * gunScale,
    height: weapon.canvasHeight * gunScale,
    left: fistX - gripX,
    top: fistY - gripY,
  };
}

/**
 * Boca del cañón del arma ya dibujada: extremo derecho del dibujo, a un tercio
 * de su altura. Coordenadas relativas a la esquina superior izquierda de la caja.
 */
function gunMuzzleOffset(weapon: WeaponConfig, w: number, h: number) {
  return {
    x: ((weapon.trim.x + weapon.trim.width) / weapon.canvasWidth) * w,
    y: ((weapon.trim.y + weapon.trim.height * 0.35) / weapon.canvasHeight) * h,
  };
}

// Armería: cada arma cuesta más monedas y hace más daño a los jefes.
const IMG_WEAPON_ESC = require('../../assets/arma.png');
const IMG_WEAPON_GLUE = require('../../assets/arma1.png');
const IMG_WEAPON_STICKY = require('../../assets/arma2.png');
const IMG_WEAPON_SAP = require('../../assets/arma3.png');
const IMG_WEAPON_GEL = require('../../assets/arma4.png');

interface WeaponConfig {
  name: string;
  sprite: ImageSourcePropType;
  aspectRatio: number;
  /** Tamaño real del PNG del arma, en px. */
  canvasWidth: number;
  canvasHeight: number;
  /**
   * Rectángulo que ocupa el dibujo del arma dentro de su PNG (px).
   * Los PNG traen mucho relleno transparente; sin esto el arma se dibuja
   * descentrada y a un tamaño arbitrario.
   */
  trim: { x: number; y: number; width: number; height: number };
  price: number;
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
    sprite: IMG_WEAPON_ESC,
    aspectRatio: 669 / 373,
    canvasWidth: 669,
    canvasHeight: 373,
    trim: { x: 129, y: 73, width: 459, height: 252 },
    price: 0,
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
    name: 'Revólver GLUE',
    sprite: IMG_WEAPON_GLUE,
    aspectRatio: 561 / 333,
    canvasWidth: 561,
    canvasHeight: 333,
    trim: { x: 33, y: 69, width: 450, height: 262 },
    price: 10,
    speed: 1150,
    radius: 4,
    lifetime: 4.0,
    cooldown: 0.24,
    damage: 2,
    pierce: 1,
    multiShot: 1,
    spread: 0,
  },
  {
    name: 'Cañón STICKY',
    sprite: IMG_WEAPON_STICKY,
    aspectRatio: 618 / 356,
    canvasWidth: 618,
    canvasHeight: 356,
    trim: { x: 35, y: 46, width: 550, height: 303 },
    price: 25,
    speed: 1020,
    radius: 6,
    lifetime: 3.5,
    cooldown: 0.20,
    damage: 3,
    pierce: 2,
    multiShot: 1,
    spread: 0,
  },
  {
    name: 'Rifle SAP',
    sprite: IMG_WEAPON_SAP,
    aspectRatio: 669 / 373,
    canvasWidth: 669,
    canvasHeight: 373,
    trim: { x: 66, y: 30, width: 566, height: 332 },
    price: 45,
    speed: 1350,
    radius: 4,
    lifetime: 4.5,
    cooldown: 0.16,
    damage: 5,
    pierce: 2,
    multiShot: 1,
    spread: 0,
  },
  {
    name: 'Cañón GEL',
    sprite: IMG_WEAPON_GEL,
    aspectRatio: 669 / 373,
    canvasWidth: 669,
    canvasHeight: 373,
    trim: { x: 76, y: 27, width: 584, height: 327 },
    price: 65,
    speed: 1250,
    radius: 6,
    lifetime: 4.5,
    cooldown: 0.12,
    damage: 8,
    pierce: 3,
    multiShot: 2,
    spread: 0.16,
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
  // Si es false, no se generan obstáculos procedimentales en este nivel.
  procedural?: boolean;
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
        { type: 'moving', x: 2050, width: 140, height: 70 },
        { type: 'spike_trap', x: 2300, width: 125, height: SPIKE_HEIGHT },
        { type: 'enemy', x: 2550, width: BOSS_WIDTH, height: BOSS_HEIGHT, isBoss: true },
        // Piedras de la trampa del lago: apoyadas en el suelo a ambos lados
        { type: 'crate', x: 3200, width: 150, height: 80 },
        { type: 'crate', x: 3650, width: 150, height: 80 },
        // Plataforma de nube sobre el lago para cruzarlo
        { type: 'cloud_trap', x: 3425, bottom: GROUND_HEIGHT + 80, width: 150, height: CLOUD_TRAP_HEIGHT },
        // Portal junto a la bandera para viajar al nivel 2
        { type: 'portal', x: 4010, width: PORTAL_WIDTH, height: PORTAL_HEIGHT },
      ],
  },
  {
    id: 2,
    name: 'Nivel 2',
    width: 3200,
    procedural: false,
    obstacles: [],
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
  | 'destructible'
  | 'moving'
  | 'trap_platform'
  | 'water'
  | 'piranha'
  | 'spike_trap'
  | 'stone_trap'
  | 'bench_trap'
  | 'cloud_trap'
  | 'portal'
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
  // Nube trampa (se resquebraja y desaparece al pisarla)
  cloudTrapActive?: boolean;
  cloudTrapCracked?: boolean;
  cloudTrapCrackTime?: number;
  vanished?: boolean;
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
      case 'cloud_trap': {
        obstacles.push({
          id: id++,
          type: 'cloud_trap',
          x: spec.x,
          bottom: spec.bottom ?? baseBottom,
          width: spec.width,
          height: spec.height,
          scored: false,
          cloudTrapActive: false,
          cloudTrapCracked: false,
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
      case 'portal': {
        obstacles.push({
          id: id++,
          type: 'portal',
          x: spec.x,
          bottom: spec.bottom ?? baseBottom,
          width: spec.width,
          height: spec.height,
          scored: false,
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
    if (spec.type === 'crate') {
      placeCoin(spec.x + spec.width / 2 - COIN_WIDTH / 2, GROUND_HEIGHT + spec.height + 10);
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

// Obstáculos que bloquean el paso: cajas, bloques destructibles, plataformas
// móviles, plataformas trampa, piedras trampa, bancos trampa y nubes fijas.
// Ninguna entidad (monstruo o vaquita) puede atravesarlos.
const SOLID_BLOCKING_TYPES: ObstacleType[] = [
  'crate',
  'destructible',
  'moving',
  'trap_platform',
  'stone_trap',
  'bench_trap',
  'cloud_trap',
];

interface CollisionBody {
  x: number;
  bottom: number;
  width: number;
  height: number;
}

// Una nube trampa ya destruida deja de colisionar y de dibujarse.
const isVanishedObstacle = (obstacle: Obstacle): boolean =>
  obstacle.type === 'cloud_trap' && obstacle.vanished === true;

interface HorizontalResolution {
  x: number;
  blockedLeft: boolean;
  blockedRight: boolean;
}

/**
 * Mueve un cuerpo en horizontal y resuelve la colisión contra los obstáculos
 * sólidos.
 *
 * - Barrido: comprueba todo el tramo recorrido en el fotograma, de modo que
 *   un cuerpo rápido (o con pocos FPS) no puede "saltar" el bloque.
 * - Expulsión: si el cuerpo ya estaba dentro del bloque (por ejemplo porque
 *   apareció o fue empujado dentro), se saca por el lado contrario al del
 *   movimiento. Sin esto, un cuerpo que quedase dentro atravesaba el bloque
 *   sin volver a chocar contra él.
 */
const resolveHorizontalCollision = (
  body: CollisionBody,
  targetX: number,
  obstacles: Obstacle[],
  excludeId?: number
): HorizontalResolution => {
  const startX = body.x;
  const movingRight = targetX >= startX;
  let x = targetX;
  let blockedLeft = false;
  let blockedRight = false;

  for (const obstacle of obstacles) {
    if (excludeId !== undefined && obstacle.id === excludeId) {
      continue;
    }
    if (!SOLID_BLOCKING_TYPES.includes(obstacle.type)) {
      continue;
    }
    if (isVanishedObstacle(obstacle)) {
      continue;
    }

    const obstacleTop = obstacle.bottom + obstacle.height;
    const overlapsVertically =
      body.bottom < obstacleTop - 2 &&
      body.bottom + body.height > obstacle.bottom + 2;
    if (!overlapsVertically) {
      continue;
    }

    const obstacleLeft = obstacle.x;
    const obstacleRight = obstacle.x + obstacle.width;
    const startInside =
      startX + body.width > obstacleLeft && startX < obstacleRight;
    const endInside = x + body.width > obstacleLeft && x < obstacleRight;

    if (startInside) {
      // El cuerpo ya estaba dentro del bloque: se expulsa por la cara más
      // cercana (menor desplazamiento) para que no lo cruce de un lado a otro.
      const penetrationLeft = startX + body.width - obstacleLeft;
      const penetrationRight = obstacleRight - startX;
      if (penetrationLeft <= penetrationRight) {
        x = Math.min(x, obstacleLeft - body.width);
        blockedRight = true;
      } else {
        x = Math.max(x, obstacleRight);
        blockedLeft = true;
      }
      continue;
    }

    if (endInside) {
      if (movingRight) {
        x = Math.min(x, obstacleLeft - body.width);
        blockedRight = true;
      } else {
        x = Math.max(x, obstacleRight);
        blockedLeft = true;
      }
      continue;
    }

    // El cuerpo cruzó el bloque entero dentro del mismo fotograma.
    const crossedBlock = movingRight
      ? startX + body.width <= obstacleLeft && x + body.width > obstacleLeft
      : startX >= obstacleRight && x < obstacleRight;
    if (crossedBlock) {
      if (movingRight) {
        x = obstacleLeft - body.width;
        blockedRight = true;
      } else {
        x = obstacleRight;
        blockedLeft = true;
      }
    }
  }

  return { x, blockedLeft, blockedRight };
};

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
    const solid = SOLID_BLOCKING_TYPES.includes(obstacle.type);
    if (!solid || isVanishedObstacle(obstacle) || !hasHorizontalOverlap(x, width, obstacle, 6)) {
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

const CloudTrap = React.memo(function CloudTrap({
  obstacle,
  left,
  cracked,
}: PlatformViewProps & { cracked: boolean }) {
  // Se dibuja con la proporción real del sprite (669x373) para que no se vea
  // recortada, y se alinea su parte superior con la superficie de apoyo.
  const renderHeight = obstacle.width / CLOUD_TRAP_ASPECT_RATIO;
  return (
    <View
      style={{
        position: 'absolute',
        left: Number(left),
        bottom: Number(obstacle.bottom + obstacle.height - renderHeight),
        width: obstacle.width,
        height: renderHeight,
      }}
    >
      <Image
        source={cracked ? IMG_CLOUD_TRAP : IMG_CLOUD}
        style={styles.obstacleImg}
        resizeMode="contain"
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
          // El lago ocupa todo el piso: se extiende por debajo del borde
          // inferior de la pantalla y sube hasta la superficie del suelo.
          bottom: -24,
          width: obstacle.width,
          height: GROUND_HEIGHT + obstacle.height + 72,
        },
      ]}
    >
      <Image source={IMG_LAKE} style={styles.waterImg} resizeMode="stretch" />
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
        {
          left: Number(left),
          // El sprite tiene relleno transparente abajo: lo hundimos para que
          // la base quede completamente apoyada en el suelo.
          bottom: Number(obstacle.bottom) - GOAL_BOTTOM_PADDING,
          width: Number(obstacle.width),
        },
      ]}
    >
      <Image
        source={IMG_META}
        style={styles.goalImage}
        resizeMode="contain"
        fadeDuration={0}
      />
    </View>
  );
});

const Portal = React.memo(function Portal({
  obstacle,
  left,
  now,
}: PlatformViewProps & { now: number }) {
  // Fundido suave entre los dos sprites + giro y respiración lentos.
  const blend = (Math.sin(now * PORTAL_ANIM_SPEED) + 1) / 2;
  const pulse = 1 + Math.sin(now * PORTAL_ANIM_SPEED) * 0.035;
  const rotation = ((now * PORTAL_ROTATION_SPEED) % 360).toFixed(1);
  const glowOpacity = 0.28 + blend * 0.22;

  return (
    <View
      style={[
        styles.portalContainer,
        {
          left: Number(left),
          bottom: Number(obstacle.bottom),
          width: obstacle.width,
          height: obstacle.height,
          transform: [{ scale: pulse }, { rotate: `${rotation}deg` }],
        },
      ]}
    >
      <View style={[styles.portalGlow, { opacity: glowOpacity }]} />
      <Image
        source={IMG_PORTAL_1}
        style={[styles.portalImgLayer, { opacity: blend }]}
        resizeMode="cover"
        fadeDuration={0}
      />
      <Image
        source={IMG_PORTAL_2}
        style={[styles.portalImgLayer, { opacity: 1 - blend }]}
        resizeMode="cover"
        fadeDuration={0}
      />
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
  const [portalAbsorb, setPortalAbsorb] = useState<{
    startedAt: number;
    portalX: number;
    portalBottom: number;
    portalWidth: number;
    portalHeight: number;
  } | null>(null);
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
  const portalAbsorbRef = useRef(false);

  // ---- Armería ----
  const [shopOpen, setShopOpen] = useState(false);
  const [ownedWeapons, setOwnedWeapons] = useState<boolean[]>(() =>
    WEAPONS.map((_, i) => i === 0)
  );
  const shopOpenRef = useRef(false);
  const ownedWeaponsRef = useRef<boolean[]>(WEAPONS.map((_, i) => i === 0));
  const [shopSlide] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(shopSlide, {
      toValue: shopOpen ? 1 : 0,
      duration: shopOpen ? 240 : 200,
      useNativeDriver: true,
    }).start();
  }, [shopOpen, shopSlide]);

  const openShop = useCallback(() => {
    if (gameOverRef.current || portalAbsorbRef.current) {
      return;
    }
    // Suelta los controles para que la vaquita no siga corriendo al volver.
    leftHeldRef.current = false;
    rightHeldRef.current = false;
    isMovingLeftRef.current = false;
    isMovingRightRef.current = false;
    isPressingLeftRef.current = false;
    isPressingRightRef.current = false;
    shopOpenRef.current = true;
    setShopOpen(true);
  }, []);

  const closeShop = useCallback(() => {
    shopOpenRef.current = false;
    setShopOpen(false);
  }, []);

  const buyOrEquipWeapon = useCallback((index: number) => {
    const weapon = WEAPONS[index];
    if (!weapon) {
      return;
    }

    // Si es el arma actual, desequipar (volver a la base). La Escopeta (0) es el
    // arma de serie y no se desequipa. Las armas compradas siguen siendo del
    // jugador: desequipar no las borra.
    if (index === weaponRef.current && index !== 0) {
      weaponRef.current = 0;
      setCurrentWeapon(0);
      return;
    }

    const isOwned = ownedWeaponsRef.current[index];
    if (!isOwned) {
      if (coinsRefCount.current < weapon.price) {
        return;
      }
      coinsRefCount.current -= weapon.price;
      setCoins(coinsRefCount.current);

      const nextOwned = [...ownedWeaponsRef.current];
      nextOwned[index] = true;
      ownedWeaponsRef.current = nextOwned;
      setOwnedWeapons(nextOwned);
    }

    weaponRef.current = index;
    setCurrentWeapon(index);
  }, []);

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

      // La armería pausa la partida mientras el jugador elige un arma.
      if (shopOpenRef.current) {
        frameId = requestAnimationFrame(loop);
        return;
      }

      // Persistent directional state: the jump must never cancel horizontal
      // velocity while a direction button is still held. When no direction
      // is active, force a full stop so the cow never keeps walking alone.
      if (isMovingRightRef.current) {
        const baseSpeed = !isGroundedRef.current ? AIR_MOVE_SPEED : MOVE_SPEED;
        velocityXRef.current = baseSpeed;
      } else if (isMovingLeftRef.current) {
        const baseSpeed = !isGroundedRef.current ? AIR_MOVE_SPEED : MOVE_SPEED;
        velocityXRef.current = -baseSpeed;
      } else {
        velocityXRef.current = 0;
      }

      const velocityX = velocityXRef.current;

      // Movimiento horizontal de la vaquita con colisiÃ³n sÃ³lida contra plataformas.
      // Si camina de lado choca sin traspasar; si cae, aterriza sobre la superficie superior.
      if (velocityX !== 0) {
        const resolved = resolveHorizontalCollision(
          {
            x: cowXRef.current,
            bottom: cowBottomRef.current,
            width: COW_WIDTH,
            height: COW_HEIGHT,
          },
          cowXRef.current + velocityX * delta,
          obstaclesRef.current
        );

        cowXRef.current = Math.max(0, resolved.x);
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

      // Portal: al tocarlo, absorbe a la vaquita y la lleva al siguiente nivel.
      if (!gameOverRef.current && !portalAbsorbRef.current) {
        for (const obstacle of obstaclesRef.current) {
          if (obstacle.type !== 'portal') {
            continue;
          }
          const touchesPortal =
            cowXRef.current < obstacle.x + obstacle.width &&
            cowXRef.current + COW_WIDTH > obstacle.x &&
            cowBottomRef.current < obstacle.bottom + obstacle.height &&
            cowBottomRef.current + COW_HEIGHT > obstacle.bottom;

          if (!touchesPortal) {
            continue;
          }

          portalAbsorbRef.current = true;
          velocityXRef.current = 0;
          velocityYRef.current = 0;
          leftHeldRef.current = false;
          rightHeldRef.current = false;
          isMovingRightRef.current = false;
          isMovingLeftRef.current = false;
          isPressingLeftRef.current = false;
          isPressingRightRef.current = false;
          setPortalAbsorb({
            startedAt: performance.now() / 1000,
            portalX: obstacle.x,
            portalBottom: obstacle.bottom,
            portalWidth: obstacle.width,
            portalHeight: obstacle.height,
          });
          break;
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
              !SOLID_BLOCKING_TYPES.includes(obstacle.type) ||
              isVanishedObstacle(obstacle) ||
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

        // Movimiento horizontal con colisiÃ³n sÃ³lida contra plataformas.
        // El monstruo no puede atravesar cajas ni plataformas: rebota al chocar.
        let nextEnemyX = obstacle.x + obstacle.vx * delta;

        // LÃ­mites de patrulla: se aplican sobre la posiciÃ³n destino para que
        // nunca se teletransporte al otro lado de un bloque.
        if (nextEnemyX <= minX) {
          nextEnemyX = minX + 1;
          obstacle.vx = Math.abs(baseSpeed);
        } else if (nextEnemyX >= maxX) {
          nextEnemyX = maxX - 1;
          obstacle.vx = -Math.abs(baseSpeed);
        }

        const resolvedEnemy = resolveHorizontalCollision(
          {
            x: obstacle.x,
            bottom: obstacle.bottom,
            width: obstacle.width,
            height: obstacle.height,
          },
          nextEnemyX,
          obstaclesRef.current,
          obstacle.id
        );

        obstacle.x = Math.max(0, resolvedEnemy.x);

        // LÃ­mites del mundo izquierdo
        if (obstacle.x <= 0) {
          obstacle.x = 4;
          obstacle.vx = Math.abs(baseSpeed);
        }

        if (resolvedEnemy.blockedRight && obstacle.vx > 0) {
          obstacle.vx = -Math.abs(obstacle.vx);
        } else if (resolvedEnemy.blockedLeft && obstacle.vx < 0) {
          obstacle.vx = Math.abs(obstacle.vx);
        }

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

      // Update trap platforms, piranhas, and goal.
      for (const obstacle of obstaclesRef.current) {

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

      // Banco trampa: solo muestra la boca abierta mientras la vaquita está sobre él.
      // Si la vaquita ya lo pasó, vuelve al estado inicial.
      for (const obstacle of obstaclesRef.current) {
        if (obstacle.type !== 'bench_trap') {
          continue;
        }
        const cowLeft = cowXRef.current;
        const cowRight = cowXRef.current + COW_WIDTH;
        const benchLeft = obstacle.x;
        const benchRight = obstacle.x + obstacle.width;
        const benchTop = obstacle.bottom + obstacle.height;

        obstacle.benchTrapActive =
          cowRight > benchLeft &&
          cowLeft < benchRight &&
          cowBottomRef.current >= benchTop - 8 &&
          cowBottomRef.current <= benchTop + 8;
      }

      // Nube trampa: al pisarla se resquebraja y desaparece para que la vaquita caiga.
      for (const obstacle of obstaclesRef.current) {
        if (obstacle.type !== 'cloud_trap' || obstacle.vanished) {
          continue;
        }
        const cowLeft = cowXRef.current;
        const cowRight = cowXRef.current + COW_WIDTH;
        const cloudLeft = obstacle.x;
        const cloudRight = obstacle.x + obstacle.width;
        const cloudTop = obstacle.bottom + obstacle.height;

        const onCloud =
          isGroundedRef.current &&
          cowRight > cloudLeft &&
          cowLeft < cloudRight &&
          cowBottomRef.current >= cloudTop - 2 &&
          cowBottomRef.current <= cloudTop + 2;

        obstacle.cloudTrapActive = onCloud;

        if (onCloud && !obstacle.cloudTrapCracked) {
          obstacle.cloudTrapCracked = true;
          obstacle.cloudTrapCrackTime = performance.now() / 1000;
        }

        if (obstacle.cloudTrapCracked) {
          const now = performance.now() / 1000;
          if (
            now - (obstacle.cloudTrapCrackTime ?? now) >=
            CLOUD_TRAP_CRACK_DELAY
          ) {
            obstacle.vanished = true;
            obstacle.cloudTrapActive = false;
          }
        }
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
            const bossHp = (hitBoss.health ?? 1) - (weapon.damage ?? 1);

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

      // Solo pinchos y trampas activas son letales. Las rocas son plataformas
      // seguras: el único peligro del lago es el agua.
      for (const obstacle of obstaclesRef.current) {
        const isTrapSpike = obstacle.type === 'spike_trap' && obstacle.spikeTrapVisible;
        const isActiveBenchTrap = obstacle.type === 'bench_trap' && obstacle.benchTrapActive;
        if (
          obstacle.type !== 'spike' &&
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

        // El tronco trampa es sólido: cuando la vaquita se para encima queda
        // apoyada justo en su borde superior, por lo que el AABB normal no
        // detecta contacto. Se amplía el área letal un poco hacia arriba para
        // que la muerda al pisarlo.
        const hazard: Obstacle = isActiveBenchTrap
          ? { ...obstacle, height: obstacle.height + 10 }
          : obstacle;

        if (intersectsHazard(cowXRef.current, cowBottomRef.current, hazard)) {
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
      }

      let generatedObstacle = false;

      // Los niveles marcados con procedural: false (por ahora el nivel 2)
      // no generan obstáculos ni monstruos automáticamente.
      if (getLevelConfig(levelRef.current).procedural !== false) {
        // No se generan obstáculos más allá del portal: la zona posterior
        // queda despejada para entrar al siguiente nivel.
        const portalObstacle = obstaclesRef.current.find(
          (o) => o.type === 'portal'
        );
        const spawnLimitX = portalObstacle
          ? portalObstacle.x - PORTAL_CLEAR_ZONE
          : Number.POSITIVE_INFINITY;

        while (
          nextObstacleXRef.current <
            cameraXRef.current + screenWidth + GENERATION_AHEAD &&
          nextObstacleXRef.current < spawnLimitX
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
    if (gameOverRef.current || portalAbsorbRef.current) {
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
    if (gameOverRef.current || portalAbsorbRef.current) {
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
    if (gameOverRef.current || portalAbsorbRef.current) {
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
    if (gameOverRef.current || portalAbsorbRef.current) {
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
    if (gameOverRef.current || portalAbsorbRef.current) {
      return;
    }

    const weapon = WEAPONS[weaponRef.current];
    const now = performance.now() / 1000;
    if (now - lastShotRef.current < weapon.cooldown) {
      return;
    }

    lastShotRef.current = now;
    setMuzzleFlashBorn(now);

    // ---- Calcular posición de la boca del cañón ----
    const cowScreenX = cowXRef.current;
    const cowBottomVal = cowBottomRef.current;

    const isShootingNow = muzzleFlashBorn > 0 && now - muzzleFlashBorn < 0.2;
    const hasWeaponEquipped = !cowDead && currentWeapon > 0;
    const grounded = isGroundedRef.current ?? view.isGrounded;

    const armedSpr = !hasWeaponEquipped
      ? null
      : isShootingNow
        ? ARMED_COW_SPRITES.attack
        : grounded
          ? ARMED_COW_SPRITES.idle
          : ARMED_COW_SPRITES.jump;

let muzzleX: number;
    let muzzleY: number;

    if (armedSpr) {
      // Sin animación de absorción (portalAbsorbRef bloquea el disparo).
      const spriteScale = COW_HEIGHT / armedSpr.content.height;
      const overlay = computeArmedWeaponOverlay(weapon, armedSpr, spriteScale);
      const muzzleOffset = gunMuzzleOffset(weapon, overlay.width, overlay.height);

      // Boca del cañón dentro de la caja del sprite.
      const localX = overlay.left + muzzleOffset.x;
      const localYFromTop = overlay.top + muzzleOffset.y;

      // Origen de la caja del sprite respecto a la caja de colisión.
      const contentWidth = armedSpr.content.width * spriteScale;
      const contentLeft = armedSpr.content.x * spriteScale;
      const boxLeftOffset = (COW_WIDTH - contentWidth) / 2 - contentLeft;
      const boxWidth = armedSpr.canvasWidth * spriteScale;
      const boxHeight = armedSpr.canvasHeight * spriteScale;

      muzzleX =
        cowScreenX +
        boxLeftOffset +
        (facing === 'right' ? localX : boxWidth - localX);
      muzzleY = cowBottomVal + boxHeight - localYFromTop;
    } else {
      muzzleX = cowScreenX + (facing === 'right' ? COW_WIDTH + 8 : -24);
      muzzleY = cowBottomVal + COW_HEIGHT * 0.45;
    }

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
  }, [cowDead, currentWeapon, facing, muzzleFlashBorn, requestStart, view.isGrounded]);

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
    const baseOwned = WEAPONS.map((_, i) => i === 0);
    ownedWeaponsRef.current = baseOwned;
    shopOpenRef.current = false;
    nextObstacleXRef.current = INITIAL_NEXT_OBSTACLE_X;
    obstacleIdRef.current = initialObstacles.length;
    gameOverRef.current = false;

    setGameOver(false);
    setCowDead(false);
    levelCompletedRef.current = false;
    setLevelCompleted(false);
    portalAbsorbRef.current = false;
    setPortalAbsorb(null);
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
    setOwnedWeapons(baseOwned);
    setShopOpen(false);

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
    nextObstacleXRef.current = INITIAL_NEXT_OBSTACLE_X;
    obstacleIdRef.current = initialObstacles.length;
    gameOverRef.current = false;

    setGameOver(false);
    setCowDead(false);
    levelCompletedRef.current = false;
    setLevelCompleted(false);
    portalAbsorbRef.current = false;
    setPortalAbsorb(null);
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
    setShopOpen(false);

    requestStart();
  }, [requestStart]);


  // Portal: cuando absorbe a la vaquita, espera la animación y pasa al nivel 2.
  useEffect(() => {
    if (!portalAbsorb) {
      return;
    }
    const timer = setTimeout(() => {
      setPortalAbsorb(null);
      portalAbsorbRef.current = false;
      if (levelRef.current < LEVELS.length) {
        advanceLevel();
      }
    }, PORTAL_ABSORB_DURATION * 1000);
    return () => clearTimeout(timer);
  }, [portalAbsorb, advanceLevel]);

  // El agua se dibuja primero para que las nubes (y el resto de obstáculos)
  // queden por encima del lago.
  const visibleObstacles = obstacles
    .filter(
      (obs) =>
        !isVanishedObstacle(obs) &&
        obs.x + obs.width > view.cameraX &&
        obs.x < view.cameraX + screenWidth
    )
    .sort((a, b) => (a.type === 'water' ? 0 : 1) - (b.type === 'water' ? 0 : 1));
  const visibleBullets = bullets.filter(
    (b) => b.x + 5 > view.cameraX && b.x - 5 < view.cameraX + screenWidth
  );
  const visibleCoins = levelCoins.filter(
    (c) => !c.collected && c.x + c.width > view.cameraX && c.x < view.cameraX + screenWidth
  );

  // ---- Selección de sprite de la vaquita ----
  // Prioridad: disparando > en el aire > caminando > reposo
  // `armedSprite` guarda la geometría 2.0 (sirve para colocar el arma dibujada
  // sobre el puño); los PNG 2.0 no traen el arma pintada.
  const hasWeapon = currentWeapon > 0 && !cowDead;
  const isShooting = muzzleFlashBorn > 0 && view.now - muzzleFlashBorn < 0.2;
  const walkFrame = Math.floor(view.now * 4) % 2;
  const armedSprite = !hasWeapon
    ? null
    : isShooting
      ? ARMED_COW_SPRITES.attack
      : !view.isGrounded
        ? ARMED_COW_SPRITES.jump
        : ARMED_COW_SPRITES.idle;

  // Imagen de la vaquita: con arma equipada solo se sustituyen tres estados por
  // su versión 2.0 (caminando → saltando → ataque). El resto de movimientos
  // (caminar, muerte) conservan exactamente los sprites de siempre.
  const cowSprite = cowDead
    ? IMG_COW_DEATH
    : armedSprite
      ? isShooting
        ? IMG_COW_ATTACK_WEAPON
        : !view.isGrounded
          ? IMG_COW_JUMP_WEAPON
          : view.isMoving && walkFrame === 1
            ? IMG_COW_WALK_2
            : IMG_COW_IDLE_WEAPON
      : isShooting
        ? IMG_COW_ATTACK
        : !view.isGrounded
          ? IMG_COW_JUMP
          : view.isMoving && walkFrame === 1
            ? IMG_COW_WALK_2
            : IMG_COW_IDLE;

  const backgroundImage = currentLevel >= 2 ? IMG_BG_LEVEL_2 : IMG_BG_LEVEL_1;

  // Animación de absorción: la vaquita se encoge y se desvanece hacia el portal.
  const absorbProgress = portalAbsorb
    ? Math.min(
        1,
        Math.max(0, (view.now - portalAbsorb.startedAt) / PORTAL_ABSORB_DURATION)
      )
    : 0;
  const absorbEase = absorbProgress * absorbProgress;
  const portalCenterScreenX = portalAbsorb
    ? portalAbsorb.portalX - view.cameraX + portalAbsorb.portalWidth / 2
    : 0;

  // Los sprites "2.0" traen relleno transparente alrededor del dibujo: se escala
  // el PNG para que el dibujo ocupe el alto de la vaquita base y se desplaza la
  // caja para que el dibujo quede centrado sobre la caja de colisión.
  const armedScale = armedSprite ? COW_HEIGHT / armedSprite.content.height : 1;
  const absorbScale = 1 - absorbEase * 0.92;
  const spriteScale = armedScale * absorbScale;
  const cowRenderWidth =
    (armedSprite ? armedSprite.canvasWidth * armedScale : COW_WIDTH) * absorbScale;
  const cowRenderHeight =
    (armedSprite ? armedSprite.canvasHeight * armedScale : COW_HEIGHT) * absorbScale;
  const cowContentWidth =
    (armedSprite ? armedSprite.content.width * armedScale : COW_WIDTH) * absorbScale;
  const cowContentLeft =
    (armedSprite ? armedSprite.content.x * armedScale : 0) * absorbScale;
  const cowContentBottomGap =
    (armedSprite
      ? (armedSprite.canvasHeight -
          armedSprite.content.y -
          armedSprite.content.height) *
        armedScale
      : 0) * absorbScale;

  const cowRestLeft =
    view.cowScreenX + (COW_WIDTH - cowContentWidth) / 2 - cowContentLeft;
  const cowRestBottom = view.cowBottom - cowContentBottomGap;

  const cowRenderLeft = portalAbsorb
    ? cowRestLeft +
      (portalCenterScreenX - (view.cowScreenX + COW_WIDTH / 2)) * absorbEase
    : cowRestLeft;
  const cowRenderBottom = portalAbsorb
    ? cowRestBottom +
      (portalAbsorb.portalBottom +
        portalAbsorb.portalHeight / 2 -
        COW_HEIGHT / 2 -
        view.cowBottom) *
        absorbEase
    : cowRestBottom;

  // Arma equipada: el PNG se coloca sobre el puño del sprite, dimensionado según
  // el dibujo real del arma (no según su lienzo transparente).
  const cowWeapon = (() => {
    if (!armedSprite || currentWeapon === 0) {
      return null;
    }
    const weapon = WEAPONS[currentWeapon];
    const overlay = computeArmedWeaponOverlay(weapon, armedSprite, spriteScale);

    return {
      source: weapon.sprite,
      ...overlay,
      // Boca del cañón dentro de la caja del sprite (para el fogonazo).
      muzzleLocal: {
        x: overlay.left + gunMuzzleOffset(weapon, overlay.width, overlay.height).x,
        y: overlay.top + gunMuzzleOffset(weapon, overlay.width, overlay.height).y,
      },
    };
  })();

  // Boca del cañón (desde la esquina superior izquierda de la caja de la vaquita).
  const muzzleLocalX = cowWeapon ? cowWeapon.muzzleLocal.x : COW_WIDTH + 8;
  const muzzleLocalYFromTop = cowWeapon
    ? cowWeapon.muzzleLocal.y
    : COW_HEIGHT * 0.72;

  const shopPanelWidth = Math.min(320, screenWidth * 0.86);

  return (
    <View style={styles.container}>
      <Image source={backgroundImage} style={styles.bgImage} resizeMode="cover" />

      {currentLevel > 0 && (
        <Text style={styles.levelText}>
          NIVEL {currentLevel}{' '}
          {levelCompleted ? '🟢 COMPLETADO' : ''}
        </Text>
      )}

      {/* El suelo se dibuja antes que el agua y los obstáculos para que el
          lago pueda ocupar visualmente todo el piso. El nivel 2 usa una
          paleta oscura acorde a su fondo. */}
      <View style={[styles.ground, currentLevel >= 2 && styles.groundNight]}>
        <View style={styles.stoneRow}>
          {Array.from({ length: 8 }).map((_, index) => (
            <View
              key={index}
              style={[styles.stoneBlock, currentLevel >= 2 && styles.stoneBlockNight]}
            />
          ))}
        </View>
        <View style={[styles.grass, currentLevel >= 2 && styles.grassNight]}>
          <View
            style={[
              styles.grassHighlight,
              currentLevel >= 2 && styles.grassHighlightNight,
            ]}
          />
          <View style={styles.grassTufts}>
            {Array.from({ length: 16 }).map((_, index) => (
              <View key={index} style={styles.grassTufts} />
            ))}
          </View>
        </View>
        {currentLevel >= 2 && <View style={styles.groundFog} />}
      </View>

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
          case 'cloud_trap':
            return (
              <CloudTrap
                key={obstacle.id}
                obstacle={obstacle}
                left={left}
                cracked={obstacle.cloudTrapCracked === true}
              />
            );
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
          case 'trap_platform':
            return <TrapPlatform key={obstacle.id} obstacle={obstacle} left={left} />;
          case 'water':
            return <WaterZone key={obstacle.id} obstacle={obstacle} left={left} />;
          case 'piranha':
            return <Piranha key={obstacle.id} obstacle={obstacle} left={left} />;
          case 'spike_trap':
            return <SpikeTrap key={obstacle.id} obstacle={obstacle} left={left} />;
          case 'portal':
            return (
              <Portal
                key={obstacle.id}
                obstacle={obstacle}
                left={left}
                now={view.now}
              />
            );
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
                  ? cowRenderLeft + muzzleLocalX
                  : cowRenderLeft + cowRenderWidth - muzzleLocalX
              ),
              bottom: Number(
                cowRenderBottom + cowRenderHeight - muzzleLocalYFromTop
              ),
            },
          ]}
        />
      )}

      <Cow
        facing={facing}
        width={cowRenderWidth}
        height={cowRenderHeight}
        isMoving={view.isMoving}
        isJumping={!view.isGrounded}
        spriteSource={cowSprite}
        resizeMode={cowDead ? 'cover' : 'contain'}
        weapon={cowDead ? null : cowWeapon}
        style={[
          styles.cow,
          {
            left: Number(cowRenderLeft),
            bottom: Number(cowRenderBottom),
            opacity: 1 - absorbEase,
          },
        ]}
      />

      <CurrentScore score={score} />

      {/* HUD de arma y monedas: abre la armería */}
      <Pressable
        onPress={openShop}
        style={({ pressed }) => [styles.hud, pressed && styles.hudPressed]}
        accessibilityRole="button"
        accessibilityLabel="Abrir armería de armas"
      >
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
              {currentWeapon > 0 ? '★ ' : ''}
              {WEAPONS[currentWeapon].name} · Nv.{currentWeapon + 1}
            </Text>
          </View>
          <View style={styles.hudCoinRow}>
            <View style={styles.hudCoinDot} />
            <Text style={styles.hudCoinsText}>{coins}</Text>
          </View>
          <Text style={styles.hudOpenHint}>ARMERÍA ▾</Text>
        </View>
      </Pressable>

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

      {/* Armería deslizante */}
      <View
        pointerEvents={shopOpen ? 'auto' : 'none'}
        style={styles.shopOverlay}
      >
        <Animated.View style={[styles.shopBackdrop, { opacity: shopSlide }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeShop} />
        </Animated.View>

        <Animated.View
          style={[
            styles.shopPanel,
            {
              width: shopPanelWidth,
              transform: [
                {
                  translateX: shopSlide.interpolate({
                    inputRange: [0, 1],
                    outputRange: [shopPanelWidth, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.shopHeader}>
            <View>
              <Text style={styles.shopTitle}>ARMERÍA</Text>
              <View style={styles.hudCoinRow}>
                <View style={styles.hudCoinDot} />
                <Text style={styles.shopCoinsText}>{coins}</Text>
              </View>
            </View>
            <Pressable
              onPress={closeShop}
              style={({ pressed }) => [
                styles.shopClose,
                pressed && styles.shopClosePressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Cerrar armería"
            >
              <Text style={styles.shopCloseText}>✕</Text>
            </Pressable>
          </View>

          <Text style={styles.shopHint}>
            Compra armas con monedas. Cada arma es más potente y hace más daño a
            los jefes.
          </Text>

          <ScrollView
            style={styles.shopList}
            contentContainerStyle={styles.shopListContent}
            showsVerticalScrollIndicator={false}
          >
            {WEAPONS.map((weapon, index) => {
              const isCurrent = index === currentWeapon;
              const isOwned = ownedWeapons[index];
              const canAfford = coins >= weapon.price;
              // El arma de serie (0) siempre está equipada; las demás, si son la
              // actual, se pueden desequipar.
              const disabled = isCurrent ? index === 0 : !isOwned && !canAfford;
              const label = isCurrent
                ? (index === 0 ? 'EQUIPADA' : 'DESEQUIPAR')
                : isOwned
                  ? 'EQUIPAR'
                  : canAfford
                    ? 'COMPRAR'
                    : `FALTAN ${weapon.price - coins}`;

              return (
                <View
                  key={weapon.name}
                  style={[styles.shopCard, isCurrent && styles.shopCardCurrent]}
                >
                  <Image
                    source={weapon.sprite}
                    style={styles.shopCardImage}
                    resizeMode="contain"
                  />
                  <View style={styles.shopCardInfo}>
                    <Text style={styles.shopCardName}>
                      {weapon.name} · Nv.{index + 1}
                    </Text>
                    <Text style={styles.shopCardStats}>
                      Daño {weapon.damage} · Cadencia{' '}
                      {Math.round(1 / weapon.cooldown)}/s
                    </Text>
                    <View style={styles.shopCardFooter}>
                      <View style={styles.shopPrice}>
                        <View style={styles.hudCoinDot} />
                        <Text style={styles.shopPriceText}>
                          {weapon.price === 0 ? 'GRATIS' : weapon.price}
                        </Text>
                      </View>
                      <Pressable
                        onPress={() => buyOrEquipWeapon(index)}
                        disabled={disabled}
                        style={({ pressed }) => [
                          styles.shopBuyButton,
                          isCurrent && index === 0 && styles.shopEquippedButton,
                          isCurrent && index > 0 && styles.shopUnequipButton,
                          disabled && !isCurrent && styles.shopBuyButtonDisabled,
                          pressed && !disabled && styles.shopBuyButtonPressed,
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel={`${label} ${weapon.name}`}
                        accessibilityState={{ disabled }}
                      >
                        <Text
                          style={[
                            styles.shopBuyText,
                            disabled &&
                              !isCurrent &&
                              styles.shopBuyTextDisabled,
                          ]}
                        >
                          {label}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </Animated.View>
      </View>

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
  groundNight: {
    backgroundColor: '#2b2530',
    borderTopColor: '#16121b',
  },
  groundFog: {
    position: 'absolute',
    top: 2,
    left: 0,
    right: 0,
    height: 26,
    backgroundColor: 'rgba(178, 156, 196, 0.10)',
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
  stoneBlockNight: {
    backgroundColor: '#3c3543',
    borderColor: '#241f29',
    borderTopColor: '#4d4554',
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
  grassNight: {
    backgroundColor: '#3a3444',
    borderBottomColor: '#221d28',
  },
  grassHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 7,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  grassHighlightNight: {
    backgroundColor: 'rgba(196, 170, 214, 0.14)',
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
  hudPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  hudOpenHint: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  shopOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 40,
    elevation: 40,
  },
  shopBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(4, 15, 24, 0.62)',
  },
  shopPanel: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(9, 27, 40, 0.97)',
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(255, 225, 77, 0.65)',
    paddingTop: 18,
    paddingHorizontal: 14,
    paddingBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: -8, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 24,
  },
  shopHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  shopTitle: {
    color: '#ffe14d',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  shopCoinsText: {
    color: '#ffe14d',
    fontSize: 15,
    fontWeight: '800',
  },
  shopClose: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  shopClosePressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  shopCloseText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  shopHint: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 11,
    marginTop: 10,
    marginBottom: 12,
    lineHeight: 15,
  },
  shopList: {
    flex: 1,
  },
  shopListContent: {
    paddingBottom: 18,
    gap: 10,
  },
  shopCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    padding: 10,
    gap: 10,
  },
  shopCardCurrent: {
    borderColor: '#ffe14d',
    backgroundColor: 'rgba(255, 225, 77, 0.12)',
  },
  shopCardImage: {
    width: 86,
    height: 50,
  },
  shopCardInfo: {
    flex: 1,
  },
  shopCardName: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
  },
  shopCardStats: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 10,
    marginTop: 2,
  },
  shopCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  shopPrice: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shopPriceText: {
    color: '#ffe14d',
    fontSize: 13,
    fontWeight: '900',
  },
  shopBuyButton: {
    backgroundColor: '#ffe14d',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    minWidth: 86,
    alignItems: 'center',
  },
  shopEquippedButton: {
    backgroundColor: 'rgba(255, 225, 77, 0.25)',
    borderWidth: 1,
    borderColor: '#ffe14d',
  },
  shopUnequipButton: {
    backgroundColor: 'rgba(255, 80, 80, 0.25)',
    borderWidth: 1,
    borderColor: '#ff5050',
  },
  shopBuyButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  shopBuyButtonPressed: {
    opacity: 0.8,
  },
  shopBuyText: {
    color: '#0a2233',
    fontSize: 11,
    fontWeight: '900',
  },
  shopBuyTextDisabled: {
    color: 'rgba(255, 255, 255, 0.55)',
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
    position: 'absolute',
    overflow: 'hidden',
  },
  waterImg: {
    width: '100%',
    height: '100%',
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
  portalContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  portalGlow: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: PORTAL_WIDTH / 2,
    backgroundColor: '#b347ff',
    shadowColor: '#ff3dbf',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 24,
    elevation: 10,
  },
  portalImgLayer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  goalContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  goalImage: {
    width: 140,
    height: 174,
  },
});
