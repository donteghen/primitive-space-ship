const {range, map, toArray, take, mergeMap, interval, tap, fromEvent, startWith, combineLatest, scan, sample, sampleTime} = rxjs;
//const {range, map, toArray, take, mergeMap, interval, tap, fromEvent, startWith, combineLatest, scan, sample, sampleTime} = require('rxjs');
//require('dotenv').config();

//  import other local modules
//const {generateStarBg} = require('./src/util/star');

const canva = document?.createElement('canvas');
const context = canva.getContext('2d');

document?.body?.appendChild(canva);
canva.width = window?.innerWidth;
canva.height = window?.innerHeight;

// to be refactored 
const SPEED = 50;
const STAR_NUMBER = 250;
const ENEMY_FREQ = 1500;
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
        y: ENEMY_Y
    } 
    enemies.push(newEnemy);
    return enemies;
}

const enemy$ = interval(ENEMY_FREQ).pipe(
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
        //take(4),
        toArray(),
        //tap(v => {console.log(v)})
    )
    .pipe(
        mergeMap(stars => {
            //console.log(stars)
            return interval(SPEED)
            .pipe(
                map(() => {
                    stars.forEach(star => {
                        //console.log('star.posY >= canva.height', star.posY, canva.height, star.posY >= canva.height)
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
    context.lineTo(x, direction === 'up' ? y - width : y + width); context.lineTo(x + width, y);
    context.lineTo(x - width,y);
    context.fill();
}


function paintSpaceShip({x, y}) { 
    drawTriangle(x, y, SHIP_SIZE, HERO_COLOR, SHIP_POINT_DIRECTION_UP);
}

const getRandomGlide = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

function paintEnemyShips(enemies, mode) {
    enemies.forEach(enemy => {
        enemy.y += ENEMY_ACCELERATION;
        enemy.x = enemyShipControl(enemy.x, mode)
        drawTriangle(enemy.x, enemy.y, 10, ENEMY_COLOR, SHIP_POINT_DIRECTION_DOWN);
    });    
}

function enemyShipControl (oldPositionX, mode) {
    const isGhostMode = mode === ENEMY_SHIP_FLIGHT_MODE.NORMAL_MODE ;
    const newPositionX = oldPositionX + getRandomGlide(ENEMY_LEFT_GLIDE, ENEMY_RIGHT_GLIDE);
    if (!isGhostMode) {        
        return newPositionX < 0 ? 4 : newPositionX > canva.width ? canva.width - 4 : newPositionX;
    }
    return newPositionX < 0 ? (newPositionX + canva.width) : newPositionX > canva.width ? (newPositionX - canva.width) : newPositionX;
}
const renderScene = (mode) => (actors) => {
    //console.log('actors', actors.stars)
    paintStars(actors.stars);
    paintSpaceShip(actors.spaceShip);    
    paintEnemyShips(actors.enemies, mode);    
}

// start sequence
const game = combineLatest([generateStarBg$(canva, STAR_NUMBER), spaceShip$, enemy$], function (stars, spaceShip, enemies)  {    
    //console.log('stars, spaceShip, enemy$', enemies)
    return {stars, spaceShip, enemies}
})

function start (mode) {
    game.pipe(
        sampleTime(SPEED)
    ).subscribe(renderScene(mode));
}

start(ENEMY_SHIP_FLIGHT_MODE.NORMAL_MODE);