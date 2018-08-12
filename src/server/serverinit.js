import { getField, setField } from './server';
import { MAP_LAYOUT, TILES, TILE_NAMES } from '../client/js/obj/tiles';
import { GLOBAL } from '../client/js/global';
import { spawnAtomAtVent } from './serverutils';

/**
 * Methods to run on server initialization and player connect initialization.
 */

/**
 * Global initialiation. Run once on server start.
 */
export function initGlobal() {
    // Set up atom spawning three times a second. This is processed outside of the player specific behavior because more players joining !== more resources spawn.
    setInterval(() => {
        for (let room in getField(['rooms'])) {
            for (let row = 0; row < MAP_LAYOUT.length; row++)
                for (let col = 0; col < MAP_LAYOUT[0].length; col++) {
                    if (TILES[TILE_NAMES[MAP_LAYOUT[row][col]]].type === 'spawner') {
                        spawnAtomAtVent(row, col, room, false);
                    }

                }
        }
    }, GLOBAL.ATOM_SPAWN_DELAY);

    // Timer
    setInterval(() => {
        for (let room in getField(['rooms'])) {
            if (getField(['rooms', room, 'started'])) {
                let seconds = getField(['rooms', room, 'time', 'seconds']), 
                    minutes = getField(['rooms', room, 'time', 'minutes']);
                    
                // Equivalent to rooms[room].time.seconds++;
                setField(seconds + 1, ['rooms', room, 'time', 'seconds']);

                if (seconds >= 60) {
                    setField(0, ['rooms', room, 'time', 'seconds']);
                    setField(minutes + 1, ['rooms', room, 'time', 'minutes']);
                }

                // Set formatted Time
                setField(minutes + ':' + ((seconds < 10) ? '0' : '') + seconds, ['rooms', room, 'time', 'formattedTime']);
            }
        }
    }, 1000);
}

/**
 * Run on every player join.
 */
export function initPlayer() {

}