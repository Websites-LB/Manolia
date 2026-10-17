import * as THREE from "three";

import type { Container } from "./bouquet";

/** Camera position + look-at that frames each container type nicely at a 4:5 portrait. */
export const FRAMING: Record<Container, { pos: THREE.Vector3; look: THREE.Vector3 }> = {
  wrap: { pos: new THREE.Vector3(0.42, 0.62, 1.5), look: new THREE.Vector3(0, 0.31, 0) },
  vase: { pos: new THREE.Vector3(0.5, 0.78, 1.82), look: new THREE.Vector3(0, 0.44, 0) },
  box: { pos: new THREE.Vector3(0.28, 0.62, 0.78), look: new THREE.Vector3(0, 0.08, 0) },
};
