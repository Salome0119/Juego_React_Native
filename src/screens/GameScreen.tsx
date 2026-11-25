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
import {
  BAT_HEIGHT,
  BAT_HITBOX_HEIGHT,
  BAT_HITBOX_WIDTH,
  BAT_WIDTH,
  BatEnemy,
} from '../components/atoms/BatEnemy';
import {
  CHASE_MONSTER_HEIGHT,
  CHASE_MONSTER_WIDTH,
  ChaseMonster,
  ChaseMonsterPhase,
} from '../components/organisms/ChaseMonster';
import { COW_HEIGHT, COW_WIDTH, Cow } from '../components/atoms/Cow';
import { MermaidCow } from '../components/atoms/MermaidCow';
import {
  BossEnemySprite,
  Enemy,
  BOSS_ASPECT_RATIO,
  ENEMY_ASPECT_RATIO,
  PIRANHA_ASPECT_RATIO,
  getEnemySpriteSize,
} from '../components/atoms/Enemy';
import { CurrentScore } from '../components/molecules/CurrentScore';
import { TouchControls } from '../components/molecules/TouchControls';
import { GameOverModal } from '../components/organisms/GameOverModal';
import {
  getMudLogLeft,
  getMudLogTop,
  MUD_TRAP_LOG_HEIGHT,
  MUD_TRAP_LOG_WIDTH,
  MUD_TRAP_SINK_DURATION,
  MudTrapZone,
} from '../components/organisms/MudTrapZone';
import { COLORS, SCREEN_HEIGHT, SCREEN_WIDTH } from '../constants/theme';

const FALLBACK_SCREEN_WIDTH = 360;
const FALLBACK_SCREEN_HEIGHT = 640;

const PLAYER_START_X = 50;
const GROUND_HEIGHT = 100;

const ASCENT_STEP_COUNT = 5;
const ASCENT_STEP_WIDTH = 190;
const ASCENT_STEP_HEIGHT = 100;
const ASCENT_STEP_GAP = 55;
const ASCENT_START_X = 460;
const MAX_STEP_CLIMB = 110;
const PISO_FLOTANTE_SURFACE = 0.43;
const PISO_FLOTANTE_ASPECT = 554 / 450;
const UPPER_ROUTE_SEGMENT_WIDTH = 420;
const UPPER_ROUTE_SEGMENT_STEP = 380;
const UPPER_ROUTE_SEGMENT_COUNT = 4;
const UPPER_ROUTE_THICKNESS = Math.round(
  UPPER_ROUTE_SEGMENT_WIDTH / PISO_FLOTANTE_ASPECT
);
const UPPER_ROUTE_TOP = Math.min(
  Math.max(GROUND_HEIGHT + UPPER_ROUTE_THICKNESS + 40, SCREEN_HEIGHT - 300),
  GROUND_HEIGHT + ASCENT_STEP_COUNT * MAX_STEP_CLIMB
);
const UPPER_ROUTE_BOTTOM = UPPER_ROUTE_TOP - UPPER_ROUTE_THICKNESS;
const UPPER_ROUTE_START_X =
  ASCENT_START_X +
  (ASCENT_STEP_COUNT - 1) * (ASCENT_STEP_WIDTH + ASCENT_STEP_GAP) +
  ASCENT_STEP_WIDTH -
  10;
const UPPER_ROUTE_END_X =
  UPPER_ROUTE_START_X +
  (UPPER_ROUTE_SEGMENT_COUNT - 1) * UPPER_ROUTE_SEGMENT_STEP +
  UPPER_ROUTE_SEGMENT_WIDTH;
const BAT_TRIGGER_STEP_INDEX = 3;
const BAT_TRIGGER_X =
  ASCENT_START_X + BAT_TRIGGER_STEP_INDEX * (ASCENT_STEP_WIDTH + ASCENT_STEP_GAP);
const BAT_TRIGGER_WIDTH = 520;
const BAT_TRIGGER_BOTTOM =
  GROUND_HEIGHT +
  ((UPPER_ROUTE_TOP - GROUND_HEIGHT) * (BAT_TRIGGER_STEP_INDEX + 1)) /
    ASCENT_STEP_COUNT;
const BAT_TRIGGER_HEIGHT = UPPER_ROUTE_TOP - BAT_TRIGGER_BOTTOM + 160;
const batSpawnBottom = (offset: number): number =>
  Math.min(UPPER_ROUTE_TOP + offset, SCREEN_HEIGHT - BAT_HEIGHT - 14);
const ESPINAS_TEXTURE = { width: 499, height: 461, topRow: 126, bottomRow: 382 };
const PISO_VISIBLE_BOTTOM_OFFSET = Math.round(
  UPPER_ROUTE_THICKNESS * (1 - PISO_FLOTANTE_SURFACE)
);
const ESPINAS_TOP_Y = UPPER_ROUTE_TOP - PISO_VISIBLE_BOTTOM_OFFSET;
const ESPINAS_GAP_HEIGHT = Math.max(40, ESPINAS_TOP_Y - GROUND_HEIGHT);
const ESPINAS_SCALE =
  ESPINAS_GAP_HEIGHT / (ESPINAS_TEXTURE.bottomRow - ESPINAS_TEXTURE.topRow);
const ESPINAS_IMAGE_WIDTH = ESPINAS_TEXTURE.width * ESPINAS_SCALE;
const ESPINAS_IMAGE_HEIGHT = ESPINAS_TEXTURE.height * ESPINAS_SCALE;
const ESPINAS_BOTTOM_TRIM =
  (ESPINAS_TEXTURE.height - ESPINAS_TEXTURE.bottomRow) * ESPINAS_SCALE;
const UNDER_FLOOR_SPINES_X =
  UPPER_ROUTE_START_X +
  ((UPPER_ROUTE_SEGMENT_COUNT - 1) * UPPER_ROUTE_SEGMENT_STEP +
    UPPER_ROUTE_SEGMENT_WIDTH -
    ESPINAS_IMAGE_WIDTH) /
    2;

const BAT_CHASE_SPEED = 130;
const BAT_CHASE_OFFSET_Y = 18;
const WAVE2_BAT_HOVER_OFFSET = 42;
const WAVE2_BAT_SPAWN_INTERVAL_MS = 2600;
const WAVE2_BAT_MAX_ACTIVE = 2;
const BAT_BULLET_TOLERANCE_Y = 18;

const CHASE_TRIGGER_X = UPPER_ROUTE_START_X + 1050;
const CHASE_TRIGGER_WIDTH = 1600;
const CHASE_TRIGGER_HEIGHT = UPPER_ROUTE_TOP - GROUND_HEIGHT;
const CHASE_SPEED = 105;
const CHASE_RUSH_SPEED_MULTIPLIER = 2.1;
const CHASE_RUSH_DURATION_SECONDS = 0.9;
const MONSTER_SPIKE_JUMP_SPEED = 520;
const MONSTER_SPIKE_JUMP_RANGE = 130;
const MONSTER_AIR_SPEED_MULTIPLIER = 1.35;
const BOSS_MAX_HP = 20;
const POWER_ORB_SIZE = 40;
const POWER_ORB_DAMAGE_MULTIPLIER = 3;
const COW_POWER_SCALE = 1.18;
const CHASE_MONSTER_HP = BOSS_MAX_HP;
const CHASE_MONSTER_DROP_MS = 900;
const CHASE_MONSTER_CONTACT_INSET_X = 24;
const CHASE_MONSTER_CONTACT_BOTTOM_OFFSET = 30;
const CHASE_MONSTER_CONTACT_HEIGHT = 132;
const CHASE_SPIKE_WIDTH = 92;
const CHASE_SPIKE_HEIGHT = 64;
const CHASE_SPIKE_WARNING_MS = 650;
const FIREBALL_SPEED = 360;
const FIREBALL_FIRST_SHOT_DELAY_MS = 1000;
const FIREBALL_COOLDOWN_MS = 2000;
const FIREBALL_RANGE = 900;
const FIREBALL_RADIUS = 13;
const FIREBALL_VISUAL_WIDTH = 46;
const FIREBALL_VISUAL_HEIGHT = 22;
const FIREBALL_HIT_WIDTH = 30;
const FIREBALL_HIT_HEIGHT = 18;
const FIREBALL_SPAWN_OFFSET_Y = 90;
const FIREBALL_MAX_VERTICAL_GAP = 220;
const CHASE_SECTION_START = UPPER_ROUTE_START_X + 1500;
const CHASE_PORTAL_X = CHASE_SECTION_START + 1250;
const CHASE_ARENA_PLATFORM_WIDTH = 150;
const LAST_CHASE_PLATFORM_X = CHASE_SECTION_START + 2020;

const MOVE_SPEED = 265;
const AIR_MOVE_SPEED = 305;
const GRAVITY = 1900;
const JUMP_SPEED = 720;
const MAX_FALL_SPEED = 950;
const APEX_VELOCITY_THRESHOLD = 100;
const APEX_GRAVITY_FACTOR = 0.85;
const MAX_JUMPS = 2;
const UNDERWATER_START_BOTTOM = GROUND_HEIGHT + 350;
const UNDERWATER_MIN_BOTTOM = GROUND_HEIGHT + 24;
const UNDERWATER_MAX_BOTTOM = SCREEN_HEIGHT - 140;
const UNDERWATER_VERTICAL_SPEED = 230;
const URCHIN_WARNING_SECONDS = 2;
const URCHIN_WAVE_SECONDS = 3;
const URCHIN_FALL_SPEED = 950;
const URCHIN_SPAWN_INTERVAL = 0.14;
const URCHIN_FRAME_SECONDS = 0.12;
const URCHIN_VISIBLE_SIZE = 40;
const URCHIN_IMAGE_WIDTH = 1376;
const URCHIN_IMAGE_HEIGHT = 768;
const URCHIN_LIFETIME_SECONDS = 3;
const OCTO_COLUMN_WIDTH = 250;
const OCTO_GAP_CENTER = UNDERWATER_START_BOTTOM;
const OCTO_GAP_HEIGHT = 140;
const OCTO_PIECE_HEIGHT = 240;
const OCTO_ANIM_SECONDS = 0.5;
const OCTO_ATTACK_SECONDS = 0.7;
const OCTO_BALL_SPEED = 420;
const OCTO_BALL_SIZE = 26;
const MAX_LIVES = 3;
const INVULNERABILITY_MS = 1300;
const DAMAGE_FRAME_GUARD_MS = 16;
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
const BOSS_ARENA_START_X = 2400;
const BOSS_ARENA_RANGE = 700;
const ENEMY_SPEED = 62;
const ENEMY_HP = 3;
const ENEMY_JUMP_SPEED = 780;
const ENEMY_JUMP_AIR_SPEED_MULTIPLIER = 2.2;
const ENEMY_JUMP_INTERVAL_MIN = 1;
const ENEMY_JUMP_INTERVAL_MAX = 1.6;
const SLIME_WIDTH = 72;
const SLIME_HEIGHT = 50;
const SLIME_LIFETIME = 7;
const SLIME_FPS = 7;
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
const BULLET_MAX_RANGE = 620;

// Monedas
const COIN_WIDTH = 20;
const COIN_HEIGHT = 20;
const COIN_COLLECT_RADIUS = 22;

// Agua / fosas
const WATER_HEIGHT = 90;
const LAKE_WATER_X = 3200;
const LAKE_WATER_WIDTH = 600;
const LAKE_ROCK_WIDTH = 150;
const LAKE_ROCK_HEIGHT = 83;
const LAKE_ROCK_EDGE_OVERLAP = 30;
const LAKE_ROCK_LEFT_X = LAKE_WATER_X - LAKE_ROCK_WIDTH + LAKE_ROCK_EDGE_OVERLAP;
const LAKE_ROCK_RIGHT_X = LAKE_WATER_X + LAKE_WATER_WIDTH - LAKE_ROCK_EDGE_OVERLAP;
const LAKE_HITBOX_X = LAKE_ROCK_LEFT_X + LAKE_ROCK_WIDTH;
const LAKE_HITBOX_WIDTH = LAKE_ROCK_RIGHT_X - LAKE_HITBOX_X;
const LAKE_IMAGE_WIDTH = LAKE_WATER_WIDTH;
const LAKE_IMAGE_LEFT_OFFSET = LAKE_WATER_X - LAKE_HITBOX_X;
const LAKE_CANVAS_WIDTH = 1376;
const LAKE_CANVAS_HEIGHT = 768;
const LAKE_IMAGE_ASPECT = LAKE_CANVAS_WIDTH / LAKE_CANVAS_HEIGHT;
const LAKE_IMAGE_HEIGHT = LAKE_IMAGE_WIDTH / LAKE_IMAGE_ASPECT;
const LAKE_SURFACE_Y = GROUND_HEIGHT - 20;
const LEVEL1_GOAL_X = LAKE_WATER_X + LAKE_WATER_WIDTH + 500;
const LEVEL1_PORTAL_X = LEVEL1_GOAL_X + 120;
const LEVEL1_WIDTH = LEVEL1_PORTAL_X + 480;
const LAKE_SURFACE_RATIO = (768 - 390) / 768;
const LAKE_IMAGE_BOTTOM = LAKE_SURFACE_Y - LAKE_SURFACE_RATIO * LAKE_IMAGE_HEIGHT;
const LAKE_FRAME_SECONDS = 0.5;

// Trampa de lodo
const MUD_TRAP_SAFE_MARGIN = 30;

// Trampa con pinchos
const TRAP_ARM_DELAY = 0.3; // segundos antes de activar pinchos

// Nube trampa: plataforma flotante que se resquebraja al pisarla y desaparece
const CLOUD_TRAP_HEIGHT = 40;
const CLOUD_TRAP_ASPECT_RATIO = 669 / 373; // proporción real de nubes.png
const CLOUD_TRAP_CRACK_DELAY = 0.2; // segundos resquebrajada antes de desaparecer
const LAKE_CLOUD_BOTTOM = GROUND_HEIGHT + 120;

// Planta PiraÃ±a
// Planta Piraña: sube cuando la vaquita salte sobre ella.
const PIRANHA_HEIGHT = 64;

// Portal entre niveles
const PORTAL_WIDTH = 140;
const PORTAL_HEIGHT = 140;
const PORTAL_ANIM_SPEED = 1.1; // velocidad del fundido entre sprites (rad/s)
const PORTAL_NIVEL2_FRAME_SECONDS = 0.6; // duración de cada sprite del portal del nivel 2
const PORTAL_NIVEL2_PULSE_SPEED = 0.5; // respiración lenta del portal del nivel 2
const PORTAL_NIVEL2_ROTATION_SPEED = 4; // grados por segundo del giro del portal del nivel 2
const PORTAL_ROTATION_SPEED = 14; // grados por segundo del giro del portal
const PORTAL_CLEAR_ZONE = 320; // zona sin obstáculos antes/después del portal
const PORTAL_ABSORB_DURATION = 0.9; // segundos que tarda la vaquita en ser absorbida

// Meta / bandera
const GOAL_BOTTOM_PADDING = 13; // parte transparente del sprite que hay que hundir

// Sprites de obstÃ¡culos (de assets/trampas/trampas.jpg, fondo eliminado)
const IMG_STONE = require('../../assets/obstaculos/obstacle-stone.png');
const IMG_HOLE = require('../../assets/trampas/agujero.png');
const HOLE_IMAGE_WIDTH = 1200;
const HOLE_IMAGE_HEIGHT = 900;
const HOLE_IMAGE_CONTENT_X = 395;
const HOLE_IMAGE_CONTENT_Y = 370;
const HOLE_IMAGE_CONTENT_WIDTH = 425;
const HOLE_IMAGE_CONTENT_HEIGHT = 220;
const HOLE_TRAP_WIDTH = 130;
const HOLE_TRAP_HEIGHT = GROUND_HEIGHT;
const HOLE_OPEN_DURATION = 0.28;
const HOLE_DEATH_BOTTOM = GROUND_HEIGHT - 140;
const IMG_SPIKES = require('../../assets/obstaculos/obstacle-spikes.png');
const IMG_BENCH = require('../../assets/obstaculos/obstacle-bench.png');
const IMG_STONE_TRAP = require('../../assets/obstaculos/obstacle-stone_trampa.png');
const IMG_STONE_TRAP_INACTIVE = require('../../assets/obstaculos/obstacle-stone_trampa_estado inicial.png');
const IMG_BENCH_TRAP = require('../../assets/obstaculos/obstacle-bench_trampa.png');
const IMG_BENCH_TRAP_INACTIVE = require('../../assets/obstaculos/obstacle-bench_trampa_estado_inicial.png');
const IMG_CLOUD = require('../../assets/trampas/nubes.png');
const IMG_CLOUD_TRAP = require('../../assets/trampas/nube_trampa.png');
const IMG_LAKE_FRAMES = [
  {
    source: require('../../assets/trampas/lago_trampa.png'),
    contentLeft: 96,
    contentWidth: 1184,
    surfaceY: 350,
  },
  {
    source: require('../../assets/trampas/lago_trampa2.png'),
    contentLeft: 68,
    contentWidth: 1160,
    surfaceY: 345,
  },
  {
    source: require('../../assets/trampas/lago_trampa3.png'),
    contentLeft: 344,
    contentWidth: 684,
    surfaceY: 338,
  },
];
const IMG_SLIMES = [
  require('../../assets/trampas/baba1.png'),
  require('../../assets/trampas/baba2.png'),
  require('../../assets/trampas/baba3.png'),
  require('../../assets/trampas/baba4.png'),
];

const IMG_ESCALERAS = [
  require('../../assets/obstaculos/escalera1.png'),
  require('../../assets/obstaculos/escalera2.png'),
  require('../../assets/obstaculos/escalera3.png'),
  require('../../assets/obstaculos/escalera4.png'),
];
const IMG_PISO_FLOTANTE = require('../../assets/obstaculos/pisoflotante.png');
const IMG_ESPINAS = require('../../assets/obstaculos/espinas.png');
const IMG_ESCALERA_ASPECTS = [398 / 206, 387 / 227, 355 / 235, 249 / 213];
const IMG_ESCALERA_SURFACES = [0.46, 0.38, 0.4, 0.4];

// Portal entre niveles y fondos por nivel
const IMG_PORTAL_1 = require('../../assets/otros/portal_movimiento1.png');
const IMG_PORTAL_2 = require('../../assets/otros/portal_movimiento2.png');
const IMG_PORTAL_NIVEL2_FRAMES = [
  require('../../assets/otros/portal1_nivel2.png'),
  require('../../assets/otros/portal2_nivel2.png'),
  require('../../assets/otros/portal3_nivel2.png'),
];
const IMG_BG_LEVEL_1 = require('../../assets/fondos/fondo.jpg');
const IMG_BG_LEVEL_2 = require('../../assets/fondos/fondo_nivel2.jpg');
const IMG_BG_LEVEL_3 = require('../../assets/fondos/fondo_nivel3.jpg');
const IMG_META = require('../../assets/otros/meta.png');
const IMG_URCHIN_WARNING = require('../../assets/otros/peligro.png');
const OCTO_SPRITES = [
  [
    require('../../assets/monstruos/pulpos1.png'),
    require('../../assets/monstruos/pulpos1_2.0.png'),
    require('../../assets/monstruos/pulpos1_ataque.png'),
  ],
  [
    require('../../assets/monstruos/pulpos2.png'),
    require('../../assets/monstruos/pulpos2_2.0.png'),
    require('../../assets/monstruos/pulpos2_ataque.png'),
  ],
  [
    require('../../assets/monstruos/pulpos3.png'),
    require('../../assets/monstruos/pulpos3_2.0.png'),
    require('../../assets/monstruos/pulpos3_ataque.png'),
  ],
];
const OCTO_PIECE_BOTTOM_Y = [
  [271, 307, 301],
  [265, 295, 379],
  [263, 297, 343],
];
const OCTO_BOTTOM_PIECE_BOTTOM_Y = [
  [573, 631, 631],
  [603, 707, 681],
  [623, 703, 575],
];
const URCHIN_FRAMES = [
  {
    source: require('../../assets/monstruos/erizo1.png'),
    left: 488,
    right: 852,
    top: 204,
    bottom: 564,
  },
  {
    source: require('../../assets/monstruos/erizo2.png'),
    left: 544,
    right: 820,
    top: 256,
    bottom: 560,
  },
];

const createOctopusColumns = (): OctopusColumn[] =>
  [820, 1140, 1340, 1960, 2440, 2680].map((x, index) => ({
    id: index + 1,
    x,
    variant: (index % 3) as 0 | 1 | 2,
    triggered: false,
    attackUntil: 0,
  }));

const urchinFrameStyle = (
  frame: (typeof URCHIN_FRAMES)[number]
) => {
  const contentWidth = frame.right - frame.left;
  const contentHeight = frame.bottom - frame.top;
  const scale = Math.min(
    URCHIN_VISIBLE_SIZE / contentWidth,
    URCHIN_VISIBLE_SIZE / contentHeight
  );
  return {
    position: 'absolute' as const,
    left: -frame.left * scale,
    bottom: -(URCHIN_IMAGE_HEIGHT - frame.bottom) * scale,
    width: URCHIN_IMAGE_WIDTH * scale,
    height: URCHIN_IMAGE_HEIGHT * scale,
  };
};

// Sprites de la vaquita (animación por estados)
const IMG_COW_IDLE = require('../../assets/vaquita/caminando1.png');
const IMG_COW_ATTACK = require('../../assets/vaquita/ataque.png');
const IMG_COW_JUMP = require('../../assets/vaquita/salto.png');
const IMG_COW_WALK_2 = require('../../assets/vaquita/caminar2.png');
const IMG_COW_DEATH = require('../../assets/vaquita/muerte.png');

// Sprites de la vaquita CON ARMA (2.0)
const IMG_COW_IDLE_WEAPON = require('../../assets/vaquita/caminando2.0.png');
const IMG_COW_ATTACK_WEAPON = require('../../assets/vaquita/ataque2.0.png');
const IMG_COW_JUMP_WEAPON = require('../../assets/vaquita/saltando2.0.png');

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
const IMG_WEAPON_ESC = require('../../assets/armas/arma.png');
const IMG_WEAPON_GLUE = require('../../assets/armas/arma1.png');
const IMG_WEAPON_STICKY = require('../../assets/armas/arma2.png');
const IMG_WEAPON_SAP = require('../../assets/armas/arma3.png');
const IMG_WEAPON_GEL = require('../../assets/armas/arma4.png');

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
    price: 20,
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
    price: 50,
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
    price: 100,
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
    price: 180,
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
    price: 350,
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

interface CarriedProgress {
  coins: number;
  ownedWeapons: boolean[];
  weapon: number;
}

let carriedProgress: CarriedProgress | null = null;

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

const UPPER_ROUTE_OBSTACLES: InitialObstacleSpec[] = [
  ...Array.from({ length: ASCENT_STEP_COUNT }, (_, index) => {
    const top =
      GROUND_HEIGHT +
      ((UPPER_ROUTE_TOP - GROUND_HEIGHT) * (index + 1)) / ASCENT_STEP_COUNT;
    return {
      type: 'upper_platform' as const,
      x: ASCENT_START_X + index * (ASCENT_STEP_WIDTH + ASCENT_STEP_GAP),
      bottom: top - ASCENT_STEP_HEIGHT,
      width: ASCENT_STEP_WIDTH,
      height: ASCENT_STEP_HEIGHT,
      visualKind: 'escalera' as const,
      visualIndex: index % IMG_ESCALERAS.length,
      collisionInsetX: 18,
    };
  }),
  ...Array.from({ length: UPPER_ROUTE_SEGMENT_COUNT }, (_, index) => ({
    type: 'upper_platform' as const,
    x: UPPER_ROUTE_START_X + index * UPPER_ROUTE_SEGMENT_STEP,
    bottom: UPPER_ROUTE_BOTTOM,
    width: UPPER_ROUTE_SEGMENT_WIDTH,
    height: UPPER_ROUTE_THICKNESS,
    visualKind: 'pisoflotante' as const,
  })),
  {
    type: 'floor_spines' as const,
    x: UNDER_FLOOR_SPINES_X,
    bottom: GROUND_HEIGHT,
    width: ESPINAS_IMAGE_WIDTH,
    height: ESPINAS_GAP_HEIGHT,
  },
  {
    type: 'spines_barrier' as const,
    x: UNDER_FLOOR_SPINES_X + ESPINAS_IMAGE_WIDTH - 40,
    bottom: GROUND_HEIGHT,
    width: ESPINAS_IMAGE_WIDTH,
    height: ESPINAS_GAP_HEIGHT,
  },
  {
    type: 'floor_spines' as const,
    x: UPPER_ROUTE_END_X - ESPINAS_IMAGE_WIDTH,
    bottom: GROUND_HEIGHT,
    width: ESPINAS_IMAGE_WIDTH,
    height: ESPINAS_GAP_HEIGHT,
  },
  {
    type: 'spines_barrier' as const,
    x: LAST_CHASE_PLATFORM_X + CHASE_ARENA_PLATFORM_WIDTH + 20,
    bottom: GROUND_HEIGHT,
    width: 30,
    height: SCREEN_HEIGHT - GROUND_HEIGHT,
    finalBarrier: true,
  },
  {
    type: 'bat_trigger' as const,
    x: BAT_TRIGGER_X,
    bottom: BAT_TRIGGER_BOTTOM,
    width: BAT_TRIGGER_WIDTH,
    height: BAT_TRIGGER_HEIGHT,
  },
  {
    type: 'bat' as const,
    x: UPPER_ROUTE_START_X + 290,
    bottom: batSpawnBottom(55),
    width: BAT_WIDTH,
    height: BAT_HEIGHT,
    batWave: 1 as const,
  },
  {
    type: 'bat' as const,
    x: UPPER_ROUTE_START_X + 740,
    bottom: batSpawnBottom(95),
    width: BAT_WIDTH,
    height: BAT_HEIGHT,
    batWave: 1 as const,
  },
  {
    type: 'bat' as const,
    x: UPPER_ROUTE_START_X + 1160,
    bottom: batSpawnBottom(45),
    width: BAT_WIDTH,
    height: BAT_HEIGHT,
    batWave: 1 as const,
  },
];

const CHASE_OBSTACLES: InitialObstacleSpec[] = [
  {
    type: 'chase_trigger' as const,
    x: CHASE_TRIGGER_X,
    bottom: GROUND_HEIGHT,
    width: CHASE_TRIGGER_WIDTH,
    height: CHASE_TRIGGER_HEIGHT,
  },
  ...[0, 1, 2].map((index) => ({
    type: 'bat' as const,
    x: CHASE_SECTION_START + 180 + index * 520,
    bottom: Math.min(
      GROUND_HEIGHT + 170 + index * 70,
      SCREEN_HEIGHT - BAT_HEIGHT - 14
    ),
    width: BAT_WIDTH,
    height: BAT_HEIGHT,
    batWave: 2 as const,
  })),
  ...[0, 1, 2].map((index) => ({
    type: 'chase_spike' as const,
    x:
      CHASE_SECTION_START +
      260 +
      index * ((LAST_CHASE_PLATFORM_X - CHASE_SECTION_START - 400) / 2),
    bottom: GROUND_HEIGHT,
    width: CHASE_SPIKE_WIDTH,
    height: CHASE_SPIKE_HEIGHT,
  })),
  ...[
    { x: CHASE_SECTION_START + 260, bottom: GROUND_HEIGHT + 300 },
    { x: CHASE_SECTION_START + 700, bottom: GROUND_HEIGHT + 100 },
    { x: CHASE_SECTION_START + 1140, bottom: GROUND_HEIGHT + 250 },
    { x: CHASE_SECTION_START + 1580, bottom: GROUND_HEIGHT + 70 },
    { x: LAST_CHASE_PLATFORM_X, bottom: GROUND_HEIGHT + 190 },
  ].map((anchor) => ({
    type: 'upper_platform' as const,
    x: anchor.x,
    bottom: anchor.bottom,
    width: CHASE_ARENA_PLATFORM_WIDTH,
    height: 60,
    visualKind: 'pisoflotante' as const,
    arenaPlatform: true,
  })),
  {
    type: 'portal' as const,
    x: CHASE_PORTAL_X,
    bottom: GROUND_HEIGHT,
    width: PORTAL_WIDTH,
    height: PORTAL_HEIGHT,
    portalLocked: true,
  },
];

const LEVELS: LevelConfig[] = [
  {
    id: 1,
    name: 'Nivel 1: Praderas',
    width: LEVEL1_WIDTH,
    water: { x: LAKE_HITBOX_X, width: LAKE_HITBOX_WIDTH, bottom: GROUND_HEIGHT, height: 60 },
    goal: { x: LEVEL1_GOAL_X, bottom: GROUND_HEIGHT, width: 60, height: 100 },
obstacles: [
        { type: 'crate', x: 300, width: 140, height: 70 },
        { type: 'enemy', x: 850, width: ENEMY_WIDTH, height: ENEMY_HEIGHT, patrolCenterX: 720, patrolRange: 370 },
        { type: 'bench_trap', x: 1000, width: 150, height: 70 },
        { type: 'spike_trap', x: 1300, width: 125, height: SPIKE_HEIGHT },
        { type: 'destructible', x: 1600, width: 120, height: 70 },
        { type: 'hole_trap', x: 1815, width: HOLE_TRAP_WIDTH, height: HOLE_TRAP_HEIGHT },
        { type: 'moving', x: 2050, width: 140, height: 70 },
        { type: 'enemy', x: 2550, width: BOSS_WIDTH, height: BOSS_HEIGHT, isBoss: true },
        // Piedras de la trampa del lago: apoyadas en el suelo a ambos lados
        { type: 'crate', x: LAKE_ROCK_LEFT_X, width: LAKE_ROCK_WIDTH, height: LAKE_ROCK_HEIGHT },
        { type: 'crate', x: LAKE_ROCK_RIGHT_X, width: LAKE_ROCK_WIDTH, height: LAKE_ROCK_HEIGHT },
        // Plataforma de nube sobre el lago para cruzarlo
        { type: 'cloud_trap', x: 3425, bottom: LAKE_CLOUD_BOTTOM, width: 150, height: CLOUD_TRAP_HEIGHT },
        // Portal junto a la bandera para viajar al nivel 2
        { type: 'portal', x: LEVEL1_PORTAL_X, width: PORTAL_WIDTH, height: PORTAL_HEIGHT },
      ],
  },
  {
    id: 2,
    name: 'Nivel 2',
    width: 3200,
    procedural: false,
    obstacles: [...UPPER_ROUTE_OBSTACLES, ...CHASE_OBSTACLES],
  },
  {
    id: 3,
    name: 'Nivel 3',
    width: 3600,
    procedural: false,
    goal: { x: 3200, bottom: GROUND_HEIGHT, width: 60, height: 100 },
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
  | 'hole_trap'
  | 'cloud_trap'
  | 'slime'
  | 'mud_trap'
  | 'mud_log'
  | 'upper_platform'
  | 'bat_trigger'
  | 'bat'
  | 'chase_trigger'
  | 'chase_monster'
  | 'chase_spike'
  | 'floor_spines'
  | 'spines_barrier'
  | 'boss_gate'
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
  enraged?: boolean;
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
  // Agujero en el suelo entre la piedra y el tronco
  holeOpen?: boolean;
  holeOpenedAt?: number;
  // Trampa de lodo
  mudTriggered?: boolean;
  // Ruta alta y murciélagos
  triggerFired?: boolean;
  batAwake?: boolean;
  batWave?: 1 | 2;
  active?: boolean;
  moving?: boolean;
  fireballWindup?: boolean;
  chaseRushUntil?: number;
  airborne?: boolean;
  enemyJumpTimer?: number;
  bossState?: 'patrol' | 'windup' | 'charge';
  bossStateUntil?: number;
  bossNextActionAt?: number;
  bossLastX?: number;
  bossStuckFor?: number;
  spawnedAt?: number;
  batHomeX?: number;
  batHomeBottom?: number;
  visualKind?: 'escalera' | 'pisoflotante';
  visualIndex?: number;
  collisionInsetX?: number;
  extraWidth?: number;
  arenaPlatform?: boolean;
  // Secuencia final del nivel 2
  portalLocked?: boolean;
  finalBarrier?: boolean;
  // Meta
  isGoal?: boolean;
}

interface Fireball {
  id: number;
  x: number;
  originX: number;
  baseY: number;
  y: number;
  vx: number;
}

interface Bullet {
  id: number;
  x: number;
  originX: number;
  y: number;
  dir: Facing;
  vx: number;
  width: number;
  height: number;
  born: number;
}

interface OctopusColumn {
  id: number;
  x: number;
  variant: 0 | 1 | 2;
  triggered: boolean;
  attackUntil: number;
}

interface OctopusBall {
  id: number;
  x: number;
  bottom: number;
  vx: number;
  vy: number;
  born: number;
}

interface Urchin {
  id: number;
  x: number;
  bottom: number;
  landed: boolean;
  expiresAt?: number;
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
  portalCoin?: boolean;
}

interface InitialObstacleSpec {
  type: ObstacleType;
  x: number;
  width: number;
  height: number;
  bottom?: number;
  isBoss?: boolean;
  visualKind?: 'escalera' | 'pisoflotante';
  visualIndex?: number;
  collisionInsetX?: number;
  extraWidth?: number;
  arenaPlatform?: boolean;
  patrolCenterX?: number;
  patrolRange?: number;
  portalLocked?: boolean;
  finalBarrier?: boolean;
  batWave?: 1 | 2;
  active?: boolean;
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
    health: ENEMY_HP,
    maxHealth: ENEMY_HP,
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
        startX: BOSS_ARENA_START_X,
        range: BOSS_ARENA_RANGE,
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
      case 'hole_trap': {
        obstacles.push({
          id: id++,
          type: 'hole_trap',
          x: spec.x,
          bottom: spec.bottom ?? 0,
          width: spec.width,
          height: spec.height,
          scored: false,
          holeOpen: false,
        });
        break;
      }
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
      case 'mud_trap': {
        obstacles.push({
          id: id++,
          type: 'mud_trap',
          x: spec.x,
          bottom: 0,
          width: spec.width,
          height: spec.height,
          scored: false,
          mudTriggered: false,
        });
        obstacles.push({
          id: id++,
          type: 'mud_log',
          x: getMudLogLeft(spec.x, spec.width),
          bottom: getMudLogTop(GROUND_HEIGHT) - MUD_TRAP_LOG_HEIGHT,
          width: MUD_TRAP_LOG_WIDTH,
          height: MUD_TRAP_LOG_HEIGHT,
          scored: false,
        });
        break;
      }
      case 'upper_platform': {
        obstacles.push({
          id: id++,
          type: 'upper_platform',
          x: spec.x,
          bottom: spec.bottom ?? UPPER_ROUTE_BOTTOM,
          width: spec.width + (spec.extraWidth ?? 0),
          height: spec.height,
          scored: false,
          visualKind: spec.visualKind,
          visualIndex: spec.visualIndex,
          collisionInsetX: spec.collisionInsetX,
          arenaPlatform: spec.arenaPlatform,
        });
        break;
      }
      case 'bat_trigger': {
        obstacles.push({
          id: id++,
          type: 'bat_trigger',
          x: spec.x,
          bottom: spec.bottom ?? UPPER_ROUTE_TOP,
          width: spec.width,
          height: spec.height,
          scored: false,
          triggerFired: false,
        });
        break;
      }
      case 'bat': {
        const batBottom = spec.bottom ?? UPPER_ROUTE_TOP;
        obstacles.push({
          id: id++,
          type: 'bat',
          x: spec.x,
          bottom: batBottom,
          width: spec.width,
          height: spec.height,
          scored: false,
          batAwake: false,
          active: false,
          batWave: spec.batWave,
          batHomeX: spec.x,
          batHomeBottom: batBottom,
          vx: 0,
          vy: 0,
          facing: 'left',
          health: 3,
        });
        break;
      }
      case 'chase_trigger': {
        obstacles.push({
          id: id++,
          type: 'chase_trigger',
          x: spec.x,
          bottom: spec.bottom ?? GROUND_HEIGHT,
          width: spec.width,
          height: spec.height,
          scored: false,
          triggerFired: false,
        });
        break;
      }
      case 'floor_spines':
      case 'spines_barrier': {
        obstacles.push({
          id: id++,
          type: spec.type,
          x: spec.x,
          bottom: spec.bottom ?? GROUND_HEIGHT,
          width: spec.width,
          height: spec.height,
          scored: false,
          finalBarrier: spec.finalBarrier,
        });
        break;
      }
      case 'chase_spike': {
        obstacles.push({
          id: id++,
          type: 'chase_spike',
          x: spec.x,
          bottom: spec.bottom ?? GROUND_HEIGHT,
          width: spec.width,
          height: spec.height,
          scored: false,
          spikeTrapVisible: false,
        });
        break;
      }
      case 'boss_gate': {
        obstacles.push({
          id: id++,
          type: 'boss_gate',
          x: spec.x,
          bottom: spec.bottom ?? GROUND_HEIGHT,
          width: spec.width,
          height: spec.height,
          scored: false,
          active: spec.active ?? true,
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
          portalLocked: spec.portalLocked ?? false,
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
          startX: isEnemy ? (spec.patrolCenterX ?? spec.x) : undefined,
          range: isEnemy ? (spec.patrolRange ?? ENEMY_PATROL_RANGE) : undefined,
          vy: isEnemy ? 0 : undefined,
          health: isEnemy ? ENEMY_HP : undefined,
          maxHealth: isEnemy ? ENEMY_HP : undefined,
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
    if (spec.type === 'upper_platform') {
      const surface = (spec.bottom ?? GROUND_HEIGHT) + spec.height;
      const count = spec.visualKind === 'escalera' ? 1 : 2;
      for (let i = 0; i < count; i++) {
        const offset = count === 1 ? 0 : (i - 0.5) * 70;
        placeCoin(spec.x + spec.width / 2 + offset - COIN_WIDTH / 2, surface + 16);
      }
    }
    if (spec.type === 'portal' && spec.portalLocked) {
      for (let i = 0; i < 5; i++) {
        placeCoin(spec.x + i * 24 - 40, GROUND_HEIGHT + 20);
        coins[coins.length - 1].portalCoin = true;
      }
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
const MONSTER_SPIKE_TYPES: ObstacleType[] = [
  'floor_spines',
  'spines_barrier',
  'chase_spike',
  'spike_trap',
];

const SOLID_BLOCKING_TYPES: ObstacleType[] = [
  'crate',
  'destructible',
  'moving',
  'trap_platform',
  'stone_trap',
  'bench_trap',
  'cloud_trap',
  'mud_log',
  'upper_platform',
  'boss_gate',
  'spines_barrier',
];

interface CollisionBody {
  x: number;
  bottom: number;
  width: number;
  height: number;
}

// Una nube trampa ya destruida o la barrera del jefe ya vencida dejan de
// colisionar y de dibujarse.
const isVanishedObstacle = (obstacle: Obstacle): boolean =>
  (obstacle.type === 'cloud_trap' && obstacle.vanished === true) ||
  (obstacle.type === 'boss_gate' && obstacle.active !== true);

const isOverOpenHole = (x: number, obstacles: Obstacle[]): boolean =>
  obstacles.some(
    (obstacle) =>
      obstacle.type === 'hole_trap' &&
      obstacle.holeOpen === true &&
      x + COW_WIDTH > obstacle.x &&
      x < obstacle.x + obstacle.width
  );

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
const getObstacleCollisionRect = (obstacle: Obstacle): Rect => {
  const inset = Math.min(
    obstacle.collisionInsetX ?? 0,
    Math.max(0, obstacle.width / 2 - 4)
  );
  return {
    x: obstacle.x + inset,
    bottom: obstacle.bottom,
    width: obstacle.width - inset * 2,
    height: obstacle.height,
  };
};

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

    const collisionRect = getObstacleCollisionRect(obstacle);
    const obstacleLeft = collisionRect.x;
    const obstacleRight = collisionRect.x + collisionRect.width;
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
    if (
      !solid ||
      obstacle.type === 'spines_barrier' ||
      obstacle.type === 'boss_gate' ||
      isVanishedObstacle(obstacle) ||
      !hasHorizontalOverlap(x, width, getObstacleCollisionRect(obstacle), 6)
    ) {
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

const getCowGroundSupport = (
  x: number,
  bottom: number,
  obstacles: Obstacle[]
): number => {
  let support = GROUND_HEIGHT;

  for (const obstacle of obstacles) {
    if (
      !SOLID_BLOCKING_TYPES.includes(obstacle.type) ||
      obstacle.type === 'spines_barrier' ||
      obstacle.type === 'boss_gate' ||
      isVanishedObstacle(obstacle)
    ) {
      continue;
    }
    const rect = getObstacleCollisionRect(obstacle);
    if (x + COW_WIDTH <= rect.x + 2 || x >= rect.x + rect.width - 2) {
      continue;
    }
    const top = obstacle.bottom + obstacle.height;
    if (top > support && bottom >= top - 2 && bottom <= top + 2) {
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
    const insetX = sprite.width * 0.12;
    const insetBottom = sprite.height * 0.06;
    const insetTop = sprite.height * 0.08;
    return {
      x: obstacle.x + (obstacle.width - sprite.width) / 2 + insetX,
      bottom: obstacle.bottom + insetBottom,
      width: sprite.width - insetX * 2,
      height: sprite.height - insetBottom - insetTop,
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
  if (obstacle.type === 'bat') {
    return {
      x: obstacle.x + (obstacle.width - BAT_HITBOX_WIDTH) / 2,
      bottom: obstacle.bottom + (obstacle.height - BAT_HITBOX_HEIGHT) / 2,
      width: BAT_HITBOX_WIDTH,
      height: BAT_HITBOX_HEIGHT,
    };
  }
  if (obstacle.type === 'chase_monster') {
    return {
      x: obstacle.x + CHASE_MONSTER_CONTACT_INSET_X,
      bottom: obstacle.bottom + CHASE_MONSTER_CONTACT_BOTTOM_OFFSET,
      width: obstacle.width - CHASE_MONSTER_CONTACT_INSET_X * 2,
      height: Math.min(
        CHASE_MONSTER_CONTACT_HEIGHT,
        obstacle.height - CHASE_MONSTER_CONTACT_BOTTOM_OFFSET
      ),
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
  obstacle: Obstacle | Rect
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

const HoleTrapObstacle = React.memo(function HoleTrapObstacle({
  obstacle,
  left,
  now,
}: ObstacleViewProps & { now: number }) {
  if (obstacle.holeOpen !== true) {
    return null;
  }
  const progress = Math.min(
    1,
    Math.max(0, (now - (obstacle.holeOpenedAt ?? now)) / HOLE_OPEN_DURATION)
  );

  const scale = (obstacle.width + 30) / HOLE_IMAGE_CONTENT_WIDTH;

  return (
    <Image
      source={IMG_HOLE}
      style={{
        position: 'absolute',
        left:
          Number(left) -
          (HOLE_IMAGE_CONTENT_X + HOLE_IMAGE_CONTENT_WIDTH / 2) * scale,
        bottom:
          -(HOLE_IMAGE_HEIGHT - HOLE_IMAGE_CONTENT_Y - HOLE_IMAGE_CONTENT_HEIGHT) *
          scale,
        width: HOLE_IMAGE_WIDTH * scale,
        height: HOLE_IMAGE_HEIGHT * scale,
        opacity: progress,
        zIndex: 4,
      }}
      resizeMode="stretch"
    />
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
  active,
}: ObstacleViewProps & { active: boolean }) {
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

const SlimeObstacle = React.memo(function SlimeObstacle({
  obstacle,
  left,
  now,
}: ObstacleViewProps & { now: number }) {
  const age = Math.max(0, now - (obstacle.spawnedAt ?? now));
  const frame = Math.floor(age * SLIME_FPS) % IMG_SLIMES.length;
  const remaining = SLIME_LIFETIME - age;
  const fade = remaining < 1 ? Math.max(0, remaining) : 1;
  const wobble = Math.sin(age * 4 + obstacle.id) * 3;

  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: Number(left + wobble),
        bottom: Number(obstacle.bottom - 9),
        width: obstacle.width,
        height: obstacle.height,
        opacity: fade,
        zIndex: 3,
      }}
    >
      <Image
        source={IMG_SLIMES[frame]}
        style={styles.obstacleImg}
        resizeMode="contain"
        fadeDuration={0}
        accessible={false}
      />
    </View>
  );
});

const EnemyObstacle = React.memo(function EnemyObstacle({
  obstacle,
  left,
  cowScreenX,
  bossSpeed,
  bossMoving,
  bossFacing,
}: ObstacleViewProps & {
  cowScreenX?: number;
  bossSpeed?: number;
  bossMoving?: boolean;
  bossFacing?: Facing;
}) {
  const isBoss = obstacle.isBoss || obstacle.bossConfig;
  const health = obstacle.health ?? 1;
  const maxHealth = obstacle.maxHealth ?? 1;
  const healthPercent = Math.max(0, Math.min(100, (health / maxHealth) * 100));
  const isHit = obstacle.hitFlash === true;
  const isAngry =
    !isBoss &&
    (obstacle.enraged === true ||
      (cowScreenX !== undefined &&
        Math.abs(cowScreenX + COW_WIDTH / 2 - (left + obstacle.width / 2)) <
          ENEMY_ALERT_DISTANCE));

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
      {isBoss ? (
        <BossEnemySprite
          facing={bossFacing ?? obstacle.facing ?? 'right'}
          width={obstacle.width}
          height={obstacle.height}
          aspectRatio={BOSS_ASPECT_RATIO}
          speed={bossSpeed ?? Math.abs(obstacle.vx ?? 0)}
          moving={bossMoving ?? (!isHit && Math.abs(obstacle.vx ?? 0) > 1)}
          hitFlash={isHit}
          style={{
            width: obstacle.width,
            height: obstacle.height,
          }}
        />
      ) : (
        <Enemy
          facing={obstacle.facing ?? 'right'}
          width={obstacle.width}
          height={obstacle.height}
          aspectRatio={
            isAngry ? ENEMY_ANGRY_ASPECT_RATIO : ENEMY_ASPECT_RATIO
          }
          imageSource={
            isAngry
              ? require('../../assets/monstruos/mosntruo_enojado.png')
              : require('../../assets/monstruos/monstruo.png')
          }
          style={{
            width: obstacle.width,
            height: obstacle.height,
            opacity: isHit ? 0.5 : 1,
            transform: isHit ? [{ scale: 1.1 }] : undefined,
          }}
        />
      )}
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

const UpperRoutePlatform = React.memo(function UpperRoutePlatform({
  obstacle,
  left,
}: PlatformViewProps) {
  const isStep = obstacle.visualKind === 'escalera';
  const stepIndex = (obstacle.visualIndex ?? 0) % IMG_ESCALERAS.length;
  const aspect = isStep ? IMG_ESCALERA_ASPECTS[stepIndex] : PISO_FLOTANTE_ASPECT;
  const surface = isStep ? IMG_ESCALERA_SURFACES[stepIndex] : PISO_FLOTANTE_SURFACE;
  const drawnHeight = Math.min(obstacle.height, obstacle.width / aspect);
  const surfaceShift = obstacle.arenaPlatform
    ? drawnHeight * (1 - surface) - obstacle.height
    : obstacle.height / 2 + drawnHeight * (surface - 0.5);
  const isArenaPlatform = obstacle.arenaPlatform === true;
  const arenaImageHeight = obstacle.width / aspect;
  const arenaBottomOffset =
    obstacle.height - arenaImageHeight * (1 - surface);
  const source = isStep ? IMG_ESCALERAS[stepIndex] : IMG_PISO_FLOTANTE;

  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: Number(left),
        bottom: Number(obstacle.bottom),
        width: obstacle.width,
        height: obstacle.height,
        zIndex: isStep ? 2 : 1,
        overflow: isArenaPlatform ? 'hidden' : undefined,
      }}
    >
      <Image
        source={source}
        style={
          isArenaPlatform
            ? {
                position: 'absolute',
                left: 0,
                bottom: arenaBottomOffset,
                width: obstacle.width,
                height: arenaImageHeight,
              }
            : {
                position: 'absolute',
                left: 0,
                bottom: 0,
                width: obstacle.width,
                height: obstacle.height,
                transform: [{ translateY: -surfaceShift }],
              }
        }
        resizeMode="contain"
        fadeDuration={0}
        accessible={false}
      />
    </View>
  );
});

const BatObstacle = React.memo(function BatObstacle({
  obstacle,
  left,
  now,
}: ObstacleViewProps & { now: number }) {
  return (
    <View
      style={[
        styles.obstacle,
        {
          left: Number(left),
          bottom: Number(obstacle.bottom),
          width: obstacle.width,
          height: obstacle.height,
          zIndex: 4,
        },
      ]}
    >
      <BatEnemy
        awake={obstacle.batAwake === true}
        facing={obstacle.facing ?? 'left'}
        now={now}
        width={obstacle.width}
        height={obstacle.height}
      />
    </View>
  );
});

const FloorSpines = React.memo(function FloorSpines({
  obstacle,
  left,
}: ObstacleViewProps) {
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: Number(left),
        bottom: Number(obstacle.bottom),
        width: obstacle.width,
        height: obstacle.height,
        zIndex: 2,
        overflow: 'hidden',
      }}
    >
      <Image
        source={IMG_ESPINAS}
        style={{
          position: 'absolute',
          left: 0,
          bottom: -ESPINAS_BOTTOM_TRIM,
          width: ESPINAS_IMAGE_WIDTH,
          height: ESPINAS_IMAGE_HEIGHT,
        }}
        resizeMode="contain"
        fadeDuration={0}
        accessible={false}
      />
    </View>
  );
});

const BossGate = React.memo(function BossGate({
  obstacle,
  left,
}: ObstacleViewProps) {
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: Number(left),
        bottom: Number(obstacle.bottom),
        width: obstacle.width,
        height: obstacle.height,
        zIndex: 6,
      }}
    >
      <Image
        source={IMG_ESPINAS}
        style={{ width: obstacle.width, height: obstacle.height }}
        resizeMode="stretch"
        fadeDuration={0}
        accessible={false}
      />
    </View>
  );
});

const ChaseSpike = React.memo(function ChaseSpike({
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
          zIndex: 3,
        },
      ]}
    >
      <View style={styles.chaseSpikeBase} />
      {obstacle.spikeTrapVisible && (
        <Image
          source={IMG_SPIKES}
          style={styles.chaseSpikeSprite}
          resizeMode="contain"
        />
      )}
    </View>
  );
});

const lakeFrameStyle = (frame: (typeof IMG_LAKE_FRAMES)[number]) => {
  const scale = LAKE_IMAGE_WIDTH / frame.contentWidth;
  return {
    position: 'absolute' as const,
    left: -frame.contentLeft * scale,
    bottom:
      LAKE_SURFACE_Y -
      (LAKE_CANVAS_HEIGHT - frame.surfaceY) * scale -
      LAKE_IMAGE_BOTTOM,
    width: LAKE_CANVAS_WIDTH * scale,
    height: LAKE_CANVAS_HEIGHT * scale,
  };
};

const WaterZone = React.memo(function WaterZone({
  obstacle,
  left,
  now,
}: PlatformViewProps & { now: number }) {
  const framePhase = now / LAKE_FRAME_SECONDS;
  const frameIndex = Math.floor(framePhase) % IMG_LAKE_FRAMES.length;
  const nextFrameIndex = (frameIndex + 1) % IMG_LAKE_FRAMES.length;
  const frameT = framePhase - Math.floor(framePhase);
  const frameBlend = frameT * frameT * (3 - 2 * frameT);

  return (
    <View
      style={[
        styles.waterZone,
        {
          left: Number(left) + LAKE_IMAGE_LEFT_OFFSET,
          bottom: LAKE_IMAGE_BOTTOM,
          width: LAKE_IMAGE_WIDTH,
          height: LAKE_IMAGE_HEIGHT,
        },
      ]}
    >
      <Image
        source={IMG_LAKE_FRAMES[frameIndex].source}
        style={lakeFrameStyle(IMG_LAKE_FRAMES[frameIndex])}
        resizeMode="stretch"
        fadeDuration={0}
      />
      <Image
        source={IMG_LAKE_FRAMES[nextFrameIndex].source}
        style={[
          lakeFrameStyle(IMG_LAKE_FRAMES[nextFrameIndex]),
          { opacity: frameBlend },
        ]}
        resizeMode="stretch"
        fadeDuration={0}
      />
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
        source={require('../../assets/monstruos/planta.png')}
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
  level,
}: PlatformViewProps & { now: number; level: number }) {
  // Fundido suave entre los dos sprites + giro y respiración lentos.
  const blend = (Math.sin(now * PORTAL_ANIM_SPEED) + 1) / 2;
  const pulse = 1 + Math.sin(now * PORTAL_ANIM_SPEED) * 0.035;
  const rotation = ((now * PORTAL_ROTATION_SPEED) % 360).toFixed(1);
  const glowOpacity = 0.28 + blend * 0.22;

  const level2 = level >= 2;
  const slowWave = (Math.sin(now * PORTAL_NIVEL2_PULSE_SPEED) + 1) / 2;
  const framePhase = now / PORTAL_NIVEL2_FRAME_SECONDS;
  const frameIndex =
    Math.floor(framePhase) % IMG_PORTAL_NIVEL2_FRAMES.length;
  const nextFrameIndex =
    (frameIndex + 1) % IMG_PORTAL_NIVEL2_FRAMES.length;
  const frameT = framePhase - Math.floor(framePhase);
  const frameBlend = frameT * frameT * (3 - 2 * frameT);
  const level2Rotation = ((now * PORTAL_NIVEL2_ROTATION_SPEED) % 360).toFixed(1);

  return (
    <View
      style={[
        styles.portalContainer,
        {
          left: Number(left),
          bottom: Number(obstacle.bottom),
          width: obstacle.width,
          height: obstacle.height,
          transform: [
            { scale: level2 ? 1 + slowWave * 0.02 : pulse },
            { rotate: `${level2 ? level2Rotation : rotation}deg` },
          ],
        },
      ]}
    >
      <View
        style={[
          styles.portalGlow,
          level2 && { backgroundColor: '#2fb8ff', shadowColor: '#7fe8ff' },
          { opacity: level2 ? 0.3 + slowWave * 0.16 : glowOpacity },
        ]}
      />
      {level2 ? (
        <>
          <Image
            source={IMG_PORTAL_NIVEL2_FRAMES[frameIndex]}
            style={styles.portalImgLayer}
            resizeMode="cover"
            fadeDuration={0}
          />
          <Image
            source={IMG_PORTAL_NIVEL2_FRAMES[nextFrameIndex]}
            style={[styles.portalImgLayer, { opacity: frameBlend }]}
            resizeMode="cover"
            fadeDuration={0}
          />
        </>
      ) : (
        <>
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
        </>
      )}
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

const GROUND_TUFTS = Array.from({ length: 22 }, (_, index) => {
  const wave = Math.abs(Math.sin(index * 2.7));
  return {
    left: (index / 22) * 100 + (wave - 0.5) * 3.5,
    top: -4 + Math.round(wave * 3),
    width: 6 + Math.round(wave * 9),
    height: 4 + Math.round(Math.abs(Math.cos(index * 1.9)) * 6),
    opacity: 0.4 + wave * 0.35,
  };
});

const GroundSurface = React.memo(function GroundSurface({
  isNight,
  isUnderwater,
}: {
  isNight: boolean;
  isUnderwater: boolean;
}) {
  const stoneColor = isUnderwater ? '#17495c' : isNight ? '#3c3543' : '#8d765c';
  const stoneBorderColor = isUnderwater ? '#0c2f3f' : isNight ? '#241f29' : '#5f4c39';
  const stoneTopColor = isUnderwater ? '#2b7085' : isNight ? '#4d4554' : '#a8927a';
  const speckLightColor = isUnderwater ? '#4aa2b8' : isNight ? '#4d4554' : '#a8927a';
  const speckDarkColor = isUnderwater ? '#0b2a38' : isNight ? '#241f29' : '#5f4c39';
  const grassColor = isUnderwater ? '#1d6f80' : isNight ? '#3a3444' : '#74c947';
  const edgeShadeColor = isUnderwater ? '#0d3d50' : isNight ? '#221d28' : '#4a8c2a';
  const tuftColor = isUnderwater ? '#38a6bb' : isNight ? '#4d4554' : '#74c947';
  const crackColor = isUnderwater ? '#0b2a38' : '#241f29';

  return (
    <>
      <View style={styles.stoneRow}>
        {Array.from({ length: 8 }, (_, tileIndex) => (
          <View
            key={tileIndex}
            style={[
              styles.stoneBlock,
              {
                backgroundColor: stoneColor,
                borderColor: stoneBorderColor,
                borderTopColor: stoneTopColor,
              },
            ]}
          >
            <View style={styles.groundTileInner}>
              {Array.from({ length: 9 }, (_, speckIndex) => {
                const seed = tileIndex * 7 + speckIndex * 13;
                const isLight = speckIndex % 2 === 0;
                return (
                  <View
                    key={speckIndex}
                    style={[
                      styles.groundSpeck,
                      {
                        left: `${6 + ((seed * 11) % 80)}%`,
                        top: `${8 + ((seed * 17) % 70)}%`,
                        width: 3 + (seed % 4),
                        height: 2 + (seed % 2),
                        backgroundColor: isLight ? speckLightColor : speckDarkColor,
                        opacity: isNight || isUnderwater ? 0.5 : 0.42,
                      },
                    ]}
                  />
                );
              })}
              {(isNight || isUnderwater) &&
                [0, 1].map((crackIndex) => {
                  const seed = tileIndex * 19 + crackIndex * 37;
                  return (
                    <View
                      key={`crack-${crackIndex}`}
                      style={[
                        styles.groundCrack,
                        {
                          left: `${20 + (seed % 55)}%`,
                          top: `${18 + ((seed * 3) % 50)}%`,
                          height: 8 + crackIndex * 5,
                          backgroundColor: crackColor,
                          opacity: 0.4,
                          transform: [
                            { rotate: crackIndex % 2 === 0 ? '18deg' : '-14deg' },
                          ],
                        },
                      ]}
                    />
                  );
                })}
              <View
                style={[
                  styles.groundBevelTop,
                  {
                    backgroundColor: stoneTopColor,
                    opacity: isNight || isUnderwater ? 0.35 : 0.45,
                  },
                ]}
              />
              <View
                style={[
                  styles.groundBevel,
                  {
                    backgroundColor: stoneBorderColor,
                    opacity: isNight || isUnderwater ? 0.6 : 0.45,
                  },
                ]}
              />
            </View>
          </View>
        ))}
      </View>
      <View
        style={[
          styles.grass,
          {
            backgroundColor: grassColor,
            borderBottomColor: edgeShadeColor,
          },
        ]}
      >
        <View
          style={[
            styles.grassHighlight,
            isNight && styles.grassHighlightNight,
          ]}
        />
        <View
          style={[
            styles.groundEdgeLight,
            {
              backgroundColor: tuftColor,
              opacity: isNight ? 0.5 : 0.65,
            },
          ]}
        />
        <View
          style={[
            styles.groundEdgeShade,
            {
              backgroundColor: edgeShadeColor,
              opacity: isNight || isUnderwater ? 0.6 : 0.5,
            },
          ]}
        />
        {GROUND_TUFTS.map((tuft, index) => (
          <View
            key={index}
            style={{
              position: 'absolute',
              left: `${tuft.left}%`,
              top: tuft.top,
              width: tuft.width,
              height: tuft.height,
              borderRadius: tuft.width / 2,
              backgroundColor: tuftColor,
              opacity: isNight ? tuft.opacity * 0.7 : tuft.opacity,
            }}
          />
        ))}
      </View>
      {(isNight || isUnderwater) && (
        <View
          style={[
            styles.groundFog,
            isUnderwater && { backgroundColor: 'rgba(120, 220, 240, 0.10)' },
          ]}
        />
      )}
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
  const [urchins, setUrchins] = useState<Urchin[]>([]);
  const [urchinWarning, setUrchinWarning] = useState<number | null>(null);
  const [octopusColumns, setOctopusColumns] = useState<OctopusColumn[]>(
    createOctopusColumns
  );
  const [octopusBalls, setOctopusBalls] = useState<OctopusBall[]>([]);
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
  const [coins, setCoins] = useState(() => carriedProgress?.coins ?? 0);
  const [bestScore, setBestScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [lives, setLives] = useState(MAX_LIVES);
  const [invulnerableUntil, setInvulnerableUntil] = useState(0);
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
  const [currentWeapon, setCurrentWeapon] = useState(
    () => carriedProgress?.weapon ?? 0
  );
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
  const platformExitRef = useRef<{ top: number; until: number } | null>(null);
  const jumpCountRef = useRef(0);
  const [isDiving, setIsDiving] = useState(false);
  const downHeldRef = useRef(false);
  const upHeldRef = useRef(false);
  const underwaterBottomRef = useRef(UNDERWATER_START_BOTTOM);

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
  const urchinsRef = useRef<Urchin[]>([]);
  const urchinWarningRef = useRef<number | null>(null);
  const urchinWarningUntilRef = useRef(0);
  const urchinZoneRef = useRef(0);
  const urchinWaveUntilRef = useRef(0);
  const nextUrchinSpawnAtRef = useRef(0);
  const nextUrchinEventAtRef = useRef(0);
  const urchinIdRef = useRef(0);
  const octopusColumnsRef = useRef<OctopusColumn[]>(createOctopusColumns());
  const octopusBallsRef = useRef<OctopusBall[]>([]);
  const octopusBallIdRef = useRef(0);
  const [fireballs, setFireballs] = useState<Fireball[]>([]);
  const fireballsRef = useRef<Fireball[]>([]);
  const [powerOrb, setPowerOrb] = useState<{ x: number; bottom: number } | null>(null);
  const powerOrbRef = useRef<{ x: number; bottom: number } | null>(null);
  const [cowEmpowered, setCowEmpowered] = useState(false);
  const cowEmpoweredRef = useRef(false);
  const fireballIdRef = useRef(0);
  const nextFireballShotAtRef = useRef(0);
  const floatingCoinsRef = useRef<FloatingCoin[]>([]);
  const coinsRef = useRef<Coin[]>([]);
  const bulletIdRef = useRef(0);
  const lastShotRef = useRef(0);
  const scoreRef = useRef(0);
  const coinsRefCount = useRef(carriedProgress?.coins ?? 0);
  const weaponRef = useRef(carriedProgress?.weapon ?? 0);
  const levelRef = useRef(1);
  const nextObstacleXRef = useRef(INITIAL_NEXT_OBSTACLE_X);
  const obstacleIdRef = useRef(obstacles.length);
  const slimeIdRef = useRef(1000000);
  const gameOverRef = useRef(false);
  const livesRef = useRef(MAX_LIVES);
  const invulnerableUntilRef = useRef(0);
  const lastDamageAtRef = useRef(0);
  const startLoopRef = useRef<(() => void) | null>(null);
  const deathEffectsRef = useRef<{ x: number; y: number; born: number; id: number }[]>([]);
  const deathEffectIdRef = useRef(0);
  const coinsRefState = useRef<Coin[]>([]);
  const levelCompletedRef = useRef(false);
  const portalAbsorbRef = useRef(false);
  const mudSinkCompleteRef = useRef(false);
  const mudSinkRef = useRef<{
    startedAt: number;
    startBottom: number;
    sinkDistance: number;
  } | null>(null);

  const [monsterPhase, setMonsterPhase] = useState<ChaseMonsterPhase | 'idle'>('idle');
  const [bossHp, setBossHp] = useState(0);
  const [bossHpAnim] = useState(() => new Animated.Value(0));
  const chasePhaseRef = useRef<ChaseMonsterPhase | 'idle'>('idle');
  const chaseStartedRef = useRef(false);
  const monsterSpawnedRef = useRef(false);
  const bossSpawnAtRef = useRef(0);
  const wave2BatsStartedRef = useRef(false);
  const chaseDropUntilRef = useRef(0);
  const chaseGraceUntilRef = useRef(0);
  const wave2BatNextSpawnAtRef = useRef(0);
  const monsterDefeatAtRef = useRef(0);

  const handleMudSinkComplete = useCallback(() => {
    mudSinkCompleteRef.current = true;
  }, []);

  // ---- Armería ----
  const [shopOpen, setShopOpen] = useState(false);
  const [ownedWeapons, setOwnedWeapons] = useState<boolean[]>(() =>
    carriedProgress
      ? [...carriedProgress.ownedWeapons]
      : WEAPONS.map((_, i) => i === 0)
  );
  const shopOpenRef = useRef(false);
  const ownedWeaponsRef = useRef<boolean[]>(
    carriedProgress
      ? [...carriedProgress.ownedWeapons]
      : WEAPONS.map((_, i) => i === 0)
  );
  const [shopSlide] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(shopSlide, {
      toValue: shopOpen ? 1 : 0,
      duration: shopOpen ? 240 : 200,
      useNativeDriver: true,
    }).start();
  }, [shopOpen, shopSlide]);

  useEffect(() => {
    Animated.timing(bossHpAnim, {
      toValue: BOSS_MAX_HP > 0 ? Math.max(0, bossHp) / BOSS_MAX_HP : 0,
      duration: 220,
      useNativeDriver: false,
    }).start();
  }, [bossHp, bossHpAnim]);

  const openShop = useCallback(() => {
    if (gameOverRef.current || portalAbsorbRef.current || mudSinkRef.current !== null) {
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

    if (carriedProgress === null) {
      carriedProgress = {
        coins: coinsRefCount.current,
        ownedWeapons: [...ownedWeaponsRef.current],
        weapon: weaponRef.current,
      };
    }

    if (coinsRefState.current.length === 0) {
      const initialCoins = createLevelCoins(levelRef.current);
      coinsRefState.current = initialCoins;
      setLevelCoins([...initialCoins]);
    }

    const updateView = () => {
      setLives((current) =>
        current === livesRef.current ? current : livesRef.current
      );
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

    const takeDamage = (): boolean => {
      if (
        gameOverRef.current ||
        levelCompletedRef.current ||
        livesRef.current <= 0
      ) {
        return false;
      }
      const now = performance.now();
      if (
        now < invulnerableUntilRef.current ||
        now - lastDamageAtRef.current < DAMAGE_FRAME_GUARD_MS
      ) {
        return false;
      }
      lastDamageAtRef.current = now;

      livesRef.current = Math.max(0, livesRef.current - 1);
      setLives(livesRef.current);
      invulnerableUntilRef.current = now + INVULNERABILITY_MS;
      setInvulnerableUntil(now + INVULNERABILITY_MS);

      if (livesRef.current <= 0) {
        triggerGameOver();
      }
      return true;
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

      // Hundimiento de la trampa: la vaquita queda congelada mientras baja.
      if (mudSinkRef.current !== null) {
        leftHeldRef.current = false;
        rightHeldRef.current = false;
        isMovingRightRef.current = false;
        isMovingLeftRef.current = false;
        velocityXRef.current = 0;
        velocityYRef.current = 0;
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

      const isUnderwater = levelRef.current >= 3;
      if (isUnderwater) {
        if (downHeldRef.current) {
          underwaterBottomRef.current -= UNDERWATER_VERTICAL_SPEED * delta;
        } else if (upHeldRef.current) {
          underwaterBottomRef.current += UNDERWATER_VERTICAL_SPEED * delta;
        }
        underwaterBottomRef.current = Math.max(
          UNDERWATER_MIN_BOTTOM,
          Math.min(UNDERWATER_MAX_BOTTOM, underwaterBottomRef.current)
        );
        const bob =
          downHeldRef.current || upHeldRef.current
            ? 0
            : Math.sin(time / 1000 * 1.5) * 3;
        cowBottomRef.current = underwaterBottomRef.current + bob;
        velocityYRef.current = 0;
        isGroundedRef.current = false;
      }

      if (isUnderwater && !gameOverRef.current && !levelCompletedRef.current) {
        const nowSeconds = time / 1000;

        const aliveCount = urchinsRef.current.length;
        urchinsRef.current = urchinsRef.current.filter(
          (urchin) =>
            !(
              urchin.landed &&
              urchin.expiresAt !== undefined &&
              nowSeconds >= urchin.expiresAt
            )
        );
        if (urchinsRef.current.length !== aliveCount) {
          setUrchins([...urchinsRef.current]);
        }

        if (
          urchinWaveUntilRef.current > 0 &&
          nowSeconds >= urchinWaveUntilRef.current
        ) {
          urchinWaveUntilRef.current = 0;
          nextUrchinEventAtRef.current = nowSeconds + randomBetween(4, 8);
        }

        if (
          urchinWarningRef.current !== null &&
          nowSeconds >= urchinWarningUntilRef.current
        ) {
          urchinZoneRef.current = urchinWarningRef.current;
          urchinWarningRef.current = null;
          setUrchinWarning(null);
          urchinWaveUntilRef.current = nowSeconds + URCHIN_WAVE_SECONDS;
          nextUrchinSpawnAtRef.current = nowSeconds;
        }

        if (
          urchinWarningRef.current === null &&
          urchinWaveUntilRef.current === 0 &&
          nowSeconds >= nextUrchinEventAtRef.current
        ) {
          urchinWarningRef.current = Math.max(
            60,
            cowXRef.current + randomBetween(-120, 220)
          );
          urchinWarningUntilRef.current =
            nowSeconds + URCHIN_WARNING_SECONDS;
          setUrchinWarning(urchinWarningRef.current);
        }

        if (
          urchinWaveUntilRef.current > 0 &&
          nowSeconds >= nextUrchinSpawnAtRef.current
        ) {
          if (urchinsRef.current.length >= 40) {
            urchinsRef.current.shift();
          }
          urchinIdRef.current += 1;
          urchinsRef.current.push({
            id: urchinIdRef.current,
            x: Math.max(
              URCHIN_VISIBLE_SIZE / 2,
              urchinZoneRef.current + randomBetween(-90, 90)
            ),
            bottom: SCREEN_HEIGHT + URCHIN_VISIBLE_SIZE,
            landed: false,
          });
          setUrchins([...urchinsRef.current]);
          nextUrchinSpawnAtRef.current = nowSeconds + URCHIN_SPAWN_INTERVAL;
        }

        let urchinsChanged = false;
        for (const urchin of urchinsRef.current) {
          if (!urchin.landed) {
            urchin.bottom -= URCHIN_FALL_SPEED * delta;
            const stacked = urchinsRef.current.filter(
              (other) =>
                other.landed &&
                other.id !== urchin.id &&
                Math.abs(other.x - urchin.x) < URCHIN_VISIBLE_SIZE * 0.7
            ).length;
            const floor =
              GROUND_HEIGHT +
              URCHIN_VISIBLE_SIZE / 2 +
              stacked * URCHIN_VISIBLE_SIZE * 0.55;
            if (urchin.bottom <= floor) {
              urchin.bottom = floor;
              urchin.landed = true;
              urchin.expiresAt = nowSeconds + URCHIN_LIFETIME_SECONDS;
              urchinsChanged = true;
            }
          }

          if (
            cowXRef.current < urchin.x + URCHIN_VISIBLE_SIZE / 2 &&
            cowXRef.current + COW_WIDTH > urchin.x - URCHIN_VISIBLE_SIZE / 2 &&
            cowBottomRef.current < urchin.bottom + URCHIN_VISIBLE_SIZE / 2 &&
            cowBottomRef.current + COW_HEIGHT >
              urchin.bottom - URCHIN_VISIBLE_SIZE / 2
          ) {
            takeDamage();
          }
        }
        if (urchinsChanged) {
          setUrchins([...urchinsRef.current]);
        }
      }

      if (isUnderwater && !gameOverRef.current && !levelCompletedRef.current) {
        const nowSeconds = time / 1000;
        let columnsChanged = false;
        const gapBottom = OCTO_GAP_CENTER - OCTO_GAP_HEIGHT / 2;
        const gapTop = OCTO_GAP_CENTER + OCTO_GAP_HEIGHT / 2;

        for (const column of octopusColumnsRef.current) {
          const overlapsColumnX =
            cowXRef.current + COW_WIDTH > column.x - 90 &&
            cowXRef.current < column.x + 90;
          const overlapsSolid =
            overlapsColumnX &&
            (cowBottomRef.current + COW_HEIGHT > gapTop ||
              cowBottomRef.current < gapBottom);
          if (overlapsSolid) {
            takeDamage();
          }

          const inGap =
            cowBottomRef.current >= gapBottom - 8 &&
            cowBottomRef.current + COW_HEIGHT <= gapTop + 8;
          if (
            !column.triggered &&
            inGap &&
            cowXRef.current + COW_WIDTH > column.x - 34 &&
            cowXRef.current < column.x + 34
          ) {
            column.triggered = true;
            column.attackUntil = nowSeconds + OCTO_ATTACK_SECONDS;
            columnsChanged = true;

            const originX = column.x;
            const originBottom = OCTO_GAP_CENTER;
            const targetX = cowXRef.current + COW_WIDTH / 2;
            const targetBottom = cowBottomRef.current + COW_HEIGHT / 2;
            const dx = targetX - originX;
            const dy = targetBottom - originBottom;
            const distance = Math.max(1, Math.hypot(dx, dy));
            octopusBallIdRef.current += 1;
            octopusBallsRef.current.push({
              id: octopusBallIdRef.current,
              x: originX,
              bottom: originBottom,
              vx: (dx / distance) * OCTO_BALL_SPEED,
              vy: (dy / distance) * OCTO_BALL_SPEED,
              born: nowSeconds,
            });
            setOctopusBalls([...octopusBallsRef.current]);
          }
        }

        if (columnsChanged) {
          setOctopusColumns([...octopusColumnsRef.current]);
        }

        let ballsChanged = false;
        for (const ball of octopusBallsRef.current) {
          ball.x += ball.vx * delta;
          ball.bottom += ball.vy * delta;
          if (
            cowXRef.current < ball.x + OCTO_BALL_SIZE / 2 &&
            cowXRef.current + COW_WIDTH > ball.x - OCTO_BALL_SIZE / 2 &&
            cowBottomRef.current < ball.bottom + OCTO_BALL_SIZE / 2 &&
            cowBottomRef.current + COW_HEIGHT > ball.bottom - OCTO_BALL_SIZE / 2
          ) {
            takeDamage();
            ball.born = -1000;
            ballsChanged = true;
          }
        }
        const activeBalls = octopusBallsRef.current.filter(
          (ball) =>
            ball.born > 0 &&
            nowSeconds - ball.born < 3 &&
            ball.x > cameraXRef.current - 200 &&
            ball.x < cameraXRef.current + screenWidth + 200
        );
        if (activeBalls.length !== octopusBallsRef.current.length || ballsChanged) {
          octopusBallsRef.current = activeBalls;
          setOctopusBalls([...activeBalls]);
        }
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

      // Trampa de lodo: se activa al pisar la zona de lodo sobre el suelo.
      // Sobre el tronco la vaquita queda a salvo.
      if (!gameOverRef.current && !levelCompletedRef.current) {
        const cowCenterX = cowXRef.current + COW_WIDTH / 2;

        for (const obstacle of obstaclesRef.current) {
          if (obstacle.type !== 'mud_trap' || obstacle.mudTriggered) {
            continue;
          }

          const insideMud =
            cowCenterX > obstacle.x && cowCenterX < obstacle.x + obstacle.width;
          if (!insideMud) {
            continue;
          }

          const logLeft = getMudLogLeft(obstacle.x, obstacle.width);
          const nearLog =
            cowCenterX >= logLeft - MUD_TRAP_SAFE_MARGIN &&
            cowCenterX <= logLeft + MUD_TRAP_LOG_WIDTH + MUD_TRAP_SAFE_MARGIN;
          const atMudSurface =
            isGroundedRef.current &&
            Math.abs(cowBottomRef.current - GROUND_HEIGHT) <= 4;

          if (nearLog || !atMudSurface) {
            continue;
          }

          obstacle.mudTriggered = true;
          mudSinkRef.current = {
            startedAt: time,
            startBottom: cowBottomRef.current,
            sinkDistance: obstacle.height,
          };
          velocityXRef.current = 0;
          velocityYRef.current = 0;
          setObstacles([...obstaclesRef.current]);
        }
      }

      if (mudSinkCompleteRef.current) {
        mudSinkCompleteRef.current = false;
        const sink = mudSinkRef.current;
        mudSinkRef.current = null;
        if (sink) {
          cowBottomRef.current = sink.startBottom;
          velocityYRef.current = 0;
          isGroundedRef.current = true;
        }
        takeDamage();
      }

      if (!gameOverRef.current && !levelCompletedRef.current) {
        const cowCenterX = cowXRef.current + COW_WIDTH / 2;
        for (let index = 0; index < obstaclesRef.current.length; index++) {
          const trigger = obstaclesRef.current[index];
          if (trigger.type !== 'bat_trigger' || trigger.triggerFired) {
            continue;
          }
          const reachedUpperRoute =
            cowCenterX > trigger.x &&
            cowCenterX < trigger.x + trigger.width &&
            cowBottomRef.current >= trigger.bottom - 12;
          if (!reachedUpperRoute) {
            continue;
          }

          obstaclesRef.current[index] = { ...trigger, triggerFired: true };
          for (let batIndex = 0; batIndex < obstaclesRef.current.length; batIndex++) {
            const bat = obstaclesRef.current[batIndex];
            if (
              bat.type !== 'bat' ||
              bat.batWave !== 1 ||
              bat.active === true
            ) {
              continue;
            }
            obstaclesRef.current[batIndex] = {
              ...bat,
              active: true,
              batAwake: true,
              vx: -BAT_CHASE_SPEED,
              vy: 0,
              facing: 'left',
            };
          }
          setObstacles([...obstaclesRef.current]);
        }
      }

      if (
        chaseStartedRef.current &&
        wave2BatsStartedRef.current &&
        !monsterSpawnedRef.current &&
        !gameOverRef.current &&
        obstaclesRef.current.every(
          (bat) => bat.type !== 'bat' || bat.batWave !== 2
        )
      ) {
        monsterSpawnedRef.current = true;
        chasePhaseRef.current = 'drop';
        chaseDropUntilRef.current = time / 1000 + CHASE_MONSTER_DROP_MS / 1000;
        chaseGraceUntilRef.current = time / 1000 + 2;
        setMonsterPhase('drop');
        setBossHp(BOSS_MAX_HP);

        const monsterId =
          Math.max(0, ...obstaclesRef.current.map((o) => o.id)) + 1;
        obstaclesRef.current.push({
          id: monsterId,
          type: 'chase_monster',
          x: cowXRef.current + 90,
          bottom: GROUND_HEIGHT,
          width: CHASE_MONSTER_WIDTH,
          height: CHASE_MONSTER_HEIGHT,
          scored: false,
          health: CHASE_MONSTER_HP,
          maxHealth: CHASE_MONSTER_HP,
          facing: 'left',
        });
        setObstacles([...obstaclesRef.current]);

        const orb = {
          x: cowXRef.current + 420,
          bottom: GROUND_HEIGHT + 30,
        };
        powerOrbRef.current = orb;
        setPowerOrb(orb);
      }

      if (chasePhaseRef.current === 'drop' && time / 1000 >= chaseDropUntilRef.current) {
        chasePhaseRef.current = 'chase';
        setMonsterPhase('chase');
        nextFireballShotAtRef.current =
          time / 1000 + FIREBALL_FIRST_SHOT_DELAY_MS / 1000;
      }

      if (
        !gameOverRef.current &&
        !levelCompletedRef.current &&
        !chaseStartedRef.current &&
        !monsterSpawnedRef.current
      ) {
        for (let index = 0; index < obstaclesRef.current.length; index++) {
          const trigger = obstaclesRef.current[index];
          if (trigger.type !== 'chase_trigger' || trigger.triggerFired) {
            continue;
          }
          const reachedZone =
            cowXRef.current + COW_WIDTH > trigger.x - 120 &&
            cowXRef.current < trigger.x + trigger.width + 240;
          const leftUpperRoute =
            cowBottomRef.current < UPPER_ROUTE_TOP - 40 ||
            cowXRef.current > UPPER_ROUTE_END_X - 120;
          if (!reachedZone || !leftUpperRoute) {
            continue;
          }

          obstaclesRef.current[index] = { ...trigger, triggerFired: true };
          chaseStartedRef.current = true;
          bossSpawnAtRef.current = 0;
          setObstacles([...obstaclesRef.current]);
        }
      }

      if (
        wave2BatsStartedRef.current &&
        !gameOverRef.current &&
        time / 1000 >= wave2BatNextSpawnAtRef.current
      ) {
        const activeWave2Count = obstaclesRef.current.filter(
          (bat) => bat.type === 'bat' && bat.batWave === 2 && bat.active === true
        ).length;

        if (activeWave2Count < WAVE2_BAT_MAX_ACTIVE) {
          let nextBatIndex = -1;
          for (let batIndex = 0; batIndex < obstaclesRef.current.length; batIndex++) {
            const bat = obstaclesRef.current[batIndex];
            if (
              bat.type !== 'bat' ||
              bat.batWave !== 2 ||
              bat.active === true
            ) {
              continue;
            }
            nextBatIndex = batIndex;
            break;
          }

          if (nextBatIndex >= 0) {
            const spawnX = cowXRef.current + 460;
            const spawnBottom = Math.min(
              GROUND_HEIGHT + 200,
              SCREEN_HEIGHT - BAT_HEIGHT - 14
            );
            obstaclesRef.current[nextBatIndex] = {
              ...obstaclesRef.current[nextBatIndex],
              x: spawnX,
              bottom: spawnBottom,
              batHomeX: spawnX,
              batHomeBottom: spawnBottom,
              active: true,
              batAwake: true,
              vx: -BAT_CHASE_SPEED,
              facing: 'left',
            };
            wave2BatNextSpawnAtRef.current =
              time / 1000 + WAVE2_BAT_SPAWN_INTERVAL_MS / 1000;
            setObstacles([...obstaclesRef.current]);
          }
        }
      }

      if (
        chasePhaseRef.current === 'chase' &&
        !gameOverRef.current &&
        time / 1000 >= chaseGraceUntilRef.current
      ) {
        for (const obstacle of obstaclesRef.current) {
          if (obstacle.type !== 'chase_monster' || obstacle.isDead) {
            continue;
          }
          const dx = cowXRef.current - obstacle.x;
          const rushing =
            (obstacle.chaseRushUntil ?? 0) > time / 1000;
          const rushSpeed = CHASE_SPEED * CHASE_RUSH_SPEED_MULTIPLIER;
          const speed = rushing ? rushSpeed : CHASE_SPEED;
          const cowMoveSign = Math.sign(velocityXRef.current);
          const desiredFacing: Facing = rushing
            ? dx >= 0
              ? 'right'
              : 'left'
            : cowMoveSign > 0
              ? 'right'
              : cowMoveSign < 0
                ? 'left'
                : dx < 0
                  ? 'left'
                  : 'right';
          if (desiredFacing !== obstacle.facing) {
            obstacle.facing = desiredFacing;
          }
          const facingSign = obstacle.facing === 'right' ? 1 : -1;
          const groundBob = Math.max(
            GROUND_HEIGHT,
            GROUND_HEIGHT + Math.sin(time / 1000 * 4) * 6
          );

          if (obstacle.airborne === true) {
            const step = speed * MONSTER_AIR_SPEED_MULTIPLIER * delta;
            obstacle.moving = Math.abs(dx) > step && step > 0;
            if (obstacle.moving) {
              obstacle.x += Math.sign(dx) * step;
            }
            obstacle.vx = Math.sign(dx) * speed * MONSTER_AIR_SPEED_MULTIPLIER;
            obstacle.bottom += (obstacle.vy ?? 0) * delta;
            obstacle.vy = (obstacle.vy ?? 0) - GRAVITY * delta;
            if (obstacle.bottom <= groundBob) {
              obstacle.bottom = groundBob;
              obstacle.vy = 0;
              obstacle.airborne = false;
            }
          } else {
            const step = speed * delta;
            obstacle.moving = Math.abs(dx) > step && step > 0;
            if (obstacle.moving) {
              obstacle.x += Math.sign(dx) * step;
              obstacle.vx = Math.sign(dx) * speed;
            } else {
              obstacle.vx = 0;
            }
            obstacle.bottom = groundBob;

            const approaching =
              (facingSign > 0 && dx > 0) || (facingSign < 0 && dx < 0);
            if (approaching) {
              const frontX =
                obstacle.x + (facingSign > 0 ? obstacle.width : 0);
              for (const hazard of obstaclesRef.current) {
                if (!MONSTER_SPIKE_TYPES.includes(hazard.type)) {
                  continue;
                }
                if (
                  (hazard.type === 'chase_spike' ||
                    hazard.type === 'spike_trap') &&
                  hazard.spikeTrapVisible !== true
                ) {
                  continue;
                }
                const distance = (hazard.x - frontX) * facingSign;
                if (distance > 0 && distance < MONSTER_SPIKE_JUMP_RANGE) {
                  obstacle.airborne = true;
                  obstacle.vy = MONSTER_SPIKE_JUMP_SPEED;
                  break;
                }
              }
            }
          }
          const monsterCenterX = obstacle.x + obstacle.width / 2;
          const cowCenterX = cowXRef.current + COW_WIDTH / 2;
          const shotSign = cowCenterX > monsterCenterX ? 1 : -1;
          const forwardDistance = Math.abs(cowCenterX - monsterCenterX);
          const alignedVertical =
            Math.abs(cowBottomRef.current - obstacle.bottom) <
            FIREBALL_MAX_VERTICAL_GAP;
          const nowSeconds = time / 1000;

          const canShoot =
            forwardDistance > 0 &&
            forwardDistance < FIREBALL_RANGE &&
            alignedVertical;
          obstacle.fireballWindup =
            canShoot && nowSeconds >= nextFireballShotAtRef.current - 0.4;

          if (canShoot && nowSeconds >= nextFireballShotAtRef.current) {
            fireballIdRef.current += 1;
            obstacle.facing = shotSign > 0 ? 'right' : 'left';
            const muzzleX =
              monsterCenterX + shotSign * (obstacle.width / 2 + 12);
            fireballsRef.current.push({
              id: fireballIdRef.current,
              x: muzzleX,
              originX: muzzleX,
              baseY: obstacle.bottom + FIREBALL_SPAWN_OFFSET_Y,
              y: obstacle.bottom + FIREBALL_SPAWN_OFFSET_Y,
              vx: shotSign * FIREBALL_SPEED,
            });
            nextFireballShotAtRef.current =
              nowSeconds + FIREBALL_COOLDOWN_MS / 1000;
            setFireballs([...fireballsRef.current]);
          }
        }
      }

      if (fireballsRef.current.length > 0) {
        const originalCount = fireballsRef.current.length;
        const cowHitbox = cowRect(cowXRef.current, cowBottomRef.current);
        const remainingFireballs: Fireball[] = [];

        for (const fireball of fireballsRef.current) {
          fireball.x += fireball.vx * delta;
          fireball.y =
            fireball.baseY + Math.sin(time / 1000 * 7 + fireball.id) * 8;

          const fireballRect: Rect = {
            x: fireball.x - FIREBALL_HIT_WIDTH / 2,
            bottom: fireball.y - FIREBALL_HIT_HEIGHT / 2,
            width: FIREBALL_HIT_WIDTH,
            height: FIREBALL_HIT_HEIGHT,
          };

          if (aabbOverlap(fireballRect, cowHitbox)) {
            takeDamage();
            continue;
          }

          const outOfRange =
            Math.abs(fireball.x - fireball.originX) > FIREBALL_RANGE;
          const outOfView =
            fireball.x < cameraXRef.current - 400 ||
            fireball.x > cameraXRef.current + screenWidth + 400;
          if (outOfRange || outOfView) {
            continue;
          }
          remainingFireballs.push(fireball);
        }

        fireballsRef.current = remainingFireballs;
        if (remainingFireballs.length !== originalCount) {
          setFireballs([...remainingFireballs]);
        }
      }

      if (
        chasePhaseRef.current === 'defeated' &&
        monsterDefeatAtRef.current > 0 &&
        time / 1000 - monsterDefeatAtRef.current > 0.5
      ) {
        monsterDefeatAtRef.current = 0;
        fireballsRef.current = [];
        setFireballs([]);
        obstaclesRef.current = obstaclesRef.current.filter(
          (o) => o.type !== 'chase_monster'
        );
        setObstacles([...obstaclesRef.current]);
      }

      if (chaseStartedRef.current && !gameOverRef.current) {
        for (const obstacle of obstaclesRef.current) {
          if (obstacle.type !== 'chase_spike') {
            continue;
          }
          const dx = obstacle.x - cowXRef.current;
          if (dx > 300 || dx < -obstacle.width - 60) {
            continue;
          }
          if (obstacle.trapTriggerTime === undefined) {
            obstacle.trapTriggerTime = time / 1000;
            setObstacles([...obstaclesRef.current]);
          } else if (
            !obstacle.spikeTrapVisible &&
            time / 1000 - obstacle.trapTriggerTime >= CHASE_SPIKE_WARNING_MS / 1000
          ) {
            obstacle.spikeTrapVisible = true;
            setObstacles([...obstaclesRef.current]);
          }
        }
      }

      // Portal: al tocarlo, absorbe a la vaquita y la lleva al siguiente nivel.
      if (!gameOverRef.current && !portalAbsorbRef.current) {
        for (const obstacle of obstaclesRef.current) {
          if (obstacle.type !== 'portal' || obstacle.portalLocked) {
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

      if (!isUnderwater && isGroundedRef.current) {
        const overOpenHole = isOverOpenHole(
          cowXRef.current,
          obstaclesRef.current
        );
        const supportBottom = overOpenHole
          ? 0
          : Math.max(
              getTerrainSupport(cowXRef.current, COW_WIDTH, terrainRef.current),
              getCowGroundSupport(
                cowXRef.current,
                cowBottomRef.current,
                obstaclesRef.current
              )
            );

        if (
          supportBottom >= cowBottomRef.current - 2 &&
          supportBottom <= cowBottomRef.current + 2
        ) {
          cowBottomRef.current = supportBottom;
          velocityYRef.current = 0;
        } else {
          isGroundedRef.current = false;
          platformExitRef.current = {
            top: cowBottomRef.current,
            until: time / 1000 + 0.25,
          };
        }
      }

      if (!isUnderwater && !isGroundedRef.current) {
        if (velocityYRef.current === 0) {
          velocityYRef.current = -1;
        }
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
        const overOpenHole = isOverOpenHole(
          cowXRef.current,
          obstaclesRef.current
        );

        if (velocityYRef.current <= 0) {
          // Check terrain support (platforms)
          for (const segment of terrainRef.current) {
            if (segment.kind === 'hole' || overOpenHole) {
              continue;
            }

            if (!hasHorizontalOverlap(cowXRef.current, COW_WIDTH, segment, 6)) {
              continue;
            }

            const segmentTop = segment.bottom;
            const exitingPlatform =
              platformExitRef.current !== null &&
              time / 1000 < platformExitRef.current.until &&
              Math.abs(segmentTop - platformExitRef.current.top) < 1;
            if (exitingPlatform) {
              continue;
            }

            if (
              previousBottom >= segmentTop - 1 &&
              nextBottom < segmentTop - 0.5
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
              obstacle.type === 'spines_barrier' ||
              isVanishedObstacle(obstacle) ||
              !hasHorizontalOverlap(
                cowXRef.current,
                COW_WIDTH,
                getObstacleCollisionRect(obstacle),
                6
              )
            ) {
              continue;
            }

            const obstacleTop = obstacle.bottom + obstacle.height;
            const exitingPlatform =
              platformExitRef.current !== null &&
              time / 1000 < platformExitRef.current.until &&
              Math.abs(obstacleTop - platformExitRef.current.top) < 1;
            if (exitingPlatform) {
              continue;
            }

            if (
              previousBottom >= obstacleTop - 1.5 &&
              nextBottom < obstacleTop - 0.5
            ) {
              if (landingBottom === null || obstacleTop > landingBottom) {
                landingBottom = obstacleTop;
              }
            }
          }

          if (nextBottom <= GROUND_HEIGHT && !overOpenHole) {
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

      if (!gameOverRef.current && !levelCompletedRef.current) {
        const cowCenterX = cowXRef.current + COW_WIDTH / 2;
        for (const obstacle of obstaclesRef.current) {
          if (
            obstacle.type !== 'hole_trap' ||
            obstacle.holeOpen === true ||
            !isGroundedRef.current ||
            Math.abs(cowBottomRef.current - GROUND_HEIGHT) > 4 ||
            cowCenterX < obstacle.x ||
            cowCenterX > obstacle.x + obstacle.width
          ) {
            continue;
          }

          obstacle.holeOpen = true;
          obstacle.holeOpenedAt = time / 1000;
          isGroundedRef.current = false;
          velocityYRef.current = 0;
          platformExitRef.current = {
            top: GROUND_HEIGHT,
            until: time / 1000 + 0.4,
          };
          setObstacles([...obstaclesRef.current]);
          break;
        }
      }

      if (!gameOverRef.current) {
        const cowCenterX = cowXRef.current + COW_WIDTH / 2;
        for (const obstacle of obstaclesRef.current) {
          if (obstacle.type !== 'hole_trap' || obstacle.holeOpen !== true) {
            continue;
          }
          if (
            cowCenterX >= obstacle.x &&
            cowCenterX <= obstacle.x + obstacle.width &&
            cowBottomRef.current <= HOLE_DEATH_BOTTOM
          ) {
            triggerGameOver();
          }
        }
      }

      if (
        chaseStartedRef.current &&
        !wave2BatsStartedRef.current &&
        !gameOverRef.current
      ) {
        const onMainFloor =
          isGroundedRef.current &&
          Math.abs(cowBottomRef.current - GROUND_HEIGHT) <= 2;
        if (onMainFloor) {
          bossSpawnAtRef.current = time / 1000;
          wave2BatsStartedRef.current = true;
          wave2BatNextSpawnAtRef.current = time / 1000;
        }
      }

      if (powerOrbRef.current && !cowEmpoweredRef.current) {
        const orb = powerOrbRef.current;
        const orbRect: Rect = {
          x: orb.x - POWER_ORB_SIZE / 2,
          bottom: orb.bottom - POWER_ORB_SIZE / 2,
          width: POWER_ORB_SIZE,
          height: POWER_ORB_SIZE,
        };
        if (aabbOverlap(cowRect(cowXRef.current, cowBottomRef.current), orbRect)) {
          cowEmpoweredRef.current = true;
          setCowEmpowered(true);
          powerOrbRef.current = null;
          setPowerOrb(null);
        }
      }

      const spawnSlimeTrail = (x: number, bottom: number) => {
        const tooClose = obstaclesRef.current.some(
          (o) => o.type === 'slime' && Math.abs(o.x - x) < SLIME_WIDTH * 0.8
        );
        if (tooClose) {
          return;
        }
        slimeIdRef.current += 1;
        obstaclesRef.current.push({
          id: slimeIdRef.current,
          type: 'slime',
          x,
          bottom,
          width: SLIME_WIDTH,
          height: SLIME_HEIGHT,
          scored: true,
          spawnedAt: time / 1000,
        });
        setObstacles([...obstaclesRef.current]);
      };

      // Patrol enemies horizontally with strict AABB collision and gravity.
      for (const obstacle of obstaclesRef.current) {
        if (obstacle.type !== 'enemy') {
          continue;
        }

        const baseSpeed = obstacle.speed ?? ENEMY_SPEED;
        if (obstacle.vx === undefined) {
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

        const isArenaBoss =
          obstacle.isBoss === true || obstacle.bossConfig !== undefined;

        // Movimiento horizontal con colisiÃ³n sÃ³lida contra plataformas.
        // El monstruo no puede atravesar cajas ni plataformas: rebota al chocar.
        const airMultiplier =
          obstacle.airborne === true || (obstacle.vy ?? 0) > 0
            ? ENEMY_JUMP_AIR_SPEED_MULTIPLIER
            : 1;
        let nextEnemyX = obstacle.x + obstacle.vx * airMultiplier * delta;

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

        if (Math.abs(obstacle.vx ?? 0) > 1) {
          obstacle.facing = obstacle.vx < 0 ? 'left' : 'right';
        }
        if (obstacle.bossConfig) {
          obstacle.bossConfig.vx = obstacle.vx;
        }

        const isJumpingMonster = !obstacle.isBoss && !obstacle.bossConfig;
        const terrainBottom = getTerrainSupport(
          obstacle.x,
          obstacle.width,
          terrainRef.current
        );
        const supportBottom = isJumpingMonster
          ? terrainBottom
          : Math.max(
              terrainBottom,
              getSupportBottom(
                obstacle.x,
                obstacle.width,
                obstacle.bottom,
                obstaclesRef.current
              )
            );

        // El monstruo morado avanza dando saltos mientras patrulla.
        if (isJumpingMonster) {
          obstacle.enemyJumpTimer = Math.max(
            0,
            (obstacle.enemyJumpTimer ?? 0.3) - delta
          );
          const resting =
            obstacle.bottom <= supportBottom + 0.5 && (obstacle.vy ?? 0) <= 0;
          const nearSolid = obstaclesRef.current.some(
            (solid) =>
              SOLID_BLOCKING_TYPES.includes(solid.type) &&
              !isVanishedObstacle(solid) &&
              solid.type !== 'spines_barrier' &&
              solid.bottom <= GROUND_HEIGHT + 2 &&
              solid.bottom + solid.height > GROUND_HEIGHT + 10 &&
              solid.x < obstacle.x + obstacle.width + 60 &&
              solid.x + solid.width > obstacle.x - 60
          );
          if (
            resting &&
            !nearSolid &&
            obstacle.enemyJumpTimer <= 0 &&
            Math.abs(obstacle.vx ?? 0) > 1
          ) {
            obstacle.vy = ENEMY_JUMP_SPEED;
            obstacle.airborne = true;
            spawnSlimeTrail(
              obstacle.facing === 'right'
                ? obstacle.x - SLIME_WIDTH + 6
                : obstacle.x + obstacle.width - 6,
              GROUND_HEIGHT
            );
            obstacle.enemyJumpTimer = randomBetween(
              ENEMY_JUMP_INTERVAL_MIN,
              ENEMY_JUMP_INTERVAL_MAX
            );
          }
        }

        const rising = (obstacle.vy ?? 0) > 0;
        const landOnSurface = (surface: number) => {
          if (obstacle.airborne === true && !isArenaBoss) {
            spawnSlimeTrail(
              obstacle.facing === 'right'
                ? obstacle.x - SLIME_WIDTH + 6
                : obstacle.x + obstacle.width - 6,
              GROUND_HEIGHT
            );
          }
          obstacle.bottom = surface;
          obstacle.vy = 0;
          obstacle.airborne = false;
        };

        if (!rising && obstacle.bottom <= supportBottom + 0.5) {
          landOnSurface(supportBottom);
        } else {
          const vy = (obstacle.vy ?? 0) - GRAVITY * delta;
          obstacle.vy = Math.max(vy, -MAX_FALL_SPEED);
          obstacle.bottom += obstacle.vy * delta;
          if (obstacle.bottom <= supportBottom && obstacle.vy <= 0) {
            landOnSurface(supportBottom);
          }
        }
      }

      if (obstaclesRef.current.some((o) => o.type === 'slime')) {
        const before = obstaclesRef.current.length;
        obstaclesRef.current = obstaclesRef.current.filter(
          (o) =>
            o.type !== 'slime' ||
            time / 1000 - (o.spawnedAt ?? time / 1000) < SLIME_LIFETIME
        );
        if (obstaclesRef.current.length !== before) {
          setObstacles([...obstaclesRef.current]);
        }
      }

      for (const obstacle of obstaclesRef.current) {
        if (obstacle.type !== 'bat' || obstacle.active !== true) {
          continue;
        }

        const batSpeed = BAT_CHASE_SPEED + (obstacle.id % 3) * 20;
        if (obstacle.batAwake !== true) {
          const homeX = obstacle.batHomeX ?? obstacle.x;
          const homeBottom = obstacle.batHomeBottom ?? obstacle.bottom;
          const phase = time / 1000 + obstacle.id;
          obstacle.x = Math.max(0, homeX + Math.sin(phase * 0.9) * 45);
          obstacle.bottom = homeBottom + Math.sin(phase * 2.2) * 12;
          obstacle.facing = Math.cos(phase * 0.9) < 0 ? 'left' : 'right';
          continue;
        }

        const targetX = cowXRef.current + COW_WIDTH / 2 - obstacle.width / 2;
        const hoverWave = Math.sin(time / 1000 * 4 + obstacle.id) * 6;
        const hoverOffset =
          obstacle.batWave === 2 ? WAVE2_BAT_HOVER_OFFSET : BAT_CHASE_OFFSET_Y;
        const targetBottom = cowBottomRef.current + hoverOffset + hoverWave;
        const deltaX = targetX - obstacle.x;
        const deltaY = targetBottom - obstacle.bottom;
        const distance = Math.hypot(deltaX, deltaY);
        if (distance < 1) {
          continue;
        }

        const step = Math.min(batSpeed * delta, distance);
        obstacle.x = Math.max(0, obstacle.x + (deltaX / distance) * step);
        obstacle.bottom += (deltaY / distance) * step;
        obstacle.facing = deltaX < 0 ? 'left' : 'right';
        obstacle.vx = (deltaX / distance) * batSpeed;
        obstacle.vy = (deltaY / distance) * batSpeed;
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
              takeDamage();
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

        const standingOnBench =
          cowRight > benchLeft &&
          cowLeft < benchRight &&
          cowBottomRef.current >= benchTop - 8 &&
          cowBottomRef.current <= benchTop + 8;

        obstacle.benchTrapActive = standingOnBench;
        if (!standingOnBench) {
          obstacle.trapTriggerTime = undefined;
          continue;
        }

        const now = performance.now() / 1000;
        if (obstacle.trapTriggerTime === undefined) {
          obstacle.trapTriggerTime = now;
        }
        if (now - obstacle.trapTriggerTime >= TRAP_ARM_DELAY) {
          livesRef.current = 0;
          setLives(0);
          triggerGameOver();
        }
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
          if (Math.abs(bullet.x - bullet.originX) > BULLET_MAX_RANGE) {
            continue;
          }
          const bulletRect: Rect = {
            x: bullet.dir === 'right' ? bullet.x : bullet.x - bullet.width,
            bottom: bullet.y - BULLET_RADIUS,
            width: bullet.width,
            height: BULLET_RADIUS * 2,
          };

          let hitEnemy: Obstacle | null = null;
          let hitSolid: Obstacle | null = null;
          let nearestEnemyDistance = Infinity;
          let nearestSolidDistance = Infinity;

          for (const obstacle of obstaclesRef.current) {
            if (
              obstacle.type === 'chase_monster' &&
              chasePhaseRef.current !== 'chase'
            ) {
              continue;
            }
            if (obstacle.type === 'bat' && obstacle.active !== true) {
              continue;
            }
            if (
              obstacle.type === 'upper_platform' ||
              obstacle.type === 'boss_gate' ||
              obstacle.type === 'cloud_trap' ||
              obstacle.type === 'mud_log' ||
              obstacle.type === 'mud_trap' ||
              obstacle.type === 'bat_trigger' ||
              obstacle.type === 'chase_trigger' ||
              obstacle.type === 'floor_spines' ||
              obstacle.type === 'water' ||
              obstacle.type === 'slime' ||
              obstacle.type === 'goal' ||
              obstacle.type === 'portal'
            ) {
              continue;
            }
            const isBossObstacle =
              obstacle.isBoss === true || obstacle.bossConfig !== undefined;
            const usesSpriteHitbox =
              isBossObstacle ||
              obstacle.type === 'enemy' ||
              obstacle.type === 'piranha' ||
              obstacle.type === 'bat' ||
              obstacle.type === 'chase_monster';
            const spriteRect = usesSpriteHitbox
              ? getBossCollisionBox(obstacle)
              : obstacle;
            const checkRect =
              obstacle.type === 'chase_monster'
                ? {
                    x: obstacle.x + 8,
                    bottom: obstacle.bottom - 12,
                    width: obstacle.width - 16,
                    height: obstacle.height + 24,
                  }
                : obstacle.type === 'bat'
                  ? {
                      x: obstacle.x - 4,
                      bottom: obstacle.bottom - BAT_BULLET_TOLERANCE_Y,
                      width: obstacle.width + 8,
                      height: obstacle.height + BAT_BULLET_TOLERANCE_Y * 2,
                    }
                  : spriteRect;
            if (aabbOverlap(bulletRect, checkRect)) {
              const distance = Math.abs(
                checkRect.x + checkRect.width / 2 - bulletRect.x
              );
              if (
                isBossObstacle ||
                obstacle.type === 'enemy' ||
                obstacle.type === 'piranha' ||
                obstacle.type === 'bat' ||
                obstacle.type === 'chase_monster' ||
                obstacle.type === 'destructible' ||
                obstacle.type === 'moving'
              ) {
                if (distance < nearestEnemyDistance) {
                  nearestEnemyDistance = distance;
                  hitEnemy = obstacle;
                }
              } else if (distance < nearestSolidDistance) {
                nearestSolidDistance = distance;
                hitSolid = obstacle;
              }
            }
          }

          const hitObstacle = hitEnemy || hitSolid;

          if (hitObstacle) {
            const hitBossObstacle =
              hitObstacle.isBoss === true ||
              hitObstacle.bossConfig !== undefined;
            const isDestroyable =
              hitBossObstacle ||
              hitObstacle.type === 'enemy' ||
              hitObstacle.type === 'piranha' ||
              hitObstacle.type === 'bat' ||
              hitObstacle.type === 'chase_monster' ||
              hitObstacle.type === 'destructible' ||
              hitObstacle.type === 'moving';

            if (isDestroyable) {
              const now = performance.now() / 1000;
              const currentHealth = hitObstacle.health ?? 1;
              const bulletDamage =
                (weapon.damage ?? 1) *
                (hitObstacle.type === 'chase_monster' && cowEmpoweredRef.current
                  ? POWER_ORB_DAMAGE_MULTIPLIER
                  : 1);
              const newHealth = currentHealth - bulletDamage;
              if (hitObstacle.type === 'chase_monster') {
                setBossHp(Math.max(0, newHealth));
              }

              // Registrar tiempo de impacto para efecto visual de destello
              const idx = obstaclesRef.current.findIndex(
                (o) => o.id === hitObstacle.id
              );
              if (idx !== -1) {
                obstaclesRef.current[idx].lastHitTime = now;
                if (hitObstacle.type === 'chase_monster') {
                  obstaclesRef.current[idx].chaseRushUntil =
                    now + CHASE_RUSH_DURATION_SECONDS;
                }
                if (
                  hitObstacle.type === 'enemy' &&
                  !hitObstacle.isBoss &&
                  !hitObstacle.bossConfig
                ) {
                  obstaclesRef.current[idx].enraged = true;
                }
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
                if (hitObstacle.type === 'chase_monster') {
                  if (idx !== -1) {
                    obstaclesRef.current[idx].health = 0;
                  }
                  setBossHp(0);
                  powerOrbRef.current = null;
                  setPowerOrb(null);
                  chasePhaseRef.current = 'defeated';
                  setMonsterPhase('defeated');
                  monsterDefeatAtRef.current = now;
                  fireballsRef.current = [];
                  setFireballs([]);
                  for (const obstacle of obstaclesRef.current) {
                    if (obstacle.type === 'portal' && obstacle.portalLocked) {
                      obstacle.portalLocked = false;
                    }
                    if (obstacle.type === 'boss_gate') {
                      obstacle.active = false;
                    }
                  }
                  obstaclesRef.current = obstaclesRef.current.filter(
                    (o) => o.type !== 'floor_spines' && o.type !== 'spines_barrier'
                  );
                  setObstacles([...obstaclesRef.current]);
                } else {
                  obstaclesRef.current = obstaclesRef.current.filter(
                    (o) => o.id !== hitObstacle.id
                  );
                  setObstacles([...obstaclesRef.current]);
                }

                const isBossDefeated = hitObstacle.isBoss || hitObstacle.bossConfig;
                const isChaseMonster = hitObstacle.type === 'chase_monster';
                const coinReward = isBossDefeated
                  ? 25
                  : isChaseMonster
                    ? 30
                    : COIN_BONUS_PER_KILL;
                const scoreReward = isBossDefeated ? 15 : isChaseMonster ? 20 : 1;

                // Spawneo de monedas de recompensa (mÃºltiples si es jefe)
                const coinsToSpawn = isBossDefeated || isChaseMonster ? 5 : 1;
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
            bullet.x < cameraXRef.current - 1200 ||
            bullet.x + bullet.width > cameraXRef.current + screenWidth + 1800 ||
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
      // El contacto fÃ­sico con la vaquita resta una vida (con invulnerabilidad).
      for (const obstacle of obstaclesRef.current) {
        if (
          obstacle.type !== 'enemy' &&
          obstacle.type !== 'piranha' &&
          obstacle.type !== 'bat' &&
          obstacle.type !== 'chase_monster' &&
          obstacle.type !== 'slime'
        ) {
          continue;
        }
        if (obstacle.type === 'slime') {
          const slimeRect: Rect = {
            x: obstacle.x + 10,
            bottom: obstacle.bottom + 4,
            width: obstacle.width - 20,
            height: obstacle.height - 16,
          };
          if (intersectsHazard(cowXRef.current, cowBottomRef.current, slimeRect)) {
            takeDamage();
          }
          continue;
        }
        if (obstacle.type === 'bat' && obstacle.batAwake !== true) {
          continue;
        }
        if (
          obstacle.type === 'chase_monster' &&
          (obstacle.isDead ||
            chasePhaseRef.current !== 'chase' ||
            time / 1000 < chaseGraceUntilRef.current)
        ) {
          continue;
        }

        // La piraÃ±a solo daÃ±a cuando estÃ¡ visible (saliÃ³ de la tuberÃ­a).
        if (obstacle.type === 'piranha' && !obstacle.piranhaUp) {
          continue;
        }

        if (intersectsEnemy(cowXRef.current, cowBottomRef.current, obstacle)) {
          takeDamage();
          break;
        }
      }

      for (const obstacle of obstaclesRef.current) {
        if (obstacle.type !== 'floor_spines') {
          continue;
        }
        if (
          !isGroundedRef.current ||
          Math.abs(cowBottomRef.current - GROUND_HEIGHT) > 4
        ) {
          continue;
        }
        if (!intersectsHazard(cowXRef.current, cowBottomRef.current, obstacle)) {
          continue;
        }

        if (!takeDamage()) {
          continue;
        }

        const pushedRight =
          cowXRef.current + COW_WIDTH / 2 < obstacle.x + obstacle.width / 2;
        cowXRef.current = Math.max(
          0,
          cowXRef.current + (pushedRight ? -16 : 16)
        );
        velocityXRef.current = 0;
        velocityYRef.current = 300;
        isGroundedRef.current = false;
        break;
      }

      for (const obstacle of obstaclesRef.current) {
        if (obstacle.type !== 'boss_gate' || obstacle.active !== true) {
          continue;
        }
        const gateRect: Rect = {
          x: obstacle.x - 6,
          bottom: obstacle.bottom,
          width: obstacle.width + 12,
          height: obstacle.height + 12,
        };
        if (aabbOverlap(cowRect(cowXRef.current, cowBottomRef.current), gateRect)) {
          takeDamage();
          break;
        }
      }

      // Contacto con trampa con pinchos activada → resta una vida
      for (const obstacle of obstaclesRef.current) {
        if (obstacle.type !== 'trap_platform' || !obstacle.trapTriggered) {
          continue;
        }

        if (intersectsHazard(cowXRef.current, cowBottomRef.current, obstacle)) {
          takeDamage();
          break;
        }
      }

      // Solo pinchos y trampas activas son letales. Las rocas son plataformas
      // seguras: el único peligro del lago es el agua.
      for (const obstacle of obstaclesRef.current) {
        const isTrapSpike = obstacle.type === 'spike_trap' && obstacle.spikeTrapVisible;
        const isActiveChaseSpike =
          obstacle.type === 'chase_spike' && obstacle.spikeTrapVisible;
        if (
          obstacle.type !== 'spike' &&
          !isTrapSpike &&
          !isActiveChaseSpike
        ) {
          continue;
        }

        if (isTrapSpike || isActiveChaseSpike) {
          const hazard: Obstacle = {
            ...obstacle,
            bottom: obstacle.bottom,
            height: obstacle.height,
          };
          if (intersectsHazard(cowXRef.current, cowBottomRef.current, hazard)) {
            takeDamage();
            break;
          }
          continue;
        }

        if (intersectsHazard(cowXRef.current, cowBottomRef.current, obstacle)) {
          takeDamage();
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

      // Hundimiento de la trampa: la Y de la vaquita sigue la misma línea
      // lineal que el tronco (sincronizados con la animación del componente).
      if (mudSinkRef.current !== null) {
        const sink = mudSinkRef.current;
        const sinkProgress = Math.min(
          1,
          (time - sink.startedAt) / MUD_TRAP_SINK_DURATION
        );
        cowBottomRef.current =
          sink.startBottom - sinkProgress * sink.sinkDistance;
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
    if (gameOverRef.current || portalAbsorbRef.current || mudSinkRef.current !== null) {
      return;
    }

    if (levelRef.current >= 3) {
      upHeldRef.current = true;
      requestStart();
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

  const handleJumpPressOut = useCallback(() => {
    upHeldRef.current = false;
  }, []);

  const handleDownPressIn = useCallback(() => {
    if (
      gameOverRef.current ||
      portalAbsorbRef.current ||
      levelRef.current < 3
    ) {
      return;
    }
    downHeldRef.current = true;
    setIsDiving(true);
    requestStart();
  }, [requestStart]);

  const handleDownPressOut = useCallback(() => {
    downHeldRef.current = false;
    setIsDiving(false);
  }, []);

  const handleDropPressIn = useCallback(() => {
    if (
      gameOverRef.current ||
      portalAbsorbRef.current ||
      mudSinkRef.current !== null ||
      !isGroundedRef.current
    ) {
      return;
    }

    const supportBottom = Math.max(
      getTerrainSupport(cowXRef.current, COW_WIDTH, terrainRef.current),
      getSupportBottom(
        cowXRef.current,
        COW_WIDTH,
        cowBottomRef.current,
        obstaclesRef.current
      )
    );
    if (supportBottom <= GROUND_HEIGHT + 1) {
      return;
    }

    platformExitRef.current = {
      top: cowBottomRef.current,
      until: performance.now() / 1000 + 0.25,
    };
    isGroundedRef.current = false;
    velocityYRef.current = -120;
    jumpCountRef.current = MAX_JUMPS;
    requestStart();
  }, [requestStart]);

  const shoot = useCallback(() => {
    if (gameOverRef.current || portalAbsorbRef.current || mudSinkRef.current !== null) {
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
      const bulletX = muzzleX + spreadOffset * 50;
      const bullet: Bullet = {
        id: bulletIdRef.current,
        x: bulletX,
        originX: bulletX,
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
        case 'ArrowDown':
        case 's':
        case 'S':
          event.preventDefault();
          if (levelRef.current >= 3) {
            handleDownPressIn();
          } else {
            handleDropPressIn();
          }
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
        case ' ':
        case 'ArrowUp':
        case 'w':
        case 'W':
          handleJumpPressOut();
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          handleDownPressOut();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleLeftPressIn, handleLeftPressOut, handleRightPressIn, handleRightPressOut, handleJumpPressIn, handleJumpPressOut, handleDownPressIn, handleDownPressOut, handleDropPressIn, handleShootPressIn]);

  const restart = useCallback(() => {
    const beforeLevel = carriedProgress ?? {
      coins: 0,
      ownedWeapons: WEAPONS.map((_, index) => index === 0),
      weapon: 0,
    };
    coinsRefCount.current = beforeLevel.coins;
    ownedWeaponsRef.current = [...beforeLevel.ownedWeapons];
    weaponRef.current = beforeLevel.weapon;
    const levelId = levelRef.current;
    const initialObstacles = createInitialObstacles(levelId);
    const initialTerrain = createInitialTerrain();
    const initialCoins = createLevelCoins(levelId);

    cowXRef.current = PLAYER_START_X;
    cowBottomRef.current =
      levelId >= 3 ? UNDERWATER_START_BOTTOM : GROUND_HEIGHT;
    underwaterBottomRef.current = cowBottomRef.current;
    downHeldRef.current = false;
    upHeldRef.current = false;
    platformExitRef.current = null;
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
    fireballsRef.current = [];
    setFireballs([]);
    nextFireballShotAtRef.current = 0;
    floatingCoinsRef.current = [];
    coinsRefState.current = initialCoins;
    coinsRef.current = [];
    deathEffectsRef.current = [];
    bulletIdRef.current = 0;
    lastShotRef.current = 0;
    scoreRef.current = 0;
    shopOpenRef.current = false;
    shopSlide.setValue(0);
    nextObstacleXRef.current = INITIAL_NEXT_OBSTACLE_X;
    obstacleIdRef.current = initialObstacles.length;
    gameOverRef.current = false;
    livesRef.current = MAX_LIVES;
    invulnerableUntilRef.current = 0;
    lastDamageAtRef.current = 0;

    setGameOver(false);
    setLives(MAX_LIVES);
    setInvulnerableUntil(0);
    setCowDead(false);
    levelCompletedRef.current = false;
    setLevelCompleted(false);
    portalAbsorbRef.current = false;
    setPortalAbsorb(null);
    mudSinkCompleteRef.current = false;
    mudSinkRef.current = null;
    chaseStartedRef.current = false;
    monsterSpawnedRef.current = false;
    bossSpawnAtRef.current = 0;
    wave2BatsStartedRef.current = false;
    chasePhaseRef.current = 'idle';
    chaseDropUntilRef.current = 0;
    chaseGraceUntilRef.current = 0;
    wave2BatNextSpawnAtRef.current = 0;
    monsterDefeatAtRef.current = 0;
    setMonsterPhase('idle');
    setBossHp(0);
    bossHpAnim.setValue(0);
    powerOrbRef.current = null;
    setPowerOrb(null);
    cowEmpoweredRef.current = false;
    setCowEmpowered(false);
    setIsDiving(false);
    urchinsRef.current = [];
    setUrchins([]);
    urchinWarningRef.current = null;
    setUrchinWarning(null);
    urchinWarningUntilRef.current = 0;
    urchinWaveUntilRef.current = 0;
    nextUrchinSpawnAtRef.current = 0;
    nextUrchinEventAtRef.current = performance.now() / 1000 + randomBetween(2, 5);
    urchinIdRef.current = 0;
    octopusColumnsRef.current = createOctopusColumns();
    setOctopusColumns([...octopusColumnsRef.current]);
    octopusBallsRef.current = [];
    setOctopusBalls([]);
    octopusBallIdRef.current = 0;
    setObstacles(initialObstacles);
    setTerrain(initialTerrain);
    setBullets([]);
    setFloatingCoins([]);
    setLevelCoins(initialCoins);
    setDeathEffects([]);
    setMuzzleFlashBorn(0);
    setView({
      cowScreenX: PLAYER_START_X,
      cowBottom: cowBottomRef.current,
      cameraX: 0,
      now: performance.now() / 1000,
      isMoving: false,
      isGrounded: levelRef.current < 3,
    });
    setFacing('right');
    setScore(0);
    setCoins(coinsRefCount.current);
    setCurrentWeapon(weaponRef.current);
    setOwnedWeapons([...ownedWeaponsRef.current]);
    setShopOpen(false);

    requestStart();
  }, [requestStart, shopSlide, bossHpAnim]);

  const advanceLevel = useCallback(() => {
    const nextLevelId = Math.min(LEVELS.length, levelRef.current + 1);
    levelRef.current = nextLevelId;
    setCurrentLevel(nextLevelId);

    carriedProgress = {
      coins: coinsRefCount.current,
      ownedWeapons: [...ownedWeaponsRef.current],
      weapon: weaponRef.current,
    };
    const carriedCoins = carriedProgress.coins;
    const carriedOwnedWeapons = [...carriedProgress.ownedWeapons];
    const carriedWeapon = carriedProgress.weapon;

    const initialObstacles = createInitialObstacles(nextLevelId);
    const initialTerrain = createInitialTerrain();
    const initialCoins = createLevelCoins(nextLevelId);

    cowXRef.current = PLAYER_START_X;
    cowBottomRef.current =
      nextLevelId >= 3 ? UNDERWATER_START_BOTTOM : GROUND_HEIGHT;
    underwaterBottomRef.current = cowBottomRef.current;
    downHeldRef.current = false;
    upHeldRef.current = false;
    platformExitRef.current = null;
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
    fireballsRef.current = [];
    setFireballs([]);
    nextFireballShotAtRef.current = 0;
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
    livesRef.current = MAX_LIVES;
    invulnerableUntilRef.current = 0;
    lastDamageAtRef.current = 0;

    setGameOver(false);
    setLives(MAX_LIVES);
    setInvulnerableUntil(0);
    setCowDead(false);
    levelCompletedRef.current = false;
    setLevelCompleted(false);
    portalAbsorbRef.current = false;
    setPortalAbsorb(null);
    mudSinkCompleteRef.current = false;
    mudSinkRef.current = null;
    chaseStartedRef.current = false;
    monsterSpawnedRef.current = false;
    bossSpawnAtRef.current = 0;
    wave2BatsStartedRef.current = false;
    chasePhaseRef.current = 'idle';
    chaseDropUntilRef.current = 0;
    chaseGraceUntilRef.current = 0;
    wave2BatNextSpawnAtRef.current = 0;
    monsterDefeatAtRef.current = 0;
    setMonsterPhase('idle');
    setBossHp(0);
    bossHpAnim.setValue(0);
    powerOrbRef.current = null;
    setPowerOrb(null);
    cowEmpoweredRef.current = false;
    setCowEmpowered(false);
    setIsDiving(false);
    urchinsRef.current = [];
    setUrchins([]);
    urchinWarningRef.current = null;
    setUrchinWarning(null);
    urchinWarningUntilRef.current = 0;
    urchinWaveUntilRef.current = 0;
    nextUrchinSpawnAtRef.current = 0;
    nextUrchinEventAtRef.current = performance.now() / 1000 + randomBetween(2, 5);
    urchinIdRef.current = 0;
    octopusColumnsRef.current = createOctopusColumns();
    setOctopusColumns([...octopusColumnsRef.current]);
    octopusBallsRef.current = [];
    setOctopusBalls([]);
    octopusBallIdRef.current = 0;
    setObstacles(initialObstacles);
    setTerrain(initialTerrain);
    setBullets([]);
    setFloatingCoins([]);
    setLevelCoins(initialCoins);
    setDeathEffects([]);
    setMuzzleFlashBorn(0);
    setView({
      cowScreenX: PLAYER_START_X,
      cowBottom: cowBottomRef.current,
      cameraX: 0,
      now: performance.now() / 1000,
      isMoving: false,
      isGrounded: levelRef.current < 3,
    });
    setFacing('right');
    setScore(0);
    setShopOpen(false);

    coinsRefCount.current = carriedCoins;
    ownedWeaponsRef.current = carriedOwnedWeapons;
    weaponRef.current = carriedWeapon;
    setCoins(carriedCoins);
    setOwnedWeapons(carriedOwnedWeapons);
    setCurrentWeapon(carriedWeapon);

    requestStart();
  }, [requestStart, bossHpAnim]);


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
          !obs.portalLocked &&
        obs.x + obs.width > view.cameraX &&
        obs.x < view.cameraX + screenWidth
    )
    .sort((a, b) => (a.type === 'water' ? 0 : 1) - (b.type === 'water' ? 0 : 1));
  const visibleBullets = bullets.filter(
    (b) => b.x + 5 > view.cameraX && b.x - 5 < view.cameraX + screenWidth
  );
  const visibleFireballs = fireballs.filter(
    (f) =>
      f.x + FIREBALL_RADIUS > view.cameraX &&
      f.x - FIREBALL_RADIUS < view.cameraX + screenWidth
  );
  const portalLockedForCoins = obstacles.some(
    (o) => o.type === 'portal' && o.portalLocked === true
  );
  const visibleCoins = levelCoins.filter(
    (c) =>
      !c.collected &&
      !(c.portalCoin && portalLockedForCoins) &&
      c.x + c.width > view.cameraX &&
      c.x < view.cameraX + screenWidth
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

  const backgroundImage =
    currentLevel >= 3
      ? IMG_BG_LEVEL_3
      : currentLevel === 2
        ? IMG_BG_LEVEL_2
        : IMG_BG_LEVEL_1;

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
  const absorbScale = (1 - absorbEase * 0.92) * (cowEmpowered ? COW_POWER_SCALE : 1);
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

  // Arma sobre el sprite de sirena: se coloca en la mano levantada igual que en
  // los niveles 1 y 2, usando el recorte real del PNG del arma.
  const mermaidWeapon = (() => {
    if (currentLevel < 3 || currentWeapon === 0 || cowDead) {
      return null;
    }
    const weapon = WEAPONS[currentWeapon];
    const gunScale = 40 / weapon.trim.width;
    const gripX = (weapon.trim.x + weapon.trim.width * 0.16) * gunScale;
    const gripY = (weapon.trim.y + weapon.trim.height * 0.8) * gunScale;
    return {
      source: weapon.sprite,
      width: weapon.canvasWidth * gunScale,
      height: weapon.canvasHeight * gunScale,
      left: 100 - gripX,
      top: 43 - gripY,
    };
  })();

  // Boca del cañón (desde la esquina superior izquierda de la caja de la vaquita).
  const muzzleLocalX = cowWeapon ? cowWeapon.muzzleLocal.x : COW_WIDTH + 8;
  const muzzleLocalYFromTop = cowWeapon
    ? cowWeapon.muzzleLocal.y
    : COW_HEIGHT * 0.72;

  const shopPanelWidth = Math.min(320, screenWidth * 0.86);
  const isInvulnerable = view.now * 1000 < invulnerableUntil;
  const cowBlinkOpacity =
    isInvulnerable && Math.floor(view.now * 12) % 2 === 0 ? 0.25 : 1;

  return (
    <View style={styles.container}>
      <Image source={backgroundImage} style={styles.bgImage} resizeMode="cover" />

      {currentLevel > 0 && (
        <Text style={styles.levelText}>
          NIVEL {currentLevel}{' '}
          {levelCompleted ? '🟢 COMPLETADO' : ''}
        </Text>
      )}

      <View style={styles.livesHud} pointerEvents="none">
        {Array.from({ length: MAX_LIVES }, (_, index) => (
          <Text
            key={index}
            style={[
              styles.lifeHeart,
              index < lives ? styles.lifeHeartFull : styles.lifeHeartEmpty,
            ]}
          >
            {index < lives ? '♥' : '♡'}
          </Text>
        ))}
      </View>

      {bossHp > 0 && (
        <View style={styles.bossHpContainer} pointerEvents="none">
          <Text style={styles.bossHpLabel}>JEFE FINAL</Text>
          <View style={styles.bossHpTrack}>
            <Animated.View
              style={[
                styles.bossHpFill,
                {
                  width: bossHpAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>
          <Text style={styles.bossHpValue}>
            {bossHp}/{BOSS_MAX_HP}
          </Text>
        </View>
      )}

      {/* El suelo se dibuja antes que el agua y los obstáculos para que el
          lago pueda ocupar visualmente todo el piso. El nivel 2 usa una
          paleta oscura acorde a su fondo. */}
      <View
        style={[
          styles.ground,
          currentLevel === 2 && styles.groundNight,
          currentLevel >= 3 && styles.groundUnderwater,
        ]}
      >
        <GroundSurface
          isNight={currentLevel === 2}
          isUnderwater={currentLevel >= 3}
        />
      </View>

      {visibleObstacles.map((obstacle) => {
        const left = Number(obstacle.x - view.cameraX);
        switch (obstacle.type) {
          case 'crate':
            return <CrateObstacle key={obstacle.id} obstacle={obstacle} left={left} />;
          case 'spike':
            return <SpikeObstacle key={obstacle.id} obstacle={obstacle} left={left} />;
          case 'slime':
            return (
              <SlimeObstacle
                key={obstacle.id}
                obstacle={obstacle}
                left={left}
                now={view.now}
              />
            );
          case 'hole_trap':
            return (
              <HoleTrapObstacle
                key={obstacle.id}
                obstacle={obstacle}
                left={obstacle.x + obstacle.width / 2 - view.cameraX}
                now={view.now}
              />
            );
          case 'stone_trap':
            return <StoneTrapObstacle key={obstacle.id} obstacle={obstacle} left={left} />;
          case 'bench_trap':
            return (
              <BenchTrapObstacle
                key={obstacle.id}
                obstacle={obstacle}
                left={left}
                active={obstacle.benchTrapActive === true}
              />
            );
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
                bossSpeed={Math.abs(obstacle.vx ?? 0)}
                bossMoving={
                  obstacle.hitFlash !== true && Math.abs(obstacle.vx ?? 0) > 1
                }
                bossFacing={obstacle.facing ?? 'right'}
              />
            );
          case 'destructible':
            return <DestructibleObstacle key={obstacle.id} obstacle={obstacle} left={left} />;
          case 'moving':
            return <MovingObstacle key={obstacle.id} obstacle={obstacle} left={left} />;
          case 'trap_platform':
            return <TrapPlatform key={obstacle.id} obstacle={obstacle} left={left} />;
          case 'upper_platform':
            return (
              <UpperRoutePlatform key={obstacle.id} obstacle={obstacle} left={left} />
            );
          case 'floor_spines':
            return (
              <FloorSpines key={obstacle.id} obstacle={obstacle} left={left} />
            );
          case 'spines_barrier':
            return null;
          case 'boss_gate':
            return <BossGate key={obstacle.id} obstacle={obstacle} left={left} />;
          case 'chase_trigger':
            return null;
          case 'chase_monster':
            return (
              <ChaseMonster
                key={obstacle.id}
                left={left}
                bottom={obstacle.bottom}
                facing={obstacle.facing ?? 'left'}
                phase={monsterPhase === 'idle' ? 'chase' : monsterPhase}
                hitFlash={
                  obstacle.lastHitTime !== undefined &&
                  view.now - obstacle.lastHitTime < 0.2
                }
                moving={obstacle.moving === true}
                firing={obstacle.fireballWindup === true}
                moveSpeed={Math.abs(obstacle.vx ?? 0) || CHASE_SPEED}
                style={{ zIndex: 5 }}
              />
            );
          case 'chase_spike':
            return (
              <ChaseSpike key={obstacle.id} obstacle={obstacle} left={left} />
            );
          case 'bat_trigger':
            return null;
          case 'bat':
            if (obstacle.active !== true) {
              return null;
            }
            return (
              <BatObstacle
                key={obstacle.id}
                obstacle={obstacle}
                left={left}
                now={view.now}
              />
            );
          case 'water':
            return (
              <WaterZone
                key={obstacle.id}
                obstacle={obstacle}
                left={left}
                now={view.now}
              />
            );
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
                level={currentLevel}
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

      {currentLevel >= 3 && urchinWarning !== null && (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: Number(urchinWarning - view.cameraX - 70),
            bottom: SCREEN_HEIGHT - 160,
            width: 140,
            height: 78,
            zIndex: 8,
            opacity: 0.55 + Math.sin(view.now * 10) * 0.35,
          }}
        >
          <Image
            source={IMG_URCHIN_WARNING}
            style={{
              position: 'absolute',
              left: -344 * (140 / 684),
              bottom: -(768 - 572) * (140 / 684),
              width: 1376 * (140 / 684),
              height: 768 * (140 / 684),
            }}
            resizeMode="stretch"
            fadeDuration={0}
            accessible={false}
          />
        </View>
      )}

      {currentLevel >= 3 &&
        urchins.map((urchin) => {
          const frameIndex =
            Math.floor((view.now + urchin.id * 0.05) / URCHIN_FRAME_SECONDS) %
            URCHIN_FRAMES.length;
          return (
            <View
              key={urchin.id}
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: Number(
                  urchin.x - view.cameraX - URCHIN_VISIBLE_SIZE / 2
                ),
                bottom: Number(urchin.bottom - URCHIN_VISIBLE_SIZE / 2),
                width: URCHIN_VISIBLE_SIZE,
                height: URCHIN_VISIBLE_SIZE,
                zIndex: 8,
              }}
            >
              <Image
                source={URCHIN_FRAMES[frameIndex].source}
                style={urchinFrameStyle(URCHIN_FRAMES[frameIndex])}
                resizeMode="stretch"
                fadeDuration={0}
                accessible={false}
              />
            </View>
          );
        })}

      {currentLevel >= 3 &&
        octopusColumns.map((column) => {
          const attacking = view.now < column.attackUntil;
          const spriteIndex = attacking
            ? 2
            : Math.floor(view.now / OCTO_ANIM_SECONDS) % 2;
          const source = OCTO_SPRITES[column.variant][spriteIndex];
          const imageLeft = (OCTO_COLUMN_WIDTH - 1376) / 2;
          return (
            <React.Fragment key={`octo-${column.id}`}>
              <View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  left: Number(
                    column.x - view.cameraX - OCTO_COLUMN_WIDTH / 2
                  ),
                  bottom: OCTO_GAP_CENTER + OCTO_GAP_HEIGHT / 2,
                  width: OCTO_COLUMN_WIDTH,
                  height: OCTO_PIECE_HEIGHT,
                  overflow: 'hidden',
                  zIndex: 3,
                }}
              >
                <Image
                  source={source}
                  style={{
                    position: 'absolute',
                    left: imageLeft,
                    bottom:
                      -(768 - OCTO_PIECE_BOTTOM_Y[column.variant][spriteIndex]),
                    width: 1376,
                    height: 768,
                  }}
                  resizeMode="contain"
                  fadeDuration={0}
                  accessible={false}
                />
              </View>
              <View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  left: Number(
                    column.x - view.cameraX - OCTO_COLUMN_WIDTH / 2
                  ),
                  bottom: GROUND_HEIGHT,
                  width: OCTO_COLUMN_WIDTH,
                  height: OCTO_PIECE_HEIGHT,
                  overflow: 'hidden',
                  zIndex: 3,
                }}
              >
                <Image
                  source={source}
                  style={{
                    position: 'absolute',
                    left: imageLeft,
                    bottom:
                      -(
                        768 -
                        OCTO_BOTTOM_PIECE_BOTTOM_Y[column.variant][spriteIndex]
                      ),
                    width: 1376,
                    height: 768,
                  }}
                  resizeMode="contain"
                  fadeDuration={0}
                  accessible={false}
                />
              </View>
            </React.Fragment>
          );
        })}

      {currentLevel >= 3 &&
        octopusBalls.map((ball) => (
          <View
            key={`octoball-${ball.id}`}
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: Number(ball.x - view.cameraX - OCTO_BALL_SIZE / 2),
              bottom: Number(ball.bottom - OCTO_BALL_SIZE / 2),
              width: OCTO_BALL_SIZE,
              height: OCTO_BALL_SIZE,
              borderRadius: OCTO_BALL_SIZE / 2,
              backgroundColor: '#08080d',
              shadowColor: '#000',
              shadowOpacity: 0.8,
              shadowRadius: 8,
              elevation: 8,
              zIndex: 9,
            }}
          />
        ))}

      {visibleFireballs.map((fireball) => (
        <View
          key={fireball.id}
          pointerEvents="none"
          style={[
            styles.fireball,
            {
              left: Number(fireball.x - view.cameraX - FIREBALL_VISUAL_WIDTH / 2),
              bottom: Number(fireball.y - FIREBALL_VISUAL_HEIGHT / 2),
              transform: [{ scaleX: fireball.vx < 0 ? -1 : 1 }],
            },
          ]}
        >
          <View style={styles.fireballTail} />
          <View style={styles.fireballCore} />
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

      {powerOrb && !cowEmpowered && (
        <View
          pointerEvents="none"
          style={[
            styles.powerOrb,
            {
              left: Number(powerOrb.x - view.cameraX - POWER_ORB_SIZE / 2),
              bottom: Number(powerOrb.bottom - POWER_ORB_SIZE / 2),
            },
          ]}
        >
          <View style={styles.powerOrbCore} />
        </View>
      )}

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

      {currentLevel < 3 && view.now - muzzleFlashBorn < 0.12 && (
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

      {currentLevel >= 3 ? (
        <MermaidCow
          facing={facing}
          isMoving={view.isMoving}
          isShooting={isShooting}
          upgradedWeapon={currentWeapon > 0}
          weapon={isShooting ? mermaidWeapon : null}
          diving={isDiving}
          now={view.now}
          style={[
            styles.cow,
            {
              left: Number(cowRenderLeft + (cowRenderWidth - 140) / 2),
              bottom: Number(cowRenderBottom + (cowRenderHeight - 110) / 2),
              opacity: (1 - absorbEase) * cowBlinkOpacity,
            },
          ]}
        />
      ) : (
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
              opacity: (1 - absorbEase) * cowBlinkOpacity,
            },
          ]}
        />
      )}

      {/* El lodo se pinta después de la vaquita para que la tape al hundirse. */}
      {visibleObstacles
        .filter((obstacle) => obstacle.type === 'mud_trap')
        .map((obstacle) => (
          <MudTrapZone
            key={obstacle.id}
            width={obstacle.width}
            left={Number(obstacle.x - view.cameraX)}
            bottom={obstacle.bottom}
            height={obstacle.height}
            isTriggered={obstacle.mudTriggered === true}
            onSinkComplete={handleMudSinkComplete}
          />
        ))}

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
        onJumpPressOut={handleJumpPressOut}
        onDownPressIn={handleDownPressIn}
        onDownPressOut={handleDownPressOut}
        showDown={currentLevel >= 3}
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
  chaseSpikeBase: {
    position: 'absolute',
    left: -4,
    right: -4,
    bottom: 0,
    height: 14,
    borderRadius: 6,
    backgroundColor: '#2b2530',
    borderTopWidth: 3,
    borderTopColor: '#4d4554',
  },
  chaseSpikeSprite: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 8,
    height: CHASE_SPIKE_HEIGHT - 8,
    width: '100%',
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
  groundUnderwater: {
    backgroundColor: '#0d3a4d',
    borderTopColor: '#082736',
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
    top: -4,
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
  groundEdgeLight: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 2,
  },
  groundEdgeShade: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 17,
    height: 5,
  },
  groundTileInner: {
    position: 'absolute',
    left: 2,
    right: 2,
    top: 2,
    bottom: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  groundSpeck: {
    position: 'absolute',
    borderRadius: 1,
  },
  groundBevel: {
    position: 'absolute',
    left: 2,
    right: 2,
    bottom: 2,
    height: 2,
  },
  groundBevelTop: {
    position: 'absolute',
    left: 3,
    right: 3,
    top: 1,
    height: 2,
  },
  groundCrack: {
    position: 'absolute',
    width: 1.5,
    borderRadius: 1,
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
  fireball: {
    position: 'absolute',
    width: FIREBALL_VISUAL_WIDTH,
    height: FIREBALL_VISUAL_HEIGHT,
    borderRadius: FIREBALL_VISUAL_HEIGHT / 2,
    backgroundColor: 'rgba(255, 96, 24, 0.92)',
    borderWidth: 2,
    borderColor: '#ffcf5c',
    shadowColor: '#ff4a12',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 12,
    zIndex: 6,
  },
  fireballCore: {
    position: 'absolute',
    left: FIREBALL_VISUAL_WIDTH * 0.42,
    top: 3,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#fff1a8',
    borderWidth: 2,
    borderColor: '#ff8a2b',
  },
  fireballTail: {
    position: 'absolute',
    left: -16,
    top: 4,
    width: 26,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(255, 62, 12, 0.7)',
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
  powerOrb: {
    position: 'absolute',
    width: POWER_ORB_SIZE,
    height: POWER_ORB_SIZE,
    borderRadius: POWER_ORB_SIZE / 2,
    borderWidth: 3,
    borderColor: '#8fe9ff',
    backgroundColor: 'rgba(40, 150, 255, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#29b6ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 12,
    zIndex: 10,
  },
  powerOrbCore: {
    width: POWER_ORB_SIZE * 0.4,
    height: POWER_ORB_SIZE * 0.4,
    borderRadius: POWER_ORB_SIZE * 0.2,
    backgroundColor: '#e1f5ff',
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
    zIndex: 100,
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
    zIndex: 120,
    elevation: 120,
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
    zIndex: 100,
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
  livesHud: {
    position: 'absolute',
    left: 10,
    top: 40,
    zIndex: 100,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  lifeHeart: {
    fontSize: 20,
    lineHeight: 24,
    marginRight: 3,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  lifeHeartFull: {
    color: '#ff4d6d',
  },
  lifeHeartEmpty: {
    color: 'rgba(255,255,255,0.45)',
  },
  bossHpContainer: {
    position: 'absolute',
    top: 104,
    left: 10,
    right: 10,
    zIndex: 100,
    alignItems: 'center',
  },
  bossHpLabel: {
    color: '#ffd166',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  bossHpTrack: {
    marginTop: 4,
    width: '100%',
    maxWidth: 320,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    backgroundColor: 'rgba(0,0,0,0.65)',
    overflow: 'hidden',
  },
  bossHpFill: {
    height: '100%',
    backgroundColor: '#ff3b30',
  },
  bossHpValue: {
    marginTop: 2,
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
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
    backgroundColor: 'transparent',
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
