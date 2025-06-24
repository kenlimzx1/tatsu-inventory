import { _decorator, Component, instantiate, Node, Prefab, SpriteFrame, Tween, tween, Vec3 } from 'cc';
import { InventoryManager } from '../InventoryManager';
import { InventoryGameItemSlotView, InventoryGameItemSlotViewData } from './InventoryGameItemSlotView';
import { GameItemDatabase } from '../../gameItem/GameItemDatabase';
import { GameItem } from '../../gameItem/GameItem';
import { InventoryTooltipPosition, InventoryTooltipUI, InventoryTooltipUIData } from './InventoryTooltipUI';
import { CharacterManager } from '../../character/CharacterManager';
const { ccclass, property } = _decorator;

export type InventoryTab = 'equipment' | 'consumable';

@ccclass('InventoryView')
export class InventoryView extends Component {

  @property(InventoryManager)
  private inventoryManager: InventoryManager = null!;

  @property(CharacterManager)
  private characterManager: CharacterManager = null!;

  @property(Prefab)
  private inventorySlotPrefab: Prefab = null!;

  @property(Node)
  private inventoryContent: Node = null!;

  @property(Node)
  private equipmentTabButton: Node = null!;

  @property(Node)
  private consumableTabButton: Node = null!;

  @property(Node)
  private selectedTabIndicator: Node = null!;

  @property(InventoryTooltipUI)
  private tooltip: InventoryTooltipUI = null!;

  private itemSlots: InventoryGameItemSlotView[] = [];
  private currentTab: InventoryTab = 'equipment';
  private selectedItemIndex: number = -1;

  protected start(): void {
  }

  public show() {
    this.selectEquipmentTab(true);
    this.tooltip.node.active = false;
  }

  private updateInventorySlots() {
    let totalSlots: number;
    if (this.currentTab === 'equipment') {
      totalSlots = this.inventoryManager.totalEquipmentSlots;
    } else if (this.currentTab === 'consumable') {
      totalSlots = this.inventoryManager.totalConsumablelots;
    } else {
      totalSlots = 0; // Default to 0 if the tab is not recognized
    }
    this.generateSlots(totalSlots);
    if (this.selectedItemIndex !== -1)
      this.itemSlots[this.selectedItemIndex].hideSelectedIndicator();
    this.selectedItemIndex = -1;
  }

  private generateSlots(totalSlots: number) {
    if (this.itemSlots.length < totalSlots) {
      for (let i = this.itemSlots.length; i < totalSlots; i++) {
        const newSlotNode = instantiate(this.inventorySlotPrefab);
        newSlotNode.parent = this.inventoryContent;
        const newSlot = newSlotNode.getComponent(InventoryGameItemSlotView)!;
        this.itemSlots.push(newSlot);
      }
    } else if (this.itemSlots.length > totalSlots) {
      for (let i = this.itemSlots.length; i > totalSlots; i--) {
        this.itemSlots.pop()!.node.destroy();
      }
    }
    this.inventoryContent.setPosition(0, 370, 0);

    for (let i = 0; i < this.itemSlots.length; i++) {
      const slot = this.itemSlots[i];
      const item = this.inventoryManager.getSlot(i, this.currentTab);
      let gameItem: GameItem;
      let sprite: SpriteFrame;
      let slotViewData: InventoryGameItemSlotViewData;
      if (item === null || item.isEmpty()) {
        slotViewData = new InventoryGameItemSlotViewData(
          i,
          null,
          null,
          0,
          (index: number) => this.selectItem(index),
          (index: number) => this.hoverItem(index),
          (index: number) => this.unHoverItem(index)
        );
      } else {
        if (this.currentTab === 'equipment')
          gameItem = GameItemDatabase.instance.getEquipmentInfo(item!.itemId)!;
        else
          gameItem = GameItemDatabase.instance.getConsumableInfo(item!.itemId)!;
        sprite = GameItemDatabase.instance.getImage(gameItem.icon)!;
        slotViewData = new InventoryGameItemSlotViewData(
          i,
          gameItem,
          sprite,
          item.quantity,
          (index: number) => this.selectItem(index),
          (index: number) => this.hoverItem(index),
          (index: number) => this.unHoverItem(index)
        );
      }

      slot.init(slotViewData);
    }
  }

  private selectItem(index: number) {
    if (this.selectedItemIndex === index) {
      this.useOrEquipItem();
    } else {
      if (this.selectedItemIndex !== -1) {
        this.itemSlots[this.selectedItemIndex].hideSelectedIndicator();
      }
      this.selectedItemIndex = index;
      this.itemSlots[this.selectedItemIndex].showSelectedIndicator();
    }
  }

  private useOrEquipItem() {
    // this.selectedItemIndex
    this.itemSlots[this.selectedItemIndex].hideSelectedIndicator();
    console.log("Use Item at index: ", this.selectedItemIndex);

    this.selectedItemIndex = -1;
  }

  private hoverItem(index: number) {

    const slot = this.inventoryManager.getSlot(index, this.currentTab);
    if (slot === null || slot!.isEmpty())
      return;

    let gameItem: GameItem;
    let sprite: SpriteFrame;
    if (this.currentTab === 'equipment')
      gameItem = GameItemDatabase.instance.getEquipmentInfo(slot!.itemId)!;
    else
      gameItem = GameItemDatabase.instance.getConsumableInfo(slot!.itemId)!;
    sprite = GameItemDatabase.instance.getImage(gameItem.icon)!;

    this.tooltip.node.active = true;
    let effectString: string = "";
    for (let i = 0; i < gameItem.effects.length; i++) {
      effectString += gameItem.effects[i];
      if (i < gameItem.effects.length - 1) {
        effectString += "\n";
      }
    }
    const tooltipData = new InventoryTooltipUIData(gameItem.name, sprite, effectString, gameItem.description);

    const slotPosition = this.itemSlots[index].node.getWorldPosition();
    let inventoryPosition: InventoryTooltipPosition;
    if (slotPosition.y > 0) {
      if (index % 4 > 1) {
        inventoryPosition = 'top-right';
      } else {
        inventoryPosition = 'top-left';
      }
    } else {
      if (index % 4 > 1) {
        inventoryPosition = 'bottom-right';
      } else {
        inventoryPosition = 'bottom-left';
      }
    }

    this.tooltip.show(tooltipData, this.itemSlots[index].node.getWorldPosition(), inventoryPosition);
  }

  private unHoverItem(index: number) {
    this.tooltip.node.active = false;
  }

  selectEquipmentTab(force: boolean = false) {
    if (this.currentTab === 'equipment' && !force)
      return;

    this.currentTab = 'equipment';
    this.updateInventorySlots();

    // animating the selected tab indicator
    const targetPosition = new Vec3(this.equipmentTabButton.position.x, this.selectedTabIndicator.position.y);
    this.moveSelectedTabIndicator(targetPosition);
  }

  selectConsumableTab(force: boolean = false) {
    if (this.currentTab === 'consumable' && !force)
      return;

    this.currentTab = 'consumable';
    this.updateInventorySlots();

    // animating the selected tab indicator
    const targetPosition = new Vec3(this.consumableTabButton.position.x, this.selectedTabIndicator.position.y);
    this.moveSelectedTabIndicator(targetPosition);
  }

  private moveSelectedTabIndicator(targetPosition: Vec3) {
    Tween.stopAllByTarget(this.selectedTabIndicator);
    tween(this.selectedTabIndicator)
      .to(.25, { position: targetPosition }, { easing: 'quadOut' })
      .start();
  }

  close() {
    this.node.active = false;
  }
}


