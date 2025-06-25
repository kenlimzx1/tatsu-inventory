import { _decorator, Component, instantiate, Label, Node, Prefab, Sprite, SpriteFrame, Tween, tween, Vec3 } from 'cc';
import { InventoryManager } from '../InventoryManager';
import { InventoryGameItemSlotView, InventoryGameItemSlotViewData } from './InventoryGameItemSlotView';
import { GameItemDatabase } from '../../gameItem/GameItemDatabase';
import { GameItem } from '../../gameItem/GameItem';
import { InventoryTooltipPosition, InventoryTooltipUI, InventoryTooltipUIData } from './InventoryTooltipUI';
import { Character, UpdateStatsEvent } from '../../character/Character';
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
        (i) => this.selectEquipment(i),
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
      // TODO: put selected equipment back to inventory
    } else {
      if (this.selectedItemIndex === index) {
        if (this.currentTab === "equipment")
          this.equipItem()
        else
          this.useItem();
        this.itemSlots[this.selectedItemIndex].hideSelectedIndicator();
        this.selectedItemIndex = -1;
      } else {
        if (this.selectedItemIndex === -1) {
          this.selectedItemIndex = index;
          this.itemSlots[this.selectedItemIndex].showSelectedIndicator();
        } else {
          if (!this.itemSlots[index].isEmpty() || !this.itemSlots[this.selectedItemIndex].isEmpty()) {
            this.switchItemSlotPosition(this.selectedItemIndex, index);
          }
          this.itemSlots[this.selectedItemIndex].hideSelectedIndicator();
          this.selectedItemIndex = -1;
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
    const info = GameItemDatabase.instance.getEquipmentInfo(slot!.itemId);
    const icon = GameItemDatabase.instance.getImage(info!.icon)!;
    let putBack = "";
    let slotView: EquipmentSlotView | undefined;

    switch (info!.category) {
      case "helmet": putBack = this.character.equippedHelmet; slotView = this.helmetSlot; break;
      case "armour": putBack = this.character.equippedArmour; slotView = this.armourSlot; break;
      case "boots": putBack = this.character.equippedBoots; slotView = this.bootsSlot; break;
      case "weapon": putBack = this.character.equippedWeapon; slotView = this.weaponSlot; break;
    }
    if (putBack) slot!.setItem(putBack, 1);

    this.itemSlots[this.selectedItemIndex].init(new InventoryGameItemSlotViewData(
      this.selectedItemIndex, info, icon, 1,
      (i) => this.selectItem(i),
      (i) => this.hoverItem(i),
      (i) => this.unHoverItem(i)
    ));
    this.character.equip(info!.id);
  }

  private useItem() { /* implement as needed */ }

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

  private selectEquipment(index: number) {
    if (this.selectedEquipmentIndex === index) {
      this.getEquipmentSlot(this.selectedEquipmentIndex)?.hideSelectedIndicator();
    } else {
      if (this.selectedEquipmentIndex !== -1)
        this.getEquipmentSlot(this.selectedEquipmentIndex)?.hideSelectedIndicator();
      this.selectedEquipmentIndex = index;
      this.getEquipmentSlot(this.selectedEquipmentIndex)?.showSelectedIndicator();
    }
    this.selectedItemIndex = -1;
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
    if (!slot || slot.isEmpty()) return;
    const info = this.getEquipmentInfo(index)!;
    const sprite = GameItemDatabase.instance.getImage(info.icon)!;
    const effectString = info.effects.join('\n');
    const tooltipData = new InventoryTooltipUIData(info.name, sprite, effectString, info.description);
    const pos = slot.node.getWorldPosition();
    const invPos: InventoryTooltipPosition = pos.y > 0 ? 'top-right' : 'bottom-right';
    this.tooltip.node.active = true;
    this.tooltip.show(tooltipData, pos, invPos);
  }

  private unHoverEquipment(index: number) {
    this.tooltip.node.active = false;
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

  close() {
    this.node.active = false;
  }
}
