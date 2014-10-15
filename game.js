;(function() {
    // TODO: Add graphics for other elements
    // TODO: Add key for power ups
    // TODO: Add background (stars?) and alter other images so they do not get lost
    // TODO: See if we can implement a HIGH SCORE somehow

    var Game = function(canvasId) {
        var canvas = document.getElementById(canvasId);
        var screen = canvas.getContext('2d');
        var gameSize = { x: canvas.width, y: canvas.height };
        var scoreSpan = document.getElementById('scoreSpan');
        var levelSpan = document.getElementById('levelSpan');
        var livesSpan = document.getElementById('livesSpan');

        this.STARTING_ALIEN_SPAWN_RATE = 100;
        this.ALIEN_POINT_VALUE = 10;
        this.LEVEL_POINT_THRESHOLD_INCREASE = 20;
        this.EXTRA_LIFE_EVERY_NUM_LEVELS = 5;
        this.DEFAULT_MAX_BULLETS = 15;
        this.POWERUP_SPAWN_RATE = 1000;

        this.gameSize = gameSize;
        this.bodies = [new Player(this, this.gameSize)];
        this.messages = [];
        this.counter = 0;
        this.play = true;
        this.debug = true;
        this.score = 0;
        this.level = 0;
        this.previousLevelThreshold = 0;
        this.lives = 3;
        this.maxBullets = this.DEFAULT_MAX_BULLETS;

        var self = this;
        var tick = function() {
            if (self.play) {
                self.counter += 1;
                self.spawnAlien(gameSize);
                self.spawnPowerup(gameSize);
                self.handleCollisions();
                self.update();
                self.checkLevelUp();
                self.draw(screen, self.gameSize);
                requestAnimationFrame(tick);
                scoreSpan.innerHTML = self.score;
                levelSpan.innerHTML = self.level;
                livesSpan.innerHTML = self.lives;
            }

        };
        tick();
    };

    Game.prototype = {
        update: function() {
            for (var i = 0; i < this.bodies.length; i++) {
                this.bodies[i].update();
                if (this.bodies[i].offBoard()) {
                    this.bodies.splice(i,1);
                }
            }
            for (var x = 0; x < this.messages.length; x++) {
                this.messages[x].update();
                this.messages[x].cleanup(this.counter);
                if (this.messages[x].remove) {
                    this.clearMessage();
                }
            }
        },

        draw: function(screen, gameSize) {
            screen.clearRect(0, 0, gameSize.x, gameSize.y);
            for (var i = 0; i < this.bodies.length; i++) {
//                drawRect(screen, this.bodies[i]);
                this.bodies[i].draw(screen);
            }
        },

        addBody: function(body) {
            this.bodies.push(body);
        },

        addMessage: function(message) {
            this.messages.push(message);
        },

        clearMessage: function() {
            this.messages = [];
        },

        spawnAlien: function (gameSize) {
            if (!(this.counter % (this.STARTING_ALIEN_SPAWN_RATE - (this.level * 3)))) {
                var alien = new Alien(gameSize, this.level);
                this.bodies.push(alien);
            }
        },

        spawnPowerup: function (gameSize) {
            if (!(this.counter % this.POWERUP_SPAWN_RATE)) {
                var powerup = new Powerup(gameSize);
                this.bodies.push(powerup);
            }
        },

        handleCollisions: function () {
            for (var bodyEvalutatedIndex = 0; bodyEvalutatedIndex < this.bodies.length; bodyEvalutatedIndex++) {
                var bodyEvaluated = this.bodies[bodyEvalutatedIndex];
                for (var bodyCollidingIndex = 0; bodyCollidingIndex < this.bodies.length; bodyCollidingIndex++) {
                    var bodyColliding = this.bodies[bodyCollidingIndex];
                    if (!(bodyEvaluated === bodyColliding)) {
                        if (
                                (
                                    (bodyEvaluated.center.x + (bodyEvaluated.size.x/2)) >= (bodyColliding.center.x - (bodyColliding.size.x/2)) &&
                                    ((bodyEvaluated.center.x - (bodyEvaluated.size.x/2)) <= (bodyColliding.center.x + (bodyColliding.size.x/2)))
                                ) && (
                                    (bodyEvaluated.center.y + (bodyEvaluated.size.y/2)) >= (bodyColliding.center.y - (bodyColliding.size.y/2)) &&
                                    ((bodyEvaluated.center.y - (bodyEvaluated.size.y/2)) <= (bodyColliding.center.y + (bodyColliding.size.y/2)))
                                )
                            ){
                            var bodyDestroyed;
                            var bodyLiving;
                            if (bodyEvaluated.isDestroyedBy(bodyColliding)) {
                                bodyDestroyed = bodyEvaluated;
                                bodyLiving = bodyColliding;
                                this.bodies.splice(bodyEvalutatedIndex,1);
                            } else {
                                bodyDestroyed = bodyColliding;
                                bodyLiving = bodyEvaluated;
                                this.bodies.splice(bodyCollidingIndex,1);
                            }
                            if (bodyDestroyed.type == 'ALIEN') {
                                this.score += this.ALIEN_POINT_VALUE;
                            }
                            if (bodyDestroyed.type == 'PLAYER') {
                                --this.lives;
                                if (this.lives == 0) {
                                    this.quit();
                                } else {
                                    var player = new Player(this, this.gameSize);
                                    this.addBody(player);
                                }
                            }
                            if (bodyDestroyed.type == 'POWERUP' && bodyLiving.type == 'PLAYER') {
                                var message = new Message('You got power up: '.concat(bodyDestroyed.subType), 'blue', 100, this.counter);
                                this.addMessage(message);
                                bodyLiving.addPowerUp(bodyDestroyed);
                            }
                        }
                    }
                }
            }
        },

        quit: function () {
            this.play = false;
            if (this.debug) {
                console.log('Level - '.concat(this.level));
                console.log('Lives - '.concat(this.lives));
                console.log('Alien Velocity - '.concat(1.5 + (this.level * 0.2)));
                console.log('Alien Spawn Rate - '.concat(this.STARTING_ALIEN_SPAWN_RATE - (this.level * 3)));
                console.log('Counter - '.concat(this.counter));
                for (var i = 0; i < this.bodies.length; i++) {
                    var body = this.bodies[i];
                    console.log('body '.concat(i, ' - type: ', body.type, ' - x: ', body.center.x, ' y: ', body.center.y));
                    if (body.type == 'PLAYER' && body.powerup) {
                        console.log('body '.concat(i, ' - type: ', body.type, ' Powerup ', body.powerup.subType, ' - expires: ', body.powerup.expiresAt));
                    }
                }
                for (var x = 0; x < this.messages.length; x++) {
                    var m = this.bodies[x];
                    console.log('message '.concat(x, ' - text: ', m.text, ' - color: ', m.color, ' - expiresAt: ', m.expiresAt));
                }

            }
            var message = new Message('GAME OVER', 'red', 1000, this.counter);
            message.update();
        },

        checkLevelUp: function() {
            var currentLevelThreshold = (this.LEVEL_POINT_THRESHOLD_INCREASE * (this.level + 1)) + this.previousLevelThreshold;
            if (this.score >= currentLevelThreshold) {
                this.levelUp(currentLevelThreshold);
            }
        },

        levelUp: function(newLevelThreshold) {
            ++this.level;
            this.previousLevelThreshold = newLevelThreshold;
            var messageText = 'Level Up! Welcome to Level '.concat(this.level);
            if (!(this.level % this.EXTRA_LIFE_EVERY_NUM_LEVELS)) {
                ++this.lives;
                messageText = messageText.concat(' You just got an EXTRA life! Keep on going!')
            }
            var message = new Message(messageText, 'blue', 100, this.counter);
            this.addMessage(message);
        }
    };

    var Player = function(game, gameSize) {
        this.type = 'PLAYER';
        this.DEFAULT_BULLET_VELOCITIES = [{ x: 0, y: -6 }];
        this.game = game;
//        this.size =  { x: 15, y: 15 };
        this.size =  { x: 40, y: 59 };
        this.fillColor = 'black';
        this.center = { x: gameSize.x / 2, y: gameSize.y - this.size.x};
        this.keyboarder = new Keyboarder();
        this.gameSize = gameSize;
        this.powerup = null;
        this.bulletVelocities = this.DEFAULT_BULLET_VELOCITIES;
    };

    Player.prototype = {
        update: function() {
            if (this.keyboarder.isDown(this.keyboarder.KEYS.Q)) {
                this.game.quit();
            }
            if (this.keyboarder.isDown(this.keyboarder.KEYS.LEFT)) {
                this.center.x -= 2;
            } else if (this.keyboarder.isDown(this.keyboarder.KEYS.RIGHT)) {
                this.center.x += 2;
            }

            if (this.keyboarder.isDown(this.keyboarder.KEYS.SPACE)) {
                var numOfBullets = 0;
                for (var i = 0; i < this.game.bodies.length; i++) {
                    if (this.game.bodies[i].type == 'BULLET') {
                        ++numOfBullets;
                    }
                }
                if (numOfBullets < this.game.maxBullets) {
                    for (var b = 0; b < this.bulletVelocities.length; b++) {
                        var bullet = new Bullet({ x: this.center.x, y: this.center.y - this.size.y / 2 }, this.bulletVelocities[b], this.gameSize);
                        this.game.addBody(bullet);
                    }
                }
            }

            if (this.powerup && this.game.counter > this.powerup.expiresAt) {
                this.removePowerUp(this.powerup);
            }
        },

        offBoard: function() {
            if (this.center.x > this.gameSize.x) {
                this.center.x = this.gameSize.x;
            }
            if (this.center.x < 0) {
                this.center.x = 0;
            }
            return false;
        },

        isDestroyedBy: function(beingHitBy) {
            return (beingHitBy.type == 'ALIEN');
        },

        addPowerUp: function(powerup) {
            this.powerup = powerup;
            powerup.invokePower(this, this.game.counter);
        },

        removePowerUp: function(powerup) {
            this.powerup = null;
            powerup.clearPower(this);
        },

        draw: function(screen) {
//            drawRect(screen, this);
            var image = new Image();
            image.src = 'spaceship.png';
            drawImage(screen, image, this);
        }
    };

    var Bullet = function(center, velocity, gameSize) {
        this.type = 'BULLET';
        this.size =  { x: 3, y: 6 };
        this.fillColor = 'red';
        this.center = center;
        this.velocity = velocity;
        this.gameSize = gameSize;
    };

    Bullet.prototype = {
        update: function() {
            this.center.x += this.velocity.x;
            this.center.y += this.velocity.y;
        },

        offBoard: function() {
            return (this.center.y < 0 || this.center > this.gameSize.y);
        },

        // TODO: handle the bullet being destroyed when hitting an alien
        isDestroyedBy: function(beingHitBy) {
            return false;
        },

        draw: function(screen) {
            drawRect(screen, this);
        }
    };

    var Alien = function(gameSize, level) {
        var xCenter = Math.random() * gameSize.x;
        var ALIEN_BASE_SPEED = 1.7;
        this.type = 'ALIEN';
        this.fillColor = 'black';
        this.size = { x: 10, y: 10 };
        this.center = { x: xCenter, y: 0 };
        this.velocity = { x: 0, y: ALIEN_BASE_SPEED + (level * 0.2) };
        this.gameSize = gameSize;
    };

    Alien.prototype = {
        update: function() {
            this.center.x += this.velocity.x;
            this.center.y += this.velocity.y;
        },

        offBoard: function() {
            return (this.center.y < 0 || this.center.y > this.gameSize.y);
        },

        isDestroyedBy: function(beingHitBy) {
            return (beingHitBy.type == 'BULLET');
        },

        draw: function(screen) {
            drawRect(screen, this);
        }
    };

    var Powerup = function(gameSize) {
        var xCenter = Math.random() * gameSize.x;
        var POWERUP_BASE_SPEED = 1;
        var WEAVE_DELTA = 20;
        this.POWERUP_DURATION = 500;

        this.type = 'POWERUP';
        this.size = { x: 8, y: 8 };
        this.center = { x: xCenter, y: 0 };
        this.weaveLimits = { min: xCenter - WEAVE_DELTA, max: xCenter + WEAVE_DELTA};
        this.weaveDirection = 'right';
        this.velocity = { x: 0, y: POWERUP_BASE_SPEED };
        this.gameSize = gameSize;

        // TODO: Implement sidecar and other
        var POWERUP_SUBTYPES = ['SPREAD', 'MACHINEGUN', 'SIDECAR', 'EXTRALIFE'];
        var POWERUP_COLORS = ['red', 'purple', 'lightblue', 'green'];
        var NUM_POWERUPS = 4;

        var rand = (Math.random() * NUM_POWERUPS | 0);
        this.fillColor = POWERUP_COLORS[rand];
        this.subType = POWERUP_SUBTYPES[rand];
        // Starts at 0 and is set when picked up by the player
        this.expiresAt = 0;

    };

    Powerup.prototype = {
        update: function() {
            if (this.center.x >= this.weaveLimits.max) {
                this.center.x = this.weaveLimits.max - 1;
                this.weaveDirection = 'left';
            } else if (this.center.x <= this.weaveLimits.min) {
                this.center.x = this.weaveLimits.min + 1;
                this.weaveDirection = 'right';
            } else {
                if (this.weaveDirection == 'right') {
                    this.center.x = this.center.x + this.velocity.x + 1;
                } else {
                    this.center.x = this.center.x + this.velocity.x - 1;
                }
            }
            this.center.y += this.velocity.y;
        },

        offBoard: function() {
            return (this.center.y < 0 || this.center.y > this.gameSize.y);
        },

        isDestroyedBy: function(beingHitBy) {
            return (beingHitBy.type == 'PLAYER' || beingHitBy.type == 'ALIEN');
        },

        invokePower: function(player, currentCounter) {
            this.expiresAt = this.POWERUP_DURATION + currentCounter;
            switch(this.subType) {
                case 'MACHINEGUN':
                    player.game.maxBullets = 10000;
                    break;
                case 'EXTRALIFE':
                    ++player.game.lives;
                    // Can expire right away
                    this.expiresAt = currentCounter;
                    break;
                case 'SPREAD':
                    player.bulletVelocities = [{ x: -2, y: -6 }, { x: 0, y: -6 }, { x: 2, y: -6 }];
                    player.game.maxBullets = player.game.DEFAULT_MAX_BULLETS * 3;
                    break;
            }
        },

        clearPower: function(player) {
            switch(this.subType) {
                case 'MACHINEGUN':
                    player.game.maxBullets = player.game.DEFAULT_MAX_BULLETS;
                    break;
                case 'EXTRALIFE':
                    // Nothing to clean up
                    break;
                case 'SPREAD':
                    player.bulletVelocities = player.DEFAULT_BULLET_VELOCITIES;
                    player.game.maxBullets = player.game.DEFAULT_MAX_BULLETS;
                    break;
            }
        },

        draw: function(screen) {
            drawRect(screen, this);
        }
    };

    var Message = function(text, color, duration, currentCounter) {
        this.text = text;
        this.color = color;
        this.expiresAt = currentCounter + duration;
        this.remove = false;
    };

    Message.prototype = {
        update: function() {
            var messageElement = document.getElementById('messageSpan');
            messageElement.innerHTML = this.text;
            messageElement.style.color = this.color;
        },

        cleanup: function(counter) {
            if (counter > this.expiresAt) {
                var messageElement2 = document.getElementById('messageSpan');
                messageElement2.innerHTML = '';
                this.remove = true;
            }
        }
    };


    var drawRect = function(screen, body) {
        screen.fillStyle = body.fillColor;
        screen.fillRect(body.center.x - body.size.x / 2,
                        body.center.y - body.size.y / 2,
                        body.size.x, body.size.y);
    };

    var drawImage = function(screen, image, body) {
        screen.drawImage(image,
                         body.center.x - body.size.x / 2,
                         body.center.y - body.size.y / 2);
    }

    var Keyboarder = function() {
        var keyState = {};

        window.onkeydown = function(e) {
            keyState[e.keyCode] = true;
        };

        window.onkeyup = function(e) {
            keyState[e.keyCode] = false;
        };

        this.isDown = function(keyCode) {
            return keyState[keyCode] === true;
        };

        this.KEYS = { LEFT: 37, RIGHT: 39, SPACE: 32, Q: 81 };
    };

    window.onload = function() {
        new Game("screen");
    };
})();