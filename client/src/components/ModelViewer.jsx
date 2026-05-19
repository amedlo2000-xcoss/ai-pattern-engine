import { Suspense, useEffect, useMemo, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, useGLTF } from '@react-three/drei'
import * as THREE from 'three'

const MODELS = {
  tshirt: '/models/black-tshirt.glb',
  shirt:  '/models/white-shirt.glb',
  dress:  '/models/dress.glb',
  skirt:  '/models/skirt.glb',
  pants:  '/models/pants.glb',
}

function GarmentModel({ itemType, color }) {
  const path = MODELS[itemType] || MODELS.tshirt
  const { scene } = useGLTF(path)

  const clonedScene = useMemo(() => {
    return scene.clone(true)
  }, [path])

  useEffect(() => {
    clonedScene.traverse((child) => {
      if (child.isMesh) {
        child.visible = true
        child.material = new THREE.MeshStandardMaterial({
          color: color,
          roughness: 0.8,
          metalness: 0,
          side: THREE.DoubleSide
        })
      }
    })
  }, [clonedScene, color])

  const { scale, position } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(clonedScene)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    const maxDim = Math.max(size.x, size.y, size.z)
    const s = 1.4 / maxDim
    return {
      scale: s,
      position: [
        -center.x * s,
        -center.y * s,
        -center.z * s
      ]
    }
  }, [clonedScene])

  return (
    <primitive
      object={clonedScene}
      scale={scale}
      position={position}
    />
  )
}

Object.values(MODELS).forEach(p => useGLTF.preload(p))

export default function ModelViewer({ itemType, baseColor }) {
  const color = baseColor || '#e0e0e0'

  const [modelKey, setModelKey] = useState(itemType)
  useEffect(() => {
    setModelKey(itemType + '_' + Date.now())
  }, [itemType])

  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: '#0a0a0a',
      borderRadius: '8px',
      overflow: 'hidden'
    }}>
      <Canvas camera={{ position: [0, 0, 2.5], fov: 45 }}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[3, 5, 3]} intensity={2.0} />
        <directionalLight position={[-3, 2, -2]} intensity={0.8} />
        <Environment preset="studio" />
        <Suspense fallback={null}>
          <GarmentModel
            key={modelKey}
            itemType={itemType}
            color={color}
          />
        </Suspense>
        <OrbitControls
          enablePan={false}
          minDistance={1.0}
          maxDistance={4.0}
        />
      </Canvas>
    </div>
  )
}
