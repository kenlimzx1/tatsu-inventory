import { _decorator, Component, instantiate, Node, Prefab, SpriteFrame, Tween, tween, Vec3 } from 'cc';
import { InventoryManager } from '../InventoryManager';
import { InventoryGameItemSlotView, InventoryGameItemSlotViewData } from './InventoryGameItemSlotView';
import { GameItemDatabase } from '../../gameItem/GameItemDatabase';
import { GameItem } from '../../gameItem/GameItem';
import { InventoryTooltipPosition, InventoryTooltipUI, InventoryTooltipUIData } from './InventoryTooltipUI';
import { Character } from '../../character/Character';
import { EquipmentSlotView, EquipmentSlotViewData } from './EquipmentSlotView';
const { ccclass, property } = _decorator;

export type InventoryTab = 'equipment' | 'consumable';

@ccclass('InventoryView')
export class InventoryView extends Component {

  @property(Character)
  private character: Character = null!;

  @property(InventoryManager)
  private inventoryManager: InventoryManager = null!;

  @property(Prefab)
  private inventorySlotPrefab: Prefab = null!;

  @property(EquipmentSlotView)
  private helmetSlot: EquipmentSlotView = null!;

  @property(EquipmentSlotView)
  private armourSlot: EquipmentSlotView = null!;

  @property(EquipmentSlotView)
  private bootsSlot: EquipmentSlotView = null!;

  @property(EquipmentSlotView)
  private weaponSlot: EquipmentSlotView = null!;

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
      if (this.currentTab === "equipment") {
        this.equipItem();
      } else {
        this.useItem();
      }
      this.itemSlots[this.selectedItemIndex].hideSelectedIndicator();
      this.selectedItemIndex = -1;
    } else {
      if (this.selectedItemIndex !== -1) {
        this.itemSlots[this.selectedItemIndex].hideSelectedIndicator();
      }
      this.selectedItemIndex = index;
      this.itemSlots[this.selectedItemIndex].showSelectedIndicator();
    }
  }

  private equipItem() {
    const slot = this.inventoryManager.getSlot(this.selectedItemIndex, "equipment");
    const equipmentInfo = GameItemDatabase.instance.getEquipmentInfo(slot!.itemId);
    const equipmentIcon = GameItemDatabase.instance.getImage(equipmentInfo!.icon)!;

    let needToPutBackEquipment: string = "";
    let equipmentSlot: EquipmentSlotView;

    switch (equipmentInfo!.category) {
      case "helmet":
        if (this.character.equippedHelmet !== "")
          needToPutBackEquipment = this.character.equippedHelmet;
        equipmentSlot = this.helmetSlot;
        break;
      case "armour":
        if (this.character.equippedArmour !== "")
          needToPutBackEquipment = this.character.equippedArmour;
        equipmentSlot = this.armourSlot;
        break;
      case "boots":
        if (this.character.equippedBoots !== "")
          needToPutBackEquipment = this.character.equippedBoots;
        equipmentSlot = this.bootsSlot;
        break;
      case "weapon":
        if (this.character.equippedWeapon !== "")
          needToPutBackEquipment = this.character.equippedWeapon;
        equipmentSlot = this.weaponSlot;
        break;
    }

    slot!.setItem(needToPutBackEquipment, 1);

    // refresh inventory slot view here
    const slotViewData = new InventoryGameItemSlotViewData(
      this.selectedItemIndex,
      equipmentInfo,
      equipmentIcon,
      1,
      (index: number) => this.selectItem(index),
      (index: number) => this.hoverItem(index),
      (index: number) => this.unHoverItem(index)
    );
    this.itemSlots[this.selectedItemIndex].init(slotViewData);

    // const equipmentData = new EquipmentSlotViewData(
    //   equipmentInfo!.category,
    //   equipmentInfo,
    //   equipmentIcon,

    // )

    // this.weaponSlot.init()

    this.character.equip(equipmentInfo!.id);
  }

  private useItem() {

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


