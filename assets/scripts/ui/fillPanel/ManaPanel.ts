import { _decorator } from 'cc';
import { FillPanel } from './FillPanel';
import EventBus, { BaseEvent } from '../../sys/eventBus/EventBus';
import { ManaStatsChangedEvent, UpdateStatsEvent } from '../../character/Character';
const { ccclass, property } = _decorator;

@ccclass('ManaPanel')
export class ManaPanel extends FillPanel {

  public init(currentAmount: number, maxAmount: number): void {
    super.init(currentAmount, maxAmount);
    EventBus.subscribe(ManaStatsChangedEvent.EVENT_ID, (ev) => this.onManaUpdate(ev));
    EventBus.subscribe(UpdateStatsEvent.EVENT_ID, (ev => this.onStatsUpdate(ev)));
  }

  private onManaUpdate(event: BaseEvent) {
    const manaUpdateEvent = event as ManaStatsChangedEvent;
    this.currentAmount = manaUpdateEvent.currentMana;
    this.maxAmount = manaUpdateEvent.currentMaxMana;
    this.updateFill();
  }

  private onStatsUpdate(event: BaseEvent) {
    const statsUpdateEvent = event as UpdateStatsEvent;
    this.maxAmount = statsUpdateEvent.currentStats.mp.amount;
    this.updateFill();
  }

}


