Array.prototype.unique = function() {
	return this.filter((elem, pos, arr) => {
		return arr.indexOf(elem) == pos;
	});
	// var payload = this.concat();
	// for(var i = 0; i < payload.length; ++i) {
	// 	for(var j = i + 1; j < payload.length; ++j) {
	// 		if(payload[i] === payload[j])
	// 			payload.splice(j--, 1);
	// 	}
	// }
	// return payload;
};

Array.prototype.diff = function(arr) {
	return this.filter(elem => arr.indexOf(elem) < 0);
}

let helpers = {
	instantInterval: (fn, delay) => {
		fn();
		return setInterval(fn, delay);
	},
}

module.exports = helpers
