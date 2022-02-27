import {defs, tiny} from './examples/common.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene, Texture,
} = tiny;

export class MousePicker extends defs.Movement_Controls{
    constructor (program_state) {
        super();
        this.projection_matrix = program_state.projection_transform;
        this.view_matrix = program_state.camera_inverse;
    }

    update_view(program_state) {
        this.view_matrix = program_state.camera_inverse;
    }

    normalize_coordinates(x, y) {
        return vec(2*x / this.width, -2*y / this.height);
    }

    get_mouse_ray(canvas) {

        const mouse_position = (e, rect = canvas.getBoundingClientRect()) => {
            this.width = rect.width;
            this.height = rect.height;
            return vec(e.clientX - (rect.left + rect.right) / 2, e.clientY - (rect.bottom + rect.top) / 2);
        }

        canvas.addEventListener("mousemove", e => {
                e.preventDefault();
                const coords = mouse_position(e);
                this.mouse["from_center"] = vec(coords[0], coords[1]);

                const x = this.mouse.from_center[0];
                const y = this.mouse.from_center[1];
                const normalized_coords  = this.normalize_coordinates(x, y);
                this.currentRay = vec4(normalized_coords[0], normalized_coords[1], -1, 1);  
                // Convert to Eye to World coordinates
                this.currentRay = this.persp_to_world(this.currentRay);
        });
        return this.currentRay;
    }

    persp_to_world(coords) {
        let c = this.eye_to_world(this.persp_to_eye(coords));
        return c;
    }

    persp_to_eye(coords) {
        const eye_coords = Mat4.inverse(this.projection_matrix).times(coords);
        return vec(eye_coords[0], eye_coords[1], -1, 0);
    }

    eye_to_world(coords) {
        const world_coords = Mat4.inverse(this.view_matrix).times(coords);
        return vec(world_coords[0], world_coords[1], world_coords[2]);
    }

    display(context, graphics_state, dt = graphics_state.animation_delta_time / 1000) {
        super.display(context, graphics_state, dt);
    }
    
}