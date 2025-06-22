import { _decorator, Component, Node, Sprite } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('FillPanel')
export class FillPanel extends Component {
  @property(Sprite)
  private fill: Sprite = null;

  public init() {

  }
}


