class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.combo = 0;
        this.powerUps = [];
        this.soundEnabled = false;
        this.retryCount = 0;
    }

    preload() {
        // 创建临时图形
        const graphics = this.add.graphics();
        
        // 创建背景
        graphics.fillStyle(0xe0f7fa);
        graphics.fillRect(0, 0, 800, 600);
        graphics.generateTexture('background', 800, 600);
        
        // 创建闪亮的球
        graphics.clear();
        graphics.lineStyle(2, 0xffffff);
        graphics.fillStyle(0x00bcd4);
        graphics.beginPath();
        graphics.arc(10, 10, 8, 0, Math.PI * 2);
        graphics.closePath();
        graphics.strokePath();
        graphics.fill();
        graphics.generateTexture('ball', 20, 20);
        
        // 创建炫酷的球拍
        graphics.clear();
        graphics.fillStyle(0x2196f3);
        graphics.fillRoundedRect(0, 0, 100, 20, 10);
        graphics.generateTexture('paddle', 100, 20);
        
        // 创建彩色砖
        const colors = [0xff4081, 0x7c4dff, 0x00bcd4, 0x64dd17, 0xffd600];
        for (let i = 0; i < colors.length; i++) {
            graphics.clear();
            graphics.fillStyle(colors[i]);
            graphics.fillRoundedRect(0, 0, 80, 30, 5);
            graphics.lineStyle(2, 0xffffff);
            graphics.strokeRoundedRect(0, 0, 80, 30, 5);
            graphics.generateTexture(`brick${i}`, 80, 30);
        }

        // 添加道具的纹理
        const powerUpGraphics = this.add.graphics();
        // 速度提升道具
        powerUpGraphics.fillStyle(0xffff00);
        powerUpGraphics.fillCircle(10, 10, 8);
        powerUpGraphics.generateTexture('speedUp', 20, 20);
        // 球拍变长道具
        powerUpGraphics.clear();
        powerUpGraphics.fillStyle(0x00ff00);
        powerUpGraphics.fillCircle(10, 10, 8);
        powerUpGraphics.generateTexture('paddleExtend', 20, 20);
        
        powerUpGraphics.destroy();

        // 确保在使用完后销毁图形对象
        graphics.destroy();

        // 加载碰撞音效
        this.load.audio('hitSound', 'assets/penzhuang.mp3');
    }

    create() {
        // 添加背景
        this.add.image(400, 300, 'background');

        // 创建UI
        this.createUI();
        
        // 设置物理系统
        this.physics.world.setBoundsCollision(true, true, true, false);

        // 修改球拍的物理属性
        this.paddle = this.add.sprite(400, 580, 'paddle');
        this.physics.add.existing(this.paddle, false);
        this.paddle.body.immovable = true;
        this.paddle.setOrigin(0.5, 1);
        
        // 修改球拍的碰撞区域
        this.paddle.body.setSize(this.paddle.displayWidth, 20);
        // 设置碰撞检测方向
        this.paddle.body.checkCollision.up = true;
        this.paddle.body.checkCollision.down = true;  // 开启底部碰撞
        this.paddle.body.checkCollision.left = true;
        this.paddle.body.checkCollision.right = true;

        // 修改球的物理属性
        this.ball = this.add.sprite(400, 560, 'ball');
        this.physics.add.existing(this.ball);
        this.ball.setOrigin(0.5);
        this.ball.body.setCircle(8);
        this.ball.body.setBounce(1);
        this.ball.body.setCollideWorldBounds(true);
        this.ball.body.setMaxVelocity(400, 400);
        this.ball.body.setDrag(0);  // 移除阻力
        this.ball.body.setFriction(0);  // 移除摩擦力

        // 创建砖块组
        this.bricks = this.physics.add.staticGroup();
        this.createBricks();

        // 设置碰撞检测
        this.physics.add.collider(
            this.ball,
            this.paddle,
            this.hitPaddle,
            null,
            this
        );

        this.physics.add.collider(
            this.ball,
            this.bricks,
            this.hitBrick,
            null,
            this
        );

        // 添加音效
        this.hitSound = this.sound.add('hitSound');

        // 设置输入控制
        this.setupInput();

        // 初始化状态
        this.ballLaunched = false;

        // 只在第一次点击后启用音效
        this.input.once('pointerdown', () => {
            this.soundEnabled = true;
        });

        // 修改道具和球拍的碰撞检测
        this.physics.add.overlap(
            this.paddle,
            this.powerUps,
            (paddle, powerUp) => {
                const type = powerUp.getData('type');
                
                // 添加道具收集效果
                this.tweens.add({
                    targets: powerUp,
                    scale: 1.5,
                    alpha: 0,
                    duration: 200,
                    onComplete: () => {
                        // 应用道具效果
                        switch(type) {
                            case 'speedUp':
                                // 增加球速
                                const currentVel = this.ball.body.velocity;
                                const speed = Math.sqrt(currentVel.x * currentVel.x + currentVel.y * currentVel.y);
                                const scale = Math.min(1.2, 400 / speed);  // 限制最大速度
                                this.ball.body.setVelocity(
                                    currentVel.x * scale,
                                    currentVel.y * scale
                                );
                                break;
                                
                            case 'paddleExtend':
                                // 增加球拍长度
                                if (!paddle.getData('isExtended')) {
                                    paddle.setScale(1.5, 1);
                                    paddle.body.setSize(paddle.width * 1.5, paddle.height);
                                    paddle.setData('isExtended', true);
                                    
                                    // 10秒后恢复
                                    this.time.delayedCall(10000, () => {
                                        paddle.setScale(1, 1);
                                        paddle.body.setSize(paddle.width, paddle.height);
                                        paddle.setData('isExtended', false);
                                    });
                                }
                                break;
                        }
                        
                        powerUp.destroy();
                        this.powerUps = this.powerUps.filter(p => p !== powerUp);
                    }
                });
            }
        );
    }

    createUI() {
        // 分数显示
        this.scoreText = this.add.text(16, 16, '分数: 0', {
            fontSize: '32px',
            fill: '#2196f3',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        });

        // 生命值显示
        this.livesText = this.add.text(650, 16, '❤️'.repeat(this.lives), {
            fontSize: '32px'
        });

        // 关卡显示
        this.levelText = this.add.text(400, 16, `关卡 ${this.level}`, {
            fontSize: '32px',
            fill: '#2196f3',
            fontFamily: 'Arial'
        }).setOrigin(0.5, 0);

        // 连击显示
        this.comboText = this.add.text(400, 50, '', {
            fontSize: '24px',
            fill: '#ff4081',
            fontFamily: 'Arial'
        }).setOrigin(0.5, 0);
    }

    createCollisionEffect(x, y) {
        // 创建碰撞波纹效果
        const circle = this.add.circle(x, y, 10, 0xffffff, 0.5);
        this.tweens.add({
            targets: circle,
            scale: 2,
            alpha: 0,
            duration: 200,
            ease: 'Power2',
            onComplete: () => circle.destroy()
        });
    }

    hitPaddle(ball, paddle) {
        // 播放音效
        if (this.soundEnabled && this.ballLaunched) {
            this.hitSound.play();
        }

        // 移除球的形变效果，改用简单的闪烁
        this.tweens.add({
            targets: ball,
            alpha: 0.8,
            duration: 50,
            yoyo: true,
            ease: 'Linear'
        });

        // 添加碰撞特效
        this.createCollisionEffect(ball.x, ball.y);

        // 计算碰撞点相对于球拍中心的位置
        const diff = ball.x - paddle.x;
        const normalizedDiff = Phaser.Math.Clamp(diff / (paddle.displayWidth / 2), -1, 1);
        
        // 设置基础速度和角度
        const baseSpeed = 300;
        const maxAngle = 60;
        const angle = normalizedDiff * maxAngle;
        const rad = Phaser.Math.DegToRad(angle);
        
        // 计算速度
        const newVelX = baseSpeed * Math.sin(rad);
        const newVelY = -Math.abs(baseSpeed * Math.cos(rad));
        
        // 设置新的速度
        ball.body.setVelocity(newVelX, newVelY);
        
        // 输出调试信息
        console.log(`Paddle collision: diff=${diff}, normalizedDiff=${normalizedDiff}, angle=${angle}`);
        console.log(`New velocity: x=${newVelX}, y=${newVelY}`);
    }

    hitBrick(ball, brick) {
        // 播放音效
        if (this.soundEnabled) {
            this.hitSound.play();
        }

        // 增加分数
        this.score += 10;
        this.scoreText.setText('分数: ' + this.score);

        // 改进砖块消失动画
        this.tweens.add({
            targets: brick,
            scaleX: 0,  // 水平方向缩小到0
            scaleY: 0,  // 垂直方向缩小到0
            alpha: 0,   // 逐渐透明
            duration: 200,
            ease: 'Power2',
            onComplete: () => {
                brick.destroy();
                
                // 检查是否通关
                if (this.bricks.countActive() === 0) {
                    this.levelComplete();
                }
            }
        });

        // 添加破碎效果（不使用圆形，改用小方块）
        for (let i = 0; i < 4; i++) {
            const piece = this.add.rectangle(
                brick.x + Phaser.Math.Between(-20, 20),
                brick.y + Phaser.Math.Between(-10, 10),
                10,
                10,
                brick.getData('color') !== undefined ? 
                    [0xff4081, 0x7c4dff, 0x00bcd4, 0x64dd17, 0xffd600][brick.getData('color')] : 
                    0xffffff
            );

            this.tweens.add({
                targets: piece,
                x: piece.x + Phaser.Math.Between(-50, 50),
                y: piece.y + Phaser.Math.Between(30, 60),
                alpha: 0,
                scale: 0,
                duration: 300,
                ease: 'Power2',
                onComplete: () => piece.destroy()
            });
        }
    }

    createPowerUp(x, y) {
        // 创建新的球
        const newBall = this.physics.add.sprite(x, y, 'ball');
        newBall.setData('isPowerBall', true);
        
        // 设置物理属性
        newBall.body.setCircle(8);
        newBall.body.setBounce(1);
        newBall.body.setCollideWorldBounds(true);
        newBall.body.setVelocity(
            Phaser.Math.Between(-150, 150),
            150
        );

        // 添加碰撞检测
        this.physics.add.collider(newBall, this.paddle, this.hitPaddle, null, this);
        this.physics.add.collider(newBall, this.bricks, this.hitBrick, null, this);

        // 简化闪烁效果
        this.tweens.add({
            targets: newBall,
            alpha: 0.7,
            yoyo: true,
            repeat: -1,
            duration: 400
        });

        // 确保 powerUps 数组存在
        if (!this.powerUps) {
            this.powerUps = [];
        }

        this.powerUps.push(newBall);

        // 5秒后销毁
        this.time.delayedCall(5000, () => {
            if (newBall && newBall.active) {
                newBall.destroy();
                this.powerUps = this.powerUps.filter(p => p !== newBall);
            }
        });
    }

    levelComplete() {
        this.level++;
        this.combo = 0;
        
        // 添加过关动画和特效
        // 1. 闪烁背景
        this.cameras.main.flash(500, 255, 255, 255);
        
        // 2. 显示过关文字
        const levelText = this.add.text(400, 300, `Level ${this.level}`, {
            fontSize: '64px',
            fill: '#2196f3',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // 3. 添加文字动画
        this.tweens.add({
            targets: levelText,
            scale: { from: 0.5, to: 1.5 },
            alpha: { from: 1, to: 0 },
            duration: 1000,
            ease: 'Power2',
            onComplete: () => {
                levelText.destroy();
                this.startNextLevel();
            }
        });

        // 4. 添加粒子庆祝效果
        const particles = this.add.particles(400, 300, 'ball', {
            speed: { min: 200, max: 400 },
            angle: { min: 0, max: 360 },
            scale: { start: 0.4, end: 0 },
            alpha: { start: 1, end: 0 },
            lifespan: 1000,
            quantity: 2,
            frequency: 50,
            blendMode: 'ADD'
        });

        // 确保粒子系统在动画结束后被销毁
        this.time.delayedCall(1000, () => {
            if (particles && particles.active) {
                particles.destroy();
            }
        });
    }

    startNextLevel() {
        // 重置球和球拍
        this.resetBall();
        
        // 清除所有砖块和道具
        this.bricks.clear(true, true);
        this.powerUps.forEach(p => p.destroy());
        this.powerUps = [];
        
        // 创建新的砖块布局
        this.createBricks();
        
        // 更新UI
        this.levelText.setText(`关卡 ${this.level}`);
    }

    createBricks() {
        const brickColors = 5; // 砖块颜色数量
        const rows = 5;
        const cols = 8;
        const brickWidth = 80;
        const brickHeight = 30;
        const padding = 10;
        const offsetX = 80;
        const offsetY = 60;

        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                const brickX = offsetX + j * (brickWidth + padding);
                const brickY = offsetY + i * (brickHeight + padding);
                const colorIndex = i % brickColors;
                
                const brick = this.bricks.create(brickX, brickY, `brick${colorIndex}`);
                brick.setScale(0.8);
                brick.setData('color', colorIndex);
            }
        }
    }

    setupInput() {
        // 键盘控制
        this.cursors = this.input.keyboard.createCursorKeys();
        
        // 鼠标控制
        this.input.on('pointermove', (pointer) => {
            const x = Phaser.Math.Clamp(pointer.x, 52, 748);
            this.paddle.x = x;
            if (!this.ballLaunched) {
                this.ball.x = x;
            }
        });

        // 发射球
        this.input.on('pointerdown', () => {
            if (!this.ballLaunched) {
                this.launchBall();
            }
        });

        // 空格键发射
        this.cursors.space.on('down', () => {
            if (!this.ballLaunched) {
                this.launchBall();
            }
        });

        // 添加开始提示文本
        this.startText = this.add.text(400, 450, '点击或按空格键发射小球', {
            fontSize: '24px',
            fill: '#2196f3',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
    }

    launchBall() {
        if (!this.ballLaunched) {
            this.ballLaunched = true;
            // 修改初始发射
            this.ball.body.setVelocity(0, -300);  // 直接向上发射
            if (this.startText) {
                this.startText.destroy();
            }
        }
    }

    update() {
        // 球拍跟随鼠标移动
        if (this.input.activePointer.x) {
            this.paddle.x = Phaser.Math.Clamp(
                this.input.activePointer.x,
                52,
                748
            );
        }

        // 未发射时球跟随球拍
        if (!this.ballLaunched) {
            this.ball.x = this.paddle.x;
            this.ball.y = this.paddle.y - 20;
        }

        // 修改掉落检测
        if (this.ball.y > this.paddle.y + 20) {
            this.lives--;
            if (this.lives > 0) {
                this.livesText.setText('❤️'.repeat(this.lives));
                this.resetBall();
                
                // 添加提示文本
                const lostText = this.add.text(400, 300, '失去一条生命，点击继续', {
                    fontSize: '24px',
                    fill: '#2196f3'
                }).setOrigin(0.5);

                // 等待点击继续
                this.input.once('pointerdown', () => {
                    lostText.destroy();
                    this.launchBall();
                });
            } else {
                // 检查重试次数
                if (this.retryCount < 1) {
                    this.retryCount++;
                    this.scene.start('GameOverScene', { 
                        score: this.score,
                        canRetry: true 
                    });
                } else {
                    this.scene.start('GameOverScene', { 
                        score: this.score,
                        canRetry: false 
                    });
                }
            }
        }

        // 移除额外的碰撞检查，使用物理系统的内置碰撞检测
        if (this.ballLaunched) {
            const velocity = this.ball.body.velocity;
            const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
            
            // 确保球速度保持在合理范围
            if (speed < 200 || speed > 400) {
                const targetSpeed = 300;
                const scale = targetSpeed / speed;
                this.ball.body.setVelocity(
                    velocity.x * scale,
                    velocity.y * scale
                );
            }

            // 确保垂直速度不会太小
            const minVerticalSpeed = 150;  // 增加最小垂直速度
            if (Math.abs(velocity.y) < minVerticalSpeed) {
                const sign = velocity.y > 0 ? 1 : -1;
                this.ball.body.setVelocityY(sign * minVerticalSpeed);
            }

            // 输出调试信息
            if (this.ball.y > this.paddle.y - 30 && this.ball.y < this.paddle.y + 30) {
                console.log(`Ball near paddle: x=${this.ball.x}, y=${this.ball.y}`);
                console.log(`Paddle position: x=${this.paddle.x}, y=${this.paddle.y}`);
            }
        }

        // 修复球的更新逻辑
        if (this.powerUps && Array.isArray(this.powerUps)) {
            this.powerUps = this.powerUps.filter(ball => {
                if (!ball || !ball.active || !ball.body) {
                    return false;
                }

                if (ball.y > 600) {
                    ball.destroy();
                    return false;
                }

                // 确保球速度保持在合理范围
                const velocity = ball.body.velocity;
                const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
                
                if (speed < 200 || speed > 400) {
                    const targetSpeed = 300;
                    const scale = targetSpeed / speed;
                    ball.body.setVelocity(
                        velocity.x * scale,
                        velocity.y * scale
                    );
                }

                return true;
            });
        }
    }

    resetBall() {
        this.ballLaunched = false;
        this.ball.body.setVelocity(0, 0);
        this.ball.x = this.paddle.x;
        this.ball.y = this.paddle.y - 20;
    }
} 