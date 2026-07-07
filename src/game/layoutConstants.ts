/**
 * GameRenderer의 캐릭터/몬스터 배치 계산과, 그 위에 겹쳐 그리는 Vue UI 오버레이(예: 몬스터별 HP 미니바)가
 * 같은 좌표 기준을 공유해야 해서 별도 모듈로 뺐다. GameRenderer.ts에서만 쓰던 값을 여기로 옮긴 것뿐이라
 * 값 자체는 변경하지 않는다.
 */

/** 지면(캐릭터/몬스터 발밑) y 좌표 = 스테이지 박스 높이 * 이 비율 */
export const GROUND_Y_RATIO = 0.82

/** 몬스터 스프라이트 높이 = 스테이지 박스 높이 * 이 비율 */
export const MONSTER_HEIGHT_RATIO = 0.34

/** 보스는 전용 아트 없이 같은 스프라이트를 이 배율만큼 키워서 그린다 (GameRenderer.syncMonsters 참고) */
export const BOSS_SCALE_MULTIPLIER = 1.8
