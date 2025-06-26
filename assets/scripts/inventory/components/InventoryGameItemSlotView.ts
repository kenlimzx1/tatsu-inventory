import { _decorator, Button, Component, Input, Label, Node, Sprite, SpriteFrame, Tween, tween, Vec3 } from 'cc';
import { GameItem } from '../../gameItem/GameItem';
const { ccclass, property } = _decorator;

export class InventoryGameItemSlotViewData {
  public gameItem: GameItem;
  public icon: SpriteFrame;
  public quantity: number = 0;
  public categoryIcon: SpriteFrame;

  constructor(gameItem: GameItem, icon: SpriteFrame, quantity: number = 0, categoryIcon: SpriteFrame) {
    this.gameItem = gameItem;
    this.icon = icon;
    this.quantity = quantity;
    this.categoryIcon = categoryIcon;
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

  @property(Sprite)
  private categoryIcon: Sprite = null!;

  private index: number = -1;
  private data: InventoryGameItemSlotViewData | null = null;
  private onSelected: (index: number) => void = null!;
  private onHovered: (index: number) => void = null!;
  private onUnhovered: (index: number) => void = null!;

  public get isEmpty(): boolean {
    return this.data === null;
  }

  protected start(): void {
    this.button.node.on(Node.EventType.MOUSE_ENTER, this.hover, this);
    this.button.node.on(Node.EventType.MOUSE_LEAVE, this.unhover, this);
    this.node.on(Input.EventType.TOUCH_START, this.hover, this);
    this.node.on(Input.EventType.TOUCH_CANCEL, this.unhover, this);
    this.hideSelectedIndicator();
  }

  public init(
    index: number,
    onSelected: (index: number) => void,
    onHovered: (index: number) => void,
    onUnhovered: (index: number) => void
  ) {
    this.index = index;
    this.onSelected = onSelected;
    this.onHovered = onHovered;
    this.onUnhovered = onUnhovered;
  }

  public updateData(data: InventoryGameItemSlotViewData | null) {
    this.data = data;
    if (this.isEmpty) {
      this.emptySlotIndicator.active = true;
      this.itemIcon.node.active = false;
      this.categoryIcon.node.active = false;
    } else {
      this.emptySlotIndicator.active = false;
      this.itemIcon.node.active = true;
      this.itemIcon.spriteFrame = data!.icon;
      this.categoryIcon.node.active = true;
      this.categoryIcon.spriteFrame = data!.categoryIcon;
    }
    this.updateQuantityLabel();
  }

  public select() {
    this.onSelected(this.index);
  }

  private updateQuantityLabel() {
    const showQuantity = !this.isEmpty && this.data!.quantity > 1;
    if (showQuantity) {
      this.quantityLabel.node.active = true;
      this.quantityLabel.string = this.data!.quantity.toString();
    } else {
      this.quantityLabel.node.active = false;
    }
  }

  public showSelectedIndicator() {
    Tween.stopAllByTarget(this.selectedIndicator);
    this.selectedIndicator.active = true;
    this.selectedIndicator.setScale(Vec3.ONE);
    tween(this.selectedIndicator)
      .to(0.2, { scale: new Vec3(.9, .9, 1) })
      .to(0.2, { scale: Vec3.ONE })
      .start();
  }

  public hideSelectedIndicator() {
    Tween.stopAllByTarget(this.selectedIndicator);
    this.selectedIndicator.active = false;
  }

  private hover() {
    this.onHovered(this.index);
  }

  private unhover() {
    this.onUnhovered(this.index);
  }
}
