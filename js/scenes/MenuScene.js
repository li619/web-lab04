class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        console.log('MenuScene 创建');
        
        // 添加标题
        this.add.text(400, 200, '打砖块游戏', {
            fontSize: '48px',
            fill: '#2196f3',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // 添加开始按钮
        const startButton = this.add.text(400, 300, '开始游戏', {
            fontSize: '32px',
            fill: '#fff',
            backgroundColor: '#2196f3',
            padding: { x: 20, y: 10 },
            borderRadius: 5
        })
        .setOrigin(0.5)
        .setInteractive();

        // 添加按钮交互效果
        startButton.on('pointerover', () => {
            startButton.setStyle({ backgroundColor: '#1976d2' });
        });

        startButton.on('pointerout', () => {
            startButton.setStyle({ backgroundColor: '#2196f3' });
        });

        startButton.on('pointerdown', () => {
            console.log('开始按钮被点击');
            this.scene.start('GameScene');
        });
    }
} 