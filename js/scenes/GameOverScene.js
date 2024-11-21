class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    init(data) {
        this.score = data.score;
        this.win = data.win || false;
        this.canRetry = data.canRetry;
    }

    create() {
        console.log('GameOverScene 创建');
        
        // 显示游戏结果
        const message = this.win ? '恭喜获胜！' : '游戏结束';
        this.add.text(400, 200, message, {
            fontSize: '48px',
            fill: '#2196f3',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // 显示分数
        this.add.text(400, 300, `最终分数: ${this.score}`, {
            fontSize: '32px',
            fill: '#333',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        // 只有在允许重试时才显示重试按钮
        if (this.canRetry) {
            const restartButton = this.add.text(400, 400, '再玩一次', {
                fontSize: '32px',
                fill: '#fff',
                backgroundColor: '#2196f3',
                padding: { x: 20, y: 10 },
                borderRadius: 5
            })
            .setOrigin(0.5)
            .setInteractive();

            restartButton.on('pointerover', () => {
                restartButton.setStyle({ backgroundColor: '#1976d2' });
            });

            restartButton.on('pointerout', () => {
                restartButton.setStyle({ backgroundColor: '#2196f3' });
            });

            restartButton.on('pointerdown', () => {
                console.log('重新开始按钮被点击');
                this.scene.start('GameScene');
            });
        } else {
            // 显示游戏真正结束的消息
            this.add.text(400, 400, '游戏结束，感谢游玩！', {
                fontSize: '24px',
                fill: '#ff4081',
                fontFamily: 'Arial'
            }).setOrigin(0.5);
        }
    }
} 