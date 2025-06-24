import { _decorator, Component, Node, Prefab } from 'cc';
import { Character } from './Character';
const { ccclass, property } = _decorator;

@ccclass('CharacterManager')
export class CharacterManager extends Component {

  @property(Prefab)
  private characterPrefab: Prefab = null!;



  init() {

  }
}


