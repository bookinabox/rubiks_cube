import {defs, tiny} from './examples/common.js';
import {MousePicker} from './mouse-picker.js';
const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene, Texture,
} = tiny;

export class Project extends Scene {
    
    constructor() {
        super();

        this.shapes = {
            cubelet: new defs.Cube(),
        }

        this.materials = {
            cubelet_mat: new Material(new Texture_Cube(), {
                ambient: 1.0, color: hex_color("#000000")
            }),
        }

        this.cubelet_data = []

        // Initialize Cubes
        for(let i=-1;i<2; i++) {
            for(let j=-1; j<2; j++) {
                for(let k=-1; k<2; k++) {
                    // don't render center
                    if((i | j | k))
                        this.cubelet_data.push(Mat4.translation(i*2, j*2, k*2));
                }
            }
        }

        this.initial_camera_location = Mat4.look_at(vec3(0, 10, 20), vec3(0, 0, 0), vec3(0, 1, 0));
    }

    make_control_panel() {
        this.key_triggered_button("Cube rotation", ["c"], () => this.rotate_side());
        this.key_triggered_button("Cube rotation", ["v"], () => this.rotate_top());
    }

    
    rotate_side() {
        let side = 1
        for(let index in this.cubelet_data) {
            if(Math.abs(this.cubelet_data[index][0][3] -2) < 0.0001) {
                let translate_to_center = Mat4.translation(0, Math.round(-this.cubelet_data[index][1][3]), Math.round(-this.cubelet_data[index][2][3]));
               
                //this.cubelet_data[index] = this.cubelet_data[index].times(translate_to_center);
                this.cubelet_data[index] = this.cubelet_data[index].times(Mat4.rotation(Math.PI/2, 1, 0, 0));
                //this.cubelet_data[index] = this.cubelet_data[index].times(Mat4.inverse(translate_to_center));
            }
        }
    }

     rotate_top() {
        let side = 1
        for(let index in this.cubelet_data) {
            if(Math.abs(this.cubelet_data[index][1][3] - 2) < 0.0001) {
                //let translate_to_center = Mat4.translation(0, -this.cubelet_data[index][1][3], -this.cubelet_data[index][2][3]);
                //this.cubelet_data[index] = this.cubelet_data[index].times(translate_to_center);
                this.cubelet_data[index] = this.cubelet_data[index].times(Mat4.rotation(Math.PI/2, 0, 1, 0));
                //this.cubelet_data[index] = this.cubelet_data[index].times(translate_to_center);
            }
        }
    }

    check_closest_face(position, ray) {
        const cube_radius = 3;


        // Find distance from cardinal planes
        let front_dist = (-cube_radius - position[2]) / ray[2];
        let back_dist = (cube_radius - position[2]) / ray[2];

        let right_dist = (cube_radius - position[0]) / ray[0];
        let left_dist = (-cube_radius - position[0]) / ray[0];

        let top_dist = (cube_radius - position[1]) / ray[1];
        let bottom_dist = (-cube_radius - position[1]) / ray[1];

        // Do not take into account intersections with planes that are off the cube
        
        const front_coord = ray.times(front_dist).plus(position);
        const back_coord = ray.times(back_dist).plus(position);
        const right_coord = ray.times(right_dist).plus(position);
        const left_coord = ray.times(left_dist).plus(position);
        const top_coord = ray.times(top_dist).plus(position);
        const bottom_coord = ray.times(bottom_dist).plus(position);

        
        console.log("front_dist " + front_dist);
        console.log("back_dist " + back_dist);
        console.log("right_dist " + right_dist);
        console.log("left_dist " + left_dist);
        console.log("top_dist " + top_dist);
        console.log("bottom_dist " + bottom_dist);
        console.log("ray " + ray);
        console.log("position " + position);
        console.log();

        console.log("front")
        console.log(front_coord);
        console.log("back")
        console.log(back_coord);
        console.log("right")
        console.log(right_coord);
        console.log("left")
        console.log(left_coord);
        console.log("top")
        console.log(top_coord);
        console.log("bottom")
        console.log(bottom_coord);
        

        const threshold = 7;
        if(Math.abs(front_coord[0]) > threshold || Math.abs(front_coord[1]) > threshold || Math.abs(front_coord[2]) > threshold) {
            front_dist = Infinity;
        }
        if(Math.abs(back_coord[0]) > threshold || Math.abs(back_coord[1]) > threshold || Math.abs(back_coord[2]) > threshold) {
            back_dist = Infinity;
        }
        if(Math.abs(right_coord[0]) > threshold || Math.abs(right_coord[1]) > threshold || Math.abs(right_coord[2]) > threshold) {
            right_dist = Infinity;
        }
        if(Math.abs(left_coord[0]) > threshold || Math.abs(left_coord[1]) > threshold || Math.abs(left_coord[2]) > threshold) {
            left_dist = Infinity;
        }
        if(Math.abs(top_coord[0]) > threshold || Math.abs(top_coord[1]) > threshold || Math.abs(top_coord[2]) > threshold) {
            top_dist = Infinity;
        }
        if(Math.abs(bottom_coord[0]) > threshold || Math.abs(bottom_coord[1]) > threshold || Math.abs(bottom_coord[2]) > threshold) {
            bottom_dist = Infinity;
        }
        
        // Find minimum

        var sides = [{
            name: "front",
            val: front_dist
        },
        {
            name: "back",
            val: back_dist
        },
        {
            name: "left",
            val: left_dist
        },
        {
            name: "right",
            val: right_dist
        },
        {
            name: "top",
            val: top_dist
        },
        {
            name: "bottom",
            val: bottom_dist
        },
    ]

    let min = sides.reduce((obj1, obj2) => {
        return (Math.abs(obj1.val) < Math.abs(obj2.val)) ? obj1: obj2;
    });

    if (min.val != Infinity)
        console.log(min);
    /*
        console.log(position);
        console.log("front")
        console.log(front_dist);
        console.log("back")
        console.log(back_dist);
        console.log("right")
        console.log(right_dist);
        console.log("left")
        console.log(left_dist);
        console.log("top")
        console.log(top_dist);
        console.log("bottom")
        console.log(bottom_dist);
    */
    }




    display(context, program_state) {
        if (!context.scratchpad.controls) {
            this.children.push(context.scratchpad.controls = new MousePicker(program_state));
            program_state.set_camera(Mat4.translation(0, 0, -25));

            let ray = undefined;
            let coords = undefined;
            context.canvas.addEventListener("mousedown", e => {
                    e.preventDefault()
                    context.scratchpad.controls.update_view(program_state);
                    ray = context.scratchpad.controls.get_mouse_ray(context.canvas);
                    coords = context.scratchpad.controls.world_position();
                    this.check_closest_face(coords, ray);
                }
            );
            context.canvas.addEventListener("mouseup", e => {
                    e.preventDefault()
                    ray  = context.scratchpad.controls.get_mouse_ray(context.canvas);
                    context.scratchpad.controls.unfreeze_camera();
                    coords = context.scratchpad.controls.world_position();
                }
            );
        }
        

        program_state.projection_transform = Mat4.perspective(
            Math.PI / 4, context.width / context.height, 1, 100);

        const light_position = vec4(10, 10, 10, 1);
        program_state.lights = [new Light(light_position, color(1, 1, 1, 1), 1000)];

        let t = program_state.animation_time / 1000, dt = program_state.animation_delta_time / 1000;

        for(let transform_data in this.cubelet_data) {
            this.shapes.cubelet.draw(context, program_state, this.cubelet_data[transform_data], this.materials.cubelet_mat);
        }
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
                        color = vec3(0, 0, 1.0);
                    }
                    if(f_position.x == 1.0) {
                        color = vec3(0, 1.0, 0);
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