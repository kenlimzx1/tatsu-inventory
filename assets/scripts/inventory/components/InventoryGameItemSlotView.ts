import { _decorator, Button, Component, EventTouch, Input, input, Label, Node, Sprite, SpriteFrame } from 'cc';
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

  private index: number = 0;

  private data: InventoryGameItemSlotViewData | null = null;

  protected start(): void {
    this.button.node.on(Node.EventType.MOUSE_ENTER, (event: EventTouch) => this.hover(event as EventTouch));
    this.button.node.on(Node.EventType.MOUSE_LEAVE, (event: EventTouch) => this.unHover(event as EventTouch));
    // this.node.on(Input.EventType.TOUCH_START, this.selectStart, this);
    // this.node.on(Input.EventType.TOUCH_MOVE, this.selectMove, this);
    // this.node.on(Input.EventType.TOUCH_END, this.selectEnd, this);
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
    console.log(`Slot ${this.index} selected`);
  }

  hover(event: EventTouch) {
    this.data!.onHover(this.index);
    console.log(`Slot ${this.index} hovered`);
  }

  unHover(event: EventTouch) {
    this.data!.onUnHover(this.index);
    console.log(`Slot ${this.index} unhovered`);
  }

  selectStart(event: EventTouch) {
    console.log(`Slot ${this.index} selected`);
  }

  selectMove(event: EventTouch) {
    console.log(`Slot ${this.index} move ` + event.getLocation().toString());
  }

  selectEnd(event: EventTouch) {
    console.log(`Slot ${this.index} selection ended`);
  }
}


