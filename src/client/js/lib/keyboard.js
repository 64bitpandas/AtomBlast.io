/**
 * Key listener function, adapted from https://github.com/kittykatattack/learningPixi#keyboard
 * Please refer to this link for extended documentation.
 * @param {number} keyCode ASCII key code for the key to listen. For best results declare the key codes in GLOBAL.js 
 */
import { isFocused } from '../pixigame';


export function keyboard(keyCode) {
  let key = {};
  key.code = keyCode;
  key.isDown = false;
  key.isUp = true;
  key.press = undefined;
  key.release = undefined;
  //The `downHandler`
  key.downHandler = event => {
      if (event.keyCode === key.code) {
        if (isFocused()) {
          if (key.isUp && key.press){
            key.press();
          }
          key.isDown = true;
          key.isUp = false;
        }
        //If 
        else{
          key.isDown = false;
          key.isUp = true;
        }
    // event.preventDefault();
      }
  };

  //The `upHandler`
  key.upHandler = event => {
      if (event.keyCode === key.code) {
        if(isFocused()){
          if (key.isDown && key.release){
            key.release();
          }
          key.isDown = false;
          key.isUp = true;
        }
        else{
          key.isDown = false;
          key.isUp = true;
        }
      }
    // event.preventDefault();
  };

  //Attach event listeners
  window.addEventListener(
    "keydown", key.downHandler.bind(key), false
  );
  window.addEventListener(
    "keyup", key.upHandler.bind(key), false
  );
  return key;
}