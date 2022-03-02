import {defs, tiny} from './examples/common.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene, Texture,
} = tiny;

export class MousePicker extends defs.Movement_Controls{
    constructor (program_state) {
        super();
        this.projection_matrix = program_state.projection_transform;
        this.view_matrix = program_state.camera_inverse;
        this.frozen = false;
    }

    update_view(program_state) {
        this.view_matrix = program_state.camera_inverse;
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

                // Normalize+Homogenized Coordinates
                this.currentRay = vec4(2*this.mouse.from_center[0] / this.width, -2*this.mouse.from_center[1] / this.height, -1, 1);  
                // Convert to Eye to World coordinates
                const eye_coords = Mat4.inverse(this.projection_matrix).times(this.currentRay);
                this.currentRay =  vec(eye_coords[0], eye_coords[1], -1, 0);
                const world_coords = Mat4.inverse(this.view_matrix).times(this.currentRay);
                // Convert back to right hand
                const mirrored_coords = Mat4.scale(1, 1, -1).times(world_coords);
                this.currentRay = vec(mirrored_coords[0], mirrored_coords[1], mirrored_coords[2]).normalized();
        });
        return this.currentRay;
    }

    freeze_camera() {
        this.frozen = true;
    }

    unfreeze_camera() {
        this.frozen = false;
    }

    world_position() {
        let location = this.view_matrix.times(this.pos);
        location[2] = location[2] + 25;
        return location;
    }

    display(context, graphics_state, dt = graphics_state.animation_delta_time / 1000) {
        // The whole process of acting upon controls begins here.
        const m = this.speed_multiplier * this.meters_per_frame,
            r = this.speed_multiplier * this.radians_per_frame;

        if (this.will_take_over_graphics_state) {
            this.reset(graphics_state);
            this.will_take_over_graphics_state = false;
        }

        if (!this.mouse_enabled_canvases.has(context.canvas)) {
            this.add_mouse_controls(context.canvas);
            this.mouse_enabled_canvases.add(context.canvas)
        }
        // Move in first-person.  Scale the normal camera aiming speed by dt for smoothness:
        this.first_person_flyaround(dt * r, dt * m);
        // Modify this to not rotate when hitting cube.
        if (this.mouse.anchor && !this.frozen)
            this.third_person_arcball(dt * r);
        // Log some values:
        this.pos = this.inverse().times(vec4(0, 0, 0, 1));
        this.z_axis = this.inverse().times(vec4(0, 0, 1, 0));
    }    

}