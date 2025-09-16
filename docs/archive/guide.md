Navigating ARC-AGI: From Zero to One
An interactive guide to the theory, implementation, and state-of-the-art strategies for the ARC-AGI Challenge.

"Easy for Humans, Hard for AI" — The defining characteristic that makes ARC-AGI a powerful benchmark for General Intelligence.
🧠 Fluid Intelligence
🔬 Program Synthesis
🚀 Test-Time Adaptation
⚖️ Induction & Transduction
🔧 Domain-Specific Languages
🏆 Competition Ready
👋
A Note from a Fellow Beginner
Hello! Like many others, I was fascinated by the ARC-AGI challenge but found the learning curve a bit steep. I created this guide as a personal project to connect the dots for myself.
My goal is simple: to provide a single, clear starting point for newcomers by synthesizing the core concepts into one easy-to-follow narrative. If you're just starting your ARC journey, I hope this resource helps. Happy Journey!

Each task in the ARC-AGI dataset follows a consistent, structured format:
Structure: A task is defined in a JSON file and consists of a train set and a test set.
The train set contains a small number of demonstration pairs, typically 2 to 5. Each pair shows an input grid transformed into an output grid.
The test set contains one or more input grids. The objective is to infer the rule from the demonstration pairs and apply it to the test input grid(s) to produce the correct output grid(s).
Grids: The grids are two-dimensional matrices of integers from 0 to 9, where each integer represents a color. Grid sizes are capped at 30x30.
Prediction: The required output is not a simple label but a fully constructed grid of the correct size and with the correct color in every cell.
A prediction is only considered correct if it is a pixel-perfect match to the ground truth solution. A single incorrect cell results in a failed attempt. This makes ARC a highly demanding structured prediction problem, far more complex than classification or regression.

What is ARC-AGI?
The Abstraction and Reasoning Corpus for Artificial General Intelligence (ARC-AGI) is a benchmark designed to measure fluid intelligence in AI systems. Unlike traditional benchmarks that test accumulated knowledge, ARC-AGI evaluates the ability to acquire new skills when faced with novel problems.

🧩
Novel Puzzles
Each task is unique and designed to resist memorization.

⚡
Skill Acquisition
Tests the efficiency of learning new skills, not just performance.

🎯
Core Knowledge
Uses only universal cognitive primitives for fair comparison.

Part I: Foundations
The Philosophy and Design of ARC-AGI
Example of an ARC Task
Training Examples

Input

→
Output

Input

→
Output

Test

Input

→
Output?

🤔 Can you find the pattern?
The Abstraction and Reasoning Corpus for Artificial General Intelligence (ARC-AGI) is more than a benchmark; it is the manifestation of a specific, rigorous philosophy about the nature of intelligence itself. Introduced by François Chollet, it was designed to address a fundamental flaw in how the AI community measured progress.

Defining Intelligence: Beyond Skill, Towards Skill-Acquisition
The central tenet of ARC-AGI is that true, general intelligence is not demonstrated by the possession of a specific skill, but by the efficiency of acquiring new skills when faced with novel problems. This stands in stark contrast to many traditional AI benchmarks which measure performance on tasks that can be mastered through extensive training on massive datasets.

In such cases, high performance can be "bought" with sufficient data and compute, masking the system's underlying ability to generalize and adapt. An AI that achieves superhuman performance at Go has mastered Go; it has not necessarily become more intelligent in a general sense.

Chollet formalizes this concept by defining intelligence as a measure of a system's skill-acquisition efficiency over a given scope of tasks, taking into account its prior knowledge, experience, and the difficulty of generalization. ARC-AGI is the concrete application of this definition. Each task is unique and designed to be unsolvable through mere memorization or pattern matching against a training set.

To measure this skill acquisition in a controlled way, every puzzle adheres to a consistent structure. This structure, the ARC Task Format, presents a small number of examples to learn from.

Core Knowledge Priors: The Bedrock of Fair Comparison
To create a fair and meaningful comparison between human and artificial intelligence, ARC-AGI is meticulously designed to test fluid intelligence—the ability to reason, adapt, and solve novel problems—rather than crystallized intelligence, which relies on accumulated, domain-specific knowledge and cultural learning.
This distinction is critical. A benchmark that required knowledge of historical facts or the English language would unfairly favor systems (and humans) with specific pre-training, turning the test into a measure of prior exposure rather than innate reasoning ability.

ARC-AGI circumvents this by designing tasks that are solvable using only a minimal set of Core Knowledge Priors. These are fundamental, universally shared cognitive building blocks that are either innate or acquired very early in development.

Key Concept: Core Knowledge Priors
🔵 Objectness
The ability to perceive a scene in terms of discrete objects with properties like cohesion (objects move as wholes) and persistence (objects don't randomly appear or disappear).

📐 Basic Topology & Geometry
Intuitive understanding of connectivity, symmetry, inside/outside relationships, and distance.

🔢 Elementary Number Sense
Simple counting and basic integer arithmetic.

🎯 Goal-Directedness
The notion that actions are taken to achieve goals.

By restricting the required knowledge to these universally accessible primitives, ARC-AGI isolates the capacity for generalization and ensures that success reflects a system's intrinsic ability to learn, reason, and adapt. The public training set is explicitly curated to expose a test-taker to all the Core Knowledge priors needed to solve the evaluation tasks, effectively serving as a "tutorial" for the conceptual language of the ARC universe.

The Evolution to ARC-AGI-2: Raising the Bar
The introduction of ARC-AGI-2 in 2025 marks a critical evolution, driven by the progress and observed failure modes of AI systems on the original dataset. While powerful AI systems could achieve high scores on ARC-AGI-1, often through brute-force search, ARC-AGI-2 was designed to be less susceptible to these methods. Furthermore, it was specifically created to probe known weaknesses in modern AI reasoning systems.

New Conceptual Hurdles in ARC-AGI-2
Based on the failures of frontier AI models, ARC-AGI-2 introduces tasks that test for new, more complex reasoning abilities:

Symbolic Interpretation: Tasks where visual symbols must be interpreted as having semantic meaning beyond their shape, such as a shape representing an action.
Compositional Reasoning: Tasks that require discovering and applying multiple, interacting rules simultaneously.
Contextual Rule Application: Tasks where the correct rule to apply depends on the specific context within the grid, moving beyond superficial global patterns.
A Comparison of ARC-AGI-1 and ARC-AGI-2
Feature	ARC-AGI-1	ARC-AGI-2	Rationale for Change
Launch Year	2019	2025	To address limitations and challenge modern AI systems.
Primary Target	Deep Learning (Memorization)	Frontier AI Reasoning Systems	To stay ahead of AI progress and target new, complex reasoning failures.
Brute-Force Susceptibility	High	Low (by design)	To ensure scores reflect intelligent adaptation, not just computational power.
Key AI Challenges	Generalization, basic abstraction.	Symbolic Interpretation, Compositional Reasoning, Contextual Rule Application.	To probe specific, observed weaknesses in state-of-the-art reasoning systems.
Frontier AI Performance	High (e.g., ~75% for o3-preview)	Very Low (e.g., <5% for o3-preview)	To create a wider "signal bandwidth" to differentiate AI capabilities.
The ARC-AGI Ecosystem: Datasets and Evaluation
Successfully navigating the ARC-AGI challenge requires a firm grasp of its practical ecosystem, which includes a structured set of datasets, specific evaluation protocols, and a vibrant community with essential resources.

Navigating the ARC Datasets
The ARC-AGI data is partitioned into several distinct sets, each with a specific purpose. Using them correctly is crucial for both development and fair evaluation.

Overview of ARC-AGI-2 Datasets
Dataset Name	Number of Tasks	Purpose	Access	Key Considerations
Public Training	~1,000	Training algorithms, learning Core Knowledge priors.	Public	Contains easier, "curriculum-style" tasks. Use freely for development.
Public Evaluation	120	Final local evaluation of an algorithm.	Public	Do not use for iterative development. Treat as a one-shot evaluation.
Semi-Private Evaluation	120	Powers the public leaderboard on arcprize.org.	Private (Kaggle)	Used to test both open and closed-source models.
Private Evaluation	120	Official ranking for the Kaggle prize competition.	Private (Kaggle)	The ultimate test of generalization. No internet access allowed.
Understanding the Rules of the Game
Competition Rules
Evaluation Metric (pass@k): The official scoring metric is pass@k, which measures the percentage of tasks solved within k attempts. For the ARC Prize, k=2.
Kaggle Environment: All prize-eligible submissions must run within a standardized Kaggle Notebook environment with no internet access and strict runtime/hardware limits.
Open Source Requirement: To be eligible for prize money, teams must open-source their complete, reproducible solution under a permissive license.
Part II: Core Methodologies
The Evolution of ARC-AGI Approaches
⚙️
Program Synthesis
Infer explicit rules from examples

→
🧠
Neural Networks
Guide search with learned intuition

→
🚀
Test-Time Adaptation
Adapt dynamically to each task

Program Synthesis and Domain-Specific Languages (DSLs)
One of the most natural and historically significant approaches to ARC is program synthesis. This paradigm directly tackles the core of the challenge: inferring a general rule from examples.

The Power of DSLs
The primary challenge in program synthesis is the vastness of the search space. A Domain-Specific Language (DSL) is essential. A DSL is a small, specialized programming language designed for ARC, consisting of a curated set of functions, or primitives, that perform common grid operations. A good DSL must be expressive enough to solve tasks while simple enough to keep the search space manageable.

Common DSL Primitives:
rotate_grid
find_objects
mirror_object
count_colors
draw_line
shift_object

# Simplified representation of the solver for task 5521c0d9 from Hodel's arc-dsl
def solve_5521c0d9(I):
    # 1. Extract all non-background objects from the input grid 'I'.
    objs = dsl.objects(I, univalued=True, diagonal=False, without_background=True)

    # 2. Merge all extracted objects into a single 'foreground' object.
    foreground = dsl.merge(objs)

    # 3. Create a new grid by removing the foreground, leaving only the background.
    empty_grid = dsl.cover(I, foreground)

    # 4. Create a function 'offset_getter' that calculates an upward shift vector
    #    equal to an object's height. This is done by composing three functions:
    #    height -> invert -> toivec (get height, negate it, convert to vector).
    offset_getter = dsl.chain(dsl.toivec, dsl.invert, dsl.height)

    # 5. Create a function 'shifter' that takes an object and moves it.
    #    The 'fork' primitive applies the 'shift' operation, using the object
    #    itself as the first argument and the result of 'offset_getter(object)'
    #    as the second argument.
    shifter = dsl.fork(dsl.shift, dsl.identity, offset_getter)

    # 6. Apply the 'shifter' function to every object in the 'objs' list
    #    and merge the results into a single object of shifted shapes.
    shifted = dsl.mapply(shifter, objs)

    # 7. Paint the final 'shifted' object onto the 'empty_grid'.
    O = dsl.paint(empty_grid, shifted)

    return O
Complete solver from Michael Hodel's arc-dsl that shifts objects upward by their height

The Duality of Induction and Transduction
A fundamental duality in problem-solving strategies has become apparent in ARC research, formalized in the prize-winning paper by Li et al. This duality mirrors the concepts of System 1 and System 2 thinking, a popular model in cognitive science used to describe the two paths of human reasoning. Understanding this is key to building a top-tier solver, as the best solutions are ensembles that combine both approaches.

🔍 Induction (Program Synthesis)
The System 2, deliberate reasoning path. The goal is to first infer a latent, explicit program or function f that fully explains the transformation in the training examples. This program f is then applied to the test input x_test to get the prediction y_test = f(x_test). The classic DSL-based search methods described earlier are inductive.

Excels at: Tasks requiring precision, multi-step logic, compositionality, and explicit computation.

⚡ Transduction (Direct Prediction)
The System 1, intuitive path. The goal is to directly predict the test output y_test by considering the training examples (x_train, y_train) and the test input x_test all at once, without necessarily creating an explicit, intermediate program. The LLM-based Test-Time Training approaches described earlier are primarily transductive.

Excels at: Tasks relying on "fuzzy" perception, pattern completion, and holistic transformations.

The very best ARC solutions are ensembles that combine both inductive and transductive methods, mirroring the dual-process models of human cognition.
