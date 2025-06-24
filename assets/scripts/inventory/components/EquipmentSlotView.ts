import { _decorator, Button, Component, EventTouch, Label, Node, Sprite, SpriteFrame, tween, Tween, Vec3 } from 'cc';
import { EquipmentCategory, GameItem } from '../../gameItem/GameItem';
const { ccclass, property } = _decorator;

export class EquipmentSlotViewData {
  public category: EquipmentCategory;
  public gameItem: GameItem | null;
  public icon: SpriteFrame | null;
  public quantity: number = 0;
  public onSelect: (category: EquipmentCategory) => void;
  public onHover: (category: EquipmentCategory) => void;
  public onUnHover: (category: EquipmentCategory) => void;

  constructor(category: EquipmentCategory, gameItem: GameItem | null, icon: SpriteFrame | null, onSelect: (category: EquipmentCategory) => void, onHover: (category: EquipmentCategory) => void = () => { }, onUnHover: (category: EquipmentCategory) => void = () => { }) {
    this.category = category;
    this.gameItem = gameItem;
    this.icon = icon;
    this.onSelect = onSelect;
    this.onHover = onHover;
    this.onUnHover = onUnHover;
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

  private category: EquipmentCategory = "armour";

  private data: EquipmentSlotViewData | null = null;

  protected start(): void {
    this.button.node.on(Node.EventType.MOUSE_ENTER, (event: EventTouch) => this.hover(event as EventTouch));
    this.button.node.on(Node.EventType.MOUSE_LEAVE, (event: EventTouch) => this.unHover(event as EventTouch));
    this.hideSelectedIndicator();
  }

  init(data: EquipmentSlotViewData) {
    this.data = data;
    this.category = data.category;
    if (data.gameItem === null) {
      this.emptySlotIndicator.active = true;
      this.itemIcon.node.active = false;
    } else {
      this.itemIcon.node.active = true;
      this.itemIcon.spriteFrame = data.icon;
      this.emptySlotIndicator.active = false;
    }
  }

  select() {
    this.data!.onSelect(this.category);
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
    this.data!.onHover(this.category);
  }

  unHover(event: EventTouch) {
    this.data!.onUnHover(this.category);
  }
}


