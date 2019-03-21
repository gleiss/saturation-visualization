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

## Setup
### Requirements
This program is written in **Python 3**.
Requirements are listed in *requirements.txt* and can be installed with **Pip**:
Navigate to the root directory of the visualization and run
```
pip3 install -r requirements.txt
```

## Usage
### Generate the Output for Vampire's Saturation Run
Call Vampire with the following options:
```
--show_preprocessing on
--show_new on
--show_passive on
--show_active on
--avatar off
```
and make sure to pipe standard and error output to the output-file using `&>`.

### Run the Visualization
* Start the server by running `app.py`:
  ```
  python3 app.py
  ```
* Open a browser and go to `127.0.0.1:5000`.
* Open the output-file using the top left button.


