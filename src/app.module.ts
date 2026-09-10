import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'node:path';
import { BlogController } from './blog.controller';
import { PostViewsService } from './post-views.service';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'public', 'assets'),
      serveRoot: '/assets',
      serveStaticOptions: { etag: true },
    }),
  ],
  controllers: [BlogController],
  providers: [PostViewsService],
})
export class AppModule {}
