import { IsInt, IsObject, Min } from 'class-validator';

export class UpsertSaveDto {
  @IsInt()
  @Min(1)
  version!: number;

  // 클라이언트(saveService.ts)가 이미 버전 마이그레이션을 마친 SaveData 블롭을 그대로 신뢰한다.
  // 필드별 재검증은 이번 범위에서 과설계로 본다 (docs/backend-guide.md 참고).
  @IsObject()
  data!: Record<string, unknown>;
}
