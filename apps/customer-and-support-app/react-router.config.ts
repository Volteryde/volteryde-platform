import type { Config } from '@react-router/dev/config';
import { readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { createGetUrl, getSlugs } from 'fumadocs-core/source';

const getUrl = createGetUrl('/docs');

async function* walk(dir: string): AsyncGenerator<string> {
  const dirents = await readdir(dir, { withFileTypes: true });
  for (const dirent of dirents) {
    const res = join(dir, dirent.name);
    if (dirent.isDirectory()) {
      yield* walk(res);
    } else {
      yield res;
    }
  }
}

export default {
  ssr: true,
  async prerender({ getStaticPaths }) {
    const paths: string[] = [];
    const excluded: string[] = ['/api/search'];

    for (const path of getStaticPaths()) {
      if (!excluded.includes(path)) paths.push(path);
    }

    const cwd = 'content/docs';
    try {
      for await (const file of walk(cwd)) {
        if (file.endsWith('.mdx')) {
          paths.push(getUrl(getSlugs(relative(cwd, file))));
        }
      }
    } catch (error) {
      // Ignore if directory doesn't exist, similar to empty glob result
    }

    return paths;
  },
} satisfies Config;
