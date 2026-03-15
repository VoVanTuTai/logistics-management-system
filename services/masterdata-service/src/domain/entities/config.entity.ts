export type ConfigValue =
  | string
  | number
  | boolean
  | null
  | ConfigValue[]
  | { [key: string]: ConfigValue };

export interface Config {
  id: string;
  key: string;
  value: ConfigValue;
  scope: string | null;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConfigWriteInput {
  key: string;
  value: ConfigValue;
  scope?: string | null;
  description?: string | null;
}
