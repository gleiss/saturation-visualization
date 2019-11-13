import Viz from 'viz.js';
import {Module, render} from 'viz.js/full.render.js';

export async function runViz(dotString) {
	let viz = new Viz({Module, render});

	return viz
		.renderString(dotString, {format: 'plain'})
		.then((result) => {
		return result;
		})
		.catch((error) => {
		viz = new Viz({Module, render});
		console.error(error);
		});
};