"use client";

import { useCallback, useEffect, useRef, useState, type ComponentType } from "react";
import HeroProductFallback from "@/components/HeroProductFallback";

type SceneProps = { onReady: () => void; onSceneChange: (scene: number) => void };
type SceneComponent = ComponentType<SceneProps>;

const sceneNames = ["Articulated dragon", "Miniature car", "Ribbed designer vase", "Robot collectible"];

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
    }, { rootMargin: "120px" });
    observer.observe(host);
    return () => {
      disposed = true;
      observer.disconnect();
    };
  }, []);

  return <div ref={hostRef} className={`vxl-hero-visual${ready ? " is-ready" : ""}`} role="img" aria-label={`Animated 3D product showcase: ${sceneNames[activeScene]}, with a car, vase and robot collectible`}>
    <div className={`vxl-showcase-fallback${ready ? " is-hidden" : ""}`}>
      <HeroProductFallback/>
    </div>
    {Scene && <Scene onReady={onReady} onSceneChange={onSceneChange}/>}
    <div className="vxl-showcase-annotation vxl-showcase-annotation--top" aria-hidden="true">
      <span className="vxl-showcase-annotation__dot"/>
      <span>ORIGINAL 3D PRODUCT STUDIES</span>
    </div>
    <div className="vxl-showcase-caption" aria-hidden="true">
      <span className="vxl-showcase-caption__index">0{activeScene + 1} / 04</span>
      <span className="vxl-showcase-caption__rule"/>
      <span className="vxl-showcase-caption__text">{sceneNames[activeScene]}</span>
      <span className="vxl-showcase-caption__material">PLA-STYLE · LAYER DETAIL</span>
    </div>
    <span className="vxl-showcase-annotation vxl-showcase-annotation--side" aria-hidden="true">FORM / MATERIAL / MOTION</span>
  </div>;
}
