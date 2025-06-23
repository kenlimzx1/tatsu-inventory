import { _decorator, Component, Node } from 'cc';
import { InventorySlot } from './InventorySlot';
import { GameItemType } from '../gameItem/GameItem';
const { ccclass, property } = _decorator;

@ccclass('InventoryManager')
export class InventoryManager extends Component {
  @property({ type: [InventorySlot] })
  private currentEquipmentSlots: InventorySlot[] = [];

  @property({ type: [InventorySlot] })
  private currentConsumableSlots: InventorySlot[] = [];

  public get totalEquipmentSlots(): number {
    return this.currentEquipmentSlots.length;
  }

  public get totalConsumablelots(): number {
    return this.currentConsumableSlots.length;
  }

  public getSlot(index: number, type: GameItemType) {
    if (type === "equipment") {
      return this.currentEquipmentSlots[index];
    } else if (type === "consumable") {
      return this.currentConsumableSlots[index];
    }
    return null;
  }

  public setSlot(index: number, type: GameItemType, itemId: string, quantity: number) {
    let slot: InventorySlot | null = null;
    if (type === "equipment") {
      slot = this.currentEquipmentSlots[index];
    } else if (type === "consumable") {
      slot = this.currentConsumableSlots[index];
    }
    if (slot) {
      slot.setItem(itemId, quantity);
    }
  }
}


