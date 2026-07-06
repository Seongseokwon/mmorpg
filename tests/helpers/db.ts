import type { Page } from '@playwright/test'
import type { FixtureSaveData } from '../fixtures/save-data'

const DB_NAME = 'mmorpg-idle'
const DB_VERSION = 1
const STORE_NAME = 'save'
const SAVE_KEY = 'main'

/**
 * 앱을 한 번 로드해 기본 상태로 부팅한 뒤, IndexedDB의 저장 레코드를 지정한 값으로
 * 덮어쓰고 새로고침해서 그 상태로 다시 부팅시킨다. gacha/전투 등 확률에 의존하지 않고
 * 원하는 게임 상태를 결정적으로 재현하기 위한 시딩 방법.
 */
export async function seedSaveAndReload(page: Page, data: FixtureSaveData): Promise<void> {
  await page.goto('/')
  await page.waitForLoadState('domcontentloaded')

  await page.evaluate(
    ({ dbName, dbVersion, storeName, saveKey, payload }) => {
      return new Promise<void>((resolve, reject) => {
        const req = indexedDB.open(dbName, dbVersion)
        req.onupgradeneeded = () => {
          const db = req.result
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName)
          }
        }
        req.onerror = () => reject(req.error)
        req.onsuccess = () => {
          const db = req.result
          const tx = db.transaction(storeName, 'readwrite')
          tx.objectStore(storeName).put(payload, saveKey)
          tx.oncomplete = () => {
            db.close()
            resolve()
          }
          tx.onerror = () => reject(tx.error)
        }
      })
    },
    { dbName: DB_NAME, dbVersion: DB_VERSION, storeName: STORE_NAME, saveKey: SAVE_KEY, payload: data },
  )

  await page.reload()
  await page.waitForLoadState('domcontentloaded')
}

/**
 * v2/v3 시절의 옛 저장 포맷처럼 SaveData 스키마를 따르지 않는 임의의 raw 객체를 그대로 심는다.
 * saveService.ts의 migrateSaveData()가 실제로 그 포맷을 v4로 변환하는지 검증하기 위한 용도.
 */
export async function seedRawAndReload(page: Page, raw: Record<string, unknown>): Promise<void> {
  await page.goto('/')
  await page.waitForLoadState('domcontentloaded')

  await page.evaluate(
    ({ dbName, dbVersion, storeName, saveKey, payload }) => {
      return new Promise<void>((resolve, reject) => {
        const req = indexedDB.open(dbName, dbVersion)
        req.onupgradeneeded = () => {
          const db = req.result
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName)
          }
        }
        req.onerror = () => reject(req.error)
        req.onsuccess = () => {
          const db = req.result
          const tx = db.transaction(storeName, 'readwrite')
          tx.objectStore(storeName).put(payload, saveKey)
          tx.oncomplete = () => {
            db.close()
            resolve()
          }
          tx.onerror = () => reject(tx.error)
        }
      })
    },
    { dbName: DB_NAME, dbVersion: DB_VERSION, storeName: STORE_NAME, saveKey: SAVE_KEY, payload: raw },
  )

  await page.reload()
  await page.waitForLoadState('domcontentloaded')
}

/** 현재 저장된 IndexedDB 레코드를 읽어온다 (자동저장이 실제로 반영됐는지 검증용) */
export async function readSaveRecord(page: Page): Promise<FixtureSaveData | undefined> {
  return page.evaluate(
    ({ dbName, dbVersion, storeName, saveKey }) => {
      return new Promise<unknown>((resolve, reject) => {
        const req = indexedDB.open(dbName, dbVersion)
        req.onerror = () => reject(req.error)
        req.onsuccess = () => {
          const db = req.result
          const tx = db.transaction(storeName, 'readonly')
          const getReq = tx.objectStore(storeName).get(saveKey)
          getReq.onsuccess = () => {
            db.close()
            resolve(getReq.result)
          }
          getReq.onerror = () => reject(getReq.error)
        }
      })
    },
    { dbName: DB_NAME, dbVersion: DB_VERSION, storeName: STORE_NAME, saveKey: SAVE_KEY },
  ) as Promise<FixtureSaveData | undefined>
}
