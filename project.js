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

   


    display(context, program_state) {
        if (!context.scratchpad.controls) {
            this.children.push(context.scratchpad.controls = new MousePicker(program_state));
            program_state.set_camera(Mat4.translation(0, 0, -8));
            context.scratchpad.controls.update_view(program_state);

            context.canvas.addEventListener("mousedown", e => {
                    e.preventDefault()
                    const coords = context.scratchpad.controls.get_mouse_ray(context.canvas);
                    console.log(coords);
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