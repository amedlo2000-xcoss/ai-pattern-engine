import { useMemo } from 'react'
import * as THREE from 'three'

export default function SkirtModel({ color = '#e0e0e0', opacity = 1 }) {
  const mat = {
    color, roughness: 0.88, metalness: 0,
    clearcoat: 0.08, clearcoatRoughness: 0.5,
    side: THREE.DoubleSide, transparent: true, opacity,
  }

  // Aラインスカートプロファイル（DressModelと同じ生成式）
  const skirtPoints = useMemo(() => {
    const pts = []
    for (let i = 0; i <= 12; i++) {
      const t = i / 12
      const y = -t * 0.75
      const r = 0.22 + t * 0.28 + Math.pow(t, 2) * 0.08
      pts.push(new THREE.Vector2(r, y))
    }
    return pts
  }, [])

  return (
    <group>
      {/* ウエストベルト */}
      <mesh position={[0, 0.30, 0]}>
        <cylinderGeometry args={[0.23, 0.23, 0.05, 32]} />
        <meshPhysicalMaterial {...mat} />
      </mesh>
      {/* スカート本体 */}
      <mesh position={[0, 0.27, 0]}>
        <latheGeometry args={[skirtPoints, 32]} />
        <meshPhysicalMaterial {...mat} />
      </mesh>
    </group>
  )
}
