import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Ranking (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const runId = Date.now();
  const users = [
    { email: `e2e-rank-a-${runId}@example.com`, nickname: '느린모험가', maxClearedStage: 3, level: 5 },
    { email: `e2e-rank-b-${runId}@example.com`, nickname: '빠른모험가', maxClearedStage: 20, level: 15 },
    { email: `e2e-rank-c-${runId}@example.com`, nickname: '중간모험가', maxClearedStage: 10, level: 8 },
  ];

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prisma = moduleRef.get(PrismaService);

    for (const user of users) {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: user.email, password: 'password123' });

      await request(app.getHttpServer())
        .put('/save')
        .set('Authorization', `Bearer ${res.body.accessToken}`)
        .send({
          version: 5,
          data: {
            nickname: user.nickname,
            level: user.level,
            maxClearedStage: user.maxClearedStage,
          },
        });
    }
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { in: users.map((u) => u.email) } } });
    await app.close();
  });

  it('인증 없이도 조회 가능하고, 최고 클리어 스테이지 내림차순으로 정렬되어 있다', async () => {
    const res = await request(app.getHttpServer()).get('/ranking').expect(200);

    const byNickname = new Map(res.body.map((entry: { nickname: string }) => [entry.nickname, entry]));
    const fast = byNickname.get('빠른모험가') as { rank: number; maxClearedStage: number; level: number };
    const mid = byNickname.get('중간모험가') as { rank: number; maxClearedStage: number; level: number };
    const slow = byNickname.get('느린모험가') as { rank: number; maxClearedStage: number; level: number };

    expect(fast).toBeDefined();
    expect(mid).toBeDefined();
    expect(slow).toBeDefined();
    expect(fast.rank).toBeLessThan(mid.rank);
    expect(mid.rank).toBeLessThan(slow.rank);
    expect(fast.maxClearedStage).toBe(20);
    expect(mid.level).toBe(8);
  });
});
