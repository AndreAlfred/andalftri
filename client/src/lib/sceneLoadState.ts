export interface SceneLoadState {
  reported: boolean;
  active: boolean;
  progress: number;
  item: string;
  loaded: number;
  total: number;
}

export function isSceneLoadComplete(state: SceneLoadState): boolean {
  return (
    state.reported &&
    !state.active &&
    state.total > 0 &&
    state.loaded >= state.total
  );
}

export function shouldShowSceneLoader(state: SceneLoadState): boolean {
  return !isSceneLoadComplete(state);
}
