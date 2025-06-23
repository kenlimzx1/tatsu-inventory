import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

export class CharacterData {
  public name: string;
  public baseHealth: number;
  public baseMana: number;
  public baseStr: number;
  public baseAgi: number;
  public baseInt: number;
  public helmet: string;
  public armour: string;
  public boots: string;
  public weapon: string;
}