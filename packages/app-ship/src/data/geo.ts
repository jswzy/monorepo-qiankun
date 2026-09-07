/**
 * 航线几何工具（纯函数，便于单测）
 *
 * 世界地图在 ECharts 里是「等距圆柱投影」：经度线性映射到 x 轴。
 * 于是「东经 129° → 西经 118°」这种跨太平洋航段，如果直接连一条直线，
 * 会被画成横穿整个欧亚大陆的错误航线（真实航线应该往东跨过 180° 经线）。
 * 解决办法：在 ±180° 边界处把航段拆成两段。
 */

export type LngLat = [number, number]

/**
 * 把航线坐标拆成可安全绘制的线段。
 * 跨越 ±180° 经线的段会在边界处断开成两段（纬度按经度线性插值）。
 */
export function buildSegments(coords: LngLat[]): LngLat[][] {
  const segs: LngLat[][] = []
  for (let i = 1; i < coords.length; i++) {
    const a = coords[i - 1]
    const b = coords[i]

    // 归一化到「走短路径」的经度差，落到 (-180, 180]
    let dLng = b[0] - a[0]
    if (dLng > 180) dLng -= 360
    if (dLng < -180) dLng += 360

    if (dLng !== b[0] - a[0]) {
      // 原始经度差与短路径不一致 → 跨了 ±180°，必须断开
      const sign = dLng > 0 ? 1 : -1
      const t = Math.min(Math.max((sign * 180 - a[0]) / dLng, 0), 1)
      const latMid = a[1] + (b[1] - a[1]) * t
      segs.push([
        [a[0], a[1]],
        [sign * 180, latMid]
      ])
      segs.push([
        [-sign * 180, latMid],
        [b[0], b[1]]
      ])
    } else {
      segs.push([a, b])
    }
  }
  return segs
}

/**
 * 航线外接框（带 padding，并夹紧到世界范围），用于 ECharts geo.boundingCoords 聚焦航区。
 * 返回 [leftTop, rightBottom]，与 ECharts 约定一致：[[minLng, maxLat], [maxLng, minLat]]
 */
export function routeBounding(coords: LngLat[], pad = 10): [LngLat, LngLat] {
  if (!coords.length) {
    return [
      [-180, 85],
      [180, -85]
    ]
  }
  const lngs = coords.map((c) => c[0])
  const lats = coords.map((c) => c[1])
  return [
    [Math.max(-180, Math.min(...lngs) - pad), Math.min(85, Math.max(...lats) + pad)],
    [Math.min(180, Math.max(...lngs) + pad), Math.max(-85, Math.min(...lats) - pad)]
  ]
}
