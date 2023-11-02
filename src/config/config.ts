import { ConfigModule } from '@nestjs/config';

export default function configGenerator() {
  const mode = process.env.NODE_ENV || 'prod';
  console.log(`Running in ${mode} mode`);
  const envFilePath =
    mode === 'dev'
      ? ['local.development.env', 'development.env', '.env']
      : ['local.production.env',  'production.env',  '.env']
  const ret =  ConfigModule.forRoot({ 
    envFilePath,
    isGlobal: true,
  })
  return ret
}


export const MESSAGE_TTL = '30d'