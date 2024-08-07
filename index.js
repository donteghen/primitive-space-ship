

const {range, map, toArray, take, mergeMap, interval, tap} = rxjs;
//const {range, map, toArray, take, mergeMap, interval, tap} = require('rxjs');
//require('dotenv').config();

//  import other local modules
//const {generateStarBg} = require('./src/util/star');

// to be refactored 
const SPEED = 500;
const STAR_NUMBER = 250;

const canva = document.createElement('canvas');
const context = canva.getContext('2d');
document.body.appendChild(canva);
canva.width = window.innerWidth;
canva.height = window.innerHeight;

function generateStarBg (canva, starCount) {   
    return range(1, starCount)
    .pipe(
        map(() => {
            return {
                posX : Number.parseInt(Math.random() * canva.width),
                posY : Number.parseInt(Math.random() * canva.height),
                size : Number.parseInt(1 + Math.random() * 3)
            } 
        }),
        take(4),
        toArray(),
        tap(v => {console.log(v)})
    )
    .pipe(
        mergeMap(stars => {
            console.log(stars)
            return interval(4000)
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

generateStarBg(canva, STAR_NUMBER).subscribe(v => {console.log(v)})