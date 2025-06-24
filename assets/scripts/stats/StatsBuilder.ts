import { Agility } from "./Agility";
import { Health } from "./Health";
import { Intelligent } from "./Intelligent";
import { Mana } from "./Mana";
import { Stats } from "./Stats";
import { Strength } from "./Strength";

export class StatsBuilder {
  public static buildFromEffect(effectString: string): Stats {
    const splits = effectString.split(" ");
    let amount = parseInt(splits[0].substring(1));
    const notation = splits[0][1];
    if (notation === "-")
      amount = -amount;

    switch (splits[1]) {
      case "STR":
        return new Strength(amount);
      case "INT":
        return new Intelligent(amount);
      case "AGI":
        return new Agility(amount);
      case "HP":
        return new Health(amount);
      case "MP":
        return new Mana(amount);
      default:
        throw new Error(`Unknown stat type: ${splits[1]}`);
    }
  }
}