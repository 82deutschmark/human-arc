/**DATE: September 13, 2025
 * AUTH: Gemini 2.5 Pro
 * Single Source of Truth for Assessment Puzzles
 * ============================================
 * This file contains the definitive list of puzzle IDs used in the user assessment.
 * Both the assessment interface and the comparison page use this constant to ensure consistency.
 */

export const ASSESSMENT_PUZZLE_IDS = [

  'e7dd8335', // Easy answer, fill the bottom half of the symmetrical shape
  'fc754716', // Make the outline whatever the dot is
  'a699fb00', // Connect the dots
  'ea786f4a',  // Make an X
  
  '66e6c45b',   // Expand!
  
];

/*
'00576224', //  2x2 -> 6x6 baseline test that is easy to understand but complex to do because it will require frequent color switching
'b15fca0b', //  5x5 draw a line to connect them!
'1e32b0e9', //  17x17 You are shown the shape to draw in the upper left, draw it using the color/emoji of the grid lines in each 3x3 box and do not remove any existing elements there 
'239be575', //  8x6 -> 1x1 where you need to learn carefully from examples 
'0d3d703e', //  3x3 where you need to learn replacements from examples
'22425bda',   // 16x16 -> 1x6  Shortest to longest? Think of them as strings, the bottom string has priority order in the output.  Or is it shortest to longest? This is particularly challenging because there are two possible solutions when using this logic and only one will be correct.  That is why two attempts are always required.
'dc1df850',    //  Surround the specific cell
'27a28665',    // 7 Examples, 3 Tests!
'3bdb4ada',  //  Make a little dot in each
'e7639916',    //  Connect the dots! Large!
'12eac192', //   8x8 and very confusing with complex rules...
'3aa6fb7a', //   Simple 7x7, make the shape a square by filling in the missing bit.
'0bb8deee',    //  Corral the shapes
'32e9702f',    //  Easy answer, everything pulled to the left and change 0 to 5 
'639f5a19', //   Big looks like Simon game 23x23

'7b80bb43', //  Close the gates!  Very Large and unusual size
'1caeab9d', //  Line them up!
'87ab05b8', //  2/Red Fills up whatever quarter of the 4x4 grid it appears in, the rest remain 6
'bc1d5164',    //  5x7 -> 3x3 where the grid is a rectangle, where a set of 2x2 grids are divided, solve by welding.
'd23f8c26' //  Extract the middle column 
*/
