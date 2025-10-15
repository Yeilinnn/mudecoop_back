import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';

@Injectable()
export class StorageService {
  private readonly root = path.join(process.cwd(), 'uploads');

  async save(buffer: Buffer, originalName: string, subdir = ''): Promise<{
    diskPath: string;
    publicPath: string;
  }> {
    const safeDir = (subdir || '')
      .replace(/\\/g, '/')
      .replace(/^\//, '')
      .replace(/\/+$/, '');

    const ext = (path.extname(originalName || '') || '.bin').toLowerCase();
    const filename = `${Date.now()}_${randomUUID().slice(0, 8)}${ext}`;

    const diskDir = path.join(this.root, ...safeDir.split('/'));
    await fs.mkdir(diskDir, { recursive: true });

    const diskPath = path.join(diskDir, filename);
    await fs.writeFile(diskPath, buffer);

    const publicPath = `/${['uploads', safeDir, filename].filter(Boolean).join('/')}`;

    return { diskPath, publicPath };
  }

  async removeByPublicPath(publicPath?: string | null): Promise<void> {
    if (!publicPath) return;
    const rel = publicPath.replace(/^\/+/, '').replace(/\\/g, '/');
    const diskPath = path.join(process.cwd(), ...rel.split('/'));
    try {
      await fs.unlink(diskPath);
    } catch {
      // ignorar si no existe
    }
  }
}
