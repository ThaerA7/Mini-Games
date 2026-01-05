// src/phaser/Game.ts
import Phaser from "phaser";
import { GameScene } from "./GameScene";

export function createPhaserGame(parent: string) {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    backgroundColor: "#0b1020",
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: 1280,
      height: 720,
    },
    fps: { target: 60, forceSetTimeOut: true },
    scene: [GameScene],
  });
}
