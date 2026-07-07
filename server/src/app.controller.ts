import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  /** Render 헬스체크 대상. NestJS는 기본 루트 라우트가 없어 헬스체크가 항상 404 나는 걸 막는다. */
  @Get('health')
  health(): { status: 'ok' } {
    return { status: 'ok' };
  }
}
