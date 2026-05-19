import { useMemo } from 'react'
import * as THREE from 'three'

const BODY_EXT = {
  depth: 0.12,
  bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 3,
}
const SLEEVE_EXT = {
  depth: 0.10,
  bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 2,
}

export default function TShirtModel({ color = '#e0e0e0', opacity = 1 }) {
  const mat = {
    color,
    roughness: 0.92, metalness: 0, clearcoat: 0,
    sheen: 0.3, sheenRoughness: 0.8, sheenColor: '#ffffff',
    side: THREE.DoubleSide, transparent: true, opacity,
  }

  // 胴体：袖ぐりカーブ＋首ぐり滑らかなマルチカーブ
  const bodyShape = useMemo(() => {
    const s = new THREE.Shape()
    s.moveTo(-0.25, -0.32)
    s.lineTo(-0.25,  0.15)
    s.quadraticCurveTo(-0.25, 0.26, -0.20, 0.28)   // 左袖ぐり
    s.lineTo(-0.13,  0.28)                           // 肩左
    s.quadraticCurveTo(-0.10, 0.28, -0.09, 0.30)   // 肩→首カーブ左
    s.quadraticCurveTo(-0.05, 0.34,  0,   0.34)    // 首ぐり左半
    s.quadraticCurveTo( 0.05, 0.34,  0.09, 0.30)   // 首ぐり右半
    s.quadraticCurveTo( 0.10, 0.28,  0.13, 0.28)   // 肩→首カーブ右
    s.lineTo( 0.20,  0.28)                           // 肩右
    s.quadraticCurveTo( 0.25, 0.26,  0.25, 0.15)   // 右袖ぐり
    s.lineTo( 0.25, -0.32)
    s.lineTo(-0.25, -0.32)
    return s
  }, [])

  // 左袖：袖山QuadraticCurveで自然なカーブ
  const lSleeveShape = useMemo(() => {
    const s = new THREE.Shape()
    s.moveTo( 0,    0.28)   // 袖付け根上
    s.lineTo(-0.22, 0.22)   // 袖先上
    s.lineTo(-0.22, 0.12)   // 袖先下
    s.lineTo(-0.01, 0.15)   // 袖付け根下
    s.quadraticCurveTo(-0.10, 0.18, 0, 0.28)   // 袖山カーブ
    return s
  }, [])

  return (
    <group>
      {/* 胴体 */}
      <mesh position={[0, 0, -0.06]}>
        <extrudeGeometry args={[bodyShape, BODY_EXT]} />
        <meshPhysicalMaterial {...mat} />
      </mesh>

      {/* 左袖 */}
      <mesh position={[-0.20, 0, -0.05]}>
        <extrudeGeometry args={[lSleeveShape, SLEEVE_EXT]} />
        <meshPhysicalMaterial {...mat} />
      </mesh>

      {/* 右袖（左袖をX軸ミラー） */}
      <mesh position={[0.20, 0, -0.05]} scale={[-1, 1, 1]}>
        <extrudeGeometry args={[lSleeveShape, SLEEVE_EXT]} />
        <meshPhysicalMaterial {...mat} />
      </mesh>

      {/* 首ぐりリブ（半円トーラス） */}
      <mesh position={[0, 0.335, 0.01]} rotation={[0, 0, Math.PI]}>
        <torusGeometry args={[0.095, 0.012, 8, 32, Math.PI]} />
        <meshStandardMaterial color="#cccccc" roughness={0.9} transparent opacity={opacity} />
      </mesh>

      {/* 裾リブ */}
      <mesh position={[0, -0.32, 0]}>
        <boxGeometry args={[0.50, 0.018, 0.13]} />
        <meshStandardMaterial color="#cccccc" roughness={0.9} transparent opacity={opacity} />
      </mesh>
    </group>
  )
}
