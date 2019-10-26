#  Saturation Visualization for Vampire

This tool visualizes Saturation Runs of Vampire, with the main aim to let a user **quickly** answer the following questions:
* Which consequences are derived?
  * Which of the consequences we anticipated were derived?
  * Which other interesting consequences were derived?
  * Which proof was found by Vampire?
* Why didn’t we derive a certain clause?
  * Forgot to add some trivial fact to the encoding
  * Ordering doesn’t allow inference
  * Weight is to big for clause to be selected
  * ...
  
There are three modes:
* **Proof:** Run Vampire on the problem. If a proof is found, visualize it.
* **Saturation:** Run Vampire on the problem. Visualize the whole saturation attempt.
* **Manual Clause Selection:** Run Vampire on the problem, but interactively decide in each step which clause Vampire should explore next.

## Running the visualization
### Step 1: Install and run a Vampire Server
Described at https://github.com/gleiss/server-vampire

The Vampire Server is used as backend by the Saturation Visualization.

### Step 2: Access the Saturation Visualization
https://gleiss.github.io/saturation-visualization/

The Saturation Visualization communicates with the Vampire Server on localhost:5000.
