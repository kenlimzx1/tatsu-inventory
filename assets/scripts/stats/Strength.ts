import { Stats } from "./Stats";

export class Strength extends Stats {
  public add(str: Strength) {
    this.amount += str.amount;
  }

  public subtract(str: Strength) {
    this.amount -= str.amount;
  }
}