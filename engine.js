class Engine {

	constructor(errorDeriv, options) {
		this.errorDeriv = errorDeriv;
		if(options) {
			this.prepFunc = options.prepFunc;
			this.learnRate = options.learnRate;
		}
		if(!this.learnRate) {
			this.learnRate = 0.1;
		}
	}

	genValues(amt, min=0, max=1) {
		this.values = new Array(amt);
		for(let i = 0; i < amt; i++) {
			this.values[i] = Math.random() * (max - min) + min;
		}
		this.newValues = new Array(amt);
	}

	setValues(values) {
		this.values = values;
		this.newValues = new Array(values.length);
	}

	solve(epochs) {
		for(let i = 0; i < epochs; i++) {
			let prep = null;
			if(this.prepFunc) {
				prep = this.prepFunc(this.values);
			}
			for(let i = 0; i < this.values.length; i++) {
				let deriv = this.errorDeriv(this.values, i, prep);
				let step = -deriv * this.learnRate;
				this.newValues[i] = this.values[i] + step;
			}
			let tmp = this.values;
			this.values = this.newValues;
			this.newValues = tmp;
		}
	}
}
module.exports = Engine;
