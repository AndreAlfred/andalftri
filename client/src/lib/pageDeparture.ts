export type PageDeparture = {
  pageId: string;
  stage: "exiting" | "preparing" | "staging" | "ready";
} | null;

export type PageDepartureEvent =
  | { type: "select" | "hub-exited" | "page-prepared" | "panel-staged"; pageId: string }
  | { type: "cancel" };

export function pageDepartureReducer(
  state: PageDeparture,
  event: PageDepartureEvent,
): PageDeparture {
  if (event.type === "cancel") return null;
  if (event.type === "select") {
    return { pageId: event.pageId, stage: "exiting" };
  }
  if (!state || state.pageId !== event.pageId) return state;
  if (event.type === "hub-exited" && state.stage === "exiting") {
    return { ...state, stage: "preparing" };
  }
  if (event.type === "page-prepared" && state.stage === "preparing") {
    return { ...state, stage: "staging" };
  }
  if (event.type === "panel-staged" && state.stage === "staging") {
    return { ...state, stage: "ready" };
  }
  return state;
}
