/** 
 * Mobile Joystick - Utilizes nippleJS
 * Created 12 January 2019
 */

import nipplejs from 'nipplejs';

export default class VirtualJoystick {

    // Use this constructor during init of game
    constructor(params) {
        
        var options = {
            zone: document.getElementById('zone_joystick'),
            color: 'red'
        };
        var manager = nipplejs.create(options);

        //Perform actions based on direction up
        manager.on('added', function (evt, nipple) {
            nipple.on('dir:up', function (evt) {
               console.log("Up")
            });
        }).on('removed', function (evt, nipple) {
            nipple.off('start move end dir plain');
        });

    }

    
}