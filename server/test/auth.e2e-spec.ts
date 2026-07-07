import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const email = `e2e-auth-${Date.now()}@example.com`;
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
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email } });
    await app.close();
  });

  it('회원가입하면 유저 정보와 액세스 토큰, 리프레시 쿠키를 받는다', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password })
      .expect(201);

    expect(res.body.user.email).toBe(email);
    expect(typeof res.body.accessToken).toBe('string');
    expect(res.headers['set-cookie']?.[0]).toMatch(/refreshToken=/);
  });

  it('이미 가입된 이메일로 재가입하면 409를 반환한다', async () => {
    await request(app.getHttpServer()).post('/auth/register').send({ email, password }).expect(409);
  });

  it('올바른 정보로 로그인하면 액세스 토큰을 받는다', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(200);

    expect(typeof res.body.accessToken).toBe('string');
  });

  it('틀린 비밀번호로 로그인하면 401을 반환한다', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'wrong-password' })
      .expect(401);
  });

  it('리프레시 쿠키로 새 액세스 토큰을 발급받는다', async () => {
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(200);

    const cookie = login.headers['set-cookie'];
    const refreshRes = await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Cookie', cookie)
      .expect(200);

    expect(typeof refreshRes.body.accessToken).toBe('string');
  });

  it('리프레시 쿠키 없이 요청하면 401을 반환한다', async () => {
    await request(app.getHttpServer()).post('/auth/refresh').expect(401);
  });
});
