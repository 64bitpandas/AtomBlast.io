// Contains all global constants and functions for both the client and server.
export const GLOBAL = {
    
    // Keys and other mathematical constants
    KEY_ESC: 27,
    KEY_ENTER: 13,
    KEY_CHAT: 13,
    KEY_W: 87,
    KEY_A: 65,
    KEY_S: 83,
    KEY_D: 68,

    // Chat
    PLACEHOLDER_NAME: 'Unnamed Player',
    MAX_CHATS: 50, // Max number of chats to be displayed before deleting

    // Server
    SERVER_IP: 'https://iogame-test.herokuapp.com/', // Change during production!!!!!
    LOCAL_HOST: 'localhost:3000',

    // Cookies
    NAME_COOKIE: 'name',
    ROOM_COOKIE: 'room',
    TEAM_COOKIE: 'team',
    COOKIE_DAYS: 14,

    // Player Movement
    MAX_SPEED: 5,
    PLAYER_RADIUS: 100,
    VELOCITY_STEP: 0.8, // speed multiplier when player is gliding to a stop
    LERP_VALUE: 0.2,
    DEADZONE: 0.1,

    // Powerups
    POWERUP_RADIUS: 30, // size of spawned powerups
    MIN_POWERUPS: 150, // minimum number of powerups to be spawned
    MAX_POWERUPS: 300, // maximum number of powerups to be spawned
    POWERUP_TYPES: 1, // number of types of powerups
    P_HYDROGEN_ATOM: 1, // HydrogenAtom
    ATTRACTION_RADIUS: 500, // Max distance for powerup to be attracted to player
    ATTRACTION_COEFFICIENT: .1, // Multiplier for attraction strength

    // Map
    MAP_SIZE: 5000,

    // Drawing
    DRAW_RADIUS: 1000, // Radius around player in which to draw other players and powerups
    GRID_SPACING: 200, // space between each line on the grid
    FRAME_RATE: 60,

    // Sprites
    SPRITES: [
        '../assets/testplayer.png',
        '../assets/testplayer2.png',
    ]

};

/**
 * Returns the distance between two objects.
 * Both objects must be GameObjects
 * @param {GameObject} obj1 First object 
 * @param {GameObject} obj2 Second object
 */
export function distanceBetween(obj1, obj2) {
    return Math.sqrt(Math.pow(obj1.posX - obj2.posX, 2) + Math.pow(obj1.posY - obj2.posY, 2));
}