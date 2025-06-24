import { Stats } from "./Stats";

export class Health extends Stats {
  public add(health: Health) {
    this.amount += health.amount;
  }

  public subtract(health: Health) {
    this.amount -= health.amount;
  }
}