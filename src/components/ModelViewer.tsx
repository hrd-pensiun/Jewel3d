"use client";

import { OrbitControls, Stage, useGLTF } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect } from "react";

import { getProxiedModelUrl } from "@/lib/model-url";

type ModelViewerProps = {
  modelUrl: string;
};

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} />;
}

function ViewerScene({ modelUrl }: { modelUrl: string }) {
  const proxiedUrl = getProxiedModelUrl(modelUrl);

  return (
    <>
      <Suspense fallback={null}>
        <Stage environment="studio" intensity={0.65} adjustCamera={1.2}>
          <Model url={proxiedUrl} />
        </Stage>
      </Suspense>
      <OrbitControls makeDefault enablePan enableZoom enableRotate />
    </>
  );
}

export default function ModelViewer({ modelUrl }: ModelViewerProps) {
  useEffect(() => {
    useGLTF.preload(getProxiedModelUrl(modelUrl));
  }, [modelUrl]);

  return (
    <div className="h-[50vh] w-full overflow-hidden rounded-xl bg-neutral-900 sm:h-[60vh]">
      <Canvas camera={{ position: [0, 0, 4], fov: 45 }}>
        <color attach="background" args={["#171717"]} />
        <ViewerScene modelUrl={modelUrl} />
      </Canvas>
    </div>
  );
}
