import type { BattleEvent } from '@/types/game'

type BattleEventListener = (event: BattleEvent) => void

export class GameLoop {
  private intervalId: number | null = null
  private readonly tickRate: number

  constructor(tickRate = 100) {
    this.tickRate = tickRate
  }

  start(onTick: (deltaMs: number) => void): void {
    this.stop()
    this.intervalId = window.setInterval(() => onTick(this.tickRate), this.tickRate)
  }

  stop(): void {
    if (this.intervalId !== null) {
      window.clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  get isRunning(): boolean {
    return this.intervalId !== null
  }
}

export class BattleEventBus {
  private listeners = new Set<BattleEventListener>()

  subscribe(listener: BattleEventListener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  emit(event: BattleEvent): void {
    for (const listener of this.listeners) {
      listener(event)
    }
  }
}

export const battleEventBus = new BattleEventBus()
