import { _decorator, Component, director, Label, Sprite } from 'cc';
import { GameItemDatabase } from './gameItem/GameItemDatabase';
const { ccclass, property } = _decorator;

@ccclass('InitSceneController')
export class InitSceneController extends Component {

  @property(Label)
  private loadingLabel: Label = null!;

  @property(Sprite)
  private spr: Sprite = null!;

  async start() {
    console.log("InitSceneController start");

    await this.loadDatabase();

    const img = GameItemDatabase.instance.getImage("light_vest");
    this.spr.spriteFrame = img;

    this.scheduleOnce(() => {
      this.loadNextScene();
    }, 1);
  }

  private async loadDatabase() {
    await GameItemDatabase.instance.loadDatabase();
    this.updateLoadingLabel("Database Loaded");
  }

  loadNextScene() {
    director.loadScene("gameScene");
  }

  update(deltaTime: number) {
    this.checkLoadingDatabase();
  }

  private checkLoadingDatabase() {
    if (!GameItemDatabase.instance.isLoading)
      return;
    switch (GameItemDatabase.instance.status) {
      case "loading_consumables":
        this.updateLoadingLabel("Loading Consumables...");
        break;
      case "loading_equipments":
        this.updateLoadingLabel("Loading Equipments...");
        break;
      case "complete":
        this.updateLoadingLabel("Loading Complete!");
        break;
      default:
        this.updateLoadingLabel("Loading...");
        break;
    }
  }

  private updateLoadingLabel(message: string) {
    if (this.loadingLabel) {
      this.loadingLabel.string = message;
    }
  }
}


