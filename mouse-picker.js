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
        this.context = undefined;
        this.ray = undefined;
    }

    update_view(program_state) {
        this.view_matrix = program_state.camera_inverse;
    }

    update_context(context) {
        this.context = context;
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
                this.ray = vec4(2*this.mouse.from_center[0] / this.width, -2*this.mouse.from_center[1] / this.height, -1, 1);  
                // Convert to Eye to World coordinates
                const eye_coords = Mat4.inverse(this.projection_matrix).times(this.ray);
                this.ray =  vec(eye_coords[0], eye_coords[1], -1, 0);
                const world_coords = Mat4.inverse(this.view_matrix).times(this.ray);
                // Convert back to right hand
                const mirrored_coords = Mat4.scale(1, 1, -1).times(world_coords);
                this.ray = vec(mirrored_coords[0], mirrored_coords[1], mirrored_coords[2]).normalized();
        });
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

    check_closest_face(position) {
        this.get_mouse_ray(this.context.canvas);
        let ray = this.ray;

        const cube_radius = 3;

        let front_dist = (position[2] + cube_radius) / ray[2];
        let back_dist = (position[2] - cube_radius) / ray[2];
        let right_dist = (position[0] - cube_radius) / ray[0];
        let left_dist = (position[0] + cube_radius) / ray[0];
        let top_dist = (position[1] - cube_radius) / ray[1];
        let bottom_dist = (position[1] + cube_radius) / ray[1];

        // Do not take into account intersections with planes that are off the cube
        const front_coord = ray.times(front_dist).plus(position)[2] === -3 ? ray.times(front_dist).plus(position) : ray.times(-front_dist).plus(position);
        const back_coord = ray.times(back_dist).plus(position)[2] === 3 ? ray.times(front_dist).plus(position) : ray.times(-front_dist).plus(position);
        const right_coord = ray.times(right_dist).plus(position)[0] === -3 ? ray.times(right_dist).plus(position) : ray.times(-right_dist).plus(position);
        const left_coord = ray.times(left_dist).plus(position)[0] === 3 ? ray.times(left_dist).plus(position) : ray.times(-left_dist).plus(position);
        const top_coord = ray.times(top_dist).plus(position)[1] === 3 ? ray.times(top_dist).plus(position) : ray.times(-top_dist).plus(position);;
        const bottom_coord = ray.times(bottom_dist).plus(position)[1] === -3 ? ray.times(bottom_dist).plus(position) : ray.times(-bottom_dist).plus(position);

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

        const threshold = 3.0;
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
        return (Math.abs(obj1.dist) < Math.abs(obj2.dist)) ? obj1: obj2;
    });


    // Determine which side(s) (up to two, cannot decide which until mouse lets go)
    let coordinates = min.coord;
    console.log(min.name);

    if(min.coord != undefined){
        if (coordinates[0] < -1) {
            console.log("left");
        } else if (coordinates[0] < 1) {
            console.log("center");
        } else {
            console.log("right");
        }

        if (coordinates[1] < -1) {
            console.log("bottom");
        } else if (coordinates[1] < 1) {
            console.log("center");
        } else {
            console.log("top");
        }
     
        if (coordinates[2] < -1) {
            console.log("front");
        } else if (coordinates[2] < 1) {
            console.log("center");
        } else {
            console.log("back");
        }
        console.log(min);

        if(Math.abs(coordinates[0]) < 3.1 && Math.abs(coordinates[1]) < 3.1 && Math.abs(coordinates[2])< 3.1) {
            return min;
    }
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