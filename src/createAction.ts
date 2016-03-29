import * as _ from "lodash";

export interface ActionSpec {
  displayName?: string;
  getDefaultProps?: () => {};
  getDescription?: () => string;
  before?: () => Action<any>[];
  after?: () => Action<any>[];
  run?: (v?: any) => any | Promise<any>;
}
export interface ActionRun {
  (v?: any): Promise<any>;
}
export interface Action<T> {
  displayName: string;
  props: T;
  getDefaultProps: () => T;
  getDescription: () => string;
  before: () => Action<any>[];
  after: () => Action<any>[];
  run: ActionRun;
}
export interface ActionClass<T> {
  displayName: string;
  new(props?: any): Action<T>;
}

/**
 * createAction creates an Action class according to the supplied spec.
 */
export default function createAction<T>(
  spec: ActionSpec = {}
): ActionClass<T> {
  const {
    displayName = "unnamed action",
    getDefaultProps,
    getDescription,
    before,
    after,
    run,
  } = spec;

  class AnonymousAction implements Action<T> {
    static displayName = displayName;
    displayName: string;
    props: T;
    constructor(props: any = {}) {
      this.displayName = displayName;
      this.props = _.merge({}, this.getDefaultProps(), props);
    }

    /**
     * getDefaultProps is used to specify the default `props` of the Action,
     * which can be overwritten at creation time. If a `getDefaultProps`
     * function is passed as part of the class `spec`, it will be called. If
     * not, the default is an empty object.
     */
    getDefaultProps(): T {
      return (
        typeof getDefaultProps === "function"
          ? getDefaultProps.call(this)
          : {}
      );
    }

    /**
     * getDescription allows action authors to write useful, human-readable
     * descriptions of what their actions do.
     */
    getDescription(): string {
      return (
        typeof getDescription === "function"
          ? getDescription.call(this)
          : displayName
      );
    }

    /**
     * before lists sub-Actions that will run before this Action's run method.
     */
    before(): Action<any>[] {
      return (
        typeof before === "function"
          ? before.call(this)
          : []
      );
    }

    /**
     * after lists sub-Actions that will run before this Action's run method.
     */
    after(): Action<any>[] {
      return (
        typeof after === "function"
          ? after.call(this)
          : []
      );
    }

    /**
     * run is the main part of an Action - it's where the action should do its
     * work. Always returns a Promise.
     */
    run(v, ...args) {
      return Promise.resolve()
        .then(() => (
          typeof run === "function"
            ? run.call(this, v, ...args)
            : v
        ));
    }
  }

  return AnonymousAction;
}
