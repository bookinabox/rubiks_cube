# Rubik's Cube - CS 174a Group 21
This project emulates a Rubik's cube in the browser. Each of the six sides can be rotated around their axes through **mouse picking** as well as using manual commands using the control panel.
In order to use mouse picking, click on one of the **sides** of on of the sides (dragging along the center piece will not rotate it as the center pieces are stationary). Drag the mouse toward the direction you want to rotate then release your mouse. The mouse picking works best when the screen is close to parallel with the face of the cube.

The sides can also be manually rotated through buttons. "R" and "Shift+R" rotate the "right" side of the cube (orientation is determined from the viewer's starting position) in counterclockwise and clockwise fashion respectively. Similarly, "L" and "Shift+L" rotate the left side, "U"/"Shift+U" rotate the  "Up" side, "D"/"Shift+D" rotate the "Down" side and "F"/"F+Shift" rotate the front side, and "B"/"B+Shift" rotate the back side.

Additionally, pressing "s" will shuffle the cube randomly and "Shift+S" will solve the cube.

Using the mouse, the user can also rotate around the cube to view the different sides.

The code can be run like all other project codes by starting a server by running the host.bat file and opening the localhost on port 8000 on the browser.

## Contributors
Derek Lee - Mouse picking, creating the cubes, texturing the cubes, implementing rotations.

Vishal Narayan - Shuffling function, adding buttons, initial idea.

Keshav Nambiar - Helping with rotation functions, debugging.

## Image Credits
The only image used was the thumbnail, which is a public domain image from https://www.publicdomainpictures.net/en/view-image.php?image=362271&picture=rubiks-cube

