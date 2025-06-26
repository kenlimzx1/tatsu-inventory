import { _decorator, Component, Label, Node, tween, Tween, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('StatusText')
export class StatusText extends Component {
  @property(Label)
  private statusLabel: Label = null!;

  private startAmount: number = 0;
  private targetAmount: number = 0;
  private currentAmount: number = 0;

  private static readonly DEFAULT_SCALE: Vec3 = new Vec3(.5, .5, 1);

  public setAmount(amount: number) {
    this.currentAmount = amount;
    this.targetAmount = amount;
    this.statusLabel.string = this.formatAmountString(amount);
  }

  public updateText(endAmount: number, onComplete: (() => void) | null = null) {
    this.unscheduleAllCallbacks();
    Tween.stopAllByTarget(this.statusLabel.node);
    this.statusLabel.node.scale = StatusText.DEFAULT_SCALE;

    this.startAmount = this.currentAmount;
    this.targetAmount = endAmount;

    const difference: number = Math.abs(endAmount - this.currentAmount);
    const changeSpeed: number = Math.max(100, difference / 100);

    const duration: number = Math.min(.5, difference / changeSpeed);
    let elapsedTime: number = 0;

    tween(this.statusLabel.node)
      .to(.15, { scale: new Vec3(.6, .6, 1) })
      .start();

    const textAnimate: Function = () => {
      if (elapsedTime >= duration) {
        this.currentAmount = this.targetAmount;
        this.statusLabel.string = this.formatAmountString(Math.floor(this.targetAmount));

        Tween.stopAllByTarget(this.statusLabel.node);
        tween(this.statusLabel.node)
          .to(.15, { scale: StatusText.DEFAULT_SCALE })
          .start();

        return;
      } else {
        const currentAmount: number = Math.round(this.lerp(this.startAmount, endAmount, (elapsedTime / duration)));
        this.currentAmount = currentAmount;
        this.statusLabel.string = this.formatAmountString(Math.round(currentAmount));
        elapsedTime += .01;
        this.scheduleOnce(() => textAnimate(), .01);
      }
    };

    textAnimate();
  }

  private formatAmountString(amount: number): string {
    return amount.toLocaleString(undefined, { maximumFractionDigits: 0, minimumFractionDigits: 0 });
  }

  private lerp(start: number, end: number, percent: number) {
    return start * (1 - percent) + end * percent;
  }
}


