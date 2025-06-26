import { _decorator, Component, math, Node } from 'cc';
import { GameItemDatabase } from '../gameItem/GameItemDatabase';
import { StatsHealth } from '../stats/StatsHealth';
import { StatsMana } from '../stats/StatsMana';
import { StatsStrength } from '../stats/StatsStrength';
import { StatsAgility } from '../stats/StatsAgility';
import { StatsIntelligent } from '../stats/StatsIntelligent';
import { Stats } from '../stats/Stats';
import { StatsBuilder, StatsCollection } from '../stats/StatsBuilder';
import EventBus, { BaseEvent } from '../sys/eventBus/EventBus';
import { EquipmentCategory } from '../gameItem/GameItem';
const { ccclass, property } = _decorator;

@ccclass('Character')
export class Character extends Component {

  @property
  public baseMaxHealth: number = 0;
  @property
  public baseMaxMana: number = 0;
  @property
  public baseStr: number = 0;
  @property
  public baseAgi: number = 0;
  @property
  public baseInt: number = 0;
  @property
  public equippedHelmet: string = "";
  @property
  public equippedArmour: string = "";
  @property
  public equippedBoots: string = "";
  @property
  public equippedWeapon: string = "";

  private _currentHealth: number = 0;
  public get currentHealth() {
    return this._currentHealth;
  }

  private _currentMana: number = 0;
  public get currentMana() {
    return this._currentMana;
  }

  private _currentMaxHealth: StatsHealth = new StatsHealth(0);
  public get currentMaxHealth() {
    return this._currentMaxHealth;
  }

  private _currentMaxMana: StatsMana = new StatsMana(0);
  public get currentMaxMana() {
    return this._currentMaxMana;
  }

  private _currentStr: StatsStrength = new StatsStrength(0);
  public get currentStr() {
    return this._currentStr;
  }

  private _currentAgi: StatsAgility = new StatsAgility(0);
  public get currentAgi() {
    return this._currentAgi;
  }

  private _currentInt: StatsIntelligent = new StatsIntelligent(0);
  public get currentInt() {
    return this._currentInt;
  }

  public init() {
    this._currentMaxHealth = new StatsHealth(this.baseMaxHealth);
    this._currentMaxMana = new StatsMana(this.baseMaxMana);
    this._currentStr = new StatsStrength(this.baseStr);
    this._currentAgi = new StatsAgility(this.baseAgi);
    this._currentInt = new StatsIntelligent(this.baseInt);
    this.updateStats();
    this._currentHealth = this._currentMaxHealth.amount;
    this._currentMana = this._currentMaxMana.amount;
  }

  public equip(equipItemId: string, category: EquipmentCategory) {
    switch (category) {
      case "armour":
        this.equippedArmour = equipItemId;
        break;
      case "helmet":
        this.equippedHelmet = equipItemId;
        break;
      case "boots":
        this.equippedBoots = equipItemId;
        break;
      case "weapon":
        this.equippedWeapon = equipItemId;
        break;
    }
    this.updateStats();
  }

  public use(effect: string) {
    const splits = effect.split(" ");
    let amount = parseInt(splits[0].substring(1));
    const notation = splits[0][1];
    if (notation === "-")
      amount = -amount;

    switch (splits[1]) {
      case "health":
        this.addHealth(amount);
        break;
      case "mana":
        this.addMana(amount);
        break;
      default:
        throw new Error(`Unknown stat type: ${splits[1]}`);
    }
  }

  public addHealth(amount: number) {
    const prevHealth = this._currentHealth;
    this._currentHealth = math.clamp(this.currentHealth + amount, 0, this.currentMaxHealth.amount);
    EventBus.publish(HealthStatsChangedEvent.EVENT_ID, new HealthStatsChangedEvent(prevHealth, this._currentHealth, this._currentMaxHealth.amount, this._currentMaxHealth.amount));
  }

  public addMana(amount: number) {
    const prevMana = this._currentMana;
    this._currentMana = math.clamp(this._currentMana + amount, 0, this.currentMaxMana.amount);
    EventBus.publish(ManaStatsChangedEvent.EVENT_ID, new ManaStatsChangedEvent(prevMana, this._currentMana, this._currentMaxMana.amount, this._currentMaxMana.amount));
  }

  private updateStats() {
    const equipment = [
      this.equippedHelmet,
      this.equippedArmour,
      this.equippedBoots,
      this.equippedWeapon
    ];

    let totalStats: StatsCollection = StatsBuilder.getDefaultStatsCollectionValue();

    for (const equipId of equipment) {
      if (equipId) {
        const equipInfo = GameItemDatabase.instance.getEquipmentInfo(equipId);
        if (equipInfo && equipInfo.effects) {
          const stats = this.convertEffects(equipInfo.effects);
          const applied = this.applyStats(stats);
          totalStats.str.amount += applied.str.amount;
          totalStats.agi.amount += applied.agi.amount;
          totalStats.int.amount += applied.int.amount;
          totalStats.hp.amount += applied.hp.amount;
          totalStats.mp.amount += applied.mp.amount;
        }
      }
    }

    const prevStats: StatsCollection = {
      str: new StatsStrength(this._currentStr.amount),
      agi: new StatsAgility(this._currentAgi.amount),
      int: new StatsIntelligent(this._currentInt.amount),
      hp: new StatsHealth(this._currentMaxHealth.amount),
      mp: new StatsMana(this._currentMaxMana.amount)
    }

    this._currentStr = new StatsStrength(this.baseStr + totalStats.str.amount);
    this._currentAgi = new StatsAgility(this.baseAgi + totalStats.agi.amount);
    this._currentInt = new StatsIntelligent(this.baseInt + totalStats.int.amount);
    this._currentMaxHealth = new StatsHealth(this.baseMaxHealth + totalStats.hp.amount);
    this._currentMaxMana = new StatsMana(this.baseMaxMana + totalStats.mp.amount);

    const currentStats: StatsCollection = {
      str: new StatsStrength(this._currentStr.amount),
      agi: new StatsAgility(this._currentAgi.amount),
      int: new StatsIntelligent(this._currentInt.amount),
      hp: new StatsHealth(this._currentMaxHealth.amount),
      mp: new StatsMana(this._currentMaxMana.amount)
    }

    EventBus.publish(UpdateStatsEvent.EVENT_ID, new UpdateStatsEvent(prevStats, currentStats));
  }

  private applyStats(stats: Stats[]): StatsCollection {
    const statCollection: StatsCollection = StatsBuilder.getDefaultStatsCollectionValue();
    for (const stat of stats) {
      if (stat instanceof StatsStrength) statCollection.str.amount += stat.amount;
      else if (stat instanceof StatsAgility) statCollection.agi.amount += stat.amount;
      else if (stat instanceof StatsIntelligent) statCollection.int.amount += stat.amount;
      else if (stat instanceof StatsMana) statCollection.mp.amount += stat.amount;
      else if (stat instanceof StatsHealth) statCollection.hp.amount += stat.amount;
    }
    return statCollection;
  }

  private convertEffects(effects: string[]): Stats[] {
    return effects.map(effect => StatsBuilder.buildFromEffect(effect));
  }
}

export class UpdateStatsEvent extends BaseEvent {
  public previousStats: StatsCollection;
  public currentStats: StatsCollection;

  public static readonly EVENT_ID = "update-stats";

  constructor(previousStats: StatsCollection, currentStats: StatsCollection) {
    super(UpdateStatsEvent.EVENT_ID);
    this.previousStats = previousStats;
    this.currentStats = currentStats;
  }
}

export class HealthStatsChangedEvent extends BaseEvent {
  public previousHealth: number;
  public previousMaxHealth: number;
  public currentHealth: number;
  public currentMaxHealth: number;

  public static readonly EVENT_ID = "health-changed";

  constructor(previousHealth: number, currentHealth: number, previousMaxHealth: number, currentMaxHealth: number) {
    super(HealthStatsChangedEvent.EVENT_ID);
    this.previousHealth = previousHealth;
    this.currentHealth = currentHealth;
    this.previousMaxHealth = previousMaxHealth;
    this.currentMaxHealth = currentMaxHealth;
  }
}

export class ManaStatsChangedEvent extends BaseEvent {
  public previousMana: number;
  public currentMana: number;
  public previousMaxMana: number;
  public currentMaxMana: number;

  public static readonly EVENT_ID = "mana-changed";

  constructor(previousMana: number, currentMana: number, previousMaxMana: number, currentMaxMana: number) {
    super(ManaStatsChangedEvent.EVENT_ID);
    this.previousMana = previousMana;
    this.currentMana = currentMana;
    this.previousMaxMana = previousMaxMana;
    this.currentMaxMana = currentMaxMana;
  }
}