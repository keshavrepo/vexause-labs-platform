"use client";

import { useCallback, useEffect, useRef, useState, type ComponentType } from "react";
import HeroProductFallback from "@/components/HeroProductFallback";

type SceneProps = { onReady: () => void; onSceneChange: (scene: number) => void };
type SceneComponent = ComponentType<SceneProps>;

const sceneNames = ["Articulated dragon", "Miniature car", "Ribbed designer vase", "Robot collectible"];
const sceneNotes = ["Matte PLA · articulated", "Satin PLA · two-tone", "Ceramic finish · fluted", "Matte PLA · jointed"];

/**
 * Full-bleed hero stage.
 *
 * The canvas covers the whole hero section rather than living in a card, so the
 * products share the page background and there is no frame to see. Only the two
 * small labels are laid over the scene.
 */
export default function HeroProductShowcase() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [Scene, setScene] = useState<SceneComponent | null>(null);
  const [ready, setReady] = useState(false);
  const [activeScene, setActiveScene] = useState(0);

  const onReady = useCallback(() => setReady(true), []);
  const onSceneChange = useCallback((scene: number) => setActiveScene(scene), []);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let disposed = false;
    let requested = false;

    const loadScene = async () => {
      if (requested) return;
      requested = true;
      try {
        const sceneModule = await import("@/components/HeroProductScene");
        if (!disposed) setScene(() => sceneModule.default);
      } catch (error) {
        console.error("Could not load the 3D product showcase.", error);
      }
    };

    if (!("IntersectionObserver" in window)) {
      void loadScene();
      return () => { disposed = true; };
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        observer.disconnect();
        void loadScene();
      }
    }, { rootMargin: "160px" });
    observer.observe(host);
    return () => {
      disposed = true;
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={hostRef}
      className={`vx-hero__stage${ready ? " is-ready" : ""}`}
      role="img"
      aria-label={`Animated 3D product study: ${sceneNames[activeScene].toLowerCase()}, staged with a dragon, car, vase and robot collectible at different depths`}
    >
      <div className={`vx-hero__fallback${ready ? " is-hidden" : ""}`} aria-hidden="true">
        <HeroProductFallback />
      </div>
      {Scene ? <Scene onReady={onReady} onSceneChange={onSceneChange} /> : null}

      <div className="vx-hero__tag" aria-hidden="true">
        <span className="vx-hero__tag-dot" />
        Original 3D product studies
      </div>

      <div className="vx-hero__caption" aria-hidden="true">
        <span className="vx-hero__caption-index">0{activeScene + 1}<i>/04</i></span>
        <span className="vx-hero__caption-rule" />
        <span>
          <b>{sceneNames[activeScene]}</b>
          <em>{sceneNotes[activeScene]}</em>
        </span>
      </div>
    </div>
  );
}
