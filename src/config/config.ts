export type Args = {
  environment?: string,
  test?: string
}

export type Config = {
  environments: {
    [key: string]: Environment
  }
}

export type EnvironmentTarget = {
  [key: string]: any
}

export type Environment = {
  common?: EnvironmentTarget
  targets: EnvironmentTarget[]
}
