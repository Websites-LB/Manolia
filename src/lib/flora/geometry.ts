import * as THREE from "three";

/**
 * Petal / leaf surfaces are a (u, v) grid: u ∈ [-1, 1] across the blade, v ∈ [0, 1] from base to tip.
 * The blade stands along +Y with its inner (concave) face toward -Z, so a petal placed at +Z of the
 * flower axis cups around it. The "closed" pose is the base geometry and the "open" pose is a morph
 * target, letting every instance blend between bud and full bloom independently.
 */
type Surface = {
  width: (v: number) => number;
  closed: (u: number, v: number, w: number) => number;
  open: (u: number, v: number, w: number) => number;
  /** Base → tip tint, multiplied with the per-instance colour. */
  tint?: (v: number, u: number) => [number, number, number];
};

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

const petalTint = (v: number, u: number): [number, number, number] => {
  // Greenish, darker heart at the base; slightly luminous, sun-washed edges.
  const s = smooth(0, 0.32, v);
  const edge = 0.94 + 0.06 * Math.abs(u) * v;
  return [(0.62 + 0.38 * s) * edge, (0.7 + 0.3 * s) * edge, (0.5 + 0.5 * s) * edge];
};

function surfaceGeometry(shape: Surface, segU = 8, segV = 14) {
  const closed: number[] = [];
  const open: number[] = [];
  const colors: number[] = [];
  const uvs: number[] = [];
  const index: number[] = [];
  const tint = shape.tint ?? petalTint;

  for (let j = 0; j <= segV; j++) {
    const v = j / segV;
    const w = shape.width(v);
    for (let i = 0; i <= segU; i++) {
      const u = (i / segU) * 2 - 1;
      const x = u * w;
      closed.push(x, v, shape.closed(u, v, w));
      open.push(x, v, shape.open(u, v, w));
      colors.push(...tint(v, u));
      uvs.push(i / segU, v);
    }
  }
  const row = segU + 1;
  for (let j = 0; j < segV; j++) {
    for (let i = 0; i < segU; i++) {
      const a = j * row + i;
      index.push(a, a + 1, a + row, a + 1, a + row + 1, a + row);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setIndex(index);
  geo.setAttribute("position", new THREE.Float32BufferAttribute(closed, 3));
  geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geo.computeVertexNormals();

  const openGeo = new THREE.BufferGeometry();
  openGeo.setIndex(index);
  openGeo.setAttribute("position", new THREE.Float32BufferAttribute(open, 3));
  openGeo.computeVertexNormals();
  geo.morphAttributes.position = [openGeo.getAttribute("position")];
  geo.morphAttributes.normal = [openGeo.getAttribute("normal")];
  return geo;
}

export function rosePetal() {
  return surfaceGeometry({
    width: (v) => 0.5 * Math.pow(Math.sin(Math.PI * Math.min(0.999, 0.03 + Math.pow(v, 0.62) * 0.97)), 0.5),
    closed: (u, v, w) => -0.62 * u * u * w - 0.22 * v * v,
    open: (u, v, w) => {
      const tip = Math.max(0, v - 0.5) * 2;
      return -0.26 * u * u * w + 0.16 * tip * tip + 0.28 * u * u * w * smooth(0.55, 1, v);
    },
  });
}

export function peonyPetal() {
  const ruffle = (u: number, v: number) => 0.035 * Math.sin(u * 11 + v * 6) * v * (0.4 + Math.abs(u));
  return surfaceGeometry({
    width: (v) => 0.56 * Math.pow(Math.sin(Math.PI * Math.min(0.999, 0.04 + Math.pow(v, 0.5) * 0.96)), 0.42),
    closed: (u, v, w) => -0.72 * u * u * w - 0.3 * v * v + ruffle(u, v) * 0.5,
    open: (u, v, w) => -0.38 * u * u * w - 0.04 * v * v + ruffle(u, v),
  });
}

export function floretPetal() {
  return surfaceGeometry(
    {
      width: (v) => 0.55 * Math.pow(Math.sin(Math.PI * Math.min(0.999, 0.05 + Math.pow(v, 0.7) * 0.95)), 0.55),
      closed: (u, v, w) => -0.2 * u * u * w - 0.1 * v * v,
      open: (u, v, w) => -0.08 * u * u * w + 0.05 * v * v,
    },
    6,
    8,
  );
}

const leafTint = (v: number, u: number): [number, number, number] => {
  const vein = 1 - 0.18 * Math.exp(-Math.pow(u * 9, 2));
  const s = 0.82 + 0.18 * smooth(0, 0.5, v);
  return [s * vein, s * vein, s * vein];
};

export function roseLeaf() {
  return surfaceGeometry({
    width: (v) => 0.36 * Math.sin(Math.PI * Math.pow(v, 0.8)) * (1 + 0.05 * Math.sin(v * 46)),
    closed: (u, v, w) => 0.5 * Math.abs(u) * w - 0.05 * v,
    open: (u, v, w) => 0.18 * Math.abs(u) * w - 0.14 * v * v,
    tint: leafTint,
  });
}

export function eucalyptusLeaf() {
  return surfaceGeometry({
    width: (v) => 0.5 * Math.sqrt(Math.max(0, Math.sin(Math.PI * Math.min(1, 0.02 + v * 0.98)))),
    closed: (u, v, w) => 0.3 * u * u * w,
    open: (u, v, w) => 0.12 * u * u * w - 0.06 * v * v,
    tint: (v, u) => {
      const s = 0.86 + 0.14 * (1 - Math.abs(u));
      return [s, s, s];
    },
  });
}

export function sepal() {
  return surfaceGeometry(
    {
      width: (v) => 0.16 * Math.sin(Math.PI * Math.pow(v, 0.55)),
      closed: (u, v, w) => -0.3 * u * u * w - 0.2 * v * v,
      open: (u, v, w) => -0.2 * u * u * w + 0.35 * v * v,
      tint: () => [1, 1, 1],
    },
    4,
    8,
  );
}

export function babysFloret() {
  return new THREE.IcosahedronGeometry(1, 1);
}
