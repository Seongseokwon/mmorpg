import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const DEFAULT_LIMIT = 100;

export interface RankingRow {
  nickname: string;
  level: number;
  maxClearedStage: number;
}

@Injectable()
export class RankingService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 랭킹 기준은 최고 클리어 스테이지(maxClearedStage) — 골드처럼 소비로 줄어드는 값과 달리
   * 한 번 올라가면 내려가지 않아 랭킹 순위가 갑자기 요동치지 않는다. 레벨을 1차 동점 기준,
   * 먼저 그 기록을 달성한 유저(updatedAt 오름차순)를 2차 동점 기준으로 삼는다.
   *
   * SaveData는 Save.data(JSONB)에 통째로 들어있어 Prisma의 orderBy로는 표현할 수 없는
   * JSON 경로 정렬이 필요해 raw SQL을 쓴다. 닉네임 필드가 생기기 전에 저장된 옛 세이브를 위해
   * COALESCE로 기본값을 채운다.
   */
  async getTopRankings(limit: number = DEFAULT_LIMIT): Promise<RankingRow[]> {
    return this.prisma.$queryRaw<RankingRow[]>(Prisma.sql`
      SELECT
        COALESCE(data->>'nickname', '익명의 모험가') AS nickname,
        COALESCE((data->>'level')::int, 1) AS level,
        COALESCE((data->>'maxClearedStage')::int, 1) AS "maxClearedStage"
      FROM "Save"
      ORDER BY
        COALESCE((data->>'maxClearedStage')::int, 1) DESC,
        COALESCE((data->>'level')::int, 1) DESC,
        "updatedAt" ASC
      LIMIT ${limit}
    `);
  }
}
