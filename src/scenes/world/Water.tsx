import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { BufferAttribute, BufferGeometry, CatmullRomCurve3, Color, DoubleSide, Points, ShaderMaterial, Vector3 } from 'three'
import { DISTRICTS, RIVER } from '../../systems/layout'
import { env } from '../../systems/dayNight'
import { mulberry32 } from '../../systems/math'
import { useStore } from '../../state/store'

const waterVertex = /* glsl */ `
  varying vec2 vUv;
  #include <fog_pars_vertex>
  void main() {
    vUv = uv;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`

const waterFragment = /* glsl */ `
  uniform float uTime;
  uniform float uSpeed;
  uniform float uScale;
  uniform vec3 uDeep;
  uniform vec3 uLight;
  uniform float uFall;
  varying vec2 vUv;
  #include <fog_pars_fragment>

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
  }

  void main() {
    vec2 uv = vUv;
    float flow = uv.y * uScale - uTime * uSpeed;
    float n = noise(vec2(uv.x * 6.0, flow));
    float streak = smoothstep(0.62, 0.9, noise(vec2(uv.x * 14.0, flow * 1.6)));
    vec3 col = mix(uDeep, uLight, n * 0.45 + streak * 0.55);
    // edges foam a little
    float edge = smoothstep(0.38, 0.5, abs(uv.x - 0.5));
    col = mix(col, uLight * 1.15, edge * 0.6);
    // waterfall fades into mist at the bottom
    float alpha = uFall > 0.5 ? (1.0 - smoothstep(0.55, 1.0, uv.y)) * 0.92 : 0.9;
    gl_FragColor = vec4(col, alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    #include <fog_fragment>
  }
`

function useWaterMaterial(speed: number, scale: number, fall = false) {
  return useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: waterVertex,
        fragmentShader: waterFragment,
        transparent: true,
        fog: true,
        side: DoubleSide,
        depthWrite: !fall,
        uniforms: {
          uTime: { value: 0 },
          uSpeed: { value: speed },
          uScale: { value: scale },
          uDeep: { value: new Color('#3aa7d9') },
          uLight: { value: new Color('#bff0ff') },
          uFall: { value: fall ? 1 : 0 },
          fogColor: { value: new Color() },
          fogNear: { value: 1 },
          fogFar: { value: 1000 },
        },
      }),
    [speed, scale, fall],
  )
}

/** Ribbon along a curve. uv.x across, uv.y along (0 at start). */
function ribbon(points: Vector3[], width: number, steps: number, widthAt?: (t: number) => number) {
  const curve = new CatmullRomCurve3(points)
  const pos: number[] = []
  const uv: number[] = []
  const idx: number[] = []
  const up = new Vector3(0, 1, 0)
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const p = curve.getPoint(t)
    const tan = curve.getTangent(t)
    let side = new Vector3().crossVectors(tan, up)
    if (side.lengthSq() < 1e-4) side = new Vector3(0, 0, 1)
    side.normalize()
    const w = (widthAt ? widthAt(t) : 1) * width * 0.5
    pos.push(p.x - side.x * w, p.y - side.y * w, p.z - side.z * w, p.x + side.x * w, p.y + side.y * w, p.z + side.z * w)
    uv.push(0, t, 1, t)
    if (i < steps) {
      const a = i * 2
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2)
    }
  }
  const g = new BufferGeometry()
  g.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3))
  g.setAttribute('uv', new BufferAttribute(new Float32Array(uv), 2))
  g.setIndex(idx)
  g.computeVertexNormals()
  return g
}

const deepDay = new Color('#38a6da')
const deepNight = new Color('#173a6e')
const lightDay = new Color('#c4f2ff')
const lightNight = new Color('#5f8fd6')

export function Water() {
  const quality = useStore((s) => s.quality)
  const riverMat = useWaterMaterial(0.9, 6)
  const pondMat = useWaterMaterial(0.08, 1)
  const fallMat = useWaterMaterial(2.2, 10, true)
  const mist = useRef<Points>(null)

  const riverGeo = useMemo(() => ribbon(RIVER.map((p) => new Vector3(p[0], 0.06, p[2])), 1.5, 40, (t) => 0.8 + t * 0.35), [])
  const end = RIVER[RIVER.length - 1]
  const fallGeo = useMemo(() => {
    const pts: Vector3[] = []
    for (let i = 0; i <= 10; i++) {
      const t = i / 10
      // pours over the lip then drops, drifting outward
      pts.push(new Vector3(end[0] - t * 4.5 - Math.pow(t, 0.5) * 1.5, 0.06 - Math.pow(t, 1.4) * 44, end[2] + t * 0.8))
    }
    return ribbon(pts, 2.0, 60, (t) => 1 + t * 1.4)
  }, [end])

  const mistGeo = useMemo(() => {
    const rand = mulberry32(4)
    const count = quality === 'high' ? 160 : 70
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      arr[i * 3] = end[0] - 2 - rand() * 5
      arr[i * 3 + 1] = -rand() * 40
      arr[i * 3 + 2] = end[2] + (rand() - 0.5) * 4
    }
    const g = new BufferGeometry()
    g.setAttribute('position', new BufferAttribute(arr, 3))
    return g
  }, [end, quality])

  useFrame(({ clock, scene }, dt) => {
    const t = clock.elapsedTime
    const fog = scene.fog as { color: Color; near: number; far: number } | null
    for (const m of [riverMat, pondMat, fallMat]) {
      m.uniforms.uTime.value = t
      m.uniforms.uDeep.value.copy(deepDay).lerp(deepNight, env.night)
      m.uniforms.uLight.value.copy(lightDay).lerp(lightNight, env.night)
      if (fog) {
        m.uniforms.fogColor.value.copy(fog.color)
        m.uniforms.fogNear.value = fog.near
        m.uniforms.fogFar.value = fog.far
      }
    }
    const pts = mist.current
    if (pts) {
      const arr = pts.geometry.attributes.position.array as Float32Array
      for (let i = 0; i < arr.length; i += 3) {
        arr[i + 1] -= dt * (6 + (i % 7))
        if (arr[i + 1] < -42) arr[i + 1] = 0
      }
      pts.geometry.attributes.position.needsUpdate = true
    }
  })

  const pond = DISTRICTS.pond.pos
  return (
    <group>
      <mesh geometry={riverGeo} material={riverMat} renderOrder={1} />
      <mesh position={[pond[0], 0.07, pond[2]]} rotation-x={-Math.PI / 2} material={pondMat} renderOrder={1}>
        <circleGeometry args={[2.4, 20]} />
      </mesh>
      <mesh position={[pond[0], 0.04, pond[2]]} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[2.3, 2.85, 20]} />
        <meshLambertMaterial color="#cdbb9c" flatShading />
      </mesh>
      <mesh geometry={fallGeo} material={fallMat} renderOrder={2} />
      <points ref={mist} geometry={mistGeo} frustumCulled={false}>
        <pointsMaterial color="#eaf8ff" size={0.6} sizeAttenuation transparent opacity={0.55} depthWrite={false} />
      </points>
    </group>
  )
}
