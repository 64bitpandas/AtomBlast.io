/** 
 * Mobile Joystick - Utilizes nippleJS
 * Created 12 January 2019
 */

import nipplejs from 'nipplejs'; // NIPPLES!!!! god dammit <3 the naming
import { GLOBAL } from '../global.js' 
import { mobileMovement } from '../pixigame.js';


export default class VirtualJoystick {

    // Use this constructor during init of game
    constructor(params) {
        this.leftDown = false
        this.upDown = false
        this.rightDown = false
        this.downDown = false

        var options = {
            zone: document.getElementById('zone_joystick'),
            color: 'red'
        };
        var manager = nipplejs.create(options);

        //Perform actions based on direction up
        manager.on('added', function (evt, nipple) {
            // nipple.on('end', function (evt) {
            //     for (let key of movementKeys){
            //         key.isDown = false;
            //         key.isUp = true;
            //     }
            // });
            nipple.on('plain:left', function (evt) {
                mobileMovement('left');
            });
            nipple.on('plain:right', function (evt) {
                mobileMovement('right');
            });
            nipple.on('plain:up', function (evt) {
                mobileMovement('up');
            });
            nipple.on('plain:down', function (evt) {
                mobileMovement('down');
            });
        }).on('removed', function (evt, nipple) {
            nipple.off('start move end dir plain');
        });

        
    }
    
} 