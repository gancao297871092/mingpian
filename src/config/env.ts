import Config from 'react-native-config';

export type EnvName = 'dev' | 'staging' | 'prod';

export interface EnvConfig {
  envName: EnvName;
  apiUrl: string;
  apiTimeout: number;
}

const toEnvName = (value?: string): EnvName => {
  if (value === 'staging' || value === 'prod') return value;
  return 'dev';
};

export const env: EnvConfig = {
  envName: toEnvName(Config.APP_ENV),
  apiUrl: Config.API_URL ?? '',
  apiTimeout: Number(Config.API_TIMEOUT ?? 15000),
};
