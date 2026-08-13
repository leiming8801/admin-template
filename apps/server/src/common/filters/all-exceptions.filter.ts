import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';

/**
 * 翻译缓存：lang -> key -> translated
 */
const translations: Record<string, Record<string, string>> = {};

/** 加载翻译文件 */
function loadTranslations(langDir: string): void {
  if (translations[langDir]) return;
  const result: Record<string, string> = {};
  // 尝试多个路径查找 messages.json
  const possiblePaths = [
    path.join(__dirname, langDir, 'messages.json'),
    path.resolve(process.cwd(), 'src', 'i18n', langDir, 'messages.json'),
    path.resolve(process.cwd(), 'dist', 'i18n', langDir, 'messages.json'),
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      try {
        const data = JSON.parse(fs.readFileSync(p, 'utf-8'));
        flattenKeys(data, '', result);
        break;
      } catch {
        // 忽略解析错误
      }
    }
  }
  translations[langDir] = result;
}

/** 将嵌套 JSON 展平为 dot key */
function flattenKeys(obj: any, prefix: string, result: Record<string, string>): void {
  for (const key of Object.keys(obj)) {
    const value = obj[key];
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') {
      result[fullKey] = value;
    } else if (typeof value === 'object' && value !== null) {
      flattenKeys(value, fullKey, result);
    }
  }
}

/** 翻译 */
function translate(key: string, lang: string): string {
  const langDir = lang || 'zh-CN';
  loadTranslations(langDir);
  // 尝试目标语言，找不到则用 fallback
  const found = translations[langDir]?.[key];
  if (found) return found;
  // fallback to zh-CN
  if (langDir !== 'zh-CN') {
    loadTranslations('zh-CN');
    const fallback = translations['zh-CN']?.[key];
    if (fallback) return fallback;
  }
  return key;
}

/**
 * 全局异常过滤器，统一错误响应格式
 *
 * 设计原则：
 * - Service/Guard/Strategy 层 throw 时只传 i18n key（如 'auth.loginFailed'）
 * - Filter 层根据 Accept-Language 请求头统一翻译
 * - class-validator 校验错误返回 'common.paramsError'
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const lang = (request.headers['accept-language'] as string) || 'zh-CN';

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'common.serverError';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const resObj = res as Record<string, any>;
        // class-validator 验证错误（message 为数组）
        if (Array.isArray(resObj.message)) {
          message = 'common.paramsError';
        } else {
          message = resObj.message || 'common.serverError';
        }
      }
    } else {
      this.logger.error('未处理异常', (exception as Error)?.stack);
    }

    // 翻译 i18n key
    message = translate(message, lang);

    response.status(status).json({
      code: status,
      message,
      data: null,
    });
  }
}
