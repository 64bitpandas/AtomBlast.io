// Contains list of resources (images, assets, stats, etc) and methods to access, load, and modify them
// Created by Ben Cuan on 5 May 2018


    /** 
    * Private list of resources.
    *  - fileName: name and/or path of file within the 'assets' directory
    *  - type: 
    */
    const resources = {
        sample: {
            fileName: 'sample.png'
        },

        sample2: {
            fileName: 'sample2.png'
        }
    };

    /** 
    * MISSING COMMENT
    */
    export function getResource(resourceName) {
        return resources[resourceName];
    }

    // Loads all assets for p5
    export function loadResources() {
        for(let item of resources) {
            loadImage('assets/' + item.fileName);
        }
    }
