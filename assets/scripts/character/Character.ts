import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Character')
export class Character extends Component {
  private data: CharacterData = null!;

  public init(data: CharacterData) {
    this.data = data;
  }

  public equip(equipItemId: string) {

  }

  public use(consumableItemId: string) {

  }
}


