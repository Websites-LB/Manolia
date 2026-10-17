import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

import * as G from "./geometry";

export type Container = "vase" | "wrap" | "box";

export type Recipe = {
  /** One colour per stem. */
  roses?: string[];
  peonies?: string[];
  hydrangeas?: string[];
  /** Baby's breath clusters. */
  babys?: number;
  /** Eucalyptus sprays spilling over the rim. */
  eucalyptus?: number;
  container: Container;
  seed?: number;
};

/* ------------------------------------------------------------------ helpers */

const Y = new THREE.Vector3(0, 1, 0);
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smooth = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

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

const _m = new THREE.Matrix4();
const _m2 = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _q2 = new THREE.Quaternion();
const _e = new THREE.Euler(0, 0, 0, "YXZ");
const _p = new THREE.Vector3();
const _t = new THREE.Vector3();
const _s = new THREE.Vector3();
const _c = new THREE.Color();
const _morph = { morphTargetInfluences: [0] } as unknown as THREE.Mesh;

/* ---------------------------------------------------------- shared assets */

let shared: ReturnType<typeof createShared> | null = null;

function createShared() {
  const petal = new THREE.MeshPhysicalMaterial({
    vertexColors: true,
    side: THREE.DoubleSide,
    roughness: 0.6,
    sheen: 1,
    sheenRoughness: 0.42,
    sheenColor: new THREE.Color(0.42, 0.36, 0.36),
  });
  // Cheap subsurface: petals glow faintly with their own colour, so they read as thin and lit-through.
  petal.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <emissivemap_fragment>",
      "#include <emissivemap_fragment>\ntotalEmissiveRadiance += diffuseColor.rgb * 0.1;",
    );
  };

  return {
    geo: {
      rose: G.rosePetal(),
      peony: G.peonyPetal(),
      floret: G.floretPetal(),
      sepal: G.sepal(),
      leaf: G.roseLeaf(),
      euc: G.eucalyptusLeaf(),
      baby: G.babysFloret(),
    },
    mat: {
      petal,
      leaf: new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.5 }),
      euc: new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.78 }),
      stem: new THREE.MeshStandardMaterial({ color: "#6b8650", roughness: 0.58 }),
      twig: new THREE.MeshStandardMaterial({ color: "#7d8c5a", roughness: 0.8 }),
      baby: new THREE.MeshStandardMaterial({ color: "#fbf8ef", roughness: 0.75, emissive: "#fffaf0", emissiveIntensity: 0.06 }),
      kraft: new THREE.MeshStandardMaterial({ color: "#c7a57d", roughness: 0.92, side: THREE.DoubleSide }),
      tissue: new THREE.MeshStandardMaterial({ color: "#f1e9dc", roughness: 0.85, side: THREE.DoubleSide }),
      ribbon: new THREE.MeshPhysicalMaterial({ color: "#2f4630", roughness: 0.32, sheen: 1, sheenColor: new THREE.Color("#6f8f6a") }),
      box: new THREE.MeshPhysicalMaterial({ color: "#2e412c", roughness: 0.42, clearcoat: 0.35, clearcoatRoughness: 0.5 }),
      gold: new THREE.MeshStandardMaterial({ color: "#c9a96b", metalness: 1, roughness: 0.28 }),
    },
  };
}

function getShared() {
  return (shared ??= createShared());
}

let vasePromise: Promise<THREE.Object3D> | null = null;
/** Poly Haven "Antique Ceramic Vase 01" (CC0). */
export function loadVase() {
  vasePromise ??= new GLTFLoader().loadAsync("/models/vase/vase.gltf").then((g) => {
    g.scene.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });
    return g.scene;
  });
  return vasePromise;
}

/* ----------------------------------------------------------------- stems */

class Stem {
  pivot = new THREE.Object3D();
  curve: THREE.CatmullRomCurve3;
  mesh: THREE.Mesh;
  grow = 0;
  private segs: number;
  private radial: number;

  constructor(
    points: THREE.Vector3[],
    origin: THREE.Vector3,
    radius: number,
    material: THREE.Material,
    readonly delay: number,
    readonly phase: number,
    readonly sway: number,
  ) {
    this.pivot.position.copy(origin);
    this.curve = new THREE.CatmullRomCurve3(points.map((p) => p.clone().sub(origin)), false, "centripetal");
    this.segs = 48;
    this.radial = 6;
    this.mesh = new THREE.Mesh(new THREE.TubeGeometry(this.curve, this.segs, radius, this.radial, false), material);
    this.mesh.castShadow = true;
    this.pivot.add(this.mesh);
  }

  update(time: number, grow: number) {
    this.grow = easeOut(clamp01((grow - this.delay) / 0.62));
    const count = Math.floor(this.grow * this.segs) * this.radial * 6;
    this.mesh.geometry.setDrawRange(0, count);
    this.mesh.visible = count > 0;
    const a = this.sway * this.grow;
    this.pivot.rotation.set(Math.sin(time * 0.62 + this.phase) * 0.02 * a, 0, Math.sin(time * 0.47 + this.phase * 1.7) * 0.022 * a);
    this.pivot.updateMatrix();
  }

  /** Writes the matrix of a frame riding the stem at arc-length s (its Y axis along the stem). */
  frameAt(out: THREE.Matrix4, s: number, spin: number, scale: number) {
    const u = Math.min(0.9999, Math.max(0.0001, s));
    this.curve.getPointAt(u, _p);
    this.curve.getTangentAt(u, _t);
    _q.setFromUnitVectors(Y, _t);
    _q2.setFromAxisAngle(Y, spin);
    _q.multiply(_q2);
    out.compose(_p, _q, _s.setScalar(scale));
    return out.premultiply(this.pivot.matrix);
  }
}

/* --------------------------------------------------------------- flowers */

type PetalSpec = { theta: number; t: number };
type Kind = "rose" | "peony" | "hydrangea";

type Head = {
  kind: Kind;
  stem: Stem;
  color: THREE.Color;
  delay: number;
  size: number;
  spin: number;
  start: number; // first instance index in its petal mesh
  sepalStart: number;
  petals: PetalSpec[];
  florets?: { q: THREE.Quaternion; p: THREE.Vector3; spin: number; delay: number; tint: THREE.Color }[];
};

type Leaf = { stem: Stem; s: number; side: number; size: number; tilt: number };
type Cluster = { stem: Stem; florets: THREE.Vector3[]; sizes: number[]; start: number; twigs: THREE.Mesh };

const ROSE_PETALS = 26;
const PEONY_PETALS = 58;
const FLORETS = 84;

const LAYOUT: Record<Container, { center: THREE.Vector3; radius: number; cap: number; focus: number; mouth: THREE.Vector3; base: number; mouthSpread: number }> = {
  vase: { center: new THREE.Vector3(0, 0.5, 0), radius: 0.21, cap: 1.38, focus: 0.3, mouth: new THREE.Vector3(0, 0.43, 0), base: 0.22, mouthSpread: 0.028 },
  wrap: { center: new THREE.Vector3(0, 0.34, 0), radius: 0.2, cap: 1.3, focus: 0.3, mouth: new THREE.Vector3(0, 0.08, 0), base: -0.08, mouthSpread: 0.012 },
  box: { center: new THREE.Vector3(0, -0.22, 0), radius: 0.4, cap: 0.34, focus: 0.8, mouth: new THREE.Vector3(0, 0.05, 0), base: 0.0, mouthSpread: 0.05 },
};

export class Bouquet {
  readonly root = new THREE.Group();
  private stems: Stem[] = [];
  private heads: Head[] = [];
  private leaves: Leaf[] = [];
  private eucLeaves: Leaf[] = [];
  private clusters: Cluster[] = [];
  private meshes: Record<string, THREE.InstancedMesh> = {};
  private disposables: THREE.BufferGeometry[] = [];
  readonly ready: Promise<void>;

  constructor(readonly recipe: Recipe) {
    const rand = rng(recipe.seed ?? 7);
    const S = getShared();
    const L = LAYOUT[recipe.container];

    /* main blooms placed on a spherical cap (Fibonacci), largest heads toward the rim */
    const kinds: { kind: Kind; color: string }[] = [
      ...(recipe.roses ?? []).map((color) => ({ kind: "rose" as const, color })),
      ...(recipe.peonies ?? []).map((color) => ({ kind: "peony" as const, color })),
      ...(recipe.hydrangeas ?? []).map((color) => ({ kind: "hydrangea" as const, color })),
    ];
    for (let i = kinds.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [kinds[i], kinds[j]] = [kinds[j], kinds[i]];
    }
    const n = kinds.length;
    const golden = Math.PI * (3 - Math.sqrt(5));
    const focus = L.center.clone().add(new THREE.Vector3(0, -L.focus, 0));

    let rosePetals = 0, peonyPetals = 0, florets = 0, sepals = 0;
    kinds.forEach((k, i) => {
      const cosT = 1 - ((i + 0.5) / n) * (1 - Math.cos(L.cap));
      const sinT = Math.sqrt(1 - cosT * cosT);
      const phi = i * golden + rand() * 0.3;
      const bump = k.kind === "hydrangea" ? 0.02 : k.kind === "peony" ? 0.01 : 0;
      const head = new THREE.Vector3(sinT * Math.cos(phi), cosT, sinT * Math.sin(phi)).multiplyScalar(L.radius + bump + rand() * 0.015).add(L.center);
      const dir = head.clone().sub(focus).normalize();
      const stem = this.addStem(head, dir, L, rand, 0.0024, S.mat.stem, (1 - cosT) * 0.18 + rand() * 0.08);

      const size = k.kind === "rose" ? 0.056 : k.kind === "peony" ? 0.072 : 0.085;
      const h: Head = {
        kind: k.kind,
        stem,
        color: new THREE.Color(k.color),
        delay: rand() * 0.25,
        size: size * (0.92 + rand() * 0.16),
        spin: rand() * Math.PI * 2,
        start: 0,
        sepalStart: 0,
        petals: [],
      };
      if (k.kind === "rose") {
        h.start = rosePetals;
        h.sepalStart = sepals;
        rosePetals += ROSE_PETALS;
        sepals += 5;
        h.petals = Array.from({ length: ROSE_PETALS }, (_, j) => ({ theta: j * 2.39996 + rand() * 0.25, t: j / (ROSE_PETALS - 1) }));
        // two leaflets per rose stem
        this.leaves.push({ stem, s: 0.62 + rand() * 0.1, side: rand() * Math.PI * 2, size: 0.03 + rand() * 0.008, tilt: 0.75 + rand() * 0.3 });
      } else if (k.kind === "peony") {
        h.start = peonyPetals;
        peonyPetals += PEONY_PETALS;
        h.petals = Array.from({ length: PEONY_PETALS }, (_, j) => ({ theta: j * 2.39996 + rand() * 0.4, t: j / (PEONY_PETALS - 1) }));
        this.leaves.push({ stem, s: 0.6 + rand() * 0.1, side: rand() * Math.PI * 2, size: 0.036, tilt: 0.8 });
      } else {
        h.start = florets;
        florets += FLORETS * 4;
        h.florets = Array.from({ length: FLORETS }, (_, j) => {
          const c = 1 - ((j + 0.5) / FLORETS) * (1 - Math.cos(1.95));
          const s = Math.sqrt(1 - c * c);
          const a = j * golden;
          const nrm = new THREE.Vector3(s * Math.cos(a), c, s * Math.sin(a));
          return {
            q: new THREE.Quaternion().setFromUnitVectors(Y, nrm),
            p: nrm.clone().multiplyScalar(0.62 + rand() * 0.06).add(new THREE.Vector3(0, 0.35, 0)),
            spin: rand() * Math.PI,
            delay: rand() * 0.45,
            // hydrangea florets drift from deep to washed-out within one head
            tint: new THREE.Color(k.color).lerp(new THREE.Color("#ffffff"), rand() * 0.4).offsetHSL((rand() - 0.5) * 0.04, 0, (rand() - 0.5) * 0.06),
          };
        });
      }
      this.heads.push(h);
    });

    /* eucalyptus sprays arc out low over the rim */
    for (let i = 0; i < (recipe.eucalyptus ?? 0); i++) {
      const a = (i / (recipe.eucalyptus ?? 1)) * Math.PI * 2 + rand() * 0.6;
      const out = new THREE.Vector3(Math.cos(a), 0, Math.sin(a));
      const reach = recipe.container === "box" ? 0.2 : 0.3;
      const lift = recipe.container === "box" ? 0.12 : 0.1;
      // hand-tied: sprays leave the tie point and fan out above the paper, not from under it
      const from = recipe.container === "wrap" ? new THREE.Vector3(0, 0.3, 0) : L.mouth;
      const m = from.clone().add(out.clone().multiplyScalar(L.mouthSpread * 0.6));
      const pts = [
        new THREE.Vector3(m.x * 0.3, L.base, m.z * 0.3),
        ...(recipe.container === "wrap" ? [L.mouth.clone()] : []),
        m,
        m.clone().add(out.clone().multiplyScalar(reach * 0.4)).add(new THREE.Vector3(0, lift + 0.05, 0)),
        m.clone().add(out.clone().multiplyScalar(reach * 0.85)).add(new THREE.Vector3(0, lift * 0.5, 0)),
        m.clone().add(out.clone().multiplyScalar(reach)).add(new THREE.Vector3(0, -0.02 - rand() * 0.04, 0)),
      ];
      const stem = new Stem(pts, m, 0.0022, S.mat.twig, 0.12 + rand() * 0.2, rand() * 10, 1.6);
      this.stems.push(stem);
      this.root.add(stem.pivot);
      for (let s = 0.36; s < 0.99; s += 0.055) {
        for (const side of [0, Math.PI]) {
          this.eucLeaves.push({ stem, s, side: side + s * 9, size: 0.036 * (1.15 - s * 0.6) * (0.85 + rand() * 0.3), tilt: 0.95 });
        }
      }
    }

    /* baby's breath: airy clusters on an outer shell, between the blooms */
    let babyCount = 0;
    for (let i = 0; i < (recipe.babys ?? 0); i++) {
      const cosT = 1 - ((i + 0.5) / (recipe.babys ?? 1)) * (1 - Math.cos(L.cap * 1.08));
      const sinT = Math.sqrt(1 - cosT * cosT);
      const phi = i * golden + 1.3 + rand() * 0.4;
      const tip = new THREE.Vector3(sinT * Math.cos(phi), cosT, sinT * Math.sin(phi)).multiplyScalar(L.radius * 1.14).add(L.center);
      const dir = tip.clone().sub(focus).normalize();
      const stem = this.addStem(tip, dir, L, rand, 0.0014, S.mat.twig, 0.25 + rand() * 0.15);

      const florets: THREE.Vector3[] = [];
      const sizes: number[] = [];
      const twigGeos: THREE.BufferGeometry[] = [];
      for (let b = 0; b < 6; b++) {
        const a = (b / 6) * Math.PI * 2 + rand();
        const sub = new THREE.Vector3(Math.cos(a) * (0.022 + rand() * 0.018), 0.012 + rand() * 0.03, Math.sin(a) * (0.022 + rand() * 0.018));
        twigGeos.push(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(new THREE.Vector3(), new THREE.Vector3(sub.x * 0.2, sub.y * 0.8, sub.z * 0.2), sub), 6, 0.0007, 3));
        for (let f = 0; f < 9; f++) {
          const o = new THREE.Vector3(rand() - 0.5, rand() * 0.6, rand() - 0.5).normalize().multiplyScalar(0.006 + rand() * 0.012);
          florets.push(sub.clone().add(o));
          sizes.push(0.0026 + rand() * 0.0014);
        }
      }
      const merged = mergeGeometries(twigGeos)!;
      twigGeos.forEach((g) => g.dispose());
      this.disposables.push(merged);
      const twigs = new THREE.Mesh(merged, S.mat.twig);
      twigs.matrixAutoUpdate = false;
      this.root.add(twigs);
      this.clusters.push({ stem, florets, sizes, start: babyCount, twigs });
      babyCount += florets.length;
    }

    /* instanced draw calls: one per surface type */
    const inst = (key: string, geo: THREE.BufferGeometry, mat: THREE.Material, count: number) => {
      if (!count) return;
      const m = new THREE.InstancedMesh(geo, mat, count);
      m.castShadow = true;
      m.receiveShadow = true;
      m.frustumCulled = false;
      m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      this.meshes[key] = m;
      this.root.add(m);
    };
    inst("rose", S.geo.rose, S.mat.petal, rosePetals);
    inst("peony", S.geo.peony, S.mat.petal, peonyPetals);
    inst("floret", S.geo.floret, S.mat.petal, florets);
    inst("sepal", S.geo.sepal, S.mat.leaf, sepals);
    inst("leaf", S.geo.leaf, S.mat.leaf, this.leaves.length);
    inst("euc", S.geo.euc, S.mat.euc, this.eucLeaves.length);
    inst("baby", S.geo.baby, S.mat.baby, babyCount);

    this.paintStatic(rand);
    this.ready = this.addContainer(recipe.container);
  }

  private addStem(head: THREE.Vector3, dir: THREE.Vector3, L: (typeof LAYOUT)[Container], rand: () => number, radius: number, mat: THREE.Material, delay: number) {
    const flat = new THREE.Vector3(head.x - L.mouth.x, 0, head.z - L.mouth.z);
    const spread = flat.lengthSq() > 1e-6 ? flat.normalize() : new THREE.Vector3(1, 0, 0);
    const mouth = L.mouth.clone().add(spread.clone().multiplyScalar(L.mouthSpread * (0.4 + rand() * 0.6)));
    const base = new THREE.Vector3(mouth.x * 0.25 + (rand() - 0.5) * 0.02, L.base, mouth.z * 0.25 + (rand() - 0.5) * 0.02);
    const pre = head.clone().addScaledVector(dir, -0.09);
    const mid = mouth.clone().lerp(pre, 0.5).add(new THREE.Vector3((rand() - 0.5) * 0.02, 0, (rand() - 0.5) * 0.02));
    const stem = new Stem([base, mouth, mid, pre, head], mouth, radius, mat, delay, rand() * 10, 1);
    this.stems.push(stem);
    this.root.add(stem.pivot);
    return stem;
  }

  private paintStatic(rand: () => number) {
    const sepal = this.meshes.sepal;
    if (sepal) for (let i = 0; i < sepal.count; i++) sepal.setColorAt(i, _c.set("#5c7843"));
    const leaf = this.meshes.leaf;
    if (leaf) this.leaves.forEach((_, i) => leaf.setColorAt(i, _c.set("#3f5b33").offsetHSL(0, 0, (rand() - 0.5) * 0.06)));
    const euc = this.meshes.euc;
    if (euc) this.eucLeaves.forEach((_, i) => euc.setColorAt(i, _c.set("#8ea596").offsetHSL((rand() - 0.5) * 0.02, 0, (rand() - 0.5) * 0.08)));
    const baby = this.meshes.baby;
    if (baby) for (let i = 0; i < baby.count; i++) baby.setColorAt(i, _c.set("#fffdf6").offsetHSL(0, 0, -rand() * 0.06));
    for (const h of this.heads) {
      if (h.kind === "hydrangea") continue;
      const mesh = this.meshes[h.kind];
      h.petals.forEach((p, j) => {
        // inner petals a touch deeper; every petal slightly different
        _c.copy(h.color).offsetHSL((rand() - 0.5) * 0.015, 0, -0.07 * (1 - p.t) + (rand() - 0.5) * 0.04);
        mesh.setColorAt(h.start + j, _c);
      });
    }
  }

  private async addContainer(container: Container) {
    const S = getShared();
    if (container === "vase") {
      const vase = (await loadVase()).clone();
      this.root.add(vase);
    } else if (container === "wrap") {
      const lathe = (pts: [number, number][], mat: THREE.Material, wave: number) => {
        const g = new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), 64);
        const pos = g.getAttribute("position");
        for (let i = 0; i < pos.count; i++) {
          const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
          const a = Math.atan2(z, x);
          const k = Math.max(0, y - 0.1);
          // folded paper: soft pleats that grow toward the rim, and a lifted front
          const pleat = 1 + 0.06 * Math.sin(a * 7) * k * 3;
          pos.setXYZ(i, x * pleat, y + wave * Math.sin(a * 3 + 1) * k * 2 - 0.08 * Math.max(0, Math.cos(a - 1.3)) * k * 1.5, z * pleat);
        }
        g.computeVertexNormals();
        this.disposables.push(g);
        const m = new THREE.Mesh(g, mat);
        m.castShadow = m.receiveShadow = true;
        this.root.add(m);
      };
      lathe([[0.022, 0.0], [0.034, 0.05], [0.07, 0.12], [0.14, 0.21], [0.22, 0.3], [0.255, 0.335]], S.mat.kraft, 0.035);
      lathe([[0.03, 0.06], [0.065, 0.13], [0.13, 0.22], [0.2, 0.32], [0.235, 0.37]], S.mat.tissue, 0.04);
      const tie = new THREE.Mesh(new THREE.TorusGeometry(0.036, 0.007, 12, 48), S.mat.ribbon);
      tie.rotation.x = Math.PI / 2;
      tie.position.y = 0.06;
      tie.castShadow = true;
      this.disposables.push(tie.geometry);
      this.root.add(tie);
      for (const side of [-1, 1]) {
        const tail = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.1, 0.002), S.mat.ribbon);
        tail.position.set(side * 0.018, 0.02, 0.04);
        tail.rotation.set(0.25, 0, side * 0.35);
        tail.castShadow = true;
        this.disposables.push(tail.geometry);
        this.root.add(tail);
      }
    } else {
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.15, 96, 1, true), S.mat.box);
      body.position.y = 0.075;
      const bottom = new THREE.Mesh(new THREE.CircleGeometry(0.17, 64), S.mat.box);
      bottom.rotation.x = -Math.PI / 2;
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.004, 10, 128), S.mat.gold);
      rim.rotation.x = Math.PI / 2;
      rim.position.y = 0.15;
      const band = new THREE.Mesh(new THREE.CylinderGeometry(0.1712, 0.1712, 0.012, 96, 1, true), S.mat.gold);
      band.position.y = 0.03;
      for (const m of [body, bottom, rim, band]) {
        m.castShadow = m.receiveShadow = true;
        this.disposables.push(m.geometry);
        this.root.add(m);
      }
    }
  }

  /**
   * @param grow  0 → bare container, 1 → every stem fully grown
   * @param bloom 0 → tight buds, 1 → full bloom
   */
  update(time: number, grow: number, bloom: number) {
    for (const s of this.stems) s.update(time, grow);

    const M = this.meshes;
    const head = _m2;

    for (const h of this.heads) {
      const g = h.stem.grow;
      const appear = smooth(0.72, 1, g);
      const b = easeOut(clamp01((bloom - h.delay) / 0.7)) * appear;
      const breathe = Math.sin(time * 0.9 + h.spin * 3) * 0.025;
      // buds are small and swell as they open
      const swell = h.kind === "hydrangea" ? 0.7 + 0.3 * b : 0.5 + 0.5 * b;
      h.stem.frameAt(head, g, h.spin, h.size * swell * Math.max(appear, 0.0001));

      if (h.kind === "rose" || h.kind === "peony") {
        const mesh = M[h.kind];
        const rose = h.kind === "rose";
        h.petals.forEach((p, j) => {
          const t = p.t;
          const pb = easeOut(clamp01((b - (1 - t) * 0.3) / 0.7));
          const len = rose ? 0.42 + 0.62 * t : 0.36 + 0.66 * t;
          const wid = rose ? 0.55 + 0.65 * t : 0.62 + 0.72 * t;
          const r = rose ? THREE.MathUtils.lerp(0.01 + 0.035 * t, 0.03 + 0.15 * t, pb) : THREE.MathUtils.lerp(0.01 + 0.06 * t, 0.02 + 0.14 * t, pb);
          const tilt = rose
            ? THREE.MathUtils.lerp(-0.22 + 0.16 * t, 0.12 + 1.38 * Math.pow(t, 1.4), pb) + breathe * t
            : THREE.MathUtils.lerp(-0.2 + 0.18 * t, 0.18 + 1.05 * Math.pow(t, 1.25), pb) + breathe * t;
          _e.set(tilt, p.theta, 0);
          _q.setFromEuler(_e);
          _p.set(Math.sin(p.theta) * r, -0.06 * t * pb, Math.cos(p.theta) * r);
          _m.compose(_p, _q, _s.set(wid, len, wid)).premultiply(head);
          mesh.setMatrixAt(h.start + j, _m);
          _morph.morphTargetInfluences![0] = clamp01(pb * (rose ? 0.2 + 0.8 * t : 0.3 + 0.7 * t) + breathe);
          mesh.setMorphAt(h.start + j, _morph);
        });
        if (rose) {
          for (let k = 0; k < 5; k++) {
            const th = (k / 5) * Math.PI * 2;
            _e.set(THREE.MathUtils.lerp(0.25, 2.1, b), th, 0);
            _q.setFromEuler(_e);
            _p.set(Math.sin(th) * 0.03, -0.02, Math.cos(th) * 0.03);
            _m.compose(_p, _q, _s.set(0.55, 0.62, 0.55)).premultiply(head);
            M.sepal.setMatrixAt(h.sepalStart + k, _m);
            _morph.morphTargetInfluences![0] = b;
            M.sepal.setMorphAt(h.sepalStart + k, _morph);
          }
        }
      } else {
        const mesh = M.floret;
        h.florets!.forEach((f, j) => {
          const fb = easeOut(clamp01((b - f.delay * 0.6) / 0.55));
          _c.set("#b7c89a").lerp(f.tint, fb);
          for (let k = 0; k < 4; k++) {
            const i = h.start + j * 4 + k;
            _e.set(Math.PI / 2 - THREE.MathUtils.lerp(0.9, 0.22, fb), f.spin + (k * Math.PI) / 2, 0);
            _q2.setFromEuler(_e);
            _q.copy(f.q).multiply(_q2);
            const fs = 0.165 * (0.35 + 0.65 * fb);
            _m.compose(f.p, _q, _s.set(fs, fs, fs)).premultiply(head);
            mesh.setMatrixAt(i, _m);
            _morph.morphTargetInfluences![0] = fb;
            mesh.setMorphAt(i, _morph);
            mesh.setColorAt(i, _c);
          }
        });
      }
    }

    const leafPass = (list: Leaf[], mesh: THREE.InstancedMesh | undefined, unfurlLen: number) => {
      if (!mesh) return;
      list.forEach((l, i) => {
        const open = smooth(l.s, l.s + unfurlLen, l.stem.grow);
        const flutter = Math.sin(time * 1.3 + l.side * 5) * 0.06;
        l.stem.frameAt(head, l.s, l.side, 1);
        _e.set(l.tilt * open + flutter, 0, 0);
        _q.setFromEuler(_e);
        _m.compose(_p.set(0, 0, 0), _q, _s.setScalar(l.size * Math.max(open, 0.0001))).premultiply(head);
        mesh.setMatrixAt(i, _m);
        _morph.morphTargetInfluences![0] = open;
        mesh.setMorphAt(i, _morph);
      });
    };
    leafPass(this.leaves, M.leaf, 0.18);
    leafPass(this.eucLeaves, M.euc, 0.12);

    for (const c of this.clusters) {
      const pop = smooth(0.8, 1, c.stem.grow) * smooth(0.25, 0.75, bloom + 0.15);
      c.stem.frameAt(head, c.stem.grow, 0, Math.max(pop, 0.0001));
      c.twigs.matrix.copy(head);
      c.twigs.visible = pop > 0.01;
      c.florets.forEach((p, j) => {
        const twinkle = 1 + Math.sin(time * 2 + j) * 0.04;
        _m.compose(p, _q.identity(), _s.setScalar(c.sizes[j] * twinkle)).premultiply(head);
        M.baby.setMatrixAt(c.start + j, _m);
      });
    }

    for (const mesh of Object.values(M)) {
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      if (mesh.morphTexture) mesh.morphTexture.needsUpdate = true;
    }
  }

  dispose() {
    for (const s of this.stems) s.mesh.geometry.dispose();
    for (const m of Object.values(this.meshes)) m.dispose();
    for (const g of this.disposables) g.dispose();
    this.root.removeFromParent();
  }
}
