import { defs, tiny } from './examples/common.js';

const {
    vec, vec4, Mat4
} = tiny;

export class MousePicker extends defs.Movement_Controls {
    constructor(program_state) {
        super();
        this.projection_matrix = program_state.projection_transform;
        this.view_matrix = program_state.camera_inverse;
        this.frozen = false;
        this.context = undefined;
        this.ray = undefined;
    }

    update_view(program_state) {
        this.view_matrix = program_state.camera_inverse;
    }

    update_context(context) {
        this.context = context;
    }

    get_mouse_ray(coords, width, height) {
        // Normalize+Homogenized Coordinates
        this.ray = vec4(2 * coords[0] / width, 2 * coords[1] / height, -1, 1);
        // Convert to Eye
        this.ray = Mat4.inverse(this.projection_matrix).times(this.ray);
        this.ray = vec(this.ray[0], this.ray[1], -1, 0);
        // Convert to World
        this.ray = Mat4.inverse(this.matrix()).times(this.ray);
        // Convert from left to right handed coordinate
        this.ray = Mat4.scale(1, 1, -1).times(this.ray);
        this.ray = vec(this.ray[0], this.ray[1], this.ray[2]).normalized();
        console.log(this.ray);
        return this.ray;
    }

    freeze_camera() {
        this.frozen = true;
    }

    unfreeze_camera() {
        this.frozen = false;
    }

    world_position() {
        // Unsure why this works
        let location = this.view_matrix.times(this.pos);
        location[2] = location[2] + 25;
        return location;
    }

    check_closest_face(mouse_coords, position, width, height) {
        this.get_mouse_ray(mouse_coords, width, height);
        let ray = this.ray;
        const cube_radius = 3;

        let front_dist = (position[2] + cube_radius) / ray[2];
        let back_dist = (position[2] - cube_radius) / ray[2];
        let right_dist = (position[0] - cube_radius) / ray[0];
        let left_dist = (position[0] + cube_radius) / ray[0];
        let top_dist = (position[1] - cube_radius) / ray[1];
        let bottom_dist = (position[1] + cube_radius) / ray[1];

        // Do not take into account intersections with planes that are off the cube

        // Instead of trying to orient the ray, just shoot in both directions and see which one hits.
        const front_coord = ray.times(front_dist).plus(position)[2] === -3 ? ray.times(front_dist).plus(position) : ray.times(-front_dist).plus(position);
        const back_coord = ray.times(back_dist).plus(position)[2] === 3 ? ray.times(front_dist).plus(position) : ray.times(-front_dist).plus(position);
        const right_coord = ray.times(right_dist).plus(position)[0] === -3 ? ray.times(right_dist).plus(position) : ray.times(-right_dist).plus(position);
        const left_coord = ray.times(left_dist).plus(position)[0] === 3 ? ray.times(left_dist).plus(position) : ray.times(-left_dist).plus(position);
        const top_coord = ray.times(top_dist).plus(position)[1] === 3 ? ray.times(top_dist).plus(position) : ray.times(-top_dist).plus(position);;
        const bottom_coord = ray.times(bottom_dist).plus(position)[1] === -3 ? ray.times(bottom_dist).plus(position) : ray.times(-bottom_dist).plus(position);

        const threshold = 3.0;
        if (Math.abs(front_coord[0]) > threshold || Math.abs(front_coord[1]) > threshold || Math.abs(front_coord[2]) > threshold) {
            front_dist = Infinity;
        }
        if (Math.abs(back_coord[0]) > threshold || Math.abs(back_coord[1]) > threshold || Math.abs(back_coord[2]) > threshold) {
            back_dist = Infinity;
        }
        if (Math.abs(right_coord[0]) > threshold || Math.abs(right_coord[1]) > threshold || Math.abs(right_coord[2]) > threshold) {
            right_dist = Infinity;
        }
        if (Math.abs(left_coord[0]) > threshold || Math.abs(left_coord[1]) > threshold || Math.abs(left_coord[2]) > threshold) {
            left_dist = Infinity;
        }
        if (Math.abs(top_coord[0]) > threshold || Math.abs(top_coord[1]) > threshold || Math.abs(top_coord[2]) > threshold) {
            top_dist = Infinity;
        }
        if (Math.abs(bottom_coord[0]) > threshold || Math.abs(bottom_coord[1]) > threshold || Math.abs(bottom_coord[2]) > threshold) {
            bottom_dist = Infinity;
        }

        // Find minimum

        var sides = [{
            name: "front",
            dist: front_dist,
            coord: front_coord
        },
        {
            name: "back",
            dist: back_dist,
            coord: back_coord
        },
        {
            name: "left",
            dist: left_dist,
            coord: left_coord
        },
        {
            name: "right",
            dist: right_dist,
            coord: right_coord
        },
        {
            name: "top",
            dist: top_dist,
            coord: top_coord
        },
        {
            name: "bottom",
            dist: bottom_dist,
            coord: bottom_coord
        },
        {
            name: "none",
            dist: Infinity,
            coord: undefined
        }
        ]

        let min = sides.reduce((obj1, obj2) => {
            return (Math.abs(obj1.dist) < Math.abs(obj2.dist)) ? obj1 : obj2;
        });


        // Determine which side(s) (up to two, cannot decide which until mouse lets go)
        let coordinates = min.coord;

        if (min.coord != undefined) {
            if (Math.abs(coordinates[0]) < 3.1 && Math.abs(coordinates[1]) < 3.1 && Math.abs(coordinates[2]) < 3.1)
                return min;
        }

        return undefined;
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