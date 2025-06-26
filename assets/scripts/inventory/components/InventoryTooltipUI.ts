import { _decorator, Component, Label, Node, Size, Sprite, SpriteFrame, UITransform, Vec3, Widget } from 'cc';
import { FitToBox2D } from '../../utils/FitToBox2D';
const { ccclass, property } = _decorator;

export type InventoryTooltipPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export class InventoryTooltipUIData {
  public itemTitle: string;
  public itemIcon: SpriteFrame;
  public itemStats: string;
  public itemDescription: string;

  constructor(itemTitle: string, itemIcon: SpriteFrame, itemStats: string, itemDescription: string) {
    this.itemTitle = itemTitle;
    this.itemIcon = itemIcon;
    this.itemStats = itemStats;
    this.itemDescription = itemDescription;
  }
}

@ccclass('InventoryTooltipUI')
export class InventoryTooltipUI extends Component {
  @property(UITransform)
  private pointerTransform: UITransform = null!;

  @property(Widget)
  private contentWidget: Widget = null!;

  @property(Label)
  private itemName: Label = null!;

  @property(Sprite)
  private itemIcon: Sprite = null!;

  @property(Label)
  private itemStats: Label = null!;

  @property(Label)
  private itemDescription: Label = null!;

  private iconReferenceSize: Size = new Size(150, 150);

  public show(data: InventoryTooltipUIData, worldPosition: Vec3, tooltipPosition: InventoryTooltipPosition): void {
    this.itemName.string = data.itemTitle;
    this.itemIcon.spriteFrame = data.itemIcon;

    const itemIconReferenceSize: Size = FitToBox2D.fitToBox2D(data.itemIcon.originalSize, this.iconReferenceSize);
    const itemIconTransform = this.itemIcon.getComponent(UITransform)!;
    itemIconTransform.width = itemIconReferenceSize.width;
    itemIconTransform.height = itemIconReferenceSize.height;

    this.itemStats.string = data.itemStats;
    this.itemDescription.string = data.itemDescription;

    // Set the position of the tooltip in world space
    this.node.setWorldPosition(worldPosition);
    this.setAnchorPosition(tooltipPosition);
  }

  private setAnchorPosition(position: InventoryTooltipPosition): void {
    switch (position) {
      case 'top-left':
        this.pointerTransform.setAnchorPoint(0, 1);
        this.contentWidget.isAlignLeft = true;
        this.contentWidget.isAlignRight = false;
        this.contentWidget.left = 0;
        this.contentWidget.isAlignTop = true;
        this.contentWidget.isAlignBottom = false;
        this.contentWidget.top = 0;
        break;
      case 'top-right':
        this.pointerTransform.setAnchorPoint(1, 1);
        this.contentWidget.isAlignRight = true;
        this.contentWidget.isAlignLeft = false;
        this.contentWidget.right = 0;
        this.contentWidget.isAlignTop = true;
        this.contentWidget.isAlignBottom = false;
        this.contentWidget.top = 0;
        break;
      case 'bottom-left':
        this.pointerTransform.setAnchorPoint(0, 0);
        this.contentWidget.isAlignLeft = true;
        this.contentWidget.isAlignRight = false;
        this.contentWidget.left = 0;
        this.contentWidget.isAlignBottom = true;
        this.contentWidget.isAlignTop = false;
        this.contentWidget.bottom = 0;
        break;
      case 'bottom-right':
        this.pointerTransform.setAnchorPoint(1, 0);
        this.contentWidget.isAlignRight = true;
        this.contentWidget.isAlignLeft = false;
        this.contentWidget.right = 0;
        this.contentWidget.isAlignBottom = true;
        this.contentWidget.isAlignTop = false;
        this.contentWidget.bottom = 0;
        break;
    }
  }
}


