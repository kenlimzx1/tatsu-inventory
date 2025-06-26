import { _decorator, Component, Node, Sprite, Tween, tween } from 'cc';
import EventBus from '../../sys/eventBus/EventBus';
const { ccclass, property } = _decorator;

@ccclass('FillPanel')
export class FillPanel extends Component {
  @property(Sprite)
  protected fillSprite: Sprite = null!;

  protected currentAmount: number = 0;
  protected maxAmount: number = 0;

  public init(currentAmount: number, maxAmount: number) {
    this.currentAmount = currentAmount;
    this.maxAmount = maxAmount;
    this.updateFill(false);
  }

  protected updateFill(useAnimation: boolean = true) {
    Tween.stopAllByTarget(this.fillSprite);
    if (useAnimation) {
      const target = this.currentAmount / this.maxAmount;
      const current = this.fillSprite.fillRange;
      const duration = Math.abs(target - current) / 1; // 1 second
      tween(this.fillSprite)
        .to(duration, { fillRange: target })
        .start();
    } else {
      this.fillSprite.fillRange = this.currentAmount / this.maxAmount;
    }
  }
}


