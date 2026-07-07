import { Controller, Get } from '@nestjs/common';
import { RankingService } from './ranking.service';

export interface RankingEntry {
  rank: number;
  nickname: string;
  level: number;
  maxClearedStage: number;
}

// 인증 가드 없음 — 게스트도 로그인 없이 랭킹을 구경할 수 있어야 한다(자기 진행상황이
// 안 나올 뿐, 다른 유저 기록을 보는 건 로그인 여부와 무관하게 허용).
@Controller('ranking')
export class RankingController {
  constructor(private readonly ranking: RankingService) {}

  @Get()
  async get(): Promise<RankingEntry[]> {
    const rows = await this.ranking.getTopRankings();
    return rows.map((row, index) => ({ rank: index + 1, ...row }));
  }
}
