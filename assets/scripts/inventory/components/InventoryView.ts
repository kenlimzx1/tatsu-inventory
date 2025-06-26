import { _decorator, Component, game, instantiate, Label, Node, Prefab, Sprite, SpriteFrame, Tween, tween, Vec3 } from 'cc';
import { InventoryManager } from '../InventoryManager';
import { InventoryGameItemSlotView, InventoryGameItemSlotViewData } from './InventoryGameItemSlotView';
import { GameItemDatabase } from '../../gameItem/GameItemDatabase';
import { ConsumableCategory, EquipmentCategory, GameItem } from '../../gameItem/GameItem';
import { InventoryTooltipPosition, InventoryTooltipUI, InventoryTooltipUIData } from './InventoryTooltipUI';
import { Character, HealthStatsChangedEvent, ManaStatsChangedEvent, UpdateStatsEvent } from '../../character/Character';
import { EquipmentSlotView, EquipmentSlotViewData } from './EquipmentSlotView';
import EventBus, { BaseEvent } from '../../sys/eventBus/EventBus';
import { InventorySlot } from '../InventorySlot';
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
  private weaponSlot: EquipmentSlotView = null!;

  @property(EquipmentSlotView)
  private helmetSlot: EquipmentSlotView = null!;

  @property(EquipmentSlotView)
  private armourSlot: EquipmentSlotView = null!;

  @property(EquipmentSlotView)
  private bootsSlot: EquipmentSlotView = null!;

  @property(Label)
  private healthStatsLabel: Label = null!;

  @property(Label)
  private manaStatsLabel: Label = null!;

  @property(Label)
  private strStatsLabel: Label = null!;

  @property(Label)
  private agiStatsLabel: Label = null!;

  @property(Label)
  private intStatsLabel: Label = null!;

  @property(Node)
  private inventoryContent: Node = null!;

  @property(Node)
  private equipmentTabButton: Node = null!;

  @property(Node)
  private consumableTabButton: Node = null!;

  @property(Node)
  private selectedTabIndicator: Node = null!;

  @property([SpriteFrame])
  private itemCategorySprites: SpriteFrame[] = [];

  @property([SpriteFrame])
  private equipmentCategorySprites: SpriteFrame[] = [];

  @property(InventoryTooltipUI)
  private tooltip: InventoryTooltipUI = null!;

  private itemSlotViews: InventoryGameItemSlotView[] = [];
  private currentTab: InventoryTab = 'equipment';
  private selectedItemIndex = -1;
  private selectedEquipmentIndex = -1;

  protected start(): void {
    EventBus.subscribe(UpdateStatsEvent.EVENT_ID, (ev) => this.updateStatusLabels());
    EventBus.subscribe(HealthStatsChangedEvent.EVENT_ID, (ev) => this.onHealthUpdate(ev));
    EventBus.subscribe(ManaStatsChangedEvent.EVENT_ID, (ev) => this.onManaUpdate(ev));
  }

  public show() {
    this.selectedItemIndex = -1;
    this.selectedEquipmentIndex = -1;

    this.selectEquipmentTab(true);
    this.tooltip.node.active = false;
    this.updateStatusLabels();
    this.initEquipmentSlots();
  }

  private initEquipmentSlots() {
    const slots = [
      { slot: this.weaponSlot, id: this.character.equippedWeapon, idx: 0, categoryIcon: this.getCategoryIcon("weapon") },
      { slot: this.helmetSlot, id: this.character.equippedHelmet, idx: 1, categoryIcon: this.getCategoryIcon("helmet") },
      { slot: this.armourSlot, id: this.character.equippedArmour, idx: 2, categoryIcon: this.getCategoryIcon("armour") },
      { slot: this.bootsSlot, id: this.character.equippedBoots, idx: 3, categoryIcon: this.getCategoryIcon("boots") },
    ];
    slots.forEach(({ slot, id, idx, categoryIcon }) => {
      const info = GameItemDatabase.instance.getEquipmentInfo(id);
      const icon = info ? GameItemDatabase.instance.getIcon(info.icon)! : null;
      slot.init(new EquipmentSlotViewData(
        idx, info, icon, categoryIcon,
        (i) => this.selectEquipSlot(i),
        (i) => this.hoverEquipment(i),
        (i) => this.unHoverEquipment(i)
      ));
    });
  }

  private updateInventorySlots() {
    const totalSlots = this.currentTab === 'equipment'
      ? this.inventoryManager.totalEquipmentSlots
      : this.inventoryManager.totalConsumablelots || 0;
    this.generateSlots(totalSlots);
    if (this.selectedItemIndex !== -1)
      this.itemSlotViews[this.selectedItemIndex].hideSelectedIndicator();
    this.selectedItemIndex = -1;
  }

  private generateSlots(totalSlots: number) {
    while (this.itemSlotViews.length < totalSlots) {
      const slot = instantiate(this.inventorySlotPrefab).getComponent(InventoryGameItemSlotView)!;
      slot.node.parent = this.inventoryContent;
      this.itemSlotViews.push(slot);
    }
    while (this.itemSlotViews.length > totalSlots) {
      this.itemSlotViews.pop()!.node.destroy();
    }
    this.inventoryContent.setPosition(0, 370, 0);

    for (let i = 0; i < this.itemSlotViews.length; i++) {
      const itemSlot = this.inventoryManager.getSlot(i, this.currentTab)!;
      const itemSlotView = this.itemSlotViews[i];
      itemSlotView.init(i, (idx) => this.selectItem(idx), (idx) => this.hoverItem(idx), (idx) => this.unHoverItem(idx));
      this.updateInventorySlotView(itemSlotView, itemSlot);
    }
  }

  private updateInventorySlotView(itemSlotView: InventoryGameItemSlotView, inventorySlot: InventorySlot) {
    let itemSlotViewData: InventoryGameItemSlotViewData | null = null;
    if (inventorySlot && !inventorySlot.isEmpty) {
      let gameItem: GameItem | null = null;
      let icon: SpriteFrame | null = null;
      let categoryIcon: SpriteFrame | null = null;
      if (this.currentTab === "equipment")
        gameItem = GameItemDatabase.instance.getEquipmentInfo(inventorySlot.itemId)!;
      else
        gameItem = GameItemDatabase.instance.getConsumableInfo(inventorySlot.itemId)!;
      icon = GameItemDatabase.instance.getIcon(gameItem.icon)!;
      categoryIcon = this.getCategoryIcon(gameItem.category)!;
      itemSlotViewData = new InventoryGameItemSlotViewData(gameItem, icon, inventorySlot.quantity, categoryIcon);
    }
    itemSlotView.updateData(itemSlotViewData);
  }

  // private initInventorySlot(
  //   index: number,
  //   gameItem: GameItem | null,
  //   sprite: SpriteFrame | null,
  //   quantity: number,
  //   categorySprite: SpriteFrame | null
  // ) {
  //   this.itemSlotViews[index].init(new InventoryGameItemSlotViewData(
  //     index, gameItem, sprite, quantity, categorySprite,
  //     (idx) => this.selectItem(idx),
  //     (idx) => this.hoverItem(idx),
  //     (idx) => this.unHoverItem(idx)
  //   ));
  // }

  private updateInventorySlotBySlotIndex(index: number, slot: InventorySlot, gameItem: GameItem | null, sprite: SpriteFrame | null, categorySprite: SpriteFrame | null) {
    this.initInventorySlot(index, gameItem, sprite, slot.quantity, categorySprite);
  }

  private clearInventorySlot(index: number) {
    this.initInventorySlot(index, null, null, 0, null);
  }

  private selectItem(index: number) {
    if (this.selectedEquipmentIndex !== -1) {
      const equipmentSlot = this.getEquipmentSlot(this.selectedEquipmentIndex)!;
      if (this.currentTab === "equipment") {
        const slot = this.inventoryManager.getSlot(index, "equipment")!;
        if (!equipmentSlot.isEmpty) {
          if (slot.isEmpty) {
            this.unequip(this.selectedEquipmentIndex, index);
          } else {
            this.selectedItemIndex = index;
            this.itemSlotViews[this.selectedItemIndex].showSelectedIndicator();
          }
        } else {
          this.selectedItemIndex = index;
          this.itemSlotViews[this.selectedItemIndex].showSelectedIndicator();
        }
      } else {
        this.selectedItemIndex = index;
        this.itemSlotViews[this.selectedItemIndex].showSelectedIndicator();
      }
      this.selectedEquipmentIndex = -1;
      equipmentSlot.hideSelectedIndicator();
    } else {
      if (this.selectedItemIndex === index) {
        if (!this.itemSlotViews[this.selectedItemIndex].isEmpty) {
          if (this.currentTab === "equipment")
            this.equipItem()
          else
            this.useItem();
        }
        this.itemSlotViews[this.selectedItemIndex].hideSelectedIndicator();
        this.selectedItemIndex = -1;
      } else {
        if (this.selectedItemIndex === -1) {
          this.selectedItemIndex = index;
          this.itemSlotViews[this.selectedItemIndex].showSelectedIndicator();
        } else {
          if (!this.itemSlotViews[index].isEmpty || !this.itemSlotViews[this.selectedItemIndex].isEmpty) {
            this.switchItemSlotPosition(this.selectedItemIndex, index);
            this.itemSlotViews[this.selectedItemIndex].hideSelectedIndicator();
            this.selectedItemIndex = -1;
          } else {
            this.itemSlotViews[this.selectedItemIndex].hideSelectedIndicator();
            this.selectedItemIndex = index;
            this.itemSlotViews[this.selectedItemIndex].showSelectedIndicator();
          }
        }
      }
      this.selectedEquipmentIndex = -1;
    }
  }

  private switchItemSlotPosition(from: number, to: number) {
    const fromSlot = this.inventoryManager.getSlot(from, this.currentTab)!;
    const toSlot = this.inventoryManager.getSlot(to, this.currentTab)!;
    const tempSlot = new InventorySlot();
    tempSlot.setItem(fromSlot.itemId, fromSlot.quantity);

    if (toSlot.isEmpty)
      fromSlot.setItem("", 0);
    else
      fromSlot.setItem(toSlot.itemId, toSlot.quantity);

    if (tempSlot.isEmpty)
      toSlot.setItem("", 0);
    else
      toSlot.setItem(tempSlot.itemId, tempSlot.quantity);

    this.refreshInventorySlot(from, fromSlot);
    this.refreshInventorySlot(to, toSlot);
  }

  private refreshInventorySlot(index: number, slot: InventorySlot) {
    let info: GameItem | null = null;
    let sprite: SpriteFrame | null = null;
    let categorySprite: SpriteFrame | null = null;
    if (!slot.isEmpty) {
      info = (this.currentTab === "consumable") ?
        GameItemDatabase.instance.getConsumableInfo(slot.itemId)! :
        GameItemDatabase.instance.getEquipmentInfo(slot.itemId)!;
      sprite = GameItemDatabase.instance.getIcon(info.icon)!;
      categorySprite = this.getCategoryIcon(info.category)!;
    }
    this.updateInventorySlotBySlotIndex(index, slot, info, sprite, categorySprite);
  }

  private equipItem() {
    const slot = this.inventoryManager.getSlot(this.selectedItemIndex, "equipment")!;
    const infoToEquip = GameItemDatabase.instance.getEquipmentInfo(slot.itemId)!;
    const iconToEquip = GameItemDatabase.instance.getIcon(infoToEquip.icon)!;
    const categoryIconToEquip = this.getCategoryIcon(infoToEquip.category)!;
    let equipmentToPutBack = "";
    let slotView: EquipmentSlotView = null!;
    let equipmentIndex: number = -1;

    switch (infoToEquip.category) {
      case "weapon": equipmentToPutBack = this.character.equippedWeapon; slotView = this.weaponSlot; equipmentIndex = 0; break;
      case "helmet": equipmentToPutBack = this.character.equippedHelmet; slotView = this.helmetSlot; equipmentIndex = 1; break;
      case "armour": equipmentToPutBack = this.character.equippedArmour; slotView = this.armourSlot; equipmentIndex = 2; break;
      case "boots": equipmentToPutBack = this.character.equippedBoots; slotView = this.bootsSlot; equipmentIndex = 3; break;
    }

    if (equipmentToPutBack) {
      slot.setItem(equipmentToPutBack, 1);
      const infoToPutBack = GameItemDatabase.instance.getEquipmentInfo(equipmentToPutBack)!;
      const iconToPutBack = GameItemDatabase.instance.getIcon(infoToPutBack.icon)!;
      const categoryIconToPutBack = this.getCategoryIcon(infoToPutBack.category)!;
      this.initInventorySlot(
        this.selectedItemIndex,
        infoToPutBack,
        iconToPutBack,
        1,
        categoryIconToPutBack
      );
    } else {
      slot.setItem("", 0);
      this.clearInventorySlot(this.selectedItemIndex);
    }

    this.initEquipmentSlotView(
      slotView,
      equipmentIndex,
      infoToEquip,
      iconToEquip,
      categoryIconToEquip
    );
    this.character.equip(infoToEquip.id, infoToEquip.category as EquipmentCategory);
  }

  private initEquipmentSlotView(
    slotView: EquipmentSlotView,
    equipmentIndex: number,
    info: GameItem | null,
    icon: SpriteFrame | null,
    categoryIcon: SpriteFrame | null
  ) {
    slotView.init(new EquipmentSlotViewData(
      equipmentIndex, info, icon, categoryIcon,
      (i) => this.selectEquipSlot(i),
      (i) => this.hoverEquipment(i),
      (i) => this.unHoverEquipment(i)
    ));
  }

  private useItem() {
    const slot = this.inventoryManager.getSlot(this.selectedItemIndex, "consumable")!;
    const infoToUse = GameItemDatabase.instance.getConsumableInfo(slot!.itemId)!;
    for (const effect of infoToUse.effects) {
      this.character.use(effect);
    }

    slot.quantity--;
    if (slot.quantity <= 0) {
      slot.setItem("", 0);
      this.clearInventorySlot(this.selectedItemIndex);
    } else {
      this.itemSlotViews[this.selectedItemIndex].changeQuantity(slot!.quantity);
    }
  }

  private hoverItem(index: number) {
    const slot = this.inventoryManager.getSlot(index, this.currentTab);
    if (!slot || slot.isEmpty) return;
    const gameItem = this.currentTab === 'equipment'
      ? GameItemDatabase.instance.getEquipmentInfo(slot.itemId)!
      : GameItemDatabase.instance.getConsumableInfo(slot.itemId)!;
    const sprite = GameItemDatabase.instance.getIcon(gameItem.icon)!;
    const effectString = gameItem.effects.join('\n');
    const tooltipData = new InventoryTooltipUIData(gameItem.name, sprite, effectString, gameItem.description);

    const pos = this.itemSlotViews[index].node.getWorldPosition();
    const invPos: InventoryTooltipPosition =
      pos.y > 0 ? (index % 4 > 1 ? 'top-right' : 'top-left') : (index % 4 > 1 ? 'bottom-right' : 'bottom-left');
    this.tooltip.node.active = true;
    this.tooltip.show(tooltipData, pos, invPos);
  }

  private unHoverItem(index: number) {
    this.tooltip.node.active = false;
  }

  private selectEquipSlot(index: number) {
    if (this.selectedItemIndex === -1) {
      if (this.selectedEquipmentIndex === index) {
        const equipSlot = this.getEquipmentSlot(this.selectedEquipmentIndex)!;
        if (!equipSlot.isEmpty) {
          this.unequip(index);
        }
        equipSlot.hideSelectedIndicator();
        this.selectedEquipmentIndex = -1;
      } else {
        if (this.selectedEquipmentIndex !== -1)
          this.getEquipmentSlot(this.selectedEquipmentIndex)!.hideSelectedIndicator();
        this.selectedEquipmentIndex = index;
        this.getEquipmentSlot(this.selectedEquipmentIndex)!.showSelectedIndicator();
      }
    } else {
      if (this.currentTab === "equipment") {
        const slot = this.inventoryManager.getSlot(this.selectedItemIndex, "equipment")!;
        if (!slot.isEmpty) {
          const category = GameItemDatabase.instance.getEquipmentInfo(slot.itemId)!.category;
          const canEquip = (
            (category === "weapon" && index === 0) ||
            (category === "helmet" && index === 1) ||
            (category === "armour" && index === 2) ||
            (category === "boots" && index === 3)
          );
          if (canEquip) {
            this.equipItem();
            this.selectedEquipmentIndex = -1;
          } else {
            this.selectedEquipmentIndex = index;
            this.getEquipmentSlot(this.selectedEquipmentIndex)!.showSelectedIndicator();
          }
        } else {
          this.selectedEquipmentIndex = index;
          this.getEquipmentSlot(this.selectedEquipmentIndex)!.showSelectedIndicator();
        }
      } else {
        this.selectedEquipmentIndex = index;
        this.getEquipmentSlot(this.selectedEquipmentIndex)!.showSelectedIndicator();
      }
      this.itemSlotViews[this.selectedItemIndex].hideSelectedIndicator();
      this.selectedItemIndex = -1;
    }
  }

  private getEquipmentSlot(index: number): EquipmentSlotView | null {
    return [this.weaponSlot, this.helmetSlot, this.armourSlot, this.bootsSlot][index] || null;
  }

  private getEquipmentInfo(index: number): GameItem | null {
    const ids = [
      this.character.equippedWeapon,
      this.character.equippedHelmet,
      this.character.equippedArmour,
      this.character.equippedBoots
    ];
    return GameItemDatabase.instance.getEquipmentInfo(ids[index]);
  }

  private hoverEquipment(index: number) {
    const slot = this.getEquipmentSlot(index);
    if (!slot || slot.isEmpty)
      return;
    const info = this.getEquipmentInfo(index)!;
    const sprite = GameItemDatabase.instance.getIcon(info.icon)!;
    const effectString = info.effects.join('\n');
    const tooltipData = new InventoryTooltipUIData(info.name, sprite, effectString, info.description);
    const pos = slot.node.getWorldPosition();
    const invPos: InventoryTooltipPosition = index % 4 > 0 ? 'bottom-left' : 'top-left';
    this.tooltip.node.active = true;
    this.tooltip.show(tooltipData, pos, invPos);
  }

  private unHoverEquipment(index: number) {
    this.tooltip.node.active = false;
  }

  private unequip(index: number, targetInventorySlotItemIndex: number = -1) {
    if (targetInventorySlotItemIndex === -1) {
      targetInventorySlotItemIndex = this.inventoryManager.findFirstEmptySlot("equipment");
      if (targetInventorySlotItemIndex === -1) {
        console.error("No slot available!");
        return;
      }
    }
    const equipmentInfo = this.getEquipmentInfo(index)!;
    this.character.equip("", equipmentInfo.category as EquipmentCategory);
    const slot = this.inventoryManager.getSlot(targetInventorySlotItemIndex, "equipment")!;
    slot.setItem(equipmentInfo.id, 1);
    const categoryIcon = this.getCategoryIcon(equipmentInfo.category);

    const equipSlot = this.getEquipmentSlot(index)!;
    this.initEquipmentSlotView(
      equipSlot,
      index,
      null,
      null,
      categoryIcon
    );

    if (this.currentTab === "equipment") {
      const sprite = GameItemDatabase.instance.getIcon(equipmentInfo.icon)!;
      this.initInventorySlot(
        targetInventorySlotItemIndex,
        equipmentInfo,
        sprite,
        1,
        this.getCategoryIcon(equipmentInfo.category)!
      );
    }
  }

  private getCategoryIcon(category: EquipmentCategory | ConsumableCategory): SpriteFrame | null {
    switch (category) {
      case "potion":
        return this.itemCategorySprites[0];
      case "other":
        return null;
      case "weapon":
        return this.equipmentCategorySprites[0];
      case "helmet":
        return this.equipmentCategorySprites[1];
      case "armour":
        return this.equipmentCategorySprites[2];
      case "boots":
        return this.equipmentCategorySprites[3];
      default:
        return null;
    }
  }

  selectEquipmentTab(force = false) {
    if (this.currentTab === 'equipment' && !force) return;
    this.currentTab = 'equipment';
    this.updateInventorySlots();
    this.moveSelectedTabIndicator(new Vec3(this.equipmentTabButton.position.x, this.selectedTabIndicator.position.y));
  }

  selectConsumableTab(force = false) {
    if (this.currentTab === 'consumable' && !force) return;
    this.currentTab = 'consumable';
    this.updateInventorySlots();
    this.moveSelectedTabIndicator(new Vec3(this.consumableTabButton.position.x, this.selectedTabIndicator.position.y));
  }

  private moveSelectedTabIndicator(targetPosition: Vec3) {
    Tween.stopAllByTarget(this.selectedTabIndicator);
    tween(this.selectedTabIndicator)
      .to(.25, { position: targetPosition }, { easing: 'quadOut' })
      .start();
  }

  private updateStatusLabels() {
    this.healthStatsLabel.string = `${this.character.currentHealth} / ${this.character.currentMaxHealth.amount}`;
    this.manaStatsLabel.string = `${this.character.currentMana} / ${this.character.currentMaxMana.amount}`;
    this.strStatsLabel.string = `${this.character.currentStr.amount}`;
    this.agiStatsLabel.string = `${this.character.currentAgi.amount}`;
    this.intStatsLabel.string = `${this.character.currentInt.amount}`;
  }

  private onHealthUpdate(event: BaseEvent) {
    this.healthStatsLabel.string = `${this.character.currentHealth} / ${this.character.currentMaxHealth.amount}`;
  }

  private onManaUpdate(event: BaseEvent) {
    this.manaStatsLabel.string = `${this.character.currentMana} / ${this.character.currentMaxMana.amount}`;
  }

  close() {
    this.node.active = false;
  }
}
