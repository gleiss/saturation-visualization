# How to run
We need 3 components to run this:

* A customed Z3 version (to dump the trace in the format the Backend expects)

[https://github.com/nhamlv-55/z3/tree/vis](https://github.com/nhamlv-55/z3/tree/vis)

* The Backend (the included script will clone the Backend for you)

[https://github.com/nhamlv-55/deepSpacer](https://github.com/nhamlv-55/deepSpacer)

* The Frontend (this repo)

## Setup and run the frontend
`./start_frontend.sh`

Running this script will serve the frontend at [http://localhost:3000](http://localhost:3000).

Note that even if the browser is popped up, the compilation process is still running, so it will take a while.

## Setup and run the backend
Edit the `start_backend.sh` to use your correct `$Z3_PATH` and `$Z3_BIN`. Then run 
`./start_backend.sh`

Running this script will serve the backend at localhost:5000. The frontend should point to this backend.

If using other port, change this line in `visualization-frontend/src/components/App.tsx`

`        const fetchedJSON = await fetch(mode === "manualcs" ? 'http://localhost:5000/spacer/startmanualcs' : 'http://localhost:5000/spacer/start', {`

