/**
 * This constant stores all data that is used to define Blueprints, 
 * which define the recipe and behaviors of Compounds.
 * 
 * Fields required:
 * Name: The formatted name of the compound to display
 * Tooltip: Description of compound
 * Texture: Path to image to load
 * Type: Class of compound. Each different type has a different behavior as defined in `compound.js`.
 * Params: Optional parameters to pass to the compound class associated with the given type.
 * Atoms: How to make the compound. Format is `Element symbol: Number required`. All excluded atoms will be considered 0.
 */
export const BLUEPRINTS = {
    sampleBlueprint: {
        name: 'Sample Blueprint',
        tooltip: 'Copyright 2018 Bananium Labs, inc.',
        texture: '../assets/atom-hydrogen.png',
        type: 'binary',
        params: {
            speed: 5,
            damage: 5,
            size: 5
        },
        atoms: {
            h: 1,
            cl: 5
        }
    },
    binaryHydrogen: {
        name: 'Hydrogen',
        tooltip: 'This is quite literally the smallest compound in the universe. Why are you using this as a weapon?',
        texture: '../assets/atom-hydrogen.png',
        type: 'binary',
        params: {
            speed: 5,
            damage: 10,
            size: 10
        },
        atoms: {
            h: 2
        }
    },
    basicMethane: {
        name: 'Methane',
        tooltip: 'Okay, who passed gas?',
        texture: '../assets/atom-hydrogen.png',
        type: 'basic',
        params: {
            speed: 3,
            damage: 3,
            size: 1
        },
        atoms: {
            c: 1,
            h: 4
        }
    },
    basicBenzene: {
        name: 'Benzene',
        tooltip: 'Carbon rings. They smell nice.',
        texture: '../assets/atom-hydrogen.png',
        type: 'basic',
        params: {
            speed: 1,
            damage: 5,
            size: 3
        },
        atoms: {
            h: 6,
            c: 6
        }
    },

}

