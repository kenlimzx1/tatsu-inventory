import { Stats } from "./Stats";

export class Intelligent extends Stats {
  public add(int: Intelligent) {
    this.amount += int.amount;
  }

  public subtract(int: Intelligent) {
    this.amount -= int.amount;
  }
}