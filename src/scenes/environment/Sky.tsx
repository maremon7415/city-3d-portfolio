import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { BackSide, Mesh, ShaderMaterial } from 'three'
import { env } from '../../systems/dayNight'

const vertex = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    gl_Position = p.xyww;
  }
`

const fragment = /* glsl */ `
  uniform vec3 uTop;
  uniform vec3 uHorizon;
  uniform vec3 uBottom;
  uniform vec3 uSunColor;
  uniform vec3 uSunDir;
  uniform vec3 uMoonDir;
  uniform float uSunVisible;
  uniform float uStars;
  uniform float uNight;
  uniform float uTime;
  varying vec3 vDir;

  float hash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  void main() {
    vec3 d = normalize(vDir);
    float h = d.y;
    vec3 col = h > 0.0
      ? mix(uHorizon, uTop, pow(smoothstep(0.0, 1.0, h), 0.55))
      : mix(uHorizon, uBottom, smoothstep(0.0, -0.4, h));

    // sun: wide glow + halo + disc
    float sd = max(dot(d, normalize(uSunDir)), 0.0);
    col += uSunColor * pow(sd, 6.0) * 0.32 * uSunVisible;
    col += uSunColor * pow(sd, 60.0) * 0.6 * uSunVisible;
    col += uSunColor * smoothstep(0.9986, 0.9992, sd) * 4.0 * uSunVisible;

    // moon with soft halo
    float md = max(dot(d, normalize(uMoonDir)), 0.0);
    float disc = smoothstep(0.99935, 0.9996, md);
    vec3 moonCol = vec3(0.92, 0.95, 1.0);
    col = mix(col, moonCol * 2.2, disc * uNight);
    col += vec3(0.45, 0.55, 1.0) * pow(md, 180.0) * 0.5 * uNight;

    // procedural twinkling stars
    if (uStars > 0.001 && h > -0.05) {
      vec3 p = d * 260.0;
      vec3 cell = floor(p);
      float n = hash(cell);
      float star = step(0.987, n);
      float dist = length(fract(p) - 0.5);
      float tw = 0.55 + 0.45 * sin(uTime * (1.5 + n * 3.0) + n * 60.0);
      float size = mix(0.08, 0.22, fract(n * 13.7));
      col += vec3(1.0, 0.97, 0.9) * star * smoothstep(size, 0.0, dist) * tw * uStars * smoothstep(-0.05, 0.3, h) * 2.2;
    }

    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`

export function Sky() {
  const mesh = useRef<Mesh>(null)
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: vertex,
        fragmentShader: fragment,
        side: BackSide,
        depthWrite: false,
        fog: false,
        uniforms: {
          uTop: { value: env.skyTop },
          uHorizon: { value: env.skyHorizon },
          uBottom: { value: env.skyBottom },
          uSunColor: { value: env.sun },
          uSunDir: { value: env.sunDiscDir },
          uMoonDir: { value: env.moonDir },
          uSunVisible: { value: 1 },
          uStars: { value: 0 },
          uNight: { value: 0 },
          uTime: { value: 0 },
        },
      }),
    [],
  )

  useFrame(({ camera, clock }) => {
    mesh.current?.position.copy(camera.position)
    material.uniforms.uSunVisible.value = env.sunVisible
    material.uniforms.uStars.value = env.stars
    material.uniforms.uNight.value = env.night
    material.uniforms.uTime.value = clock.elapsedTime
  })

  return (
    <mesh ref={mesh} material={material} renderOrder={-1} frustumCulled={false}>
      <sphereGeometry args={[500, 32, 16]} />
    </mesh>
  )
}
