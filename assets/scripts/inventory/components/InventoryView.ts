import { _decorator, Component, instantiate, Label, Node, Prefab, Sprite, SpriteFrame, Tween, tween, Vec3 } from 'cc';
import { InventoryManager } from '../InventoryManager';
import { InventoryGameItemSlotView, InventoryGameItemSlotViewData } from './InventoryGameItemSlotView';
import { GameItemDatabase } from '../../gameItem/GameItemDatabase';
import { EquipmentCategory, GameItem } from '../../gameItem/GameItem';
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

  @property(InventoryTooltipUI)
  private tooltip: InventoryTooltipUI = null!;

  private itemSlots: InventoryGameItemSlotView[] = [];
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
      { slot: this.weaponSlot, id: this.character.equippedWeapon, idx: 0 },
      { slot: this.helmetSlot, id: this.character.equippedHelmet, idx: 1 },
      { slot: this.armourSlot, id: this.character.equippedArmour, idx: 2 },
      { slot: this.bootsSlot, id: this.character.equippedBoots, idx: 3 },
    ];
    slots.forEach(({ slot, id, idx }) => {
      const info = GameItemDatabase.instance.getEquipmentInfo(id);
      const icon = info ? GameItemDatabase.instance.getImage(info.icon)! : null;
      slot.init(new EquipmentSlotViewData(
        idx, info, icon,
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
      this.itemSlots[this.selectedItemIndex].hideSelectedIndicator();
    this.selectedItemIndex = -1;
  }

  private generateSlots(totalSlots: number) {
    while (this.itemSlots.length < totalSlots) {
      const slot = instantiate(this.inventorySlotPrefab).getComponent(InventoryGameItemSlotView)!;
      slot.node.parent = this.inventoryContent;
      this.itemSlots.push(slot);
    }
    while (this.itemSlots.length > totalSlots) {
      this.itemSlots.pop()!.node.destroy();
    }
    this.inventoryContent.setPosition(0, 370, 0);

    for (let i = 0; i < this.itemSlots.length; i++) {
      const item = this.inventoryManager.getSlot(i, this.currentTab);
      let gameItem: GameItem | null = null;
      let sprite: SpriteFrame | null = null;
      if (item && !item.isEmpty()) {
        gameItem = this.currentTab === 'equipment'
          ? GameItemDatabase.instance.getEquipmentInfo(item.itemId)!
          : GameItemDatabase.instance.getConsumableInfo(item.itemId)!;
        sprite = GameItemDatabase.instance.getImage(gameItem.icon)!;
      }
      this.itemSlots[i].init(new InventoryGameItemSlotViewData(
        i, gameItem, sprite, item?.quantity ?? 0,
        (idx) => this.selectItem(idx),
        (idx) => this.hoverItem(idx),
        (idx) => this.unHoverItem(idx)
      ));
    }
  }

  private selectItem(index: number) {
    if (this.selectedEquipmentIndex !== -1) {
      const equipmentSlot = this.getEquipmentSlot(this.selectedEquipmentIndex)!;
      if (this.currentTab === "equipment") {
        const slot = this.inventoryManager.getSlot(index, "equipment")!;
        if (!equipmentSlot.isEmpty()) {
          if (slot.isEmpty()) {
            this.unequip(this.selectedEquipmentIndex, index);
          } else {
            this.selectedItemIndex = index;
            this.itemSlots[this.selectedItemIndex].showSelectedIndicator();
          }
        } else {
          this.selectedItemIndex = index;
          this.itemSlots[this.selectedItemIndex].showSelectedIndicator();
        }
      } else {
        this.selectedItemIndex = index;
        this.itemSlots[this.selectedItemIndex].showSelectedIndicator();
      }
      this.selectedEquipmentIndex = -1;
      equipmentSlot.hideSelectedIndicator();
    } else {
      if (this.selectedItemIndex === index) {
        if (!this.itemSlots[this.selectedItemIndex].isEmpty) {
          if (this.currentTab === "equipment")
            this.equipItem()
          else
            this.useItem();
        }
        this.itemSlots[this.selectedItemIndex].hideSelectedIndicator();
        this.selectedItemIndex = -1;
      } else {
        if (this.selectedItemIndex === -1) {
          this.selectedItemIndex = index;
          this.itemSlots[this.selectedItemIndex].showSelectedIndicator();
        } else {
          if (!this.itemSlots[index].isEmpty || !this.itemSlots[this.selectedItemIndex].isEmpty) {
            this.switchItemSlotPosition(this.selectedItemIndex, index);
            this.itemSlots[this.selectedItemIndex].hideSelectedIndicator();
            this.selectedItemIndex = -1;
          } else {
            this.itemSlots[this.selectedItemIndex].hideSelectedIndicator();
            this.selectedItemIndex = index;
            this.itemSlots[this.selectedItemIndex].showSelectedIndicator();
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

    if (toSlot.isEmpty())
      fromSlot.setItem("", 0);
    else
      fromSlot.setItem(toSlot.itemId, toSlot.quantity);

    if (tempSlot.isEmpty())
      toSlot.setItem("", 0);
    else
      toSlot.setItem(tempSlot.itemId, tempSlot.quantity);

    let fromInfo: GameItem | null = null;
    let fromSprite: SpriteFrame | null = null;
    let toInfo: GameItem | null = null;
    let toSprite: SpriteFrame | null = null;

    if (!fromSlot.isEmpty()) {
      fromInfo = (this.currentTab === "consumable") ?
        GameItemDatabase.instance.getConsumableInfo(fromSlot.itemId)! :
        GameItemDatabase.instance.getEquipmentInfo(fromSlot.itemId)!;
      fromSprite = GameItemDatabase.instance.getImage(fromInfo!.icon);
    }
    if (!toSlot.isEmpty()) {
      toInfo = (this.currentTab === "consumable") ?
        GameItemDatabase.instance.getConsumableInfo(toSlot.itemId)! :
        GameItemDatabase.instance.getEquipmentInfo(toSlot.itemId)!;
      toSprite = GameItemDatabase.instance.getImage(toInfo!.icon);
    }

    this.itemSlots[from].init(new InventoryGameItemSlotViewData(
      from, fromInfo, fromSprite, fromSlot.quantity,
      (i) => this.selectItem(i),
      (i) => this.hoverItem(i),
      (i) => this.unHoverItem(i)
    ));
    this.itemSlots[to].init(new InventoryGameItemSlotViewData(
      to, toInfo, toSprite, toSlot.quantity,
      (i) => this.selectItem(i),
      (i) => this.hoverItem(i),
      (i) => this.unHoverItem(i)
    ));
  }

  private equipItem() {
    const slot = this.inventoryManager.getSlot(this.selectedItemIndex, "equipment");
    const infoToEquip = GameItemDatabase.instance.getEquipmentInfo(slot!.itemId);
    const iconToEquip = GameItemDatabase.instance.getImage(infoToEquip!.icon)!;
    let equipmentToPutBack = "";
    let slotView: EquipmentSlotView = null!;
    let equipmentIndex: number = -1;

    switch (infoToEquip!.category) {
      case "weapon": equipmentToPutBack = this.character.equippedWeapon; slotView = this.weaponSlot; equipmentIndex = 0; break;
      case "helmet": equipmentToPutBack = this.character.equippedHelmet; slotView = this.helmetSlot; equipmentIndex = 1; break;
      case "armour": equipmentToPutBack = this.character.equippedArmour; slotView = this.armourSlot; equipmentIndex = 2; break;
      case "boots": equipmentToPutBack = this.character.equippedBoots; slotView = this.bootsSlot; equipmentIndex = 3; break;
    }

    if (equipmentToPutBack) {
      slot!.setItem(equipmentToPutBack, 1);
      const infoToPutBack = GameItemDatabase.instance.getEquipmentInfo(equipmentToPutBack)!;
      const iconToPutBack = GameItemDatabase.instance.getImage(infoToPutBack!.icon)!;
      this.itemSlots[this.selectedItemIndex].init(new InventoryGameItemSlotViewData(
        this.selectedItemIndex, infoToPutBack, iconToPutBack, 1,
        (i) => this.selectItem(i),
        (i) => this.hoverItem(i),
        (i) => this.unHoverItem(i)
      ));
    } else {
      slot!.setItem("", 0);
      this.itemSlots[this.selectedItemIndex].init(new InventoryGameItemSlotViewData(
        this.selectedItemIndex, null, null, 0,
        (i) => this.selectItem(i),
        (i) => this.hoverItem(i),
        (i) => this.unHoverItem(i)
      ));
    }

    slotView!.init(new EquipmentSlotViewData(
      equipmentIndex, infoToEquip, iconToEquip,
      (i) => this.selectEquipSlot(i),
      (i) => this.hoverEquipment(i),
      (i) => this.unHoverEquipment(i)
    ));
    this.character.equip(infoToEquip!.id, infoToEquip!.category as EquipmentCategory);
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
      this.itemSlots[this.selectedItemIndex].init(new InventoryGameItemSlotViewData(
        this.selectedItemIndex, null, null, 0,
        (idx) => this.selectItem(idx),
        (idx) => this.hoverItem(idx),
        (idx) => this.unHoverItem(idx)
      ))
    } else {
      this.itemSlots[this.selectedItemIndex].changeQuantity(slot!.quantity);
    }
  }

  private hoverItem(index: number) {
    const slot = this.inventoryManager.getSlot(index, this.currentTab);
    if (!slot || slot.isEmpty()) return;
    const gameItem = this.currentTab === 'equipment'
      ? GameItemDatabase.instance.getEquipmentInfo(slot.itemId)!
      : GameItemDatabase.instance.getConsumableInfo(slot.itemId)!;
    const sprite = GameItemDatabase.instance.getImage(gameItem.icon)!;
    const effectString = gameItem.effects.join('\n');
    const tooltipData = new InventoryTooltipUIData(gameItem.name, sprite, effectString, gameItem.description);

    const pos = this.itemSlots[index].node.getWorldPosition();
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
        if (!equipSlot.isEmpty()) {
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
        if (!slot.isEmpty()) {
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
      this.itemSlots[this.selectedItemIndex].hideSelectedIndicator();
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
    if (!slot || slot.isEmpty())
      return;
    const info = this.getEquipmentInfo(index)!;
    const sprite = GameItemDatabase.instance.getImage(info.icon)!;
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

    const equipSlot = this.getEquipmentSlot(index)!;
    equipSlot.init(new EquipmentSlotViewData(
      index, null, null,
      (i) => this.selectEquipSlot(i),
      (i) => this.hoverEquipment(i),
      (i) => this.unHoverEquipment(i)
    ));

    if (this.currentTab === "equipment") {
      const sprite = GameItemDatabase.instance.getImage(equipmentInfo.icon)!;
      this.itemSlots[targetInventorySlotItemIndex].init(new InventoryGameItemSlotViewData(
        targetInventorySlotItemIndex,
        equipmentInfo,
        sprite,
        1,
        (idx) => this.selectItem(idx),
        (idx) => this.hoverItem(idx),
        (idx) => this.unHoverItem(idx)
      ));
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
    const healthUpdateEvent = event as HealthStatsChangedEvent;
    this.healthStatsLabel.string = `${this.character.currentHealth} / ${this.character.currentMaxHealth.amount}`;
  }

  private onManaUpdate(event: BaseEvent) {
    const manaUpdateEvent = event as ManaStatsChangedEvent;
    this.manaStatsLabel.string = `${this.character.currentMana} / ${this.character.currentMaxMana.amount}`;
  }

  close() {
    this.node.active = false;
  }
}
