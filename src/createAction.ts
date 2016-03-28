import * as _ from "lodash";

export interface ActionSpec {
  displayName?: string;
  getDefaultProps?: () => {};
}
export interface Action {
  displayName: string;
  props: {};
  getDefaultProps: () => {};
}
export interface ActionClass {
  displayName: string;
  new(props?: any): Action;
}

/**
 * createAction creates an Action class according to the supplied spec.
 */
export default function createAction<T>(spec: ActionSpec = {}): ActionClass {
  const {
    displayName = "unnamed action",
    getDefaultProps
  } = spec;

  class AnonymousAction implements Action {
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
  }

  return AnonymousAction;
}
