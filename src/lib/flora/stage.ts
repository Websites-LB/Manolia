import * as THREE from "three";
import { HDRLoader } from "three/examples/jsm/loaders/HDRLoader.js";

export const CREAM = "#f3ede3";

const hdrCache = new WeakMap<THREE.WebGLRenderer, Promise<THREE.Texture>>();

/** Poly Haven "Brown Photostudio 02" (CC0), prefiltered once per renderer. */
export function loadEnvironment(renderer: THREE.WebGLRenderer) {
  let p = hdrCache.get(renderer);
  if (!p) {
    p = new HDRLoader().loadAsync("/hdri/studio.hdr").then((hdr) => {
      const pmrem = new THREE.PMREMGenerator(renderer);
      const env = pmrem.fromEquirectangular(hdr).texture;
      hdr.dispose();
      pmrem.dispose();
      return env;
    });
    hdrCache.set(renderer, p);
  }
  return p;
}

export function createRenderer(canvas: HTMLCanvasElement, opts: { alpha?: boolean; preserve?: boolean } = {}) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: opts.alpha ?? false,
    preserveDrawingBuffer: opts.preserve ?? false,
    powerPreference: "high-performance",
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 0.95;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  return renderer;
}

/** Warm studio: soft window key from the left, candle-warm rim, a floor that only catches shadow. */
export function createStage(background: string | null = CREAM) {
  const scene = new THREE.Scene();
  if (background) {
    scene.background = new THREE.Color(background);
    scene.fog = new THREE.Fog(background, 2.4, 6);
  }

  const key = new THREE.DirectionalLight("#fff3e2", 2.4);
  key.position.set(-1.1, 2.8, 2.1);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = -0.7;
  key.shadow.camera.right = 0.7;
  key.shadow.camera.top = 1.1;
  key.shadow.camera.bottom = -0.3;
  key.shadow.camera.near = 0.5;
  key.shadow.camera.far = 6;
  key.shadow.radius = 6;
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.01;
  scene.add(key);

  const rim = new THREE.DirectionalLight("#ffc98a", 1.3);
  rim.position.set(1.6, 1.2, -1.4);
  scene.add(rim);

  scene.add(new THREE.HemisphereLight("#fff8ee", "#c9bba5", 0.55));

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), new THREE.ShadowMaterial({ color: "#5a4632", opacity: 0.085 }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  return { scene, key, rim, floor };
}

/** Pollen-like motes drifting through the key light — slow, sparse, barely there. */
export function createMotes(count = 140) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  const seed = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 1.8;
    pos[i * 3 + 1] = Math.random() * 1.4;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 1.4;
    seed[i] = Math.random();
  }
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("seed", new THREE.BufferAttribute(seed, 1));
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { uTime: { value: 0 }, uPixel: { value: 1 }, uOpacity: { value: 1 } },
    vertexShader: /* glsl */ `
      attribute float seed;
      uniform float uTime;
      uniform float uPixel;
      varying float vAlpha;
      void main() {
        vec3 p = position;
        float t = uTime * (0.03 + seed * 0.04);
        p.y = mod(p.y + t, 1.4);
        p.x += sin(uTime * 0.2 + seed * 40.0) * 0.06;
        p.z += cos(uTime * 0.17 + seed * 30.0) * 0.05;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = (0.012 + seed * 0.022) * uPixel * (1.0 / -mv.z);
        vAlpha = smoothstep(0.0, 0.25, p.y) * smoothstep(1.4, 1.0, p.y) * (0.25 + 0.5 * seed);
      }`,
    fragmentShader: /* glsl */ `
      uniform float uOpacity;
      varying float vAlpha;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.0, d) * vAlpha * uOpacity;
        gl_FragColor = vec4(1.0, 0.93, 0.8, a);
      }`,
  });
  return new THREE.Points(geo, mat);
}
