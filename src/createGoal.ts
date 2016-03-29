import * as _ from "lodash";

import { Action } from "./createAction";

export interface GoalSpec {
  displayName?: string;
  getDefaultProps?: () => {};
  getDescription?: () => string;
  getDependencies?: () => GoalClass<any>[];
  setup?: () => Action<any>[];
  teardown?: () => Action<any>[];
}
export interface Goal<T> {
  displayName: string;
  props: T;
  getDefaultProps: () => T;
  getDescription: () => string;
  getDependencies: () => GoalClass<any>[];
  setup: () => Action<any>[];
  teardown: () => Action<any>[];
}
export interface GoalClass<T> {
  displayName: string;
  new(props?: any): Goal<T>;
}

/**
 * createGoal creates a Goal using to the supplied spec.
 */
export default function createGoal<T>(
  spec: GoalSpec = {}
): GoalClass<T> {
  const {
    displayName = "unnamed goal",
    getDefaultProps,
    getDescription,
    getDependencies,
    setup,
    teardown
  } = spec;

  class AnonymousGoal implements Goal<T> {
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
     * getDependencies lists Goal constructors that must have run before this
     * goal can run.
     */
    getDependencies(): GoalClass<any>[] {
      return (
        typeof getDependencies === "function"
          ? getDependencies.call(this)
          : []
      );
    }

    /**
     * before lists Actions that make up the main part of this goal.
     */
    setup(): Action<any>[] {
      return (
        typeof setup === "function"
          ? setup.call(this)
          : []
      );
    }

    /**
     * after lists Actions that will run after subsequent Goals in the Test
     * teardown.
     */
    teardown(): Action<any>[] {
      return (
        typeof teardown === "function"
          ? teardown.call(this)
          : []
      );
    }
  }

  return AnonymousGoal;
}
