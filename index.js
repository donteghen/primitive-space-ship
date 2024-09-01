const {Subject, concat, range, map, toArray, take, mergeMap, interval, tap, fromEvent, startWith, combineLatest, scan, sample,
     sampleTime, filter, timestamp, merge, distinctUntilChanged, debounceTime, takeWhile, of} = rxjs;


const startBtn = document.querySelector('#gamer-button');
const canva = document?.createElement('canvas');
canva.tabIndex = 1; // work-around to make the canva element focusable
const context = canva.getContext('2d');

document?.body?.appendChild(canva);
canva.width = window?.innerWidth;
canva.height = window?.innerHeight;

// Simulate canvas click when button is clicked
startBtn.addEventListener('click', () => {
    // remove button from view
    document.body.removeChild(startBtn);
    // Create a new MouseEvent for the canvas click
    const canvasClickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true        
    });

    // Dispatch the event on the canvas
    canva.dispatchEvent(canvasClickEvent);
});

// to be refactored 
const SPEED = 50;
const STAR_NUMBER = 250;
const ENEMY_FREQ = 3000 //1500;
const HERO_Y = canva.height - 30;
const HERO_COLOR = '#ff0000';
const ENEMY_Y = -30;
const ENEMY_COLOR = '#21b707';
const ENEMY_ACCELERATION = 3;
const ENEMY_LEFT_GLIDE = -10;
const ENEMY_RIGHT_GLIDE = 10;
const SHIP_SIZE = 10;
const SHIP_POINT_DIRECTION_UP = 'up';
const SHIP_POINT_DIRECTION_DOWN = 'down';
const ENEMY_SHIP_FLIGHT_MODE = {
    NORMAL_MODE : 'normal',
    GHOST_MODE: 'ghost'
}
const BULLET_SIZE = 5;
const SHOOOTING_SPEED = 15;
const ENEMY_SHOOT_FREQ = 750;
const SCORE_INCREASE = 10;
const COLLISION_PROXIMITY = 5;

// TO DO: Move to helper file.*****************************************
const mouseMoveEventToNewPos = e => ({x: e.clientX, y: HERO_Y});

// *****************************************


const mouseMove = fromEvent(canva, 'mousemove');

const spaceShip$ = mouseMove.pipe(    
    map(mouseMoveEventToNewPos),
    startWith({x: canva.width / 2, y: HERO_Y}),
);

const enemyAccumilator = (enemies) => {
    //console.log('enemies', enemies)
    const newEnemy = {
        x: parseInt(Math.random() * canva.width),
        y: ENEMY_Y,
        shots: []
    } ;
    interval(ENEMY_SHOOT_FREQ).subscribe(v => {
        newEnemy.shots.push({x:newEnemy.x, y: newEnemy.y})
    });
    const aliveOrHasShots = (enemy) => !(enemy.isDead && enemy.shots.length === 0);
    enemies.push(newEnemy);
    return enemies.filter(aliveOrHasShots);
}

const enemies$ = interval(ENEMY_FREQ).pipe(
    scan(enemyAccumilator, [])
)
/**
 * 
 * @param {*} stars 
 */
const paintStars = (stars) => {
    context.fillStyle = '#000000';
    context.fillRect(0, 0, canva.width, canva.height); 
    context.fillStyle = '#ffffff';
    stars.forEach(star => {
        context.fillRect(star.posX, star.posY, star.size, star.size)
    });
}

const subject = new Subject()
const scoreSubject$ = subject.pipe(
    scan((acc, prev) => acc + prev, 0),
    startWith(0)
)

const paintScore = (score) => {
    context.fillStyle = '#fffff';
    context.font = 'bold 26px sans-serif';
    context.fillText(`Score : ${score}`, 40, 43);
}


/**
 * @typedef StarObject
 * @property {number} posX horizontal position of the star (x-axis)
 * @property {number} posY vertical position of the star (y-axis)
 * @property {number} size the size  of the star
 */

/**
 * This function generates the stars and add them to the canva's background
 * @param {HTMLCanvasElement} canva 
 * @param {number} starCount 
 * @returns {Observable<StarObject>}
 */
function generateStarBg$ (canva, starCount) {   
    return range(1, starCount)
    .pipe(
        map(() => {
            return {
                posX : Number.parseInt(Math.random() * canva.width),
                posY : Number.parseInt(Math.random() * canva.height),
                size : Number.parseInt(1 + Math.random() * 3)
            } 
        }),
        toArray()
    )
    .pipe(
        mergeMap(stars => {
            return interval(SPEED)
            .pipe(
                map(() => {
                    stars.forEach(star => {
                        if (star.posY >= canva.height) {
                            star.posY = 0;
                        }
                        else {
                            star.posY = star.posY + 3;
                        }
                    });
                    return stars;
                })
            )
        })
    )
}

const drawTriangle = (x, y, width, color, direction) => {
    context.fillStyle = color;
    context.beginPath();
    context.moveTo(x - width, y);
    context.lineTo(x, direction === 'up' ? y - width : y + width); 
    context.lineTo(x + width, y);
    context.lineTo(x - width,y);
    context.fill();
}

// ships settup and control
function paintSpaceShip({x, y}) { 
    drawTriangle(x, y, SHIP_SIZE, HERO_COLOR, SHIP_POINT_DIRECTION_UP);
}

const getRandomGlide = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

function paintEnemyShips(enemies, mode) {
    enemies.forEach(enemy => {
        enemy.y += ENEMY_ACCELERATION;
        enemy.x = enemyShipControl(enemy.x, mode)
        if (!enemy.isDead) {
            drawTriangle(enemy.x, enemy.y, SHIP_SIZE, ENEMY_COLOR, SHIP_POINT_DIRECTION_DOWN);
        }
        enemy.shots.forEach(shot => {
            shot.y += SHOOOTING_SPEED;
            drawTriangle(shot.x, shot.y, BULLET_SIZE, ENEMY_COLOR, SHIP_POINT_DIRECTION_DOWN);
        })
    });    
}

function enemyShipControl (oldPositionX, mode) {    
    const isGhostMode = mode === ENEMY_SHIP_FLIGHT_MODE.GHOST_MODE ;
    const newPositionX = oldPositionX + getRandomGlide(ENEMY_LEFT_GLIDE, ENEMY_RIGHT_GLIDE);
    if (!isGhostMode) {        
        return newPositionX < 0 ? 4 : newPositionX > canva.width ? canva.width - 4 : newPositionX;
    }
    return newPositionX < 0 ? (newPositionX + canva.width) : newPositionX > canva.width ? (newPositionX - canva.width) : newPositionX;
}

// shooting and actions
const click$ = fromEvent(canva, 'click');
const spacePress$ = fromEvent(canva, 'keydown').pipe(
    //tap(console.log),
    filter(R.compose(R.equals(32), R.prop('keyCode')))
); 
const heroFiring$ = merge(click$, spacePress$).pipe(    
    timestamp(),
    debounceTime(10) 
);

const combineShotPositionSelector = (heroFiring, spaceShip) => ({x: spaceShip.x, timestamp: heroFiring.timestamp});
const heroShotAccumilator = (shootArray, shot) => {
    shootArray.push({x: shot.x, y: HERO_Y});
    return shootArray;
}
const heroShot$ = combineLatest([heroFiring$, spaceShip$], combineShotPositionSelector).pipe(
    distinctUntilChanged((prev, curr) => prev.timestamp === curr.timestamp),
    scan(heroShotAccumilator, []),    
);


const paintHeroShoot = (shots, enemies) => {
    shots.forEach(shot => {
        enemies.forEach(enemy => {
            if (!enemy.isDead && collision(shot, enemy)) {
                scoreSubject$.next(SCORE_INCREASE);
                enemy.isDead = true;
                shot.x = shot.y = -100;
                return
            }
        })
        shot.y -= SHOOOTING_SPEED; 
        drawTriangle(shot.x, shot.y, BULLET_SIZE, HERO_COLOR, SHIP_POINT_DIRECTION_UP)       
    })
}

// start sequence
const renderScene = (mode) => (actors) => {    
    paintStars(actors.stars);
    paintSpaceShip(actors.spaceShip);    
    paintEnemyShips(actors.enemies, mode); 
    paintHeroShoot(actors.shots, actors.enemies);
    paintScore(actors.score)
}

const combineSelector = (stars, spaceShip, enemies, shots, score) => ({stars, spaceShip, enemies, shots, score});

const game = combineLatest([generateStarBg$(canva, STAR_NUMBER), spaceShip$, enemies$, heroShot$, scoreSubject$], combineSelector).pipe(
    takeWhile(actors => !gameOver(actors.spaceShip, actors.enemies))
)

function start (mode) { 
    game.pipe(
        sampleTime(SPEED)
    ).subscribe(renderScene(mode));
}

start(ENEMY_SHIP_FLIGHT_MODE.NORMAL_MODE);


// Helpers
function collision(target1, target2) {
    return (target1.x > target2.x - COLLISION_PROXIMITY && target1.x < target2.x + COLLISION_PROXIMITY) &&
            (target1.y > target2.y - COLLISION_PROXIMITY && target1.y < target2.y + COLLISION_PROXIMITY);
}

function gameOver (ship, enemies) {
    return enemies.some(enemy => {
        if (collision(ship, enemy)) {
            return true;
        }
        return enemy.shots.some(shot => {            
            return collision(ship, shot);            
        })
    })
}