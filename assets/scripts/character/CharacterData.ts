import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

export class CharacterData {
  public baseHealth: number = 0;
  public baseMana: number = 0;
  public baseStr: number = 0;
  public baseAgi: number = 0;
  public baseInt: number = 0;
  public helmet: string = "";
  public armour: string = "";
  public boots: string = "";
  public weapon: string = "";
}