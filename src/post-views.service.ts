import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Database = require('better-sqlite3');
import { dirname, resolve } from 'node:path';
import { mkdirSync } from 'node:fs';

export interface PostViewCount {
  slug: string;
  views: number;
}

@Injectable()
export class PostViewsService implements OnModuleDestroy {
  private readonly database: Database.Database;
  private readonly incrementView: Database.Statement;
  private readonly readView: Database.Statement;

  constructor() {
    const databasePath = resolve(
      process.env.DATABASE_PATH ?? './data/blog.sqlite',
    );
    try {
      mkdirSync(dirname(databasePath), { recursive: true });
      this.database = new Database(databasePath);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      throw new Error(
        `Không thể khởi tạo SQLite tại ${databasePath}. ` +
          `Kiểm tra DATABASE_PATH và quyền ghi thư mục: ${reason}`,
      );
    }
    this.database.pragma('journal_mode = WAL');
    this.database.pragma('busy_timeout = 5000');
    this.database.exec(`
      CREATE TABLE IF NOT EXISTS post_views (
        slug TEXT PRIMARY KEY,
        views INTEGER NOT NULL DEFAULT 0,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    this.database.transaction(() => {
      const legacy = this.database
        .prepare('SELECT views FROM post_views WHERE slug = ?')
        .get('api-comparation') as { views: number } | undefined;
      if (!legacy) return;
      const current = this.database
        .prepare('SELECT views FROM post_views WHERE slug = ?')
        .get('api-comparison') as { views: number } | undefined;
      if (current) {
        this.database
          .prepare('UPDATE post_views SET views = views + ? WHERE slug = ?')
          .run(legacy.views, 'api-comparison');
      } else {
        this.database
          .prepare('INSERT INTO post_views (slug, views) VALUES (?, ?)')
          .run('api-comparison', legacy.views);
      }
      this.database.prepare('DELETE FROM post_views WHERE slug = ?').run('api-comparation');
    })();
    this.incrementView = this.database.prepare(`
      INSERT INTO post_views (slug, views, updated_at)
      VALUES (?, 1, CURRENT_TIMESTAMP)
      ON CONFLICT(slug) DO UPDATE SET
        views = post_views.views + 1,
        updated_at = CURRENT_TIMESTAMP
      RETURNING slug, views
    `);
    this.readView = this.database.prepare(
      'SELECT slug, views FROM post_views WHERE slug = ?',
    );
  }

  increment(slug: string): PostViewCount {
    return this.incrementView.get(slug) as PostViewCount;
  }

  get(slug: string): PostViewCount {
    return (this.readView.get(slug) as PostViewCount | undefined) ?? {
      slug,
      views: 0,
    };
  }

  onModuleDestroy() {
    this.database.close();
  }
}
