"use client";

import * as THREE from "three";

import type { Product } from "../products";
import { Bouquet } from "./bouquet";
import { FRAMING } from "./framing";
import { createRenderer, createStage, loadEnvironment } from "./stage";

/**
 * Product photos are rendered once in the browser from the same flower engine as the hero, through a
 * single offscreen renderer, then reused as blob URLs. One WebGL context for the whole catalogue.
 */
const W = 640;
const H = 800;
export const CARD_BG = "#ebe3d5";

let ctx: { renderer: THREE.WebGLRenderer; scene: THREE.Scene; camera: THREE.PerspectiveCamera } | null = null;
const cache = new Map<string, Promise<string>>();
let queue: Promise<unknown> = Promise.resolve();

async function context() {
  if (!ctx) {
    const canvas = document.createElement("canvas");
    const renderer = createRenderer(canvas, { preserve: true });
    renderer.setPixelRatio(1);
    renderer.setSize(W, H, false);
    const { scene } = createStage(CARD_BG);
    const camera = new THREE.PerspectiveCamera(30, W / H, 0.05, 20);
    ctx = { renderer, scene, camera };
    scene.environment = await loadEnvironment(renderer);
    scene.environmentIntensity = 0.55;
  }
  return ctx;
}

export function snapshot(product: Product): Promise<string> {
  let hit = cache.get(product.id);
  if (hit) return hit;
  hit = new Promise<string>((resolve, reject) => {
    queue = queue.then(async () => {
      try {
        const { renderer, scene, camera } = await context();
        const b = new Bouquet(product.recipe);
        scene.add(b.root);
        await b.ready;
        b.update(1.2, 1, 1);
        const f = FRAMING[product.recipe.container];
        camera.position.copy(f.pos);
        camera.lookAt(f.look);
        renderer.render(scene, camera);
        const blob = await new Promise<Blob | null>((r) => renderer.domElement.toBlob(r, "image/webp", 0.92));
        b.dispose();
        resolve(blob ? URL.createObjectURL(blob) : renderer.domElement.toDataURL("image/jpeg", 0.9));
        // yield to the main thread between renders so scrolling never hitches
        await new Promise((r) => setTimeout(r, 30));
      } catch (e) {
        reject(e);
      }
    });
  });
  cache.set(product.id, hit);
  return hit;
}
