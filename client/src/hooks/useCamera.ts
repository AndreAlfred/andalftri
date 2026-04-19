import { create } from "zustand";
import { MENU_HUB_CAMERA } from "@/data/sceneConfig";

export type CameraTarget = [number, number, number];

interface CameraState {
  targetPosition: CameraTarget;
  targetLookAt: CameraTarget;
  currentPage: string | null;
  isTransitioning: boolean;
  flyTo: (position: CameraTarget, lookAt: CameraTarget, pageId: string) => void;
  returnToHub: () => void;
  finishTransition: () => void;
}

export const useCameraStore = create<CameraState>((set) => ({
  targetPosition: [...MENU_HUB_CAMERA.position],
  targetLookAt: [...MENU_HUB_CAMERA.lookAt],
  currentPage: null,
  isTransitioning: false,
  flyTo: (position, lookAt, pageId) =>
    set({
      targetPosition: [...position],
      targetLookAt: [...lookAt],
      currentPage: pageId,
      isTransitioning: true,
    }),
  returnToHub: () =>
    set({
      targetPosition: [...MENU_HUB_CAMERA.position],
      targetLookAt: [...MENU_HUB_CAMERA.lookAt],
      currentPage: null,
      isTransitioning: true,
    }),
  finishTransition: () => set({ isTransitioning: false }),
}));
