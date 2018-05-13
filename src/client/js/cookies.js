/**
 * Cookies.js was adopted from a StackOverflow answer 
 * (https://stackoverflow.com/questions/14573223/set-cookie-and-get-cookie-with-javascript).
 */

/**
 * Sets the value of a cookie.
 * @param {string} name Name of cookie
 * @param {string} value New value of cookie
 * @param {number} days Number of days this cookie will last for
 */
export function setCookie(name, value, days) {
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = `; expires=${date.toUTCString()}`;
    }
    document.cookie = `${name}=${value || ""}${expires}; path=/`;
}

/**
 * Sets the value of a cookie.
 * @param {string} name Name of cookie
 * @return {string} The value of the cookie. Returns null if the cookie is not found.
 */
export function getCookie(name) {
    const nameEQ = `${name}=`;
    const ca = document.cookie.split(';');

    for (let c of ca) {
        while (c.charAt(0) == ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }

    return null;
}

/**
 * Removes the given cookie.
 * @param {string} name The name of the cookie to erase.
 */
export function eraseCookie(name) {
    document.cookie = `${name}=; Max-Age=-99999999;`;
}