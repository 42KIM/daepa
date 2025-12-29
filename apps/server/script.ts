/**
 * Admin 스크립트 - 데이터베이스 직접 조작용
 *
 * 사용법:
 *   pnpm server-script    (루트에서)
 *   pnpm script           (apps/server에서)
 */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { DataSource } from 'typeorm';

// Services - 필요한 서비스 import
// import { UserService } from './src/user/user.service';
// import { PetService } from './src/pet/pet.service';

async function bootstrap() {
  console.log('🚀 스크립트 시작...\n');

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  try {
    // DataSource 가져오기
    const dataSource = app.get(DataSource);

    // 필요한 서비스 가져오기
    // const userService = app.get(UserService);
    // const petService = app.get(PetService);

    // ========================================
    // 여기에 실행할 작업을 작성하세요
    // ========================================

    // 예시 1: Raw Query 실행
    // const result = await dataSource.query('SELECT COUNT(*) as count FROM pets');
    // console.log('펫 수:', result);

    // 예시 2: 서비스 메서드 사용
    // const users = await userService.findAll();
    // console.log('전체 사용자:', users.length);

    console.log('✅ 작업 완료');

    // ========================================
  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  } finally {
    await app.close();
    console.log('\n🔒 연결 종료');
  }
}

void bootstrap();
