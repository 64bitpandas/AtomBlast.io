// Contains all global constants for the client.
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
    COOKIE_DAYS: 14,

    // Player Movement
    MAX_SPEED: 5,
    PLAYER_RADIUS: 100,
    VELOCITY_STEP: 0.3,
    LERP_VALUE: 0.2,

    // Powerups
    POWERUP_RADIUS: 30, // size of spawned powerups
    MIN_POWERUPS: 50, // minimum number of powerups to be spawned
    MAX_POWERUPS: 100, // maximum number of powerups to be spawned
    POWERUP_TYPES: 1, // number of types of powerups
    P_HEALTH: 0, // HealthPowerup

    // Map
    MAP_SIZE: 5000,

    // Drawing
    SPAWN_RADIUS: 800, // Radius around player in which to draw other players and powerups
    GRID_SPACING: 200, // space between each line on the grid
    FRAME_RATE: 60,

    // Sprites
    PLAYER_SPRITE: '../assets/testplayer.png'

};