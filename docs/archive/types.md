### 40 ARC-AGI Transformation Types with Implementation Instructions
##  Author:  Unknown AI
#   Beware of logical errors.



**GEOMETRIC TRANSFORMATIONS**

1. **Horizontal Reflection**
   - Mirror the grid left-to-right: `output[i][j] = input[i][n-1-j]`

2. **Vertical Reflection**
   - Mirror the grid top-to-bottom: `output[i][j] = input[n-1-i][j]`

3. **90° Clockwise Rotation**
   - Rotate quarter turn right: `output[j][n-1-i] = input[i][j]`

4. **180° Rotation**
   - Half turn: `output[n-1-i][n-1-j] = input[i][j]`

5. **270° Clockwise Rotation**
   - Three-quarter turn right: `output[n-1-j][i] = input[i][j]`

6. **Primary Diagonal Reflection**
   - Flip across top-left to bottom-right: `output[j][i] = input[i][j]`

7. **Secondary Diagonal Reflection**
   - Flip across top-right to bottom-left: `output[n-1-j][n-1-i] = input[i][j]`

8. **Translation/Shift**
   - Move all elements by fixed offset (dx,dy), wrap around edges

9. **Scaling Up**
   - Each cell becomes 2x2 block: `output[2*i][2*j] = input[i][j]`

10. **Scaling Down**
    - Sample every other cell (or average 2x2 blocks if needed)

**PATTERN OPERATIONS**

11. **Pattern Completion**
    - Identify repeating sequence, fill 0s (or a specific value in a discernible pattern) with missing values 

12. **Pattern Extension**
    - Continue established pattern beyond boundaries

13. **Pattern Repetition**
    - Tile identified sub-pattern across entire grid

14. **Sequence Increment**
    - Add fixed value to each non-zero cell: `if input[i][j] != 0: output[i][j] = (input[i][j] + k) % 10`

15. **Symmetry Completion**
    - Mirror partial pattern to create full symmetric design

16. **Checkerboard Alternation**
    - Place values in alternating positions: `if (i+j)%2 == 0: output[i][j] = val1`

17. **Spiral Shift**
    - Move each value one position along spiral path

18. **Radial Distance Pattern**
    - Assign values based on Manhattan distance from center

19. **Diagonal Fill**
    - Fill diagonals with incrementing values

20. **Grid Subdivision**
    - Divide into sub-grids, apply different value to each

**LOGICAL OPERATIONS**  REMEMBER THAT THE PUZZLES APPEAR AS SYMBOLS NOT NUMBERS!! MUST BE SOLVABLE IF THE USER DOESN'T SEE NUMBERS!! 

21. **AND Operation (Binary Presence)** REMEMBER THAT THE PUZZLE WILL APPEAR AS SYMBOLS NOT NUMBERS!! MUST BE SOLVABLE IF THE USER DOESN'T SEE NUMBERS!! Be creative and don't only use 0 or 1!  
    - `output[i][j] = 1 if (input1[i][j] != 0 AND input2[i][j] != 0) else 0`

22. **OR Operation (Binary Union)** REMEMBER THAT THE PUZZLE WILL APPEAR AS SYMBOLS NOT NUMBERS!! MUST BE SOLVABLE IF THE USER DOESN'T SEE NUMBERS!! 
    - `output[i][j] = 1 if (input1[i][j] != 0 OR input2[i][j] != 0) else 0`

23. **XOR Operation (Exclusive Presence)** REMEMBER THAT THE PUZZLE WILL APPEAR AS SYMBOLS NOT NUMBERS!! MUST BE SOLVABLE IF THE USER DOESN'T SEE NUMBERS!! 
    - `output[i][j] = input1[i][j] if input2[i][j] == 0 else (input2[i][j] if input1[i][j] == 0 else 0)`

24. **NOT Operation (Inversion)** REMEMBER THAT THE PUZZLE WILL APPEAR AS SYMBOLS NOT NUMBERS!! MUST BE SOLVABLE IF THE USER DOESN'T SEE NUMBERS!! 
    - `output[i][j] = 1 if input[i][j] == 0 else 0`

25. **Value Matching** REMEMBER THAT THE PUZZLE WILL APPEAR AS SYMBOLS NOT NUMBERS!! MUST BE SOLVABLE IF THE USER DOESN'T SEE NUMBERS!! 
    - `output[i][j] = 1 if input[i][j] == target_value else 0`

26. **Neighbor Count** REMEMBER THAT THE PUZZLE WILL APPEAR AS SYMBOLS NOT NUMBERS!! MUST BE SOLVABLE IF THE USER DOESN'T SEE NUMBERS!! 
    - `output[i][j] = count of non-zero neighbors`

27. **Majority Value** REMEMBER THAT THE PUZZLE WILL APPEAR AS SYMBOLS NOT NUMBERS!! MUST BE SOLVABLE IF THE USER DOESN'T SEE NUMBERS!! 
    - Cell takes most common non-zero value among neighbors

28. **Maximum Filter** REMEMBER THAT THE PUZZLE WILL APPEAR AS SYMBOLS NOT NUMBERS!! MUST BE SOLVABLE IF THE USER DOESN'T SEE NUMBERS!! 
    - `output[i][j] = max(input[i][j], neighbors)`

29. **Modulo Arithmetic** REMEMBER THAT THE PUZZLE WILL APPEAR AS SYMBOLS NOT NUMBERS!! MUST BE SOLVABLE IF THE USER DOESN'T SEE NUMBERS!! 
    - `output[i][j] = input[i][j] % k` for some constant k

30. **Value Replacement**
    - Replace all occurrences of value A with value B

**SPATIAL FILTERING**

31. **Border Extraction**
    - Keep only perimeter cells, interior becomes 0 or a specific value in a discernible pattern

32. **Interior Extraction**
    - Keep only non-border cells, perimeter becomes 0 or a specific value in a discernible pattern

33. **Corner Marking**
    - Mark corner positions with specific value

34. **Cross Extraction**
    - Keep only center row and column

35. **Diamond Mask**
    - Keep values within diamond shape from center

36. **Frame Only**
    - Zero out interior, keep outer frame

37. **Diagonal Lines**
    - Keep only main and/or anti-diagonal values

38. **Quadrant Isolation**
    - Keep only specified quadrant, others to 0 or a specific value in a discernible pattern

39. **Distance-Based Filter**
    - Keep values within specific distance from center

40. **Flood Fill**
    - Starting from seed point, fill connected region of same value

**Implementation Notes for AI System:**
- Use 0 as background/empty
- Values 1-9 represent different states (display as emojis to user)
- All operations work on numeric values only
- Transformations must be deterministic and position-based
- No semantic interpretation of values