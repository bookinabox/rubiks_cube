import { defs, tiny } from './examples/common.js';
import { Controls } from './mouse-picker.js';
const {
    vec, vec3, vec4, color, hex_color, Mat4, Light, Material, Scene,
} = tiny;

// Rotation Matrices (To avoid floating point issues caused by Math.PI/2)

let R_X = new Mat4([1, 0, 0, 0],
    [0, 0, -1, 0],
    [0, 1, 0, 0],
    [0, 0, 0, 1])

let R_Y = new Mat4([0, 0, 1, 0],
    [0, 1, 0, 0],
    [-1, 0, 0, 0],
    [0, 0, 0, 1])

let R_Z = new Mat4([0, -1, 0, 0],
    [1, 0, 0, 0],
    [0, 0, 1, 0],
    [0, 0, 0, 1])

export class Rubiks_Cube extends Scene {

    constructor() {
        super();

        this.shapes = {
            cubelet: new defs.Cube(),
            sphere: new defs.Subdivision_Sphere(4)
        }

        this.materials = {
            cubelet_mat: new Material(new Texture_Cube(), {
                ambient: 1.0, color: hex_color("#000000")
            }),
            background: new Material(new defs.Phong_Shader(), {
                ambient: 0.8, diffuse: 1.0, specular: 1.0, color: hex_color("#22232a")
            })
        }

        this.cubelet_data = []

        // Initialize Cubes
        for (let i = -1; i < 2; i++) {
            for (let j = -1; j < 2; j++) {
                for (let k = -1; k < 2; k++) {
                    // don't render center
                    if ((i | j | k))
                        this.cubelet_data.push(Mat4.translation(i * 2, j * 2, k * 2));
                }
            }
        }

        this.initial_camera_location = Mat4.look_at(vec3(0, 10, 20), vec3(0, 0, 0), vec3(0, 1, 0));
    }


    shuffle() {
        let sides = ["right", "left", "top", "bottom", "front", "back"];

        let side = sides[Math.floor(Math.random() * sides.length)];
        let dir = 1;
        if (Math.floor(Math.random() * 2) == 0) {
            dir = dir * -1;
        }
        this.rotate(side, dir);
    }

    solve() {
        this.cubelet_data = []

        // Initialize Cubes
        for (let i = -1; i < 2; i++) {
            for (let j = -1; j < 2; j++) {
                for (let k = -1; k < 2; k++) {
                    // don't render center
                    if ((i | j | k))
                        this.cubelet_data.push(Mat4.translation(i * 2, j * 2, k * 2));
                }
            }
        }
    }


    make_control_panel() {
        this.key_triggered_button("R", ["r"], () => this.rotate("right", -1));
        this.key_triggered_button("R'", ["Shift", "R"], () => this.rotate("right", 1));

        this.key_triggered_button("L", ["l"], () => this.rotate("left", 1));
        this.key_triggered_button("L'", ["Shift", "L"], () => this.rotate("left", -1));

        this.key_triggered_button("U", ["u"], () => this.rotate("top", -1));
        this.key_triggered_button("U'", ["Shift", "U"], () => this.rotate("top", 1));

        this.key_triggered_button("D", ["d"], () => this.rotate("bottom", 1));
        this.key_triggered_button("D'", ["Shift", "D"], () => this.rotate("bottom", -1));

        this.key_triggered_button("F", ["f"], () => this.rotate("front", -1));
        this.key_triggered_button("F'", ["Shift", "F"], () => this.rotate("front", 1));

        this.key_triggered_button("B", ["b"], () => this.rotate("back", 1));
        this.key_triggered_button("B'", ["Shift", "B"], () => this.rotate("back", -1));

        this.key_triggered_button("Shuffle", ["s"], () => {
            for (let i = 0; i < 20; i++) {
                this.shuffle();
            }
        });
        this.key_triggered_button("Solve", ["Shift", "S"], () => this.solve());

    }


    // Allows a single rotation for all sides
    rotate(side, direction) {
        let coord = undefined;
        let dir = direction > 0 ? 1 : -1;
        let rot_matrix = undefined;

        // Coord = 0 means look at x, etc.
        if (side == "right" || side == "left") {
            coord = 0;
            rot_matrix = R_X;
        } else if (side == "top" || side == "bottom") {
            coord = 1;
            rot_matrix = R_Y;
        } else if (side == "front" || side == "back") {
            coord = 2;
            rot_matrix = R_Z;
        }

        // To simplify which side we're looking at
        // i.e. -2 for right side, 2 for left side
        let opposite = -1;
        if (side == "left" || side == "bottom" || side == "back") {
            opposite = 1;
        }

        // Based on direction, we can basically just rotate on way or another
        rot_matrix = dir == -1 ? Mat4.inverse(rot_matrix) : rot_matrix;

        // This should handle all possible side rotations (not center ones)
        for (let index in this.cubelet_data) {
            if (Math.abs(this.cubelet_data[index][coord][3] + 2 * opposite) < 0.0001) {
                let translate_to_center = Mat4.translation(0, Math.round(-this.cubelet_data[index][(coord + 1) % 2][3]), Math.round(-this.cubelet_data[index][(coord + 2) % 2][3]));

                this.cubelet_data[index] = this.cubelet_data[index].times(translate_to_center);
                this.cubelet_data[index] = rot_matrix.times(this.cubelet_data[index]);
                this.cubelet_data[index] = this.cubelet_data[index].times(Mat4.inverse(translate_to_center));
            }
        }
    }

    display(context, program_state) {
        if (!context.scratchpad.controls) {
            program_state.set_camera(Mat4.translation(0, 0, -25));
            program_state.projection_transform = Mat4.perspective(
                Math.PI / 4, context.width / context.height, 1, 100);

            this.children.push(context.scratchpad.controls = new Controls(program_state));
            let selected = undefined;
            let ray_1 = undefined;
            context.canvas.addEventListener("mousedown", e => {
                e.preventDefault()
                const mouse_position = (e, rect = context.canvas.getBoundingClientRect()) => {
                    this.width = rect.width;
                    this.height = rect.height;
                    return vec(e.clientX - (rect.left + rect.right) / 2, e.clientY - (rect.bottom + rect.top) / 2);
                }

                context.scratchpad.controls.update_view(program_state);
                context.scratchpad.controls.update_context(context)
                const coords = context.scratchpad.controls.world_position();
                const m_coords = mouse_position(e);
                ray_1 = context.scratchpad.controls.get_mouse_ray(m_coords, this.width, this.height);
                selected = context.scratchpad.controls.check_closest_face(m_coords, coords, this.width, this.height);

                if (selected) {
                    context.scratchpad.controls.freeze_camera();
                }
            }
            );

            let ray_2 = undefined;
            context.canvas.addEventListener("mouseup", e => {
                e.preventDefault()

                if (selected) {

                    const mouse_position = (e, rect = context.canvas.getBoundingClientRect()) => {
                        this.width = rect.width;
                        this.height = rect.height;
                        return vec(e.clientX - (rect.left + rect.right) / 2, e.clientY - (rect.bottom + rect.top) / 2);
                    }

                    context.scratchpad.controls.update_view(program_state);
                    context.scratchpad.controls.update_context(context);
                    const m_coords = mouse_position(e);
                    ray_2 = context.scratchpad.controls.get_mouse_ray(m_coords, this.width, this.height);

                    const dir_x = ray_1[0] - ray_2[0];
                    const dir_y = ray_1[1] - ray_2[1];
                    const dir_z = ray_1[2] - ray_2[2];

                    // Need to only look at largest change in mouse position.
                    // (so we don't rotate the wrong direction just because its the first if statement)
                    let max_diff = undefined;
                    if (Math.abs(dir_x) > Math.abs(dir_y) && Math.abs(dir_x) > Math.abs(dir_z)) {
                        max_diff = "x";
                    } else if (Math.abs(dir_y) > Math.abs(dir_z) && Math.abs(dir_y) > Math.abs(dir_x)) {
                        max_diff = "y";
                    } else {
                        max_diff = "z";
                    }

                    // Basically doing this because if we look from opposite side,
                    // its exactly the same as inverting all the rotations
                    let flip_rotation = 1;
                    if (selected.name === "back" || selected.name === "right" || selected.name === "bottom") {
                        flip_rotation = -1;
                    }

                    if (selected.name === "front" || selected.name === "back") {
                        if (max_diff === "y") {
                            if (selected.coord[0] > 1 && dir_y > 0) {
                                this.rotate("right", -1 * flip_rotation);
                            } else if (selected.coord[0] > 1 && dir_y < 0) {
                                this.rotate("right", 1 * flip_rotation);
                            }

                            else if (selected.coord[0] < -1 && dir_y > 0) {
                                this.rotate("left", -1 * flip_rotation);
                            } else if (selected.coord[0] < -1 && dir_y < 0) {
                                this.rotate("left", 1 * flip_rotation);
                            }
                        }
                        if (max_diff === "x") {
                            if (selected.coord[1] < -1 && dir_x > 0) {
                                this.rotate("top", -1 * flip_rotation);
                            } else if (selected.coord[1] < -1 && dir_x < 0) {
                                this.rotate("top", 1 * flip_rotation);
                            }

                            else if (selected.coord[1] > 1 && dir_x > 0) {
                                this.rotate("bottom", -1 * flip_rotation);
                            } else if (selected.coord[1] > 1 && dir_x < 0) {
                                this.rotate("bottom", 1 * flip_rotation);
                            }
                        }

                    } else if (selected.name === "left" || selected.name === "right") {
                        if (max_diff === "y") {
                            if (selected.coord[2] > 1 && dir_y > 0) {
                                this.rotate("back", -1 * flip_rotation);
                            } else if (selected.coord[2] > 1 && dir_y < 0) {
                                this.rotate("back", 1 * flip_rotation);
                            }

                            else if (selected.coord[2] < -1 && dir_y > 0) {
                                this.rotate("front", -1 * flip_rotation);
                            } else if (selected.coord[2] < -1 && dir_y < 0) {
                                this.rotate("front", 1 * flip_rotation);
                            }
                        }
                        if (max_diff === "z") {
                            if (selected.coord[1] < -1 && dir_z > 0) {
                                this.rotate("top", 1 * flip_rotation);
                            } else if (selected.coord[1] < -1 && dir_z < 0) {
                                this.rotate("top", -1 * flip_rotation);
                            }

                            else if (selected.coord[1] > 1 && dir_z > 0) {
                                this.rotate("bottom", 1 * flip_rotation);
                            } else if (selected.coord[1] > 1 && dir_z < 0) {
                                this.rotate("bottom", -1 * flip_rotation);
                            }
                        }

                    } else if (selected.name === "top" || selected.name === "bottom") {
                        if (max_diff === "z") {
                            if (selected.coord[0] < -1 && dir_z > 0) {
                                this.rotate("left", -1 * flip_rotation);
                            } else if (selected.coord[0] < -1 && dir_z < 0) {
                                this.rotate("left", 1 * flip_rotation);
                            }

                            else if (selected.coord[0] > 1 && dir_z > 0) {
                                this.rotate("right", -1 * flip_rotation);
                            } else if (selected.coord[0] > 1 && dir_z < 0) {
                                this.rotate("right", 1 * flip_rotation);
                            }
                        }
                        if (max_diff === "x") {
                            if (selected.coord[2] < -1 && dir_x > 0) {
                                this.rotate("back", 1 * flip_rotation);
                            } else if (selected.coord[2] < -1 && dir_x < 0) {
                                this.rotate("back", -1 * flip_rotation);
                            }

                            else if (selected.coord[2] > 1 && dir_x > 0) {
                                this.rotate("front", 1 * flip_rotation);
                            } else if (selected.coord[2] > 1 && dir_x < 0) {
                                this.rotate("front", -1 * flip_rotation);
                            }
                        }

                    }
                }
                context.scratchpad.controls.unfreeze_camera();
            }
            );
        }

        const light_position = vec4(10, 10, 10, 1);
        program_state.lights = [new Light(light_position, color(1, 1, 1, 1), 1000)];

        for (let transform_data in this.cubelet_data) {
            this.shapes.cubelet.draw(context, program_state, this.cubelet_data[transform_data], this.materials.cubelet_mat);
        }
        this.shapes.sphere.draw(context, program_state, Mat4.scale(50, 50, 50), this.materials.background);
    }
}


class Texture_Cube extends defs.Phong_Shader {

    vertex_glsl_code() {
        return this.shared_glsl_code() + `
            varying vec2 f_tex_coord;
            varying vec3 f_position;

            attribute vec3 position, normal;

            // Position is expressed in object coordinates.
            attribute vec2 texture_coord;

            uniform mat4 model_transform;
            uniform mat4 projection_camera_model_transform;
    
            void main(){                                                                   
                // The vertex's final resting place (in NDCS):
                gl_Position = projection_camera_model_transform * vec4( position, 1.0 );
                // The final normal vector in screen space.
                N = normalize( mat3( model_transform ) * normal / squared_scale);
                vertex_worldspace = ( model_transform * vec4( position, 1.0 ) ).xyz;
                // Turn the per-vertex texture coordinate into an interpolated variable.
                f_tex_coord = texture_coord;
                f_position = position;
              } `;
    }

    fragment_glsl_code() {
        return this.shared_glsl_code() + `
            varying vec2 f_tex_coord;
            varying vec3 f_position;

            uniform sampler2D texture;

            void main(){
                
                vec4 tex_color = texture2D(texture, f_tex_coord);

                float u = f_tex_coord.x;
                float v = f_tex_coord.y;


                float dist_to_inner_edge = 0.95;
                bool border = false;

                // Horizontal
                if (v > dist_to_inner_edge || v < 1.0-dist_to_inner_edge) {
                    border = true;
                }

                // Vertical
                if (u > dist_to_inner_edge || u < 1.0-dist_to_inner_edge) {
                    border = true;
                }

                if (border) {
                    gl_FragColor = vec4(0,0,0,1.0);
                    gl_FragColor.xyz += phong_model_lights( normalize( N), vertex_worldspace );
                } else {

                    // Probably a better way to do this???
                    vec3 color = vec3(1.0,1.0,1.0);

                    if(f_position.x == -1.0) {
                        color = vec3(0, 1.0, 0);
                    }
                    if(f_position.x == 1.0) {
                        color = vec3(0, 0, 1.0);
                    }


                    if(f_position.y == -1.0) {
                        color = vec3(1.0, 1.0, 0.0);
                    }
                    if(f_position.y == 1.0) {
                        color = vec3(1.0, 1.0, 1.0);
                    }


                    if(f_position.z == -1.0) {
                        color = vec3(0.7, 0.3, 0);
                    }
                    if(f_position.z == 1.0) {
                        color = vec3(1.0, 0.0, 0.0);
                    }


                    gl_FragColor = vec4(color, shape_color.w * tex_color.w );
                    gl_FragColor.xyz += phong_model_lights( normalize( N+vec3(1.0,1.0,1.0)), vertex_worldspace );
                }
        } `;
    }
}