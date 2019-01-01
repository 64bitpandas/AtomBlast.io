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
    binaryHydrogen: {
        name: 'Hydrogen',
        tooltip: 'This is quite literally the smallest compound in the universe. Why are you using this as a weapon?',
        texture: '../assets/atom-hydrogen.png',
        type: 'flammable',
        params: {
            speed: 5*3,
            damage: 1,
            size: 20,
            ignitedDamage: 10,
            splash: 50,
            splashImage: '../assets/explosion.png'
        },
        atoms: {
            h: 2
        }
    },
    basicMethane: {
        name: 'Methane',
        tooltip: 'Okay, who passed gas?',
        texture: '../assets/atom-hydrogen.png',
        type: 'flammable',
        params: {
            speed: 3*3,
            damage: 3,
            size: 10
        },
        atoms: {
            c: 1,
            h: 4
        }
    },
    basicBenzene: {
        name: 'Benzene',
        tooltip: 'Carbon rings. They smell nice.',
        texture: '../assets/atom_carbon.png',
        type: 'basic',
        params: {
            speed: 1*3,
            damage: 5,
            size: 30
        },
        atoms: {
            h: 6,
            c: 6
        }
    },
    basicWater: {
        name: 'Water',
        tooltip: 'Why life exists. Are you trying to drown someone?',
        texture: '../assets/atom-hydrogen.png',
        type: 'stream',
        params: {
            speed: 4*3,
            damage: 1,
            size: 15,
            length: 10,
            spacing: 50     
        },
        atoms: {
            h: 2,
            o: 1
        }
    },
    binaryNitrogen: {
        name: 'Nitrogen',
        tooltip: '78% of your air, and also why you get the bends.',
        texture: '../assets/atom_nitrogen.png',
        type: 'basic',
        params: {
            speed: 3*3,
            damage: 3,
            size: 20
        },
        atoms: {
            n: 2
        }
    },
    binaryHelium: {
        name: 'Helium',
        tooltip: 'A nonreactive, inert gas. In other words, useless.',
        texture: '../assets/atom_helium.png',
        type: 'basic',
        params: {
            speed: 4 * 3,
            damage: 2,
            size: 14
        },
        atoms: {
            he: 2
        }
    },
    ionicSodiumChloride: {
        name: 'Sodium Chloride',
        tooltip: 'Can kill small insects, slugs, and snails. Cannot kill much else.',
        texture: '../assets/atom_helium.png',
        type: 'ionic',
        params: {
            speed: 4 * 3,
            damage: 2,
            size: 14
        },
        atoms: {
            na: 1,
            cl: 1
        }
    },
    acidicHydrogenChloride: {
        name: 'Hydrochloric Acid',
        tooltip: 'In a pure form, can corrode metal.',
        texture: '../assets/atom_helium.png',
        type: 'acidic',
        params: {
            speed: 4 * 3,
            damage: 2,
            size: 14
        },
        atoms: {
            h: 1,
            cl: 1
        }
    },
    nuclearLithiumHydrogen: {
        name: 'Lithium Deuteride',
        tooltip: 'Used as the primary fuel in thermonuclear weapons.',
        texture: '../assets/atom_lithium.png',
        type: 'nuclear',
        params: {
            speed: 1 * 3,
            damage: 2,
            size: 14
        },
        atoms: {
            h: 1,
            li: 1
        }
    },
    glucose: {
        name: 'Glucose',
        tooltip: 'S U G A R R U S H !!!!',
        texture: '../assets/atom-hydrogen.png',
        type: 'speed',
        params: {
            speedFactor: 0.5
        },
        atoms: {
            c: 6,
            h: 12,
            o: 6
        }
    },
    protonPack: {
        name: 'Proton Pack',
        tooltip: 'Easy health!',
        texture: '../assets/atom-hydrogen.png',
        type: 'health',
        params: {
            healthModifier: 10
        },
        atoms: {
            h: 10
        }
    }
};

