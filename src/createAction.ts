import * as _ from "lodash";

export interface ActionSpec {
  displayName?: string;
  getDefaultProps?: () => {};
  getDescription?: () => string;
}
export interface Action<T> {
  displayName: string;
  props: T;
  getDefaultProps: () => T;
  getDescription: () => string;
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
    getDescription
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

    getDescription() {
      return (
        typeof getDescription === "function"
          ? getDescription.call(this)
          : displayName
      );
    }
  }

  return AnonymousAction;
}
