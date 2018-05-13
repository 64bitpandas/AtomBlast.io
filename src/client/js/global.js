// Contains all global constants for the client.
export const GLOBAL = {
    
    // Keys and other mathematical constants
    KEY_ESC: 27,
    KEY_ENTER: 13,
    KEY_CHAT: 13,
    KEY_FIREFOOD: 119,
    KEY_SPLIT: 32,
    KEY_LEFT: 37,
    KEY_UP: 38,
    KEY_RIGHT: 39,
    KEY_DOWN: 40,

    // Canvas
    backgroundColor: '#f2fbff',
    lineColor: '#000000',

    // Chat
    PLACEHOLDER_NAME: 'Unnamed Player',

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
    LERP_VALUE: 0.5

};