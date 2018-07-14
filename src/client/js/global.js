// Contains all global constants and functions for both the client and server.
export const GLOBAL = {
    
    DEBUG: true,
    // Keys and other mathematical constants
    KEY_ESC: 27,
    KEY_ENTER: 13,
    KEY_W: 87,
    KEY_A: 65,  
    KEY_S: 83,
    KEY_D: 68,
    KEY_1: 49,
    KEY_2: 50,
    KEY_3: 51,
    KEY_4: 52,
    KEY_SPACE: 32,

    //Blueprints
    BP_SELECT: 'Blueprint Select - Slot ', // Text for blueprint select header
    BP_MAX: 4, // Maximum number of blueprints a player can have in one game at a time

    // Main menu
    INPUT_COUNT: 3, // Number of input boxes on main menu

    // Chat
    PLACEHOLDER_NAME: 'Unnamed Player',
    MAX_CHATS: 50, // Max number of chats to be displayed before deleting

    // Server
    SERVER_IP: 'https://iogame-test.herokuapp.com/', // Change during production!!!!!
    LOCAL_HOST: 'localhost:3000',
    NO_ROOM_IDENTIFIER: '$_NOROOM', // Pass to server if matchmaking is required

    // Cookies
    COOKIES: [
        'name', //0
        'room', //1
        'team', //2
        'bp-slot-1', //3
        'bp-slot-2', //4
        'bp-slot-3', //5 
        'bp-slot-4', //6
        'room-type', //7
        'server', //8
    ],
    COOKIE_DAYS: 14, // Cookie lifetime

    // Player Movement
    MAX_SPEED: 5,
    PLAYER_RADIUS: 100,
    VELOCITY_STEP: 0.8, // speed multiplier when player is gliding to a stop
    LERP_VALUE: 0.2,
    DEADZONE: 0.1,
    MAX_HEALTH: 100, // Starting health of players

    // Atoms
    ATOM_RADIUS: 30, // size of spawned atoms
    MIN_POWERUPS: 150, // minimum number of powerups to be spawned (TEMPORARY)
    MAX_POWERUPS: 300, // maximum number of powerups to be spawned (TEMPORARY)
    ATTRACTION_RADIUS: 500, // Max distance for powerup to be attracted to player
    ATTRACTION_COEFFICIENT: 0.1, // Multiplier for attraction strength

    // Map
    MAP_SIZE: 5000,

    // Drawing
    DRAW_RADIUS: 1000, // Radius around player in which to draw other objects
    GRID_SPACING: 200, // space between each line on the grid
    GRID_LINE_STROKE: 1,
    GRID_LINE_COLOUR: 0xD3D3D3,
    FRAME_RATE: 60,

    // Sprites and textures
    PLAYER_SPRITES: [
        '../assets/testplayer.png',
        
    ],

    // Atoms: ID's and Sprites. ATOM_SPRITES[id] returns the texture location of atom of that id.
    ATOM_IDS: [
        'h',
        'he',
        'c',
        'cl'
    ],
    ATOM_SPRITES: [
        '../assets/atom-hydrogen.png',
        '../assets/atom_helium.png',
        '../assets/atom_carbon.png',
        '../assets/testplayer2.png',
    ],
    //Each Value corresponds with the above event
    EXPERIENCE_VALUES: {
        CRAFT: 10,
        KILL: 124
    },

    //The cutoffs for each level. Index 0 = level 1, 1 = level 2, etc
    EXPERIENCE_LEVELS: [
        0,
        10,
        20,
        40,
        100,
        140,
        160
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