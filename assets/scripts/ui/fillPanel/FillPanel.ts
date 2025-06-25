import { _decorator, Component, Node, Sprite } from 'cc';
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
    this.updateFill();
  }

  protected updateFill() {
    this.fillSprite.fillRange = this.currentAmount / this.maxAmount;
  }
}


