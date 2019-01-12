/** 
 * Client-side chat window connection, adapted for use from agario-clone (https://github.com/huytd/agar.io-clone/) by Ben Cuan
 * Created 17 April 2018
 */

import nipplejs from 'nipplejs';

export default class VirtualJoystick {

    // Use this constructor during init to connect ChatClient to the server
    constructor(params) {
        
        var options = {
            zone: document.getElementById('zone_joystick'),
            color: 'red'
        };
        var manager = nipplejs.create(options);

        //Perform actions based on position/whatever
        manager.on('added', function (evt, nipple) {
            nipple.on('dir:up', function (evt) {
               console.log("Up")
            });
        }).on('removed', function (evt, nipple) {
            nipple.off('start move end dir plain');
        });

    }

    
}