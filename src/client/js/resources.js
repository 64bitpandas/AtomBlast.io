// Contains list of resources (images, assets, stats, etc) and methods to access, load, and modify them
// Created by Ben Cuan on 5 May 2018
export class Resources {

    /** 
    * MISSING COMMENT
    */
    #resources = {
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
    getResource(resourceName) {
        return resources[resourceName];
    }

    // Loads all assets for p5
    loadResources() {
        for(let item of resources) {
            loadImage('assets/' + item.fileName);
        }
    }
}