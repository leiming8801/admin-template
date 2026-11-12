import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.getOrThrow<number>('port');

  // CORS
  app.enableCors(configService.getOrThrow('cors'));

  // 全局前缀
  app.setGlobalPrefix('api');

  // 全局 Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  // 全局响应拦截器
  app.useGlobalInterceptors(new TransformInterceptor(app.get('Reflector')));

  // 全局异常过滤器已通过 APP_FILTER 在 AppModule 中注册

  // Swagger 文档
  const swaggerConfig = new DocumentBuilder()
    .setTitle('后台管理系统 API')
    .setDescription('Admin Template API Documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  await app.listen(port);

  Logger.log(`Server running on http://localhost:${port}`, 'Bootstrap');
  Logger.log(`Swagger docs at http://localhost:${port}/docs`, 'Bootstrap');
}

bootstrap();
