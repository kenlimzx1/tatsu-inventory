import { _decorator, Asset, assetManager, AssetManager, Component, Node, SpriteFrame, TextAsset, Texture2D } from 'cc';
import { GameItem } from './GameItem';
const { ccclass, property } = _decorator;

@ccclass('GameItemDatabase')
export class GameItemDatabase extends Component {
  private static _instance: GameItemDatabase | null = null;

  public static get instance(): GameItemDatabase {
    if (!GameItemDatabase._instance) {
      GameItemDatabase._instance = new GameItemDatabase();
    }
    return GameItemDatabase._instance;
  }

  private _consumables: Map<string, GameItem> = new Map();
  private _equipments: Map<string, GameItem> = new Map();
  private _images: Map<string, SpriteFrame> = new Map();
  private _isLoading: boolean = false;
  public get isLoading(): boolean {
    return this._isLoading;
  }
  private _status: string = "not started";
  public get status(): string {
    return this._status;
  }

  public async loadDatabase(): Promise<void> {
    this._isLoading = true;
    this._status = "loading_consumables";
    await this.loadConsumables();
    this._status = "loading_equipments";
    await this.loadEquipments();
    this._status = "complete";
    this._isLoading = false;
  }

  public async loadConsumables(): Promise<void> {
    const consumablesBundle = await this.loadBundle("consumables");
    const config = (consumablesBundle as { _config?: BundleConfig })._config;
    const maps = config?.paths?._map ?? {};
    const keys = Object.keys(maps);
    for (let i = 0; i < keys.length; i++) {
      const path = keys[i];
      const splits = path.split("/");
      if (splits[splits.length - 1] === splits[splits.length - 2]) {
        const textFile = await this.loadFile<TextAsset>(consumablesBundle, path);
        const gameItemData = (textFile as { json?: GameItem }).json!;
        this._consumables.set(gameItemData.id, gameItemData);
      }
      else if (splits[splits.length - 1] === "spriteFrame") {
        const imageName = splits[splits.length - 2];
        const image = await this.loadFile<SpriteFrame>(consumablesBundle, path);
        this._images.set(imageName, image);
      }
    }
  }

  public async loadEquipments(): Promise<void> {
    const equipmentsBundle = await this.loadBundle("equipments");
    const config = (equipmentsBundle as { _config?: BundleConfig })._config;
    const maps = config?.paths?._map ?? {};
    const keys = Object.keys(maps);
    for (let i = 0; i < keys.length; i++) {
      const path = keys[i];
      const splits = path.split("/");
      if (splits[splits.length - 1] === splits[splits.length - 2]) {
        const textFile = await this.loadFile<TextAsset>(equipmentsBundle, path);
        const gameItemData = (textFile as { json?: GameItem }).json!;
        this._equipments.set(gameItemData.id, gameItemData);
      }
      else if (splits[splits.length - 1] === "spriteFrame") {
        const imageName = splits[splits.length - 2];
        const image = await this.loadFile<SpriteFrame>(equipmentsBundle, path);
        this._images.set(imageName, image);
      }
    }
  }

  public loadBundle(bundleName: string): Promise<AssetManager.Bundle> {
    return new Promise((resolve, reject) => {
      assetManager.loadBundle(bundleName, (err, bundle) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(bundle);
      });
    });
  }

  public loadFile<T extends Asset>(bundle: AssetManager.Bundle, path: string): Promise<T> {
    return new Promise((resolve, reject) => {
      bundle.load(path, (err, asset: T) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(asset);
      });
    });
  }

  public getConsumableInfo(id: string): GameItem | null {
    return this._consumables.get(id) || null;
  }

  public getEquipmentInfo(id: string): GameItem | null {
    return this._equipments.get(id) || null;
  }

  public getImage(id: string): SpriteFrame | null {
    return this._images.get(id) || null;
  }
}

interface BundleConfig {
  paths: {
    _map: Record<string, unknown>;
  };
}