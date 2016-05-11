export type Args = {
  environment?: string,
  test?: string
}

export type Config = {
  environments: EnvironmentConfig
}

export type Environment = {
  common?: EnvironmentTarget
  targets?: EnvironmentTarget[]
}

export type EnvironmentConfig = {
  [key: string]: Environment
}

export type EnvironmentTarget = {
  [key: string]: any
}
