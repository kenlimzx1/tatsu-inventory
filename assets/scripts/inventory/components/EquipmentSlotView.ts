import { _decorator, Button, Component, EventTouch, Node, Sprite, SpriteFrame, tween, Tween, Vec3 } from 'cc';
import { GameItem } from '../../gameItem/GameItem';
const { ccclass, property } = _decorator;

export class EquipmentSlotViewData {
  public gameItem: GameItem;
  public icon: SpriteFrame;

  constructor(gameItem: GameItem, icon: SpriteFrame) {
    this.gameItem = gameItem;
    this.icon = icon;
  }
}

@ccclass('EquipmentSlotView')
export class EquipmentSlotView extends Component {

  @property(Button)
  private button: Button = null!;

  @property(Sprite)
  private itemIcon: Sprite = null!;

  @property(Node)
  private emptySlotIndicator: Node = null!;

  @property(Node)
  private selectedIndicator: Node = null!;

  @property(Sprite)
  private categoryIcon: Sprite = null!;

  private index: number = -1;
  private data: EquipmentSlotViewData | null = null;
  private onSelected: (index: number) => void = null!;
  private onHovered: (index: number) => void = null!;
  private onUnhovered: (index: number) => void = null!;

  public get isEmpty(): boolean {
    return this.data === null;
  }

  protected start(): void {
    this.button.node.on(Node.EventType.MOUSE_ENTER, this.hover, this);
    this.button.node.on(Node.EventType.MOUSE_LEAVE, this.unHover, this);
    this.hideSelectedIndicator();
  }

  public init(
    index: number,
    equipmentCategoryIcon: SpriteFrame,
    onSelected: (index: number) => void,
    onHovered: (index: number) => void,
    onUnhovered: (index: number) => void
  ) {
    this.index = index;
    this.categoryIcon.node.active = true;
    this.categoryIcon.spriteFrame = equipmentCategoryIcon;
    this.onSelected = onSelected;
    this.onHovered = onHovered;
    this.onUnhovered = onUnhovered;
  }

  public updateData(data: EquipmentSlotViewData | null, useAnimation: boolean = true) {
    this.data = data;
    Tween.stopAllByTarget(this.node);
    this.node.scale = new Vec3(1, 1, 1);
    if (this.isEmpty) {
      this.emptySlotIndicator.active = true;
      this.itemIcon.node.active = false;
    } else {
      this.emptySlotIndicator.active = false;
      this.itemIcon.node.active = true;
      this.itemIcon.spriteFrame = data!.icon;
      if (useAnimation) {
        tween(this.node)
          .to(.1, { scale: new Vec3(.9, .9, .9) })
          .to(.1, { scale: new Vec3(1.1, 1.1, 1.1) })
          .to(.05, { scale: new Vec3(1, 1, 1) })
          .start();
      }
    }
  }

  select() {
    this.onSelected(this.index);
  }

  showSelectedIndicator() {
    Tween.stopAllByTarget(this.selectedIndicator);
    this.selectedIndicator.active = true;
    this.selectedIndicator.setScale(Vec3.ONE);
    tween(this.selectedIndicator)
      .to(0.2, { scale: new Vec3(0.9, 0.9, 1) })
      .to(0.2, { scale: Vec3.ONE })
      .start();
  }

  hideSelectedIndicator() {
    Tween.stopAllByTarget(this.selectedIndicator);
    this.selectedIndicator.active = false;
  }

  hover() {
    this.onHovered(this.index);
  }

  unHover() {
    this.onUnhovered(this.index);
  }
}
