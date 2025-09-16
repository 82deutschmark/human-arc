# Puzzle Test Cases Reference
Just some puzzles I found useful
This document contains a JSON array of test puzzles used for development and debugging.

## Available Test Cases

```json
[
  {
    "id": "87ab05b8",
    "name": "4x4 Basic Test",
    "description": "Simple 4x4 puzzle for basic functionality testing",
    "difficulty": "easy",
    "gridSize": { "height": 4, "height": 4 },
    "testCount": 1,
    "dataPath": "data/training2/87ab05b8.json",
    "tags": ["basic", "small-grid", "quick-test"]
  },
  {
    "id": "be03b35f",
    "name": "Standard Test Puzzle",
    "description": "Reliable test case for general testing",
    "difficulty": "easy",
    "gridSize": { "height": 5, "width": 5 },
    "exampleCount": 3,
    "testCount": 1,
    "dataPath": "data/evaluation/be03b35f.json",
    "tags": ["standard", "balanced"]
  },
  {
    "id": "9aaea919",
    "name": "Maximum Size Test",
    "description": "Tests grid size limits and performance",
    "exampleCount": 3,
    "difficulty": "hard",
    "gridSize": { "height": 30, "width": 30 },
    "testCount": 1,
    "dataPath": "data/evaluation2/9aaea919.json",
    "tags": ["performance", "large-grid", "stress-test"]
  },
  {
    "id": "27a28665",
    "name": "Multi-Test Challenge",
    "description": "Requires 3 tests to complete, 3x3 grid reduced to 1x1",
    "exampleCount": 7,
    "difficulty": "Hard",
    "gridSize": { "height": 3, "width": 3 },
    "testCount": 3,
    "dataPath": "data/training2/27a28665.json",
    "tags": ["multi-test", "challenge"]
  },
  {
    "id": "d35bdbdc",
    "name": "10x10 Test Suite",
    "description": "10x10 grid with multiple test cases very complex",
    "difficulty": "impossible",
    "gridSize": { "height": 10, "width": 10 },
    "testCount": 3,
    "dataPath": "data/evaluation2/d35bdbdc.json",
    "tags": ["evaluation", "medium-grid", "multi-test"]
  },
  {
    "id": "d631b094",
    "name": "Number Connection Puzzle",
    "description": "Connect matching numbers with lines that don't cross",
    "difficulty": "medium",
    "gridSize": { "height": 3, "width": 3 },
    "testCount": 1,
    "dataPath": "data/training2/d631b094.json",
    "tags": ["training"],

  },
  {
    "id": "7b80bb43",
    "name": "Gate Closing",
    "description": "Close the gates, eliminate the noise",
    "difficulty": "impossible",
    "gridSize": { "height": 29, "width": 17 },
    "testCount": 1,
    "dataPath": "data/training2/d631b094.json",
    "tags": ["training"],
    
    },
    {
      "id": "17cae0c1",
      "name": "Map each distinct arrangement of 5s inside a 3×3 block to a unique colour; paint the whole block with that colour."
      "description": "Map each distinct arrangement of 5s inside a 3×3 block to a unique colour; paint the whole block with that colour."
      "difficulty": "some ai get it"
      "gridSize": { "height": "3", "width": "9" },
      "testCount": "1",
      "dataPath": "",
      "tags": ["map to unique, paint whole block"],

  
    },
    {
      "id": "4cd1b7b2",
      "name": "Look at Example 2!!",
      "description": "Look at Example 2!!",
      "difficulty": "some ai get it, but for the wrong reason"
      "gridSize": { "height": "4", "width": "4" },
      "exampleCount": 3,
      "testCount": "1",
      "dataPath": "",
      "tags": [""],



  
    },
    {
      "id": "32e9702f",
      "name": "Everything gets pulled to the left 1 space",
      "description": "Look at Example 2!!",
      "difficulty": "some ai get it, but for the wrong reason"
      "gridSize": { "height": "10", "width": "10" },
      "exampleCount": 3,
      "testCount": "1",
      "dataPath": "",
      "tags": [""],



    },

]
```

## Usage in Code
None, reference for designer only.
