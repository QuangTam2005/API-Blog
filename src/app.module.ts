import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'node:path';
import { BlogController } from './blog.controller';

@Module({
  imports: [
    ServeStaticModule.forRoot({
    rootPath: join(process.cwd(), 'public'),
      serveRoot: '/',
      exclude: ['/health'],
    }),
  ],
  controllers: [BlogController],
})
export class AppModule {}
