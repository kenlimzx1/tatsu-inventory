import { StatsAgility } from "./StatsAgility";
import { StatsHealth } from "./StatsHealth";
import { StatsIntelligent } from "./StatsIntelligent";
import { StatsMana } from "./StatsMana";
import { Stats } from "./Stats";
import { StatsStrength } from "./StatsStrength";

export interface StatsCollection {
  str: StatsStrength;
  int: StatsIntelligent;
  agi: StatsAgility;
  hp: StatsHealth;
  mp: StatsMana;
}

export class StatsBuilder {
  public static buildFromEffect(effectString: string): Stats {
    const splits = effectString.split(" ");
    let amount = parseInt(splits[0].substring(1));
    const notation = splits[0][1];
    if (notation === "-")
      amount = -amount;

    switch (splits[1]) {
      case "STR":
        return new StatsStrength(amount);
      case "INT":
        return new StatsIntelligent(amount);
      case "AGI":
        return new StatsAgility(amount);
      case "HP":
        return new StatsHealth(amount);
      case "MP":
        return new StatsMana(amount);
      default:
        throw new Error(`Unknown stat type: ${splits[1]}`);
    }
  }

  public static getDefaultStatsCollectionValue(): StatsCollection {
    return {
      hp: new StatsHealth(0),
      mp: new StatsMana(0),
      str: new StatsStrength(0),
      agi: new StatsAgility(0),
      int: new StatsIntelligent(0),
    }
  }
}