import { Stats } from "./Stats";

export class Agility extends Stats {
  public add(agi: Agility) {
    this.amount += agi.amount;
  }

  public subtract(agi: Agility) {
    this.amount -= agi.amount;
  }
}