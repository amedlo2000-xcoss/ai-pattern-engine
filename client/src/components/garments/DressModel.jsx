import { useMemo } from 'react'
import * as THREE from 'three'

const BODICE_EXT = { depth: 0.11, bevelEnabled: false }

export default function DressModel({ color = '#e0e0e0', opacity = 1 }) {
  const mat = {
    color, roughness: 0.88, metalness: 0,
    clearcoat: 0.08, clearcoatRoughness: 0.5,
    side: THREE.DoubleSide, transparent: true, opacity,
  }

  // 上半身：Tシャツと同形状（着丈短め）
  const bodiceShape = useMemo(() => {
    const s = new THREE.Shape()
    s.moveTo(-0.26, -0.32)
    s.lineTo(-0.26,  0.10)
    s.quadraticCurveTo(-0.26, 0.28, -0.18, 0.30)
    s.lineTo(-0.26,  0.30)
    s.lineTo(-0.10,  0.32)
    s.quadraticCurveTo(0, 0.36, 0.10, 0.32)
    s.lineTo( 0.26,  0.30)
    s.quadraticCurveTo(0.26, 0.28, 0.26, 0.10)
    s.lineTo( 0.26, -0.32)
    s.lineTo(-0.26, -0.32)
    return s
  }, [])

  // スカート：Aラインプロファイル（2次カーブで裾広がり）
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
      {/* 上半身 */}
      <mesh position={[0, 0.12, -0.05]}>
        <extrudeGeometry args={[bodiceShape, BODICE_EXT]} />
        <meshPhysicalMaterial {...mat} />
      </mesh>
      {/* スカート */}
      <mesh position={[0, 0.02, 0]}>
        <latheGeometry args={[skirtPoints, 32]} />
        <meshPhysicalMaterial {...mat} />
      </mesh>
    </group>
  )
}
