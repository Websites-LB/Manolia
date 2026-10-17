import * as THREE from "three";

import { lilyPad, lilyPetal, smooth } from "./geometry";

export type Palette = {
  /** Colour toward the petal tips. */
  tip: string;
  /** Pale colour at the petal base. */
  base: string;
};

/* rings from the heart outward: [count, length, width, radius closed, radius open, tilt closed, tilt open] */
const RINGS: [number, number, number, number, number, number, number][] = [
  [7, 0.058, 0.85, 0.004, 0.012, -0.14, 0.42],
  [9, 0.072, 0.95, 0.007, 0.018, -0.1, 0.78],
  [11, 0.086, 1.0, 0.01, 0.024, -0.06, 1.1],
  [13, 0.098, 1.05, 0.013, 0.03, -0.02, 1.36],
];
const STAMENS = 72;

const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler(0, 0, 0, "YXZ");
const _p = new THREE.Vector3();
const _s = new THREE.Vector3();
const _up = new THREE.Vector3();
const _morph = { morphTargetInfluences: [0] } as unknown as THREE.Mesh;

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * A single water lily on its pads. One draw call for every petal; colour is two uniforms (tip, base)
 * so the whole flower can drift from one palette to the next without rebuilding anything.
 */
export class WaterLily {
  readonly root = new THREE.Group();
  private head = new THREE.Group();
  private petals: THREE.InstancedMesh;
  private stamens: THREE.InstancedMesh;
  private anthers: THREE.InstancedMesh;
  private specs: { ring: number; theta: number; jitter: number; phase: number }[] = [];
  private stamenSpecs: { theta: number; r: number; len: number; lean: number }[] = [];
  private uniforms = {
    uTip: { value: new THREE.Color() },
    uBase: { value: new THREE.Color() },
  };
  private disposables: { dispose(): void }[] = [];

  constructor(seed = 4) {
    const rand = rng(seed);

    /* petals: soft, faintly lit-through, veined, shading from a pale heart to the coloured tip */
    const petalMat = new THREE.MeshPhysicalMaterial({
      side: THREE.DoubleSide,
      roughness: 0.52,
      sheen: 1,
      sheenRoughness: 0.4,
      sheenColor: new THREE.Color(0.55, 0.5, 0.5),
    });
    petalMat.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, this.uniforms);
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", "#include <common>\nvarying vec2 vPetal;")
        .replace("#include <begin_vertex>", "#include <begin_vertex>\nvPetal = uv;");
      shader.fragmentShader = shader.fragmentShader
        .replace("#include <common>", "#include <common>\nvarying vec2 vPetal;\nuniform vec3 uTip;\nuniform vec3 uBase;")
        .replace(
          "#include <color_fragment>",
          `#include <color_fragment>
          float along = smoothstep(0.04, 0.92, vPetal.y);
          vec3 petal = mix(uBase, uTip, along * along * (0.6 + 0.4 * along));
          // fine longitudinal veins, fading toward the tip
          float vein = pow(abs(sin(vPetal.x * 3.14159 * 11.0)), 10.0) * (1.0 - vPetal.y) * 0.06;
          // a slightly deeper midrib
          float rib = exp(-pow((vPetal.x - 0.5) * 14.0, 2.0)) * 0.05;
          diffuseColor.rgb *= petal * (1.0 - vein - rib);`,
        )
        .replace(
          "#include <emissivemap_fragment>",
          "#include <emissivemap_fragment>\ntotalEmissiveRadiance += diffuseColor.rgb * 0.14;",
        );
    };

    const geo = lilyPetal();
    const count = RINGS.reduce((n, r) => n + r[0], 0);
    this.petals = new THREE.InstancedMesh(geo, petalMat, count);
    this.petals.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.petals.castShadow = true;
    this.petals.frustumCulled = false;
    RINGS.forEach(([n], ring) => {
      const offset = ring * 0.37 + rand();
      for (let i = 0; i < n; i++) {
        this.specs.push({ ring, theta: offset + (i / n) * Math.PI * 2 + (rand() - 0.5) * 0.12, jitter: rand(), phase: rand() * 6.28 });
        // each petal a hair different in value, like real ones
        this.petals.setColorAt(this.specs.length - 1, new THREE.Color().setScalar(0.93 + rand() * 0.07));
      }
    });
    this.head.add(this.petals);
    this.disposables.push(geo, petalMat);

    /* golden heart: receptacle, then a crown of stamens that spreads as the flower opens */
    const receptacleMat = new THREE.MeshStandardMaterial({ color: "#d9cf6b", roughness: 0.6, emissive: "#3a3510", emissiveIntensity: 0.4 });
    const receptacle = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.009, 0.012, 32), receptacleMat);
    receptacle.position.y = 0.006;
    this.head.add(receptacle);
    const stamenMat = new THREE.MeshStandardMaterial({ color: "#f0c24f", roughness: 0.55, emissive: "#6b4a00", emissiveIntensity: 0.25 });
    const antherMat = new THREE.MeshStandardMaterial({ color: "#e7a72e", roughness: 0.5, emissive: "#5a3400", emissiveIntensity: 0.3 });
    const stamenGeo = new THREE.CylinderGeometry(0.0009, 0.0012, 1, 5).translate(0, 0.5, 0);
    const antherGeo = new THREE.SphereGeometry(1, 8, 6);
    this.stamens = new THREE.InstancedMesh(stamenGeo, stamenMat, STAMENS);
    this.anthers = new THREE.InstancedMesh(antherGeo, antherMat, STAMENS);
    for (let i = 0; i < STAMENS; i++) {
      this.stamenSpecs.push({ theta: i * 2.39996, r: 0.011 + rand() * 0.005, len: 0.016 + rand() * 0.008, lean: 0.25 + rand() * 0.35 });
    }
    this.head.add(this.stamens, this.anthers);
    this.disposables.push(receptacle.geometry, receptacleMat, stamenGeo, stamenMat, antherGeo, antherMat);

    this.head.position.y = 0.012;
    this.root.add(this.head);

    /* pads, floating around and slightly under the bloom */
    const padMat = new THREE.MeshStandardMaterial({ color: "#6e8a5a", roughness: 0.5, side: THREE.DoubleSide });
    padMat.onBeforeCompile = (shader) => {
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", "#include <common>\nvarying vec2 vPad;")
        .replace("#include <begin_vertex>", "#include <begin_vertex>\nvPad = position.xz;");
      shader.fragmentShader = shader.fragmentShader
        .replace("#include <common>", "#include <common>\nvarying vec2 vPad;")
        .replace(
          "#include <color_fragment>",
          `#include <color_fragment>
          float ang = atan(vPad.y, vPad.x);
          float rad = length(vPad);
          float veins = pow(abs(sin(ang * 14.0)), 24.0) * smoothstep(0.004, 0.03, rad) * 0.1;
          diffuseColor.rgb *= (1.0 + veins) * (0.9 + 0.1 * smoothstep(0.0, 0.12, rad));`,
        );
    };
    // small and close: they frame the bloom without competing with it
    const pads: [number, number, number, number][] = [
      [0.105, 0.0, -0.035, 0.4],
      [0.062, 0.135, 0.02, 2.2],
      [0.05, -0.118, 0.06, 4.1],
    ];
    for (const [r, x, z, rot] of pads) {
      const g = lilyPad(r, rot);
      const m = new THREE.Mesh(g, padMat);
      m.position.set(x, -0.004, z);
      m.rotation.y = rot;
      m.receiveShadow = true;
      m.castShadow = true;
      this.root.add(m);
      this.disposables.push(g);
    }
    this.disposables.push(padMat);
  }

  setPalette(tip: THREE.Color, base: THREE.Color) {
    this.uniforms.uTip.value.copy(tip);
    this.uniforms.uBase.value.copy(base);
  }

  /** @param open 0 → tight bud, 1 → fully open */
  update(time: number, open: number) {
    this.specs.forEach((s, i) => {
      const [, len, wid, r0, r1, t0, t1] = RINGS[s.ring];
      // outer rings lead, the heart follows: the bloom unfurls from the outside in
      const lead = (3 - s.ring) * 0.12;
      const o = smooth(0, 1, (open + lead * open - s.ring * 0.04) / (1 + lead * 0.6));
      const breathe = Math.sin(time * 0.8 + s.phase) * 0.018 * (0.4 + o);
      const tilt = THREE.MathUtils.lerp(t0, t1 + s.jitter * 0.08, o) + breathe;
      const r = THREE.MathUtils.lerp(r0, r1, o);
      _e.set(tilt, s.theta, 0);
      _q.setFromEuler(_e);
      _p.set(Math.sin(s.theta) * r, 0, Math.cos(s.theta) * r);
      const size = len * (0.94 + s.jitter * 0.12);
      _m.compose(_p, _q, _s.set(size * wid, size, size * wid));
      this.petals.setMatrixAt(i, _m);
      _morph.morphTargetInfluences![0] = o;
      this.petals.setMorphAt(i, _morph);
    });
    this.petals.instanceMatrix.needsUpdate = true;
    if (this.petals.morphTexture) this.petals.morphTexture.needsUpdate = true;

    const crown = smooth(0.35, 1, open);
    this.stamenSpecs.forEach((s, i) => {
      _e.set(s.lean * crown + 0.05, s.theta, 0);
      _q.setFromEuler(_e);
      _p.set(Math.sin(s.theta) * s.r * (0.6 + 0.4 * crown), 0.01, Math.cos(s.theta) * s.r * (0.6 + 0.4 * crown));
      const len = s.len * (0.4 + 0.6 * crown);
      _m.compose(_p, _q, _s.set(1, len, 1));
      this.stamens.setMatrixAt(i, _m);
      // anther sits at the stamen tip
      _p.add(_up.set(0, len, 0).applyQuaternion(_q));
      _m.compose(_p, _q, _s.set(0.0018, 0.003, 0.0018).multiplyScalar(0.5 + 0.5 * crown));
      this.anthers.setMatrixAt(i, _m);
    });
    this.stamens.instanceMatrix.needsUpdate = true;
    this.anthers.instanceMatrix.needsUpdate = true;

    // the bloom drifts and turns ever so slightly on the water
    this.head.rotation.set(Math.sin(time * 0.31) * 0.02, time * 0.025, Math.cos(time * 0.27) * 0.02);
    this.root.position.y = Math.sin(time * 0.6) * 0.0015;
  }

  dispose() {
    this.petals.dispose();
    this.stamens.dispose();
    this.anthers.dispose();
    for (const d of this.disposables) d.dispose();
    this.root.removeFromParent();
  }
}
