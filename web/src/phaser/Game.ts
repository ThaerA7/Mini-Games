import Phaser from 'phaser'
import { GameScene } from './GameScene'

export function createPhaserGame(parent: string) {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    backgroundColor: '#0f172a',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: 360,
      height: 640
    },
    fps: { target: 60, forceSetTimeOut: true },
    scene: [GameScene]
  })
}
