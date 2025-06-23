export type GameItemType = "consumable" | "equipment";
export type ConsumableCategory = "potion" | "other";
export type EquipmentCategory = "weapon" | "helmet" | "armour" | "boots";

export class GameItem {
  public id: string;
  public name: string;
  public description: string;
  public icon: string;
  public type: GameItemType;
  public category: ConsumableCategory | EquipmentCategory;
  public effects: string[];

  constructor(
    id: string,
    name: string,
    description: string,
    icon: string,
    type: GameItemType,
    category: ConsumableCategory | EquipmentCategory,
    effects: string[]
  ) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.icon = icon;
    this.type = type;
    this.category = category;
    this.effects = effects;
  }
}