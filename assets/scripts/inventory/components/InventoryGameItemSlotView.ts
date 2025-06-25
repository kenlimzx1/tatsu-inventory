import { _decorator, Button, Component, EventTouch, Label, Node, Sprite, SpriteFrame, Tween, tween, Vec3 } from 'cc';
import { GameItem } from '../../gameItem/GameItem';
const { ccclass, property } = _decorator;

export class InventoryGameItemSlotViewData {
  constructor(
    public index: number,
    public gameItem: GameItem | null,
    public icon: SpriteFrame | null,
    public quantity: number = 0,
    public onSelect: (index: number) => void = () => { },
    public onHover: (index: number) => void = () => { },
    public onUnHover: (index: number) => void = () => { }
  ) { }
}

@ccclass('InventoryGameItemSlotView')
export class InventoryGameItemSlotView extends Component {
  @property(Button)
  private button: Button = null!;

  @property(Sprite)
  private itemIcon: Sprite = null!;

  @property(Node)
  private emptySlotIndicator: Node = null!;

  @property(Label)
  private quantityLabel: Label = null!;

  @property(Node)
  private selectedIndicator: Node = null!;

  private data: InventoryGameItemSlotViewData | null = null;

  public isEmpty(): boolean {
    return !this.data?.gameItem;
  }

  protected start(): void {
    this.button.node.on(Node.EventType.MOUSE_ENTER, this.hover, this);
    this.button.node.on(Node.EventType.MOUSE_LEAVE, this.unHover, this);
    this.hideSelectedIndicator();
  }

  init(data: InventoryGameItemSlotViewData) {
    this.data = data;
    const isEmpty = !data.gameItem;
    this.emptySlotIndicator.active = isEmpty;
    this.itemIcon.node.active = !isEmpty;
    this.quantityLabel.node.active = !isEmpty && data.quantity > 1;
    if (!isEmpty) {
      this.itemIcon.spriteFrame = data.icon;
      if (data.quantity > 1) this.quantityLabel.string = data.quantity.toString();
    }
  }

  select() {
    this.data?.onSelect(this.data.index);
  }

  showSelectedIndicator() {
    Tween.stopAllByTarget(this.selectedIndicator);
    this.selectedIndicator.active = true;
    this.selectedIndicator.setScale(Vec3.ONE);
    tween(this.selectedIndicator)
      .to(0.2, { scale: new Vec3(.9, .9, 1) })
      .to(0.2, { scale: Vec3.ONE })
      .start();
  }

  hideSelectedIndicator() {
    Tween.stopAllByTarget(this.selectedIndicator);
    this.selectedIndicator.active = false;
  }

  hover() {
    this.data?.onHover(this.data.index);
  }

  unHover() {
    this.data?.onUnHover(this.data.index);
  }
}
