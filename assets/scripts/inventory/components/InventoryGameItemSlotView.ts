import { _decorator, Button, Component, Label, Node, Sprite, SpriteFrame, Tween, tween, Vec3 } from 'cc';
import { GameItem } from '../../gameItem/GameItem';
const { ccclass, property } = _decorator;

export class InventoryGameItemSlotViewData {
  public gameItem: GameItem;
  public icon: SpriteFrame;
  public quantity: number = 0;
  public itemCategoryIcon: SpriteFrame;

  constructor(gameItem: GameItem, icon: SpriteFrame, quantity: number = 0, itemCategoryIcon: SpriteFrame) {
    this.gameItem = gameItem;
    this.icon = icon;
    this.quantity = quantity;
    this.itemCategoryIcon = itemCategoryIcon;
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
  private categorySprite: Sprite = null!;

  private data: InventoryGameItemSlotViewData | null = null;

  private onSelect: (index: number) => void = null!;
  private onHover: (index: number) => void = null!;
  private onUnhover: (index: number) => void = null!;
  private index: number = -1;

  public get isEmpty(): boolean {
    return this.data === null;
  }

  protected start(): void {
    this.button.node.on(Node.EventType.MOUSE_ENTER, this.hover, this);
    this.button.node.on(Node.EventType.MOUSE_LEAVE, this.unhover, this);
    this.hideSelectedIndicator();
  }

  public init(index: number, onSelected: (index: number) => void, onHovered: (index: number) => void, onUnhovered: (index: number) => void) {
    this.index = index;
    this.onSelect = onSelected;
    this.onHover = onHovered;
    this.onUnhover = onUnhovered;
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

  public updateData(data: InventoryGameItemSlotViewData | null) {
    this.data = data;
    if (this.isEmpty) {
      this.emptySlotIndicator.active = true;
      this.itemIcon.node.active = false;
      this.categorySprite.node.active = false;
    } else {
      this.emptySlotIndicator.active = false;
      this.itemIcon.node.active = true;
      this.categorySprite.node.active = true;
      this.itemIcon.spriteFrame = data!.icon;
    }
    this.updateQuantityLabel();
  }

  public select() {
    this.onSelect(this.index);
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
    this.onHover(this.index);
  }

  private unhover() {
    this.onUnhover(this.index);
  }

  public changeQuantity(updatedQuantity: number) {
    this.data!.quantity = updatedQuantity;
    this.updateQuantityLabel();
  }
}
