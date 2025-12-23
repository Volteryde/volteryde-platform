import { Injectable } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';

@Injectable()
export class HealthService {
  private readonly version: string;

  constructor() {
    // Read version from package.json
    try {
      const packageJsonPath = join(process.cwd(), 'package.json');
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      this.version = packageJson.version || '1.0.0';
    } catch (error) {
      this.version = '1.0.0';
    }
  }

  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'volteryde-nest',
      version: this.version,
    };
  }
}
