import { _decorator, Button, Component, EventTouch, Node, Sprite, SpriteFrame, tween, Tween, Vec3 } from 'cc';
import { GameItem } from '../../gameItem/GameItem';
const { ccclass, property } = _decorator;

export class EquipmentSlotViewData {
  constructor(
    public index: number,
    public gameItem: GameItem | null,
    public icon: SpriteFrame | null,
    public equipCategoryIcon: SpriteFrame | null,
    public onSelect: (index: number) => void,
    public onHover: (index: number) => void = () => { },
    public onUnHover: (index: number) => void = () => { }
  ) { }
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
  private categorySprite: Sprite = null!;

  private index = -1;
  private data: EquipmentSlotViewData | null = null;

  public get isEmpty(): boolean {
    return !this.data?.gameItem;
  }

  protected start(): void {
    this.button.node.on(Node.EventType.MOUSE_ENTER, this.hover, this);
    this.button.node.on(Node.EventType.MOUSE_LEAVE, this.unHover, this);
    this.hideSelectedIndicator();
  }

  init(data: EquipmentSlotViewData) {
    this.data = data;
    this.index = data.index;
    this.emptySlotIndicator.active = this.isEmpty;
    this.itemIcon.node.active = !this.isEmpty;
    this.categorySprite.node.active = true;
    this.categorySprite.spriteFrame = data.equipCategoryIcon;
    if (!this.isEmpty) {
      this.itemIcon.spriteFrame = data.icon;
    }
  }

  select() {
    this.data?.onSelect(this.index);
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
    this.data?.onHover(this.index);
  }

  unHover() {
    this.data?.onUnHover(this.index);
  }
}
