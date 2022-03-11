import { defs, tiny } from './examples/common.js';
import { Rubiks_Cube } from "./project.js";
// Pull these names into this module's scope for convenience:
const {
    Canvas_Widget, Code_Widget, Text_Widget
} = tiny;

Object.assign(defs,
    { Rubiks_Cube }
);

// ******************** End extra step

// (Can define Main_Scene's class here)

const Main_Scene = Rubiks_Cube;
//const Main_Scene = Mouse_Demo;
const Additional_Scenes = [];

export { Main_Scene, Additional_Scenes, Canvas_Widget, Code_Widget, Text_Widget, defs }