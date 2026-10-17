import * as THREE from "three";

/**
 * Petal surfaces are a (u, v) grid: u ∈ [-1, 1] across the blade, v ∈ [0, 1] from base to tip.
 * The blade stands along +Y with its inner (concave) face toward -Z, so a petal placed at +Z of the
 * flower axis cups around it. The "closed" pose is the base geometry and the "open" pose is a morph
 * target, letting every instance blend between bud and full bloom independently.
 * uv = (across, along) so shaders can shade base → tip and draw veins.
 */
type Surface = {
  width: (v: number) => number;
  closed: (u: number, v: number, w: number) => number;
  open: (u: number, v: number, w: number) => number;
};

export const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

function surfaceGeometry(shape: Surface, segU = 10, segV = 18) {
  const closed: number[] = [];
  const open: number[] = [];
  const uvs: number[] = [];
  const index: number[] = [];

  for (let j = 0; j <= segV; j++) {
    const v = j / segV;
    const w = shape.width(v);
    for (let i = 0; i <= segU; i++) {
      const u = (i / segU) * 2 - 1;
      closed.push(u * w, v, shape.closed(u, v, w));
      open.push(u * w, v, shape.open(u, v, w));
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

/** Water-lily petal: boat-shaped, pointed, stays gently cupped even when fully open. */
export function lilyPetal() {
  return surfaceGeometry({
    width: (v) => 0.4 * Math.pow(Math.sin(Math.PI * Math.min(0.999, 0.02 + Math.pow(v, 0.72) * 0.98)), 0.78),
    closed: (u, v, w) => -0.85 * u * u * w - 0.16 * v * v,
    open: (u, v, w) => -0.26 * u * u * w + 0.06 * v * v - 0.03 * Math.sin(Math.PI * v),
  });
}

/** Round lily pad with its characteristic notch, softly domed, lying in the XZ plane. */
export function lilyPad(radius: number, seed: number) {
  const geo = new THREE.CircleGeometry(radius, 72, 0.12, Math.PI * 2 - 0.24);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.getAttribute("position");
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const r = Math.hypot(x, z) / radius;
    const a = Math.atan2(z, x);
    // centre slightly raised, rim lifting a touch in a slow wave
    pos.setY(i, 0.006 * (1 - r * r) + 0.004 * Math.pow(r, 4) * (1 + Math.sin(a * 3 + seed)));
  }
  geo.computeVertexNormals();
  return geo;
}
