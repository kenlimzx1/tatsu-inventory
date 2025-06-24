import { _decorator, Component, Node } from 'cc';
import { InventoryView } from './inventory/components/InventoryView';
import { InventoryManager } from './inventory/InventoryManager';
import { Character } from './character/Character';
import { HealthPanel } from './ui/fillPanel/HealthPanel';
import { ManaPanel } from './ui/fillPanel/ManaPanel';
const { ccclass, property } = _decorator;

@ccclass('GameSceneController')
export class GameSceneController extends Component {

  @property(InventoryView)
  private inventoryView: InventoryView = null!;

  @property(InventoryManager)
  private inventoryManager: InventoryManager = null!;

  @property(Character)
  private character: Character = null!;

  @property(HealthPanel)
  private healthPanel: HealthPanel = null!;

  @property(ManaPanel)
  private manaPanel: ManaPanel = null!;

  start() {
    this.inventoryView.node.active = false;
    this.character.init();
    this.healthPanel.init(this.character.currentHealth, this.character.currentMaxHealth.amount);
    this.manaPanel.init(this.character.currentMana, this.character.currentMaxMana.amount);
  }

  update(deltaTime: number) {

  }


  showInventory() {
    this.inventoryView.node.active = true;
    this.inventoryView.show();
  }

  hit() {
    this.character.hit(20);
  }

  spell() {
    this.character.useMana(20);
  }
}


