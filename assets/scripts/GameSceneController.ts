import { _decorator, Component, Node } from 'cc';
import { InventoryView } from './inventory/components/InventoryView';
import { InventoryManager } from './inventory/InventoryManager';
const { ccclass, property } = _decorator;

@ccclass('GameSceneController')
export class GameSceneController extends Component {

  @property(InventoryView)
  private inventoryView: InventoryView = null!;

  @property(InventoryManager)
  private inventoryManager: InventoryManager = null!;

  start() {
    this.inventoryView.node.active = false;
  }

  update(deltaTime: number) {

  }


  showInventory() {
    this.inventoryView.node.active = true;
    this.inventoryView.show();
  }

  hit() {

  }

  spell() {

  }
}


