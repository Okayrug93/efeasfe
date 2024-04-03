const savePixels = require('save-pixels');
const getPixels = require('get-pixels');
const ndarray = require('ndarray');
const fs = require('fs');

const Engine = require('./engine');

let WIDTH;
let HEIGHT;

const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];
const TARGETS = [1, 1, 1, 1];

function mod(a, b) {
	return ((a % b) + b) % b;
}

let difMap = [];
getPixels('fox.png', (error, pixels) => {
	if(error) console.error(error);
	WIDTH = pixels.shape[0];
	HEIGHT = pixels.shape[1];
	for(let x = 0; x < WIDTH; x++) {
		for(let y = 0; y < HEIGHT; y++) {
			for(let j = 0; j < DIRS.length; j++) {
				let dir = DIRS[j];
				let nx = mod(x + dir[0], WIDTH);
				let ny = mod(y + dir[1], HEIGHT);
				let dif = Math.abs(pixels.get(x, y, 0) - pixels.get(nx, ny, 0)) ** 2;
				dif += Math.abs(pixels.get(x, y, 1) - pixels.get(nx, ny, 1)) ** 2;
				dif += Math.abs(pixels.get(x, y, 2) - pixels.get(nx, ny, 2)) ** 2;
				difMap.push(Math.sqrt(dif) / 256);
				
			}
		}
	}
	getPixels('apples.png', (error, pixels) => {
		if(error) console.error(error);
		let values = [];
		for(let x = 0; x < WIDTH; x++) {
			for(let y = 0; y < HEIGHT; y++) {
				values.push(pixels.get(x, y, 0) / 256);
			}
		}
		run(values);
		
	});
	
});

function getTarget(values, index) {
	let targ = 0;
	let bx = Math.trunc(index / HEIGHT);
	let by = index % HEIGHT;
	for(let dir of DIRS) {
		let x = mod(bx + dir[0], WIDTH);
		let y = mod(by + dir[1], HEIGHT);
		let i = x * HEIGHT + y;
		targ += values[i];
	}
	return targ / 4;
}

function errorFunc(values) {
	let sum = 0;
	for(let i = 0; i < values.length; i++) {
		let sq = values[i] * values[i];
		if(sq > 1) {
			sum += sq - 1;
		}
		let bx = Math.trunc(i / HEIGHT);
		let by = i % HEIGHT;
		for(let j = 0; j < DIRS.length; j++) {
			let dir = DIRS[j];
			let target = TARGETS[j];
			let x = mod(bx + dir[0], WIDTH);
			let y = mod(by + dir[1], HEIGHT);
			let ind = x * HEIGHT + y;
			let dif = Math.abs(values[ind] - values[i]) - target * difMap[i * 4 + j];
			sum += dif * dif;
		}
	}
	return sum;
}

function errorDeriv(values, index, prep) {
	let bx = Math.trunc(index / HEIGHT);
	let by = index % HEIGHT;
	let deriv = 0;
	let abs = Math.abs(values[index]);
	if(abs > 1) {
		deriv += 2 * values[index];
	}
	for(let j = 0; j < DIRS.length; j++) {
		let dir = DIRS[j];
		let target = TARGETS[j];
		let x = mod(bx + dir[0], WIDTH);
		let y = mod(by + dir[1], HEIGHT);
		let i = x * HEIGHT + y;
		let dif = values[index] - values[i];
		deriv += 2 * dif - target * difMap[index * 4 + j] * 2 * Math.sign(dif);
	}
	return deriv;
}

function prepFunc(values) {
	for(let i = 0; i < values.length; i++) {
		let x = Math.trunc(i / HEIGHT);
		let y = i % HEIGHT;
	}
}

function approxDeriv(values, index, prep) {
	values[index] -= 1e-8;
	let dif = prep - errorFunc(values);
	values[index] += 1e-8;
	return dif * 1e8;
}

function run(values) {
	let engine = new Engine(errorDeriv);
	engine.setValues(values);
	let start = Date.now();
	let loops = 100;
	for(let i = 0; i < loops; i++) {
		engine.solve(100);
		console.log(`${i + 1}%`); // this was commented out for the test so it didn't spam
	}
	console.log(`Time: ${Date.now() - start}ms`);
	console.log(`Error post-solving: ${errorFunc(engine.values)}`);
	for(let i = 0; i < engine.values.length; i++) {
		engine.values[i] = (engine.values[i] + 1) * 128;
	}
	savePixels(ndarray(new Float64Array(engine.values), [WIDTH, HEIGHT]), 'png')
		.pipe(fs.createWriteStream('out.png'));
}
