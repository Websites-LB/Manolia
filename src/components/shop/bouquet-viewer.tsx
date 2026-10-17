"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

import { Bouquet, type Recipe } from "@/lib/flora/bouquet";
import { FRAMING } from "@/lib/flora/framing";
import { createRenderer, createStage, loadEnvironment } from "@/lib/flora/stage";
import { CARD_BG } from "@/lib/flora/snapshots";

/** Live, draggable bouquet that finishes opening as you look at it. */
export function BouquetViewer({ recipe }: { recipe: Recipe }) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = canvas.current!;
    const renderer = createRenderer(el);
    const { scene } = createStage(CARD_BG);
    const camera = new THREE.PerspectiveCamera(30, 1, 0.05, 20);
    const bouquet = new Bouquet(recipe);
    scene.add(bouquet.root);
    loadEnvironment(renderer).then((env) => {
      scene.environment = env;
      scene.environmentIntensity = 0.55;
    });

    const f = FRAMING[recipe.container];
    const radius = Math.hypot(f.pos.x - f.look.x, f.pos.z - f.look.z);
    const baseAngle = Math.atan2(f.pos.x, f.pos.z);

    const resize = () => {
      const w = el.clientWidth, h = el.clientHeight;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    // drag to turn; it keeps a little momentum, then settles back into a slow idle drift
    let yaw = 0, vel = 0, dragging = false, lastX = 0;
    const down = (e: PointerEvent) => {
      dragging = true;
      lastX = e.clientX;
      el.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (!dragging) return;
      vel = (e.clientX - lastX) * 0.008;
      yaw += vel;
      lastX = e.clientX;
    };
    const up = () => (dragging = false);
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);

    const clock = new THREE.Clock();
    let open = 0, raf = 0;
    const frame = () => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.elapsedTime;
      open = Math.min(1, open + dt * 0.45);
      if (!dragging) {
        vel *= Math.exp(-dt * 3);
        yaw += vel + dt * 0.12;
      }
      bouquet.update(t, 0.82 + 0.18 * open, 0.35 + 0.65 * open);
      const a = baseAngle + yaw;
      camera.position.set(f.look.x + Math.sin(a) * radius, f.pos.y, f.look.z + Math.cos(a) * radius);
      camera.lookAt(f.look);
      renderer.render(scene, camera);
    };
    bouquet.ready.then(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
      bouquet.dispose();
      renderer.dispose();
    };
  }, [recipe]);

  return <canvas ref={canvas} className="h-full w-full cursor-grab touch-pan-y active:cursor-grabbing" aria-label="Drag to turn the bouquet" />;
}
