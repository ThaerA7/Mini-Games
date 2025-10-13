import Phaser from 'phaser'

export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene')
  }

  create() {
    const { width, height } = this.scale
    const text = this.add.text(width / 2, height / 2, 'Phaser is live!', { fontSize: '28px' })
    text.setOrigin(0.5)
    this.tweens.add({ targets: text, scale: 1.1, duration: 500, yoyo: true, repeat: -1 })
  }
}
