<script setup lang="ts">
/**
 * 右侧可折叠货轮切换边栏
 *
 * - 列出全部货轮（照片缩略 + 船名 + 状态 + 当前船位 + 货量），点击切换选中船
 * - 顶部把手可折叠 / 隐藏，折叠后仅留竖向标签，便于把地图区域最大化
 * - active 项高亮（与地图选中态联动）
 */
import { DemoTag } from '@demo/ui-package/vue3'
import ShipPhoto from './ShipPhoto.vue'
import { SHIP_STATUS_COLOR, shipColor, type Ship, type ShipStatus } from '../data/ships'

defineProps<{ ships: Ship[]; activeId?: string | null; open: boolean }>()
const emit = defineEmits<{ (e: 'select', ship: Ship): void; (e: 'toggle'): void }>()

const STATUS_TONE: Record<ShipStatus, 'success' | 'primary' | 'warning'> = {
  航行中: 'success',
  靠泊中: 'primary',
  锚泊中: 'warning'
}
</script>

<template>
  <aside class="sidebar" :class="{ 'is-open': open }">
    <button type="button" class="sidebar__handle" :title="open ? '收起货轮列表' : '展开货轮列表'" @click="emit('toggle')">
      <span v-if="open">收起 ›</span>
      <span v-else class="sidebar__handle-vert">‹ 货轮</span>
    </button>

    <div v-show="open" class="sidebar__body">
      <header class="sidebar__head">
        <b>货轮船队</b>
        <span class="sidebar__count">{{ ships.length }} 艘</span>
      </header>

      <ul class="sidebar__list">
        <li
          v-for="ship in ships"
          :key="ship.id"
          class="ship-item"
          :class="{ 'is-active': ship.id === activeId }"
          @click="emit('select', ship)"
        >
          <span class="ship-item__bar" :style="{ background: shipColor(ship.hue) }" />
          <div class="ship-item__photo">
            <ShipPhoto :hue="ship.hue" :name="ship.name" :status="ship.status" />
          </div>
          <div class="ship-item__body">
            <div class="ship-item__title">
              <b>{{ ship.name }}</b>
              <DemoTag :tone="STATUS_TONE[ship.status]" dot>{{ ship.status }}</DemoTag>
            </div>
            <div class="ship-item__meta">
              <span>{{ ship.voyage }} · {{ ship.lane }}</span>
              <span class="demo-mono">{{ ship.lat.toFixed(1) }}, {{ ship.lng.toFixed(1) }}</span>
              <span>货量 {{ ship.cargo }}</span>
            </div>
          </div>
        </li>
      </ul>

      <footer class="sidebar__foot">
        <span><i :style="{ background: SHIP_STATUS_COLOR['航行中'] }" />航行中</span>
        <span><i :style="{ background: SHIP_STATUS_COLOR['靠泊中'] }" />靠泊中</span>
        <span><i :style="{ background: SHIP_STATUS_COLOR['锚泊中'] }" />锚泊中</span>
      </footer>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  flex: none;
  width: 320px;
  align-self: stretch;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--demo-border, #e6ebef);
  border-radius: 12px;
  background: #fff;
  overflow: hidden;
  transition: width 0.2s ease;
}
.sidebar:not(.is-open) {
  width: 40px;
}

.sidebar__handle {
  flex: none;
  width: 100%;
  height: 38px;
  border: 0;
  border-bottom: 1px solid var(--demo-border, #e6ebef);
  background: #f4f8fb;
  color: #2b3d4a;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}
.sidebar__handle:hover {
  background: #e8f0f6;
}
.sidebar:not(.is-open) .sidebar__handle-vert {
  writing-mode: vertical-rl;
  letter-spacing: 2px;
}

.sidebar__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.sidebar__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  font-size: 13px;
}
.sidebar__count {
  font-size: 11px;
  color: var(--demo-text-muted);
}

.sidebar__list {
  list-style: none;
  margin: 0;
  padding: 4px 8px;
  flex: 1;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ship-item {
  position: relative;
  display: flex;
  gap: 8px;
  padding: 8px 8px 8px 10px;
  border: 1px solid var(--demo-border, #e6ebef);
  border-radius: 10px;
  cursor: pointer;
  transition:
    box-shadow 0.16s ease,
    border-color 0.16s ease,
    background 0.16s ease;
}
.ship-item:hover {
  box-shadow: 0 6px 16px rgba(15, 60, 90, 0.1);
}
.ship-item.is-active {
  border-color: #0b6ea8;
  background: #f1f8fc;
  box-shadow: 0 6px 18px rgba(11, 110, 168, 0.18);
}
.ship-item__bar {
  position: absolute;
  left: 0;
  top: 8px;
  bottom: 8px;
  width: 3px;
  border-radius: 3px;
}
.ship-item__photo {
  flex: none;
  width: 96px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--demo-border, #e6ebef);
}
.ship-item__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.ship-item__title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}
.ship-item__title b {
  font-size: 12.5px;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ship-item__meta {
  display: flex;
  flex-direction: column;
  gap: 1px;
  font-size: 11px;
  color: var(--demo-text-muted);
}

.sidebar__foot {
  flex: none;
  display: flex;
  gap: 12px;
  padding: 8px 12px;
  border-top: 1px dashed var(--demo-border, #e6ebef);
  font-size: 11px;
  color: var(--demo-text-muted);
}
.sidebar__foot span {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.sidebar__foot i {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}
</style>
