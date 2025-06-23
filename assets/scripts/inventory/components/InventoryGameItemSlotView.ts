import { _decorator, Button, Component, EventTouch, Input, input, Label, Node, Sprite, SpriteFrame, Tween, tween, Vec3 } from 'cc';
import { GameItem } from '../../gameItem/GameItem';
const { ccclass, property } = _decorator;

export class InventoryGameItemSlotViewData {
  public index: number;
  public gameItem: GameItem | null;
  public icon: SpriteFrame | null;
  public quantity: number = 0;
  public onSelect: (index: number) => void;
  public onHover: (index: number) => void;
  public onUnHover: (index: number) => void;

  constructor(index: number, gameItem: GameItem | null, icon: SpriteFrame | null, amount: number, onSelect: (index: number) => void, onHover: (index: number) => void = () => { }, onUnHover: (index: number) => void = () => { }) {
    this.index = index;
    this.gameItem = gameItem;
    this.icon = icon;
    this.onSelect = onSelect;
    this.onHover = onHover;
    this.onUnHover = onUnHover;
  }
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

  private index: number = 0;

  private data: InventoryGameItemSlotViewData | null = null;

  protected start(): void {
    this.button.node.on(Node.EventType.MOUSE_ENTER, (event: EventTouch) => this.hover(event as EventTouch));
    this.button.node.on(Node.EventType.MOUSE_LEAVE, (event: EventTouch) => this.unHover(event as EventTouch));
    this.hideSelectedIndicator();
  }

  init(data: InventoryGameItemSlotViewData) {
    this.data = data;
    this.index = data.index;
    if (data.gameItem === null) {
      this.emptySlotIndicator.active = true;
      this.itemIcon.node.active = false;
      this.quantityLabel.node.active = false;
    } else {
      this.itemIcon.node.active = true;
      this.itemIcon.spriteFrame = data.icon;
      this.emptySlotIndicator.active = false;
      if (data.quantity > 1) {
        this.quantityLabel.node.active = true;
        this.quantityLabel.string = data.quantity.toString();
      } else {
        this.quantityLabel.node.active = false;
      }
    }
  }

  select() {
    this.data!.onSelect(this.index);
  }

  showSelectedIndicator() {
    Tween.stopAllByTarget(this.selectedIndicator);
    this.selectedIndicator.active = true;
    this.selectedIndicator.setScale(new Vec3(1, 1, 1));
    tween(this.selectedIndicator)
      .to(0.2, { scale: new Vec3(.9, .9, 1) })
      .to(0.2, { scale: new Vec3(1, 1, 1) })
      .start();
  }

  hideSelectedIndicator() {
    Tween.stopAllByTarget(this.selectedIndicator);
    this.selectedIndicator.active = false;
  }

  hover(event: EventTouch) {
    this.data!.onHover(this.index);
  }

  unHover(event: EventTouch) {
    this.data!.onUnHover(this.index);
  }
}


