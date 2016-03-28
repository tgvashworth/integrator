export interface ActionSpec {
  displayName?: string;
}
export interface Action {
  displayName: string;
}
export interface ActionClass {
  displayName: string;
  new(): Action;
}

export default function createAction(spec: ActionSpec = {}): ActionClass {
  const {
    displayName = "unnamed action"
  } = spec;

  class AnonymousAction implements Action {
    static displayName = displayName;
    displayName: string;
    constructor() {
      this.displayName = displayName;
    }
  }

  return AnonymousAction;
}
