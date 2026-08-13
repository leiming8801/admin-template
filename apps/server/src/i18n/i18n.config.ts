import { I18nOptions, HeaderResolver } from 'nestjs-i18n';
import * as path from 'path';
import * as fs from 'fs';

/** 查找 i18n 翻译文件目录：优先 dist，回退 src */
function findI18nPath(): string {
  const distPath = path.join(__dirname, '/');
  const srcPath = path.resolve(process.cwd(), 'src/i18n/');

  if (fs.existsSync(path.join(distPath, 'zh-CN', 'messages.json'))) {
    return distPath;
  }
  return srcPath;
}

export const i18nOptions: I18nOptions = {
  fallbackLanguage: 'zh-CN',
  loaderOptions: {
    path: findI18nPath(),
    watch: false,
  },
  resolvers: [
    { use: HeaderResolver, options: ['zh-CN', 'en-US'] },
  ],
};
