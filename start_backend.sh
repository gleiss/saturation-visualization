#!/usr/bin/env bash
PROJ_ROOT=$PWD
Z3_PATH=~/opt/z3/build/python/
Z3_BIN=~/opt/z3m/bin/z3
git clone git@github.com:nhamlv-55/deepSpacer.git
cd deepSpacer
echo "Installing requirements"
pip3 install -r requirements.txt
echo "running the Backend server"
cd pobvis/app
export PYTHONPATH=$Z3_PATH:$PROJ_ROOT/deepSpacer/
echo $PYTHONPATH
python3 main_sat_vis.py -z3 $Z3_BIN
