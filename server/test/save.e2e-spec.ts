import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Save (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  const email = `e2e-save-${Date.now()}@example.com`;
  const password = 'password123';

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prisma = moduleRef.get(PrismaService);

    const res = await request(app.getHttpServer()).post('/auth/register').send({ email, password });
    accessToken = res.body.accessToken;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email } });
    await app.close();
  });

  it('토큰 없이 요청하면 401을 반환한다', async () => {
    await request(app.getHttpServer()).get('/save').expect(401);
  });

  it('아직 저장한 적 없으면 빈 응답을 반환한다', async () => {
    const res = await request(app.getHttpServer())
      .get('/save')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.text).toBe('');
  });

  it('저장(PUT) 후 조회(GET)하면 그대로 반영되어 있다', async () => {
    const payload = { version: 4, data: { gold: 999, level: 5 } };

    const putRes = await request(app.getHttpServer())
      .put('/save')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(payload)
      .expect(200);

    expect(putRes.body.version).toBe(4);
    expect(putRes.body.data).toEqual({ gold: 999, level: 5 });

    const getRes = await request(app.getHttpServer())
      .get('/save')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(getRes.body.data).toEqual({ gold: 999, level: 5 });
  });

  it('version 필드가 없으면 400을 반환한다', async () => {
    await request(app.getHttpServer())
      .put('/save')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ data: { gold: 1 } })
      .expect(400);
  });
});
