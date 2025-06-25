import { _decorator, CCInteger, CCString, Component, Node, Prefab } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('InventorySlot')
export class InventorySlot {

  @property
  public itemId: string = "";

  @property({ type: CCInteger })
  public quantity: number = 0;

  public isEmpty(): boolean {
    return this.itemId === "" || this.quantity <= 0;
  }

  public setItem(itemId: string, quantity: number): void {
    this.itemId = itemId;
    this.quantity = quantity;
  }
}


