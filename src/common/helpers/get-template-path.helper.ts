import * as fs from 'fs';
import * as path from 'path';

export function getTemplatePath(template: string): string {
  const srcPath = path.join(
    process.cwd(),
    'src',
    'common',
    'templates',
    template,
  );

  const distPath = path.join(
    process.cwd(),
    'dist',
    'src',
    'common',
    'templates',
    template,
  );

  if (fs.existsSync(distPath)) {
    return distPath;
  }

  return srcPath;
}