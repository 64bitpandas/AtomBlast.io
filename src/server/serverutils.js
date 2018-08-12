/**
 * Misc. standalone utilities for the server.
 */

/**
* Returns a random number between between 10000000 and 99999999, inclusive.
* TODO Make every ID guaranteed unique
* @returns random id between 10000000 and 99999999
*/
export function generateID() {
    return Math.floor(Math.random() * 90000000) + 10000000;
}