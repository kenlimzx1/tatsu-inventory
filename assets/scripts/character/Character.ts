import { _decorator, Component, Node } from 'cc';
import { GameItemDatabase } from '../gameItem/GameItemDatabase';
import { Health } from '../stats/Health';
import { Mana } from '../stats/Mana';
import { Strength } from '../stats/Strength';
import { Agility } from '../stats/Agility';
import { Intelligent } from '../stats/Intelligent';
import { Stats } from '../stats/Stats';
import { StatsBuilder } from '../stats/StatsBuilder';
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

  private currentHealth: number = 0;
  private currentMana: number = 0;
  private currentMaxHealth: Health = new Health(0);
  private currentMaxMana: Mana = new Mana(0);
  private currentStr: Strength = new Strength(0);
  private currentAgi: Agility = new Agility(0);
  private currentInt: Intelligent = new Intelligent(0);

  public init() {
    this.currentHealth = this.baseMaxHealth;
    this.currentMana = this.baseMaxMana;
    this.currentMaxHealth = new Health(this.baseMaxHealth);
    this.currentMaxMana = new Mana(this.baseMaxMana);
    this.currentStr = new Strength(this.baseStr);
    this.currentAgi = new Agility(this.baseAgi);
    this.currentInt = new Intelligent(this.baseInt);
    this.updateStats();
  }

  public equip(equipItemId: string) {
    this.updateStats();
  }

  public use(consumableItemId: string) {

  }

  private updateStats() {
    let addedStats: Stats[] = [
      new Strength(0),
      new Agility(0),
      new Intelligent(0),
      new Health(0),
      new Mana(0)
    ];

    if (this.equippedHelmet && this.equippedHelmet !== "") {
      const helmetInfo = GameItemDatabase.instance.getEquipmentInfo(this.equippedHelmet);
      const helmetStats = this.convertEffects(helmetInfo!.effects);
      this.combineStats(addedStats, helmetStats);
    }

    if (this.equippedArmour && this.equippedArmour !== "") {
      const armourInfo = GameItemDatabase.instance.getEquipmentInfo(this.equippedArmour);
      const armourStats = this.convertEffects(armourInfo!.effects);
      this.combineStats(addedStats, armourStats);
    }

    if (this.equippedBoots && this.equippedBoots !== "") {
      const bootsInfo = GameItemDatabase.instance.getEquipmentInfo(this.equippedBoots);
      const bootsStats = this.convertEffects(bootsInfo!.effects);
      this.combineStats(addedStats, bootsStats);
    }
  }

  private combineStats(source: Stats[], target: Stats[]) {

  }

  private convertEffects(effects: string[]): Stats[] {
    let stats: Stats[] = [];
    for (let i = 0; i < effects.length; i++) {
      const effect = effects[i];
      const stat = StatsBuilder.buildFromEffect(effect);
      stats.push(stat);
    }
    return stats;
  }
}


