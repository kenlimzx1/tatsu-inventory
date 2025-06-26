import { _decorator, Component, game, instantiate, Label, Node, Prefab, SpriteFrame, Tween, tween, Vec3 } from 'cc';
import { InventoryManager } from '../InventoryManager';
import { InventoryGameItemSlotView, InventoryGameItemSlotViewData } from './InventoryGameItemSlotView';
import { GameItemDatabase } from '../../gameItem/GameItemDatabase';
import { ConsumableCategory, EquipmentCategory, GameItem } from '../../gameItem/GameItem';
import { InventoryTooltipPosition, InventoryTooltipUI, InventoryTooltipUIData } from './InventoryTooltipUI';
import { Character, HealthStatsChangedEvent, ManaStatsChangedEvent, UpdateStatsEvent } from '../../character/Character';
import { EquipmentSlotView, EquipmentSlotViewData } from './EquipmentSlotView';
import EventBus, { BaseEvent } from '../../sys/eventBus/EventBus';
import { InventorySlot } from '../InventorySlot';
import { StatusText } from '../../ui/statusText/StatusText';
import { StatusPointsText } from '../../ui/statusText/StatusPointsText';

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

  @property(StatusPointsText)
  private healthStatsLabel: StatusPointsText = null!;

  @property(StatusPointsText)
  private manaStatsLabel: StatusPointsText = null!;

  @property(StatusText)
  private strStatsLabel: StatusText = null!;

  @property(StatusText)
  private agiStatsLabel: StatusText = null!;

  @property(StatusText)
  private intStatsLabel: StatusText = null!;

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
    EventBus.subscribe(UpdateStatsEvent.EVENT_ID, () => this.updateStatusLabels());
    EventBus.subscribe(HealthStatsChangedEvent.EVENT_ID, (ev) => this.onHealthUpdate(ev));
    EventBus.subscribe(ManaStatsChangedEvent.EVENT_ID, (ev) => this.onManaUpdate(ev));
  }

  public show() {
    this.selectedItemIndex = -1;
    this.selectedEquipmentIndex = -1;
    this.selectEquipmentTab(true);
    this.tooltip.node.active = false;

    this.healthStatsLabel.setAmountAndMaxAmount(this.character.currentHealth, this.character.currentMaxHealth.amount);
    this.manaStatsLabel.setAmountAndMaxAmount(this.character.currentMana, this.character.currentMaxMana.amount);
    this.strStatsLabel.setAmount(this.character.currentStr.amount);
    this.agiStatsLabel.setAmount(this.character.currentAgi.amount);
    this.intStatsLabel.setAmount(this.character.currentInt.amount);

    this.initEquipmentSlots();
  }

  private initEquipmentSlots() {
    const slots = [
      { slot: this.weaponSlot, id: this.character.equippedWeapon, index: 0, icon: this.getCategoryIcon("weapon")! },
      { slot: this.helmetSlot, id: this.character.equippedHelmet, index: 1, icon: this.getCategoryIcon("helmet")! },
      { slot: this.armourSlot, id: this.character.equippedArmour, index: 2, icon: this.getCategoryIcon("armour")! },
      { slot: this.bootsSlot, id: this.character.equippedBoots, index: 3, icon: this.getCategoryIcon("boots")! },
    ];
    slots.forEach(({ slot, id, index, icon }) => {
      if (id === "") {
        slot.updateData(null);
      } else {
        const info = GameItemDatabase.instance.getEquipmentInfo(id)!;
        const itemIcon = GameItemDatabase.instance.getIcon(info.icon)!;
        slot.updateData(new EquipmentSlotViewData(info, itemIcon), false);
      }
      slot.init(index, icon,
        (type) => this.selectEquipSlot(type),
        (type) => this.hoverEquipment(type),
        (type) => this.unHoverEquipment(type),
      );
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
      itemSlotView.init(i, (idx) => this.selectItem(idx), (idx) => this.hoverItem(idx), (idx) => this.unhoverItem(idx));
      this.updateInventorySlotView(itemSlotView, itemSlot, this.currentTab);
    }
  }

  private updateInventorySlotView(
    itemSlotView: InventoryGameItemSlotView,
    inventorySlot: InventorySlot,
    inventoryTab: InventoryTab
  ) {
    let data: InventoryGameItemSlotViewData | null = null;
    if (inventorySlot && !inventorySlot.isEmpty) {
      let gameItem: GameItem | null = null;
      if (inventoryTab === "equipment")
        gameItem = GameItemDatabase.instance.getEquipmentInfo(inventorySlot.itemId)!;
      else
        gameItem = GameItemDatabase.instance.getConsumableInfo(inventorySlot.itemId)!;
      const icon = GameItemDatabase.instance.getIcon(gameItem.icon)!;
      const categoryIcon = this.getCategoryIcon(gameItem.category)!;
      data = new InventoryGameItemSlotViewData(gameItem, icon, inventorySlot.quantity, categoryIcon);
    }
    itemSlotView.updateData(data);
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
            this.equipItem();
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
    const fromView = this.itemSlotViews[from];
    const toView = this.itemSlotViews[to];
    const temp = new InventorySlot();
    temp.setItem(fromSlot.itemId, fromSlot.quantity);

    if (toSlot.isEmpty)
      fromSlot.setItem("", 0);
    else
      fromSlot.setItem(toSlot.itemId, toSlot.quantity);

    if (temp.isEmpty)
      toSlot.setItem("", 0);
    else
      toSlot.setItem(temp.itemId, temp.quantity);

    this.updateInventorySlotView(fromView, fromSlot, this.currentTab);
    this.updateInventorySlotView(toView, toSlot, this.currentTab);

    this.unhoverItem(-1);
  }

  private equipItem() {
    const slot = this.inventoryManager.getSlot(this.selectedItemIndex, "equipment")!;
    const view = this.itemSlotViews[this.selectedItemIndex];
    const info = GameItemDatabase.instance.getEquipmentInfo(slot.itemId)!;
    const icon = GameItemDatabase.instance.getIcon(info.icon)!;
    let toPutBack = "";
    let equipView: EquipmentSlotView = null!;

    switch (info.category) {
      case "weapon": toPutBack = this.character.equippedWeapon; equipView = this.weaponSlot; break;
      case "helmet": toPutBack = this.character.equippedHelmet; equipView = this.helmetSlot; break;
      case "armour": toPutBack = this.character.equippedArmour; equipView = this.armourSlot; break;
      case "boots": toPutBack = this.character.equippedBoots; equipView = this.bootsSlot; break;
    }

    if (toPutBack)
      slot.setItem(toPutBack, 1);
    else
      slot.clear();

    this.updateInventorySlotView(view, slot, "equipment");
    equipView.updateData(new EquipmentSlotViewData(info, icon));
    this.character.equip(info.id, info.category as EquipmentCategory);
    this.unhoverItem(-1);
  }

  private useItem() {
    const slot = this.inventoryManager.getSlot(this.selectedItemIndex, "consumable")!;
    const view = this.itemSlotViews[this.selectedItemIndex];
    const info = GameItemDatabase.instance.getConsumableInfo(slot.itemId)!;
    for (const effect of info.effects)
      this.character.use(effect);

    slot.quantity--;
    if (slot.quantity <= 0)
      slot.clear();
    this.updateInventorySlotView(view, slot, "consumable");

    this.unhoverItem(-1);
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

  private unhoverItem(index: number) {
    this.tooltip.node.active = false;
  }

  private selectEquipSlot(index: number) {
    if (this.selectedItemIndex === -1) {
      if (this.selectedEquipmentIndex === index) {
        const equipSlot = this.getEquipmentSlot(this.selectedEquipmentIndex)!;
        if (!equipSlot.isEmpty) this.unequip(index);
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
    if (!slot || slot.isEmpty) return;
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

  private unequip(index: number, targetIndex: number = -1) {
    if (targetIndex === -1) {
      targetIndex = this.inventoryManager.findFirstEmptySlot("equipment");
      if (targetIndex === -1) {
        console.error("No slot available!");
        return;
      }
    }
    const info = this.getEquipmentInfo(index)!;
    this.character.equip("", info.category as EquipmentCategory);
    const slot = this.inventoryManager.getSlot(targetIndex, "equipment")!;
    slot.setItem(info.id, 1);

    const equipView = this.getEquipmentSlot(index)!;
    equipView.updateData(null);

    if (this.currentTab === "equipment") {
      const itemView = this.itemSlotViews[targetIndex];
      this.updateInventorySlotView(itemView, slot, "equipment");
    }

    this.unhoverItem(-1);
  }

  private getCategoryIcon(category: EquipmentCategory | ConsumableCategory): SpriteFrame | null {
    switch (category) {
      case "potion": return this.itemCategorySprites[0];
      case "other": return null;
      case "weapon": return this.equipmentCategorySprites[0];
      case "helmet": return this.equipmentCategorySprites[1];
      case "armour": return this.equipmentCategorySprites[2];
      case "boots": return this.equipmentCategorySprites[3];
      default: return null;
    }
  }

  selectEquipmentTab(force = false) {
    if (this.currentTab === 'equipment' && !force) return;
    this.currentTab = 'equipment';
    this.updateInventorySlots();
    this.unhoverItem(-1);
    this.moveSelectedTabIndicator(new Vec3(this.equipmentTabButton.position.x, this.selectedTabIndicator.position.y));
  }

  selectConsumableTab(force = false) {
    if (this.currentTab === 'consumable' && !force) return;
    this.currentTab = 'consumable';
    this.updateInventorySlots();
    this.unhoverItem(-1);
    this.moveSelectedTabIndicator(new Vec3(this.consumableTabButton.position.x, this.selectedTabIndicator.position.y));
  }

  private moveSelectedTabIndicator(targetPosition: Vec3) {
    Tween.stopAllByTarget(this.selectedTabIndicator);
    tween(this.selectedTabIndicator)
      .to(.25, { position: targetPosition }, { easing: 'quadOut' })
      .start();
  }

  private updateStatusLabels() {
    this.healthStatsLabel.setAmountAndMaxAmount(this.character.currentHealth, this.character.currentMaxHealth.amount);
    this.manaStatsLabel.setAmountAndMaxAmount(this.character.currentMana, this.character.currentMaxMana.amount);
    this.strStatsLabel.updateText(this.character.currentStr.amount);
    this.agiStatsLabel.updateText(this.character.currentAgi.amount);
    this.intStatsLabel.updateText(this.character.currentInt.amount);
  }

  private onHealthUpdate(_: BaseEvent) {
    this.healthStatsLabel.updateText(this.character.currentHealth);
  }

  private onManaUpdate(_: BaseEvent) {
    this.manaStatsLabel.updateText(this.character.currentMana);
  }

  close() {
    this.node.active = false;
  }
}
