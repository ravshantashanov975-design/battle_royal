 // JavaScript - Asosiy o'zgaruvchilar
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        // O'yin konstantalari
        const PLAYER_SIZE = 15;
        const PLAYER_SPEED = 2.5;
        const BULLET_SPEED = 10;
        const BOT_SPEED = 2;
        const MAP_SIZE = 3500;
        const TOTAL_BOTS = 14;
        const WEAPON_SIZE = 15;
        const HEALTH_RESTORE = 1200;

        // Dekoratsiyalar va airdrop
        let decorations = [];
        let airdrop = null;

        // Ranglar
        const COLORS = [
            '#44ff44', '#ff4444', '#4444ff', '#ffff44', 
            '#ff44ff', '#44ffff', '#ff8844', '#88ff44',
            '#8844ff', '#ff88ff'
        ];

        let player1Color = COLORS[0];
        let player2Color = COLORS[1];

        // Qurollar
        const WEAPONS = [
            { name: 'Pichoq', damage: 50, color: '#888888', fireRate: 500, range: 30, ammo: -1 },
            { name: 'Pistol', damage: 100, color: '#666666', fireRate: 400, range: 200, ammo: -1 },
            { name: 'Shotgun', damage: 150, color: '#8B4513', fireRate: 800, range: 100, ammo: -1 },
            { name: 'SMG', damage: 120, color: '#FFD700', fireRate: 150, range: 180, ammo: -1 },
            { name: 'AK-47', damage: 200, color: '#8B0000', fireRate: 200, range: 250, ammo: -1 },
            { name: 'M4A1', damage: 250, color: '#4169E1', fireRate: 180, range: 280, ammo: -1 },
            { name: 'Sniper', damage: 400, color: '#2F4F4F', fireRate: 1200, range: 400, ammo: -1 },
            { name: 'Minigun', damage: 300, color: '#FF4500', fireRate: 100, range: 220, ammo: -1 },
            { name: 'AWM', damage: 1000, color: '#FF0000', fireRate: 1500, range: 500, ammo: -1 },
            { name: 'Bazooka', damage: 5000, color: '#FF1493', fireRate: 360, range: 600, ammo: 5 }
        ];

        // O'yin holati
        let gameMode = 0; // 0 = menu, 1 = 1 player, 2 = 2 player
        let gameRunning = false;
        let gamePaused = false;
        let player1, player2, bots, bullets, weaponsOnGround;
        let keys = {};
        let mouse = { x: 0, y: 0 };
        let aliveCount = 0;

        // Mobile joystick
        let joystickActive = false;
        let joystickStart = { x: 0, y: 0 };
        let joystickCurrent = { x: 0, y: 0 };

        let joystickP1Active = false;
        let joystickP1Start = { x: 0, y: 0 };
        let joystickP1Current = { x: 0, y: 0 };

        let joystickP2Active = false;
        let joystickP2Start = { x: 0, y: 0 };
        let joystickP2Current = { x: 0, y: 0 };

        // JavaScript - Menu funksiyalari

        function togglePause() {
            if (!gameRunning) return;
            
            gamePaused = !gamePaused;
            document.getElementById('pauseMenu').style.display = gamePaused ? 'block' : 'none';
            document.getElementById('pauseBtn').innerHTML = gamePaused ? '▶' : '⏸';
        }

        document.getElementById('resumeBtn').addEventListener('click', () => {
            togglePause();
        });

        document.getElementById('menuBtnPause').addEventListener('click', () => {
            gamePaused = false;
            document.getElementById('pauseMenu').style.display = 'none';
            document.getElementById('gameOver').style.display = 'none';
            document.getElementById('gameUI').style.display = 'none';
            document.getElementById('menu').style.display = 'flex';
            document.getElementById('mobileControls').style.display = 'none';
            document.getElementById('mobileControls2P').style.display = 'none';
            gameRunning = false;
        });

        function showSettings() {
            document.getElementById('menu').style.display = 'none';
            document.getElementById('settings').style.display = 'flex';
            initColorSelectors();
        }

        function hideSettings() {
            document.getElementById('settings').style.display = 'none';
            document.getElementById('menu').style.display = 'flex';
        }

        function initColorSelectors() {
            const grid1 = document.getElementById('colorGrid1');
            const grid2 = document.getElementById('colorGrid2');
            
            grid1.innerHTML = '';
            grid2.innerHTML = '';

            COLORS.forEach((color, index) => {
                const option1 = document.createElement('div');
                option1.className = 'color-option';
                option1.style.background = color;
                if (color === player1Color) option1.classList.add('selected');
                option1.onclick = () => selectColor(1, color);
                grid1.appendChild(option1);

                const option2 = document.createElement('div');
                option2.className = 'color-option';
                option2.style.background = color;
                if (color === player2Color) option2.classList.add('selected');
                option2.onclick = () => selectColor(2, color);
                grid2.appendChild(option2);
            });
        }

        function selectColor(playerNum, color) {
            if (playerNum === 1) {
                player1Color = color;
            } else {
                player2Color = color;
            }
            initColorSelectors();
        }

        function startGame(mode) {
            gameMode = mode;
            document.getElementById('menu').style.display = 'none';
            document.getElementById('gameUI').style.display = 'block';
            
            if (mode === 2) {
                document.getElementById('stats2').style.display = 'block';
                document.getElementById('weaponInfo2').style.display = 'block';
                document.getElementById('player2ColorSelector').style.display = 'block';
                document.getElementById('finalKills2Text').style.display = 'block';
                
                if (isMobile()) {
                    document.getElementById('mobileControls2P').style.display = 'block';
                }
            } else {
                document.getElementById('stats2').style.display = 'none';
                document.getElementById('weaponInfo2').style.display = 'none';
                
                if (isMobile()) {
                    document.getElementById('mobileControls').style.display = 'block';
                }
            }
            
            initGame();
        }

        function initGame() {
            // O'yinchilarni yaratish
            player1 = {
                x: Math.random() * MAP_SIZE,
                y: Math.random() * MAP_SIZE,
                health: 10000,
                maxHealth: 10000,
                weapon: 0,
                angle: 0,
                lastShot: 0,
                kills: 0,
                alive: true,
                color: player1Color,
                id: 1,
                bazookaAmmo: 0
            };

            if (gameMode === 2) {
                player2 = {
                    x: Math.random() * MAP_SIZE,
                    y: Math.random() * MAP_SIZE,
                    health: 10000,
                    maxHealth: 10000,
                    weapon: 0,
                    angle: 0,
                    lastShot: 0,
                    kills: 0,
                    alive: true,
                    color: player2Color,
                    id: 2,
                    bazookaAmmo: 0
                };
                aliveCount = TOTAL_BOTS + 2;
            } else {
                aliveCount = TOTAL_BOTS + 1;
            }

            bots = [];
            bullets = [];
            weaponsOnGround = [];
            decorations = [];

            createBots();
            createWeapons();
            createDecorations();
            createAirdrop();
            
            gameRunning = true;
            gameLoop();
        }

        // Airdrop yaratish
        function createAirdrop() {
            airdrop = {
                x: MAP_SIZE / 2,
                y: MAP_SIZE / 2,
                opened: false,
                canOpen: false
            };
        }

        // Airdropni tekshirish
        function checkAirdrop(player) {
            if (!airdrop || airdrop.opened) return;
            
            // 3 ta kill qilgan bo'lsa ochish mumkin
            if (player.kills >= 3) {
                airdrop.canOpen = true;
            }
            
            const dist = distance(player.x, player.y, airdrop.x, airdrop.y);
            if (dist < 50 && airdrop.canOpen) {
                airdrop.opened = true;
                player.weapon = 9; // Bazooka
                player.bazookaAmmo = 5;
                
                if (player === player1) {
                    document.getElementById('weaponInfo').innerHTML = 
                        `💥 Bazooka (${player.bazookaAmmo})`;
                } else if (player === player2) {
                    document.getElementById('weaponInfo2').innerHTML = 
                        `💥 Bazooka (${player.bazookaAmmo})`;
                }
            }
        }

        // Dekoratsiyalar yaratish
        function createDecorations() {
            // Daraxtlar
            for (let i = 0; i < 100; i++) {
                decorations.push({
                    type: 'tree',
                    x: Math.random() * MAP_SIZE,
                    y: Math.random() * MAP_SIZE,
                    size: 30 + Math.random() * 20,
                    color: Math.random() > 0.5 ? '#2d5016' : '#1a3a0f'
                });
            }

            // Yashiklar
            for (let i = 0; i < 60; i++) {
                decorations.push({
                    type: 'crate',
                    x: Math.random() * MAP_SIZE,
                    y: Math.random() * MAP_SIZE,
                    size: 25 + Math.random() * 10,
                    color: '#8B4513'
                });
            }

            // Toshlar
            for (let i = 0; i < 80; i++) {
                decorations.push({
                    type: 'rock',
                    x: Math.random() * MAP_SIZE,
                    y: Math.random() * MAP_SIZE,
                    size: 20 + Math.random() * 15,
                    color: '#696969'
                });
            }
        }

        // JavaScript - Botlar va qurollar

        function createBots() {
            for (let i = 0; i < TOTAL_BOTS; i++) {
                bots.push({
                    x: Math.random() * MAP_SIZE,
                    y: Math.random() * MAP_SIZE,
                    health: 10000,
                    weapon: 0,
                    angle: Math.random() * Math.PI * 2,
                    lastShot: 0,
                    kills: 0,
                    alive: true,
                    target: null,
                    moveTimer: 0
                });
            }
        }

        function createWeapons() {
            // Pichoqdan AWM gacha (Bazooka airdropda)
            for (let i = 1; i < WEAPONS.length - 1; i++) {
                let count = i === 8 ? 2 : Math.floor(Math.random() * 8) + 5; // AWM 2 ta, qolganlar ko'proq
                for (let j = 0; j < count; j++) {
                    weaponsOnGround.push({
                        x: Math.random() * MAP_SIZE,
                        y: Math.random() * MAP_SIZE,
                        type: i
                    });
                }
            }
        }

        function distance(x1, y1, x2, y2) {
            return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
        }

        function getWeaponEmoji(type) {
            const emojis = ['🔪', '🔫', '💥', '🔫', '🔫', '🔫', '🎯', '⚙️', '💀', '💣'];
            return emojis[type] || '🔪';
        }

        function getWeaponName(type) {
            return WEAPONS[type] ? WEAPONS[type].name : 'Pichoq';
        }

        // JavaScript - Klaviatura va sichqoncha

        window.addEventListener('keydown', (e) => {
            keys[e.key.toLowerCase()] = true;
            
            // Player 1 otish - Alt
            if (e.key === 'Alt') {
                e.preventDefault();
                if (player1 && player1.alive) shoot(player1);
            }
            
            // Player 2 otish - Insert (0)
            if (e.key === 'Insert' || e.key === '0') {
                e.preventDefault();
                if (player2 && player2.alive && gameMode === 2) shoot(player2);
            }
        });

        window.addEventListener('keyup', (e) => {
            keys[e.key.toLowerCase()] = false;
        });

        canvas.addEventListener('mousemove', (e) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
        });

        canvas.addEventListener('mousedown', () => {
            if (gameMode === 1 && player1.alive) {
                shoot(player1);
            }
        });

        // JavaScript - Mobile controls setup

        function isMobile() {
            return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        }

        // 1 Player joystick
        const joystick = document.querySelector('.joystick');
        const joystickInner = document.getElementById('joystickInner');
        const shootButton = document.getElementById('shootButton');

        if (joystick) {
            joystick.addEventListener('touchstart', (e) => {
                e.preventDefault();
                joystickActive = true;
                const rect = joystick.getBoundingClientRect();
                joystickStart.x = rect.left + rect.width / 2;
                joystickStart.y = rect.top + rect.height / 2;
            });

            joystick.addEventListener('touchmove', (e) => {
                e.preventDefault();
                if (joystickActive) {
                    const touch = e.touches[0];
                    joystickCurrent.x = touch.clientX;
                    joystickCurrent.y = touch.clientY;
                    
                    const dx = joystickCurrent.x - joystickStart.x;
                    const dy = joystickCurrent.y - joystickStart.y;
                    const dist = Math.min(35, Math.sqrt(dx * dx + dy * dy));
                    const angle = Math.atan2(dy, dx);
                    
                    joystickInner.style.left = `calc(50% + ${Math.cos(angle) * dist}px)`;
                    joystickInner.style.top = `calc(50% + ${Math.sin(angle) * dist}px)`;
                }
            });

            joystick.addEventListener('touchend', () => {
                joystickActive = false;
                joystickInner.style.left = '50%';
                joystickInner.style.top = '50%';
            });
        }

        let shootInterval = null;
        if (shootButton) {
            shootButton.addEventListener('touchstart', (e) => {
                e.preventDefault();
                if (player1 && player1.alive) shoot(player1);
                shootInterval = setInterval(() => {
                    if (player1 && player1.alive) shoot(player1);
                }, 100);
            });

            shootButton.addEventListener('touchend', (e) => {
                e.preventDefault();
                if (shootInterval) {
                    clearInterval(shootInterval);
                    shootInterval = null;
                }
            });
        }

        // 2 Player joysticks
        const joystickP1 = document.querySelector('.joystick-p1');
        const joystickInnerP1 = document.getElementById('joystickInnerP1');
        const shootButtonP1 = document.getElementById('shootButtonP1');

        const joystickP2 = document.querySelector('.joystick-p2');
        const joystickInnerP2 = document.getElementById('joystickInnerP2');
        const shootButtonP2 = document.getElementById('shootButtonP2');

        if (joystickP1) {
            joystickP1.addEventListener('touchstart', (e) => {
                e.preventDefault();
                joystickP1Active = true;
                const rect = joystickP1.getBoundingClientRect();
                joystickP1Start.x = rect.left + rect.width / 2;
                joystickP1Start.y = rect.top + rect.height / 2;
            });

            joystickP1.addEventListener('touchmove', (e) => {
                e.preventDefault();
                if (joystickP1Active) {
                    const touch = e.touches[0];
                    joystickP1Current.x = touch.clientX;
                    joystickP1Current.y = touch.clientY;
                    
                    const dx = joystickP1Current.x - joystickP1Start.x;
                    const dy = joystickP1Current.y - joystickP1Start.y;
                    const dist = Math.min(35, Math.sqrt(dx * dx + dy * dy));
                    const angle = Math.atan2(dy, dx);
                    
                    joystickInnerP1.style.left = `calc(50% + ${Math.cos(angle) * dist}px)`;
                    joystickInnerP1.style.top = `calc(50% + ${Math.sin(angle) * dist}px)`;
                }
            });

            joystickP1.addEventListener('touchend', () => {
                joystickP1Active = false;
                joystickInnerP1.style.left = '50%';
                joystickInnerP1.style.top = '50%';
            });
        }

        if (joystickP2) {
            joystickP2.addEventListener('touchstart', (e) => {
                e.preventDefault();
                joystickP2Active = true;
                const rect = joystickP2.getBoundingClientRect();
                joystickP2Start.x = rect.left + rect.width / 2;
                joystickP2Start.y = rect.top + rect.height / 2;
            });

            joystickP2.addEventListener('touchmove', (e) => {
                e.preventDefault();
                if (joystickP2Active) {
                    const touch = e.touches[0];
                    joystickP2Current.x = touch.clientX;
                    joystickP2Current.y = touch.clientY;
                    
                    const dx = joystickP2Current.x - joystickP2Start.x;
                    const dy = joystickP2Current.y - joystickP2Start.y;
                    const dist = Math.min(35, Math.sqrt(dx * dx + dy * dy));
                    const angle = Math.atan2(dy, dx);
                    
                    joystickInnerP2.style.left = `calc(50% + ${Math.cos(angle) * dist}px)`;
                    joystickInnerP2.style.top = `calc(50% + ${Math.sin(angle) * dist}px)`;
                }
            });

            joystickP2.addEventListener('touchend', () => {
                joystickP2Active = false;
                joystickInnerP2.style.left = '50%';
                joystickInnerP2.style.top = '50%';
            });
        }

        let shootIntervalP1 = null;
        let shootIntervalP2 = null;

        if (shootButtonP1) {
            shootButtonP1.addEventListener('touchstart', (e) => {
                e.preventDefault();
                if (player1 && player1.alive) shoot(player1);
                shootIntervalP1 = setInterval(() => {
                    if (player1 && player1.alive) shoot(player1);
                }, 100);
            });

            shootButtonP1.addEventListener('touchend', (e) => {
                e.preventDefault();
                if (shootIntervalP1) {
                    clearInterval(shootIntervalP1);
                    shootIntervalP1 = null;
                }
            });
        }

        if (shootButtonP2) {
            shootButtonP2.addEventListener('touchstart', (e) => {
                e.preventDefault();
                if (player2 && player2.alive) shoot(player2);
                shootIntervalP2 = setInterval(() => {
                    if (player2 && player2.alive) shoot(player2);
                }, 100);
            });

            shootButtonP2.addEventListener('touchend', (e) => {
                e.preventDefault();
                if (shootIntervalP2) {
                    clearInterval(shootIntervalP2);
                    shootIntervalP2 = null;
                }
            });
        }

        // JavaScript - O'yinchilarni harakatlantirish

        function checkCollision(x, y, size, excludeEntity) {
            // Boshqa playerlar bilan to'qnashuv
            if (player1 && player1.alive && player1 !== excludeEntity) {
                const dist = distance(x, y, player1.x, player1.y);
                if (dist < size + PLAYER_SIZE) return true;
            }
            if (player2 && player2.alive && player2 !== excludeEntity && gameMode === 2) {
                const dist = distance(x, y, player2.x, player2.y);
                if (dist < size + PLAYER_SIZE) return true;
            }

            // Botlar bilan to'qnashuv
            for (let bot of bots) {
                if (!bot.alive || bot === excludeEntity) continue;
                const dist = distance(x, y, bot.x, bot.y);
                if (dist < size + PLAYER_SIZE) return true;
            }

            // Dekoratsiyalar bilan to'qnashuv
            for (let deco of decorations) {
                if (deco.type === 'tree' || deco.type === 'crate') {
                    const dist = distance(x, y, deco.x, deco.y);
                    if (dist < size + deco.size / 2) return true;
                }
            }

            return false;
        }

        function movePlayer(player, isPlayer1) {
            if (!player || !player.alive) return;

            let moveX = 0;
            let moveY = 0;

            if (gameMode === 1) {
                // 1 Player - WASD va joystick
                if (joystickActive) {
                    const dx = joystickCurrent.x - joystickStart.x;
                    const dy = joystickCurrent.y - joystickStart.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist > 10) {
                        moveX = dx / dist;
                        moveY = dy / dist;
                    }
                } else {
                    if (keys['w'] || keys['arrowup']) moveY -= 1;
                    if (keys['s'] || keys['arrowdown']) moveY += 1;
                    if (keys['a'] || keys['arrowleft']) moveX -= 1;
                    if (keys['d'] || keys['arrowright']) moveX += 1;
                }

                if (!isMobile()) {
                    player.angle = Math.atan2(mouse.y - canvas.height / 2, mouse.x - canvas.width / 2);
                } else if (joystickActive) {
                    const dx = joystickCurrent.x - joystickStart.x;
                    const dy = joystickCurrent.y - joystickStart.y;
                    if (Math.sqrt(dx * dx + dy * dy) > 10) {
                        player.angle = Math.atan2(dy, dx);
                    }
                }
            } else if (gameMode === 2) {
                // 2 Player rejimi
                if (isPlayer1) {
                    // Player 1 - WASD va joystick P1
                    if (isMobile() && joystickP1Active) {
                        const dx = joystickP1Current.x - joystickP1Start.x;
                        const dy = joystickP1Current.y - joystickP1Start.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        if (dist > 10) {
                            moveX = dx / dist;
                            moveY = dy / dist;
                            player.angle = Math.atan2(dy, dx);
                        }
                    } else if (!isMobile()) {
                        if (keys['w']) moveY -= 1;
                        if (keys['s']) moveY += 1;
                        if (keys['a']) moveX -= 1;
                        if (keys['d']) moveX += 1;
                        
                        if (moveX !== 0 || moveY !== 0) {
                            player.angle = Math.atan2(moveY, moveX);
                        }
                    }
                } else {
                    // Player 2 - Arrow keys va joystick P2
                    if (isMobile() && joystickP2Active) {
                        const dx = joystickP2Current.x - joystickP2Start.x;
                        const dy = joystickP2Current.y - joystickP2Start.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        if (dist > 10) {
                            moveX = dx / dist;
                            moveY = dy / dist;
                            player.angle = Math.atan2(dy, dx);
                        }
                    } else if (!isMobile()) {
                        // Arrows keys to'g'ri ishlashi uchun
                        const upKey = keys['arrowup'];
                        const downKey = keys['arrowdown'];
                        const leftKey = keys['arrowleft'];
                        const rightKey = keys['arrowright'];
                        
                        if (upKey) moveY -= 1;
                        if (downKey) moveY += 1;
                        if (leftKey) moveX -= 1;
                        if (rightKey) moveX += 1;
                        
                        if (moveX !== 0 || moveY !== 0) {
                            player.angle = Math.atan2(moveY, moveX);
                        }
                    }
                }
            }

            // Harakat - to'qnashuvni tekshirish bilan
            if (moveX !== 0 || moveY !== 0) {
                const length = Math.sqrt(moveX * moveX + moveY * moveY);
                moveX = (moveX / length) * PLAYER_SPEED;
                moveY = (moveY / length) * PLAYER_SPEED;
                
                const newX = Math.max(0, Math.min(MAP_SIZE, player.x + moveX));
                const newY = Math.max(0, Math.min(MAP_SIZE, player.y + moveY));

                // To'qnashuv tekshirish
                if (!checkCollision(newX, player.y, PLAYER_SIZE, player)) {
                    player.x = newX;
                }
                if (!checkCollision(player.x, newY, PLAYER_SIZE, player)) {
                    player.y = newY;
                }
            }
        }

        // JavaScript - O'q otish

        function shoot(entity) {
            const now = Date.now();
            const weapon = WEAPONS[entity.weapon];
            
            if (now - entity.lastShot < weapon.fireRate) return;
            
            // Bazooka uchun o'q tekshirish
            if (entity.weapon === 9) {
                if (entity.bazookaAmmo <= 0) return;
                entity.bazookaAmmo--;
                
                // UI yangilash
                if (entity === player1) {
                    if (entity.bazookaAmmo > 0) {
                        document.getElementById('weaponInfo').innerHTML = 
                            `💥 Bazooka (${entity.bazookaAmmo})`;
                    } else {
                        entity.weapon = 0;
                        document.getElementById('weaponInfo').innerHTML = '🔪 Pichoq';
                    }
                } else if (entity === player2) {
                    if (entity.bazookaAmmo > 0) {
                        document.getElementById('weaponInfo2').innerHTML = 
                            `💥 Bazooka (${entity.bazookaAmmo})`;
                    } else {
                        entity.weapon = 0;
                        document.getElementById('weaponInfo2').innerHTML = '🔪 Pichoq';
                    }
                }
            }
            
            entity.lastShot = now;

            if (weapon.name === 'Pichoq') {
                meleeAttack(entity);
            } else {
                bullets.push({
                    x: entity.x,
                    y: entity.y,
                    vx: Math.cos(entity.angle) * BULLET_SPEED,
                    vy: Math.sin(entity.angle) * BULLET_SPEED,
                    damage: weapon.damage,
                    owner: entity,
                    range: weapon.range,
                    traveled: 0,
                    isBazooka: entity.weapon === 9
                });
            }
        }

        function meleeAttack(entity) {
            const weapon = WEAPONS[entity.weapon];
            
            if (entity === player1 || entity === player2) {
                // Player botlarga zarba beradi
                bots.forEach(bot => {
                    if (!bot.alive) return;
                    const dist = distance(entity.x, entity.y, bot.x, bot.y);
                    if (dist < weapon.range) {
                        bot.health -= weapon.damage;
                        if (bot.health <= 0) {
                            bot.alive = false;
                            entity.kills++;
                            aliveCount--;
                            // Jon tiklash
                            entity.health = Math.min(entity.maxHealth, entity.health + HEALTH_RESTORE);
                        }
                    }
                });

                // 2 Player rejimida playerlar bir-birlariga zarba berishi
                if (gameMode === 2) {
                    const otherPlayer = entity === player1 ? player2 : player1;
                    if (otherPlayer && otherPlayer.alive) {
                        const dist = distance(entity.x, entity.y, otherPlayer.x, otherPlayer.y);
                        if (dist < weapon.range) {
                            otherPlayer.health -= weapon.damage;
                            if (otherPlayer.health <= 0) {
                                otherPlayer.alive = false;
                                entity.kills++;
                                aliveCount--;
                                // Jon tiklash
                                entity.health = Math.min(entity.maxHealth, entity.health + HEALTH_RESTORE);
                                checkGameOver();
                            }
                        }
                    }
                }
            } else {
                // Bot playerga zarba beradi
                if (player1 && player1.alive) {
                    const dist = distance(entity.x, entity.y, player1.x, player1.y);
                    if (dist < weapon.range) {
                        player1.health -= weapon.damage;
                        if (player1.health <= 0) {
                            player1.alive = false;
                            aliveCount--;
                            entity.kills++;
                            checkGameOver();
                        }
                    }
                }

                if (player2 && player2.alive && gameMode === 2) {
                    const dist = distance(entity.x, entity.y, player2.x, player2.y);
                    if (dist < weapon.range) {
                        player2.health -= weapon.damage;
                        if (player2.health <= 0) {
                            player2.alive = false;
                            aliveCount--;
                            entity.kills++;
                            checkGameOver();
                        }
                    }
                }
            }
        }

        function updateBullets() {
            bullets = bullets.filter(bullet => {
                bullet.x += bullet.vx;
                bullet.y += bullet.vy;
                bullet.traveled += BULLET_SPEED;

                if (bullet.x < 0 || bullet.x > MAP_SIZE || bullet.y < 0 || bullet.y > MAP_SIZE) {
                    return false;
                }

                if (bullet.traveled > bullet.range) {
                    return false;
                }

                // Player o'qlari botlarga tegadi
                if (bullet.owner === player1 || bullet.owner === player2) {
                    for (let bot of bots) {
                        if (!bot.alive) continue;
                        
                        const dist = distance(bullet.x, bullet.y, bot.x, bot.y);
                        if (dist < PLAYER_SIZE) {
                            bot.health -= bullet.damage;
                            if (bot.health <= 0) {
                                bot.alive = false;
                                bullet.owner.kills++;
                                aliveCount--;
                                // Jon tiklash
                                bullet.owner.health = Math.min(bullet.owner.maxHealth, bullet.owner.health + HEALTH_RESTORE);
                            }
                            return false;
                        }
                    }

                    // 2 Player rejimida playerlar bir-biriga otishi
                    if (gameMode === 2) {
                        const otherPlayer = bullet.owner === player1 ? player2 : player1;
                        if (otherPlayer && otherPlayer.alive) {
                            const dist = distance(bullet.x, bullet.y, otherPlayer.x, otherPlayer.y);
                            if (dist < PLAYER_SIZE) {
                                otherPlayer.health -= bullet.damage;
                                if (otherPlayer.health <= 0) {
                                    otherPlayer.alive = false;
                                    bullet.owner.kills++;
                                    aliveCount--;
                                    // Jon tiklash
                                    bullet.owner.health = Math.min(bullet.owner.maxHealth, bullet.owner.health + HEALTH_RESTORE);
                                    checkGameOver();
                                }
                                return false;
                            }
                        }
                    }
                } else {
                    // Bot o'qlari playerlarga tegadi
                    if (player1 && player1.alive) {
                        const dist = distance(bullet.x, bullet.y, player1.x, player1.y);
                        if (dist < PLAYER_SIZE) {
                            player1.health -= bullet.damage;
                            if (player1.health <= 0) {
                                player1.alive = false;
                                aliveCount--;
                                bullet.owner.kills++;
                                checkGameOver();
                            }
                            return false;
                        }
                    }

                    if (player2 && player2.alive && gameMode === 2) {
                        const dist = distance(bullet.x, bullet.y, player2.x, player2.y);
                        if (dist < PLAYER_SIZE) {
                            player2.health -= bullet.damage;
                            if (player2.health <= 0) {
                                player2.alive = false;
                                aliveCount--;
                                bullet.owner.kills++;
                                checkGameOver();
                            }
                            return false;
                        }
                    }
                }

                return true;
            });
        }

        // JavaScript - Botlar AI

        function updateBots() {
            bots.forEach(bot => {
                if (!bot.alive) return;

                bot.moveTimer--;

                if (!bot.target || bot.moveTimer <= 0) {
                    const nearbyWeapons = weaponsOnGround.filter(w => 
                        distance(bot.x, bot.y, w.x, w.y) < 300
                    );
                    
                    if (nearbyWeapons.length > 0 && bot.weapon < 3) {
                        bot.target = nearbyWeapons[0];
                    } else {
                        bot.target = {
                            x: Math.random() * MAP_SIZE,
                            y: Math.random() * MAP_SIZE
                        };
                    }
                    bot.moveTimer = Math.random() * 200 + 100;
                }

                if (bot.target) {
                    const dx = bot.target.x - bot.x;
                    const dy = bot.target.y - bot.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    
                    if (dist > 5) {
                        const newX = bot.x + (dx / dist) * BOT_SPEED;
                        const newY = bot.y + (dy / dist) * BOT_SPEED;
                        
                        // To'qnashuv tekshirish
                        if (!checkCollision(newX, bot.y, PLAYER_SIZE, bot)) {
                            bot.x = newX;
                        }
                        if (!checkCollision(bot.x, newY, PLAYER_SIZE, bot)) {
                            bot.y = newY;
                        }
                        
                        bot.angle = Math.atan2(dy, dx);
                    }
                }

                checkWeaponPickup(bot);

                // Player 1 ga hujum
                if (player1 && player1.alive) {
                    const distToPlayer = distance(bot.x, bot.y, player1.x, player1.y);
                    
                    if (distToPlayer < 300) {
                        bot.angle = Math.atan2(player1.y - bot.y, player1.x - bot.x);
                        const shootChance = distToPlayer < 150 ? 0.08 : 0.04;
                        
                        if (Math.random() < shootChance) {
                            shoot(bot);
                            return;
                        }
                    }
                }

                // Player 2 ga hujum (agar 2 player rejimida bo'lsa)
                if (player2 && player2.alive && gameMode === 2) {
                    const distToPlayer2 = distance(bot.x, bot.y, player2.x, player2.y);
                    
                    if (distToPlayer2 < 300) {
                        // Eng yaqin playerni tanlash
                        const distToPlayer1 = player1 && player1.alive ? distance(bot.x, bot.y, player1.x, player1.y) : Infinity;
                        
                        if (distToPlayer2 < distToPlayer1) {
                            bot.angle = Math.atan2(player2.y - bot.y, player2.x - bot.x);
                            const shootChance = distToPlayer2 < 150 ? 0.08 : 0.04;
                            
                            if (Math.random() < shootChance) {
                                shoot(bot);
                            }
                        }
                    }
                }
            });
        }

        // JavaScript - Qurollarni olish

        function checkWeaponPickup(entity) {
            weaponsOnGround = weaponsOnGround.filter(weapon => {
                const dist = distance(entity.x, entity.y, weapon.x, weapon.y);
                if (dist < 30 && weapon.type > entity.weapon) {
                    entity.weapon = weapon.type;
                    if (entity === player1) {
                        document.getElementById('weaponInfo').innerHTML = 
                            `${getWeaponEmoji(weapon.type)} ${WEAPONS[weapon.type].name}`;
                    } else if (entity === player2) {
                        document.getElementById('weaponInfo2').innerHTML = 
                            `${getWeaponEmoji(weapon.type)} ${WEAPONS[weapon.type].name}`;
                    }
                    return false;
                }
                return true;
            });
        }

        // Qurollarni chizish
        function drawWeapon(ctx, x, y, type) {
            const weapon = WEAPONS[type];
            ctx.save();
            ctx.translate(x, y);
            
            switch(type) {
                case 0: // Pichoq
                    ctx.fillStyle = '#888888';
                    ctx.beginPath();
                    ctx.moveTo(-8, 5);
                    ctx.lineTo(-3, 5);
                    ctx.lineTo(0, -8);
                    ctx.lineTo(3, 5);
                    ctx.lineTo(8, 5);
                    ctx.lineTo(5, 8);
                    ctx.lineTo(-5, 8);
                    ctx.closePath();
                    ctx.fill();
                    ctx.strokeStyle = '#000';
                    ctx.lineWidth = 1;
                    ctx.stroke();
                    break;
                    
                case 1: // Pistol
                    ctx.fillStyle = '#666666';
                    ctx.fillRect(-6, -3, 12, 6);
                    ctx.fillRect(6, -1, 4, 2);
                    ctx.fillStyle = '#444444';
                    ctx.fillRect(-6, -1, 5, 2);
                    break;
                    
                case 2: // Shotgun
                    ctx.fillStyle = '#8B4513';
                    ctx.fillRect(-10, -3, 20, 6);
                    ctx.fillRect(-12, -2, 5, 4);
                    ctx.fillStyle = '#654321';
                    ctx.fillRect(-8, -1, 10, 2);
                    break;
                    
                case 3: // SMG
                    ctx.fillStyle = '#FFD700';
                    ctx.fillRect(-8, -4, 16, 8);
                    ctx.fillRect(8, -2, 4, 4);
                    ctx.fillStyle = '#DAA520';
                    ctx.fillRect(-8, -2, 8, 4);
                    break;
                    
                case 4: // AK-47
                    ctx.fillStyle = '#8B0000';
                    ctx.fillRect(-12, -4, 24, 8);
                    ctx.fillRect(12, -2, 5, 4);
                    ctx.fillStyle = '#654321';
                    ctx.fillRect(-12, -2, 6, 4);
                    ctx.fillStyle = '#000';
                    ctx.fillRect(-6, -5, 2, 3);
                    break;
                    
                case 5: // M4A1
                    ctx.fillStyle = '#4169E1';
                    ctx.fillRect(-12, -3, 24, 6);
                    ctx.fillRect(12, -1, 5, 2);
                    ctx.fillStyle = '#000';
                    ctx.fillRect(-10, -4, 2, 2);
                    ctx.fillRect(-6, -4, 2, 2);
                    break;
                    
                case 6: // Sniper
                    ctx.fillStyle = '#2F4F4F';
                    ctx.fillRect(-15, -2, 30, 4);
                    ctx.fillRect(15, -1, 5, 2);
                    ctx.fillStyle = '#000';
                    ctx.fillRect(-15, -6, 3, 4);
                    ctx.fillRect(-8, -5, 12, 2);
                    break;
                    
                case 7: // Minigun
                    ctx.fillStyle = '#FF4500';
                    for(let i = 0; i < 4; i++) {
                        ctx.fillRect(-12, -4 + i*2, 20, 1.5);
                    }
                    ctx.fillStyle = '#654321';
                    ctx.fillRect(-14, -4, 4, 8);
                    break;
                    
                case 8: // AWM
                    ctx.fillStyle = '#FF0000';
                    ctx.fillRect(-16, -2, 32, 4);
                    ctx.fillRect(16, -1, 6, 2);
                    ctx.fillStyle = '#8B0000';
                    ctx.fillRect(-16, -5, 4, 3);
                    ctx.fillRect(-10, -6, 15, 2);
                    ctx.strokeStyle = '#000';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(-16, -2, 32, 4);
                    break;
                    
                case 9: // Bazooka
                    ctx.fillStyle = '#FF1493';
                    ctx.fillRect(-14, -5, 28, 10);
                    ctx.fillStyle = '#FF69B4';
                    ctx.fillRect(14, -3, 4, 6);
                    ctx.fillStyle = '#8B008B';
                    ctx.fillRect(-14, -3, 6, 6);
                    ctx.strokeStyle = '#000';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(-14, -5, 28, 10);
                    break;
            }
            
            ctx.restore();
        }

        // Odamni chizish
        function drawPerson(ctx, x, y, color, angle, size) {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(angle);
            
            // Bosh
            ctx.fillStyle = '#FFD8B8';
            ctx.beginPath();
            ctx.arc(0, -size * 0.6, size * 0.3, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 1;
            ctx.stroke();
            
            // Tanasi
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.ellipse(0, 0, size * 0.4, size * 0.6, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            
            // Qo'llar
            ctx.strokeStyle = color;
            ctx.lineWidth = size * 0.15;
            ctx.lineCap = 'round';
            
            // Chap qo'l
            ctx.beginPath();
            ctx.moveTo(-size * 0.3, -size * 0.1);
            ctx.lineTo(-size * 0.6, size * 0.3);
            ctx.stroke();
            
            // O'ng qo'l (qurolni ushlab turadi)
            ctx.beginPath();
            ctx.moveTo(size * 0.3, -size * 0.1);
            ctx.lineTo(size * 0.7, 0);
            ctx.stroke();
            
            // Oyoqlar
            ctx.strokeStyle = '#4169E1';
            ctx.lineWidth = size * 0.15;
            
            // Chap oyoq
            ctx.beginPath();
            ctx.moveTo(-size * 0.15, size * 0.5);
            ctx.lineTo(-size * 0.3, size * 0.9);
            ctx.stroke();
            
            // O'ng oyoq
            ctx.beginPath();
            ctx.moveTo(size * 0.15, size * 0.5);
            ctx.lineTo(size * 0.3, size * 0.9);
            ctx.stroke();
            
            ctx.restore();
        }

        // JavaScript - Chizish

        function drawScreen(player, screenX, screenY, screenWidth, screenHeight) {
            ctx.save();
            
            // Clip region - faqat o'z ekranida chizadi
            ctx.beginPath();
            ctx.rect(screenX, screenY, screenWidth, screenHeight);
            ctx.clip();

            // Kamera player ga ergashadi
            const cameraX = screenX + screenWidth / 2 - player.x;
            const cameraY = screenY + screenHeight / 2 - player.y;

            ctx.translate(cameraX, cameraY);

            // Xarita chegaralari
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 5;
            ctx.strokeRect(0, 0, MAP_SIZE, MAP_SIZE);

            // Dekoratsiyalar
            decorations.forEach(deco => {
                if (deco.type === 'tree') {
                    // Daraxt
                    ctx.fillStyle = '#4a2511';
                    ctx.fillRect(deco.x - 5, deco.y - 10, 10, 20);
                    ctx.fillStyle = deco.color;
                    ctx.beginPath();
                    ctx.arc(deco.x, deco.y - 15, deco.size / 2, 0, Math.PI * 2);
                    ctx.fill();
                } else if (deco.type === 'crate') {
                    // Yashik
                    ctx.fillStyle = deco.color;
                    ctx.fillRect(deco.x - deco.size/2, deco.y - deco.size/2, deco.size, deco.size);
                    ctx.strokeStyle = '#654321';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(deco.x - deco.size/2, deco.y - deco.size/2, deco.size, deco.size);
                    // X belgisi
                    ctx.beginPath();
                    ctx.moveTo(deco.x - deco.size/4, deco.y - deco.size/4);
                    ctx.lineTo(deco.x + deco.size/4, deco.y + deco.size/4);
                    ctx.moveTo(deco.x + deco.size/4, deco.y - deco.size/4);
                    ctx.lineTo(deco.x - deco.size/4, deco.y + deco.size/4);
                    ctx.stroke();
                } else if (deco.type === 'rock') {
                    // Tosh
                    ctx.fillStyle = deco.color;
                    ctx.beginPath();
                    ctx.arc(deco.x, deco.y, deco.size / 2, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.strokeStyle = '#505050';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }
            });

            // Qurollar
            weaponsOnGround.forEach(weapon => {
                drawWeapon(ctx, weapon.x, weapon.y, weapon.type);
            });

            // Airdrop
            if (airdrop && !airdrop.opened) {
                // Drop qutisi
                ctx.fillStyle = airdrop.canOpen ? '#FFD700' : '#FF6347';
                ctx.fillRect(airdrop.x - 35, airdrop.y - 35, 70, 70);
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 4;
                ctx.strokeRect(airdrop.x - 35, airdrop.y - 35, 70, 70);
                
                // Parashyut
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(airdrop.x, airdrop.y - 60, 40, 0, Math.PI, true);
                ctx.fill();
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 2;
                ctx.stroke();
                
                // Arqon
                ctx.beginPath();
                ctx.moveTo(airdrop.x - 30, airdrop.y - 60);
                ctx.lineTo(airdrop.x - 20, airdrop.y - 35);
                ctx.moveTo(airdrop.x + 30, airdrop.y - 60);
                ctx.lineTo(airdrop.x + 20, airdrop.y - 35);
                ctx.stroke();
                
                // Yozuv
                ctx.fillStyle = '#000';
                ctx.font = 'bold 20px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('DROP', airdrop.x, airdrop.y + 5);
                
                if (airdrop.canOpen) {
                    ctx.fillStyle = '#00ff00';
                    ctx.font = 'bold 14px Arial';
                    ctx.fillText('OPEN!', airdrop.x, airdrop.y + 60);
                } else {
                    ctx.fillStyle = '#ff0000';
                    ctx.font = 'bold 12px Arial';
                    ctx.fillText('3 KILL', airdrop.x, airdrop.y + 60);
                }
            }

            // Botlar
            bots.forEach(bot => {
                if (!bot.alive) return;
                
                // Odam shakli
                drawPerson(ctx, bot.x, bot.y, '#ff4444', bot.angle, PLAYER_SIZE);

                // Jon chizig'i
                const healthPercent = bot.health / 10000;
                ctx.fillStyle = '#00ff00';
                ctx.fillRect(bot.x - PLAYER_SIZE, bot.y - PLAYER_SIZE - 10, PLAYER_SIZE * 2 * healthPercent, 5);
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 1;
                ctx.strokeRect(bot.x - PLAYER_SIZE, bot.y - PLAYER_SIZE - 10, PLAYER_SIZE * 2, 5);
            });

            // Player 1
            if (player1 && player1.alive) {
                ctx.fillStyle = player1.color;
                ctx.beginPath();
                ctx.arc(player1.x, player1.y, PLAYER_SIZE, 0, Math.PI * 2);
                ctx.fill();

                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(player1.x, player1.y);
                ctx.lineTo(
                    player1.x + Math.cos(player1.angle) * PLAYER_SIZE,
                    player1.y + Math.sin(player1.angle) * PLAYER_SIZE
                );
                ctx.stroke();

                const healthPercent = player1.health / 10000;
                ctx.fillStyle = '#00ff00';
                ctx.fillRect(player1.x - PLAYER_SIZE, player1.y - PLAYER_SIZE - 10, PLAYER_SIZE * 2 * healthPercent, 5);
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 1;
                ctx.strokeRect(player1.x - PLAYER_SIZE, player1.y - PLAYER_SIZE - 10, PLAYER_SIZE * 2, 5);
            }

            // Player 2
            if (player2 && player2.alive && gameMode === 2) {
                ctx.fillStyle = player2.color;
                ctx.beginPath();
                ctx.arc(player2.x, player2.y, PLAYER_SIZE, 0, Math.PI * 2);
                ctx.fill();

                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(player2.x, player2.y);
                ctx.lineTo(
                    player2.x + Math.cos(player2.angle) * PLAYER_SIZE,
                    player2.y + Math.sin(player2.angle) * PLAYER_SIZE
                );
                ctx.stroke();

                const healthPercent = player2.health / 10000;
                ctx.fillStyle = '#00ff00';
                ctx.fillRect(player2.x - PLAYER_SIZE, player2.y - PLAYER_SIZE - 10, PLAYER_SIZE * 2 * healthPercent, 5);
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 1;
                ctx.strokeRect(player2.x - PLAYER_SIZE, player2.y - PLAYER_SIZE - 10, PLAYER_SIZE * 2, 5);
            }

            // O'qlar
            bullets.forEach(bullet => {
                if (bullet.isBazooka) {
                    // Bazooka o'qi - katta va pushti
                    ctx.fillStyle = '#FF1493';
                    ctx.beginPath();
                    ctx.arc(bullet.x, bullet.y, 8, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.strokeStyle = '#FF69B4';
                    ctx.lineWidth = 3;
                    ctx.stroke();
                } else {
                    ctx.fillStyle = '#ffff00';
                    ctx.beginPath();
                    ctx.arc(bullet.x, bullet.y, 4, 0, Math.PI * 2);
                    ctx.fill();
                }
            });

            ctx.restore();
        }

        function draw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            if (gameMode === 1) {
                // 1 Player - to'liq ekran
                if (player1 && player1.alive) {
                    const cameraX = canvas.width / 2 - player1.x;
                    const cameraY = canvas.height / 2 - player1.y;

                    ctx.save();
                    ctx.translate(cameraX, cameraY);

                    // Xarita chegaralari
                    ctx.strokeStyle = '#ff0000';
                    ctx.lineWidth = 5;
                    ctx.strokeRect(0, 0, MAP_SIZE, MAP_SIZE);

                    // Qurollar
                    weaponsOnGround.forEach(weapon => {
                        ctx.fillStyle = WEAPONS[weapon.type].color;
                        ctx.fillRect(weapon.x - WEAPON_SIZE/2, weapon.y - WEAPON_SIZE/2, WEAPON_SIZE, WEAPON_SIZE);
                        ctx.strokeStyle = '#fff';
                        ctx.lineWidth = 2;
                        ctx.strokeRect(weapon.x - WEAPON_SIZE/2, weapon.y - WEAPON_SIZE/2, WEAPON_SIZE, WEAPON_SIZE);
                    });

                    // Botlar
                    bots.forEach(bot => {
                        if (!bot.alive) return;
                        
                        ctx.fillStyle = '#ff4444';
                        ctx.beginPath();
                        ctx.arc(bot.x, bot.y, PLAYER_SIZE, 0, Math.PI * 2);
                        ctx.fill();

                        ctx.strokeStyle = '#fff';
                        ctx.lineWidth = 3;
                        ctx.beginPath();
                        ctx.moveTo(bot.x, bot.y);
                        ctx.lineTo(
                            bot.x + Math.cos(bot.angle) * PLAYER_SIZE,
                            bot.y + Math.sin(bot.angle) * PLAYER_SIZE
                        );
                        ctx.stroke();

                        const healthPercent = bot.health / 10000;
                        ctx.fillStyle = '#00ff00';
                        ctx.fillRect(bot.x - PLAYER_SIZE, bot.y - PLAYER_SIZE - 10, PLAYER_SIZE * 2 * healthPercent, 5);
                        ctx.strokeStyle = '#000';
                        ctx.lineWidth = 1;
                        ctx.strokeRect(bot.x - PLAYER_SIZE, bot.y - PLAYER_SIZE - 10, PLAYER_SIZE * 2, 5);
                    });

                    // Player 1
                    ctx.fillStyle = player1.color;
                    ctx.beginPath();
                    ctx.arc(player1.x, player1.y, PLAYER_SIZE, 0, Math.PI * 2);
                    ctx.fill();

                    ctx.strokeStyle = '#fff';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.moveTo(player1.x, player1.y);
                    ctx.lineTo(
                        player1.x + Math.cos(player1.angle) * PLAYER_SIZE,
                        player1.y + Math.sin(player1.angle) * PLAYER_SIZE
                    );
                    ctx.stroke();

                    const healthPercent = player1.health / 10000;
                    ctx.fillStyle = '#00ff00';
                    ctx.fillRect(player1.x - PLAYER_SIZE, player1.y - PLAYER_SIZE - 10, PLAYER_SIZE * 2 * healthPercent, 5);
                    ctx.strokeStyle = '#000';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(player1.x - PLAYER_SIZE, player1.y - PLAYER_SIZE - 10, PLAYER_SIZE * 2, 5);

                    // O'qlar
                    bullets.forEach(bullet => {
                        ctx.fillStyle = '#ffff00';
                        ctx.beginPath();
                        ctx.arc(bullet.x, bullet.y, 4, 0, Math.PI * 2);
                        ctx.fill();
                    });

                    ctx.restore();
                }
            } else if (gameMode === 2) {
                // 2 Player - split screen
                // Mobile da horizontal (yuqori/quyi), PC da vertical (chap/o'ng)
                if (isMobile()) {
                    const halfHeight = canvas.height / 2;
                    
                    // Quyi ekran - Player 1 (normal)
                    if (player1 && player1.alive) {
                        drawScreen(player1, 0, halfHeight, canvas.width, halfHeight);
                    }
                    
                    // Yuqori ekran - Player 2 (normal, teskari emas)
                    if (player2 && player2.alive) {
                        drawScreen(player2, 0, 0, canvas.width, halfHeight);
                    }

                    // O'rtadagi chiziq
                    ctx.strokeStyle = '#ff0000';
                    ctx.lineWidth = 5;
                    ctx.beginPath();
                    ctx.moveTo(0, halfHeight);
                    ctx.lineTo(canvas.width, halfHeight);
                    ctx.stroke();
                } else {
                    // PC da vertical split
                    const halfWidth = canvas.width / 2;
                    
                    // Chap ekran - Player 1
                    if (player1 && player1.alive) {
                        drawScreen(player1, 0, 0, halfWidth, canvas.height);
                    }
                    
                    // O'ng ekran - Player 2
                    if (player2 && player2.alive) {
                        drawScreen(player2, halfWidth, 0, halfWidth, canvas.height);
                    }

                    // O'rtadagi chiziq
                    ctx.strokeStyle = '#ff0000';
                    ctx.lineWidth = 5;
                    ctx.beginPath();
                    ctx.moveTo(halfWidth, 0);
                    ctx.lineTo(halfWidth, canvas.height);
                    ctx.stroke();
                }
            }

            // UI yangilash
            if (player1) {
                document.getElementById('health').textContent = Math.max(0, player1.health);
                document.getElementById('kills').textContent = player1.kills;
            }

            if (player2 && gameMode === 2) {
                document.getElementById('health2').textContent = Math.max(0, player2.health);
                document.getElementById('kills2').textContent = player2.kills;
            }

            document.getElementById('alive').textContent = aliveCount;
        }

        // JavaScript - O'yin tugashi

        function checkGameOver() {
            if (gameMode === 1) {
                if (!player1.alive || aliveCount === 1) {
                    gameOver();
                }
            } else if (gameMode === 2) {
                const playersAlive = (player1.alive ? 1 : 0) + (player2.alive ? 1 : 0);
                if (playersAlive === 0 || aliveCount === 1 || (playersAlive === 1 && aliveCount === 1)) {
                    gameOver();
                }
            }
        }

        function gameOver() {
            gameRunning = false;
            document.getElementById('gameOver').style.display = 'block';
            
            if (gameMode === 1) {
                document.getElementById('finalKills1').textContent = player1.kills;
                
                if (player1.alive && aliveCount === 1) {
                    document.getElementById('resultText').textContent = '🏆 G\'OLIB!';
                    document.getElementById('resultText').style.color = '#44ff44';
                    document.getElementById('winnerText').textContent = '';
                } else {
                    document.getElementById('resultText').textContent = '💀 O\'LDINGIZ';
                    document.getElementById('resultText').style.color = '#ff4444';
                    document.getElementById('winnerText').textContent = `O'rningiz: ${aliveCount}`;
                }
            } else if (gameMode === 2) {
                document.getElementById('finalKills1').textContent = player1.kills;
                document.getElementById('finalKills2').textContent = player2.kills;
                
                if (player1.alive && !player2.alive && aliveCount === 1) {
                    document.getElementById('resultText').textContent = '🏆 PLAYER 1 G\'OLIB!';
                    document.getElementById('resultText').style.color = player1Color;
                    document.getElementById('winnerText').textContent = '';
                } else if (player2.alive && !player1.alive && aliveCount === 1) {
                    document.getElementById('resultText').textContent = '🏆 PLAYER 2 G\'OLIB!';
                    document.getElementById('resultText').style.color = player2Color;
                    document.getElementById('winnerText').textContent = '';
                } else if (player1.alive && player2.alive && aliveCount === 2) {
                    if (player1.kills > player2.kills) {
                        document.getElementById('resultText').textContent = '🏆 PLAYER 1 G\'OLIB!';
                        document.getElementById('resultText').style.color = player1Color;
                    } else if (player2.kills > player1.kills) {
                        document.getElementById('resultText').textContent = '🏆 PLAYER 2 G\'OLIB!';
                        document.getElementById('resultText').style.color = player2Color;
                    } else {
                        document.getElementById('resultText').textContent = '🤝 DURRANG!';
                        document.getElementById('resultText').style.color = '#ffff44';
                    }
                    document.getElementById('winnerText').textContent = '';
                } else {
                    document.getElementById('resultText').textContent = '💀 O\'YIN TUGADI';
                    document.getElementById('resultText').style.color = '#ff4444';
                    document.getElementById('winnerText').textContent = `O'rningiz: ${aliveCount}`;
                }
            }
        }

        document.getElementById('restartBtn').addEventListener('click', () => {
            document.getElementById('gameOver').style.display = 'none';
            startGame(gameMode);
        });

        document.getElementById('menuBtn').addEventListener('click', () => {
            document.getElementById('gameOver').style.display = 'none';
            document.getElementById('gameUI').style.display = 'none';
            document.getElementById('menu').style.display = 'flex';
            document.getElementById('mobileControls').style.display = 'none';
            document.getElementById('mobileControls2P').style.display = 'none';
            gameRunning = false;
        });

        window.addEventListener('resize', () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        });

        // JavaScript - O'yin tsikli

        function gameLoop() {
            if (!gameRunning || gamePaused) {
                if (gameRunning) requestAnimationFrame(gameLoop);
                return;
            }

            if (player1 && player1.alive) {
                movePlayer(player1, true);
                checkWeaponPickup(player1);
                checkAirdrop(player1);
            }

            if (player2 && player2.alive && gameMode === 2) {
                movePlayer(player2, false);
                checkWeaponPickup(player2);
                checkAirdrop(player2);
            }

            updateBots();
            updateBullets();
            checkGameOver();
            
            draw();
            requestAnimationFrame(gameLoop);
        }
