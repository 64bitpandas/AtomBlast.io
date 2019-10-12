/** 
 * Mobile Joystick - Utilizes nippleJS
 * Created 12 January 2019
 */

import nipplejs from 'nipplejs'; // NIPPLES!!!! god dammit <3 the naming
import { GLOBAL } from '../global.js' 
import { movePlayer } from '../pixigame.js';


export default class VirtualJoystick {

    // Use this constructor during init of game
    constructor(params) {
        this.mobileKey = {} //that failed me tho that should work
        this.mobileKey.leftDown = false
        this.mobileKey.upDown = false
        this.mobileKey.rightDown = false
        this.mobileKey.downDown = false //lolol that naming is a beuaty

        var options = {
            zone: document.getElementById('zone_joystick'),
            color: 'red'
        };
        var manager = nipplejs.create(options);


        let self = this // hacky hak

        //Perform actions based on direction up
        manager.on('added', function (evt, nipple) {
            // nipple.on('end', function (evt) {
            //     for (let key of movementKeys){
            //         key.isDown = false;
            //         key.isUp = true;
            //     }
            // });
            nipple.on('plain:left', function (evt) {
                movePlayer('left') 
                self.mobileKey.leftDown = true 
                self.mobileKey.rightDown = false
            })
            nipple.on('plain:right', function (evt) {
                movePlayer('right')
                self.mobileKey.rightDown = true
                self.mobileKey.leftDown = false
            })
            nipple.on('plain:up', function (evt) {
                movePlayer('up')
                self.mobileKey.upDown = true
                self.mobileKey.downDown = false
            })
            nipple.on('plain:down', function (evt) {
                movePlayer('down')
                self.mobileKey.downDown = true
                self.mobileKey.upDown = false
            })
            nipple.on('end', function(evt){
                self.mobileKey.leftDown = false
                self.mobileKey.upDown = false
                self.mobileKey.rightDown = false
                self.mobileKey.downDown = false
            })
        }).on('removed', function (evt, nipple) {
            nipple.off('start move end dir plain')
        })
    }
    
} 

