import { _decorator, Component, Label, Node, Sprite, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('InventoryTooltipUI')
export class InventoryTooltipUI extends Component {
  @property(Label)
  private itemName: Label = null!;

  @property(Sprite)
  private itemIcon: Sprite = null!;

  @property(Label)
  private itemStats: Label = null!;

  @property(Label)
  private itemDescription: Label = null!;

  public show(itemTitle: string, itemIcon: Sprite, itemStats: string, itemDescription: string, worldPosition: Vec3): void {
    this.itemName.string = itemTitle;
    this.itemIcon.spriteFrame = itemIcon.spriteFrame;
    this.itemStats.string = itemStats;
    this.itemDescription.string = itemDescription;
    this.node.setWorldPosition(worldPosition);
  }
}


