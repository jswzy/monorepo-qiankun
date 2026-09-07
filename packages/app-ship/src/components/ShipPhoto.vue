<script setup lang="ts">
/**
 * 货轮「照片」
 *
 * 演示数据里没有真实船照，这里用 SVG 画一艘汽车船（滚装船）作为船只卡片的主视觉：
 * 船体配色由 ship.hue 决定（每艘船一个色相）， Sky / 海面用渐变，船体带轻微浮沉动画。
 * 点击卡片（父组件负责）即可进入该船的航线轨迹图。
 */
import { computed } from 'vue'

export interface ShipPhotoProps {
  /** 船体色相 0-360 */
  hue?: number
  /** 船名（画在船体上） */
  name?: string
  /** 航行状态，非「航行中」时在船首标注 */
  status?: string
}

const props = withDefaults(defineProps<ShipPhotoProps>(), { hue: 205, name: '', status: '' })

const hull = computed(() => `hsl(${props.hue}, 34%, 30%)`)
const hullDark = computed(() => `hsl(${props.hue}, 38%, 22%)`)
const deck = computed(() => `hsl(${props.hue}, 24%, 86%)`)
const deckLine = computed(() => `hsl(${props.hue}, 22%, 72%)`)
const funnel = computed(() => `hsl(${props.hue}, 45%, 42%)`)

const isMoving = computed(() => props.status === '航行中')
</script>

<template>
  <svg class="ship-photo" viewBox="0 0 320 180" role="img" :aria-label="`货轮 ${name}`">
    <defs>
      <linearGradient id="shipSky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#d7ecf8" />
        <stop offset="100%" stop-color="#f2f9fd" />
      </linearGradient>
      <linearGradient id="shipSea" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#2d7fb3" />
        <stop offset="100%" stop-color="#0e4c75" />
      </linearGradient>
    </defs>

    <!-- 天空与海面 -->
    <rect x="0" y="0" width="320" height="112" fill="url(#shipSky)" />
    <rect x="0" y="112" width="320" height="68" fill="url(#shipSea)" />

    <!-- 云 -->
    <g fill="#ffffff" opacity="0.75">
      <ellipse cx="58" cy="30" rx="20" ry="8" />
      <ellipse cx="72" cy="26" rx="14" ry="7" />
      <ellipse cx="248" cy="22" rx="17" ry="7" />
    </g>

    <!-- 船体（带轻微浮沉） -->
    <g class="ship-photo__hull">
      <!-- 上层建筑（船尾桥楼） -->
      <rect x="74" y="62" width="52" height="46" rx="3" fill="#f7fbfd" />
      <rect x="74" y="62" width="52" height="6" fill="#e3eef4" />
      <g fill="#4d7f9c">
        <rect x="80" y="72" width="8" height="6" rx="1" />
        <rect x="92" y="72" width="8" height="6" rx="1" />
        <rect x="104" y="72" width="8" height="6" rx="1" />
        <rect x="80" y="84" width="8" height="6" rx="1" />
        <rect x="92" y="84" width="8" height="6" rx="1" />
        <rect x="104" y="84" width="8" height="6" rx="1" />
      </g>
      <!-- 烟囱 -->
      <rect x="88" y="44" width="15" height="20" rx="2" :fill="funnel" />
      <rect x="88" y="44" width="15" height="5" rx="2" :fill="hullDark" />

      <!-- 货舱（汽车船典型的大箱型上建） -->
      <rect x="132" y="52" width="122" height="56" rx="3" :fill="deck" />
      <g :stroke="deckLine" stroke-width="1">
        <line x1="132" y1="66" x2="254" y2="66" />
        <line x1="132" y1="80" x2="254" y2="80" />
        <line x1="132" y1="94" x2="254" y2="94" />
      </g>
      <rect x="132" y="52" width="122" height="4" :fill="deckLine" />

      <!-- 船首桅杆 -->
      <line x1="248" y1="52" x2="248" y2="34" stroke="#8fa9b8" stroke-width="2" />
      <circle cx="248" cy="31" r="3" fill="#e8b53a" />

      <!-- 主船体 -->
      <path
        d="M54,108 L266,108 L266,113 L252,133 L70,133 L54,113 Z"
        :fill="hull"
      />
      <!-- 吃水线 -->
      <rect x="54" y="108" width="212" height="4" :fill="hullDark" />
      <!-- 船名 -->
      <text x="160" y="126" text-anchor="middle" font-size="11" font-weight="700" fill="#ffffff" opacity="0.92">
        {{ name }}
      </text>
    </g>

    <!-- 海浪 -->
    <g stroke="#ffffff" stroke-opacity="0.35" stroke-width="1.5" fill="none">
      <path d="M0,140 q10,-5 20,0 t20,0 t20,0 t20,0 t20,0 t20,0 t20,0 t20,0 t20,0 t20,0 t20,0 t20,0 t20,0 t20,0 t20,0 t20,0" />
      <path d="M-10,156 q10,-5 20,0 t20,0 t20,0 t20,0 t20,0 t20,0 t20,0 t20,0 t20,0 t20,0 t20,0 t20,0 t20,0 t20,0 t20,0 t20,0 t20,0" />
    </g>

    <!-- 航行中的尾迹 -->
    <g v-if="isMoving" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1.5" fill="none">
      <path d="M270,132 q16,3 30,9" />
      <path d="M270,138 q20,4 38,12" />
    </g>

    <!-- 靠泊 / 锚泊标记 -->
    <g v-else>
      <circle cx="292" cy="140" r="9" fill="#ffffff" opacity="0.9" />
      <text x="292" y="145" text-anchor="middle" font-size="11">⚓</text>
    </g>
  </svg>
</template>

<style scoped>
.ship-photo {
  display: block;
  width: 100%;
  height: auto;
  border-radius: 10px 10px 0 0;
  background: #eaf4fa;
}
.ship-photo__hull {
  transform-origin: 160px 120px;
  animation: ship-bob 4.5s ease-in-out infinite;
}
@keyframes ship-bob {
  0%,
  100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-2.5px) rotate(-0.5deg);
  }
}
@media (prefers-reduced-motion: reduce) {
  .ship-photo__hull {
    animation: none;
  }
}
</style>
