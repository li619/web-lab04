const config = {
    type: Phaser.AUTO,
    parent: 'game',
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [MenuScene, GameScene, GameOverScene],
    backgroundColor: '#ffffff'
};

window.addEventListener('load', () => {
    try {
        const game = new Phaser.Game(config);
        console.log('游戏初始化成功');
    } catch (error) {
        console.error('游戏初始化失败:', error);
    }
}); 