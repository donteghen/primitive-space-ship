//const {interval, take, range} = rxjs;
const {range, map, toArray, take} = require('rxjs');

/**
 * @typedef {Object} StarType
 * @property {number} posX - position of the x-axis
 * @property {numer} posY - position of the y-axis
 * @property {number} size - size of the star
 */

/**
 * 
 * @param {HTMLCanvasElement} canva The plan or frame that will contain the generated stars
 * @param {number} starCount The number of stars to be generated
 * @returns {Observable<StarType>}
 */
function generateStarBg (canva, starCount) {
    return range(1, starCount).pipe(
        map(i => {
            return {
                posX : Math.random() * canva.width,
                posY : Math.random() * canva.width,
                size : 1 + Math.random() * 3
            } 
        }),
        take(2),
        toArray()
    )
}


module.exports = {
    generateStarBg
}
