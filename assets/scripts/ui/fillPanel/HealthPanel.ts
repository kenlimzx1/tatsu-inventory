import { _decorator } from 'cc';
import { FillPanel } from './FillPanel';
import EventBus, { BaseEvent } from '../../sys/eventBus/EventBus';
import { HealthStatsChangedEvent } from '../../character/Character';
const { ccclass, property } = _decorator;

@ccclass('HealthPanel')
export class HealthPanel extends FillPanel {

  public init(currentAmount: number, maxAmount: number): void {
    super.init(currentAmount, maxAmount);
    EventBus.subscribe(HealthStatsChangedEvent.EVENT_ID, (ev) => this.onHealthUpdate(ev));
  }

  private onHealthUpdate(event: BaseEvent) {
    const healthUpdateEvent = event as HealthStatsChangedEvent;
    this.currentAmount = healthUpdateEvent.currentHealth;
    this.maxAmount = healthUpdateEvent.currentMaxHealth;
    this.fillSprite.fillRange = this.currentAmount / this.maxAmount;
  }
}


