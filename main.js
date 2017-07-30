let helpers = require('./helpers')
let request = require('request')
let sqlite3 = require('sqlite3')

const options = {
	uri: 'https://m.10010.com/NumApp/NumberCenter/qryNum',
	headers: {
		'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/603.3.8 (KHTML, like Gecko) Version/10.1.2 Safari/603.3.8',
		'Accept': 'text/javascript, application/javascript, application/ecmascript, application/x-ecmascript, */*; q=0.01',
		'Referer': 'https://m.10010.com/queen/tencent/fill.html?product=0&channel=2',
	},
	qs: {
		'callback': 'jsonp_queryMoreNums',
		'provinceCode': 36,
		'cityCode': 360,
		'monthFeeLimit': 0,
		'groupKey': 60236866,
		'searchCategory': 3,
		'net': '01',
		'amounts': 200,
		'qryType': '02',
		'goodsNet': 4,
	},
}
const categoryExp = {
	'AAA': /([\d])\1{2,}/,
	'AxA': /([\d]{1})\d{3}\1$/,
	'AABB': /((\d)(?=\2)\d)(?!\1)((\d)(?=\4)\d)/,
	// 'AABBB': /([\d])\1{1,}([\d])\2{2,}/,
	// 'AABBCC': /^(?=\d*(\d)\1(\d)\2(\d)\3)1\d{10}$/,
	'ABAB': /(([\d]){1,}([\d]){1,})\1{1,}/,
	'ABxxAB': /([\d]{2})\d{2}\1$/,
	// 'ABCABC': /^(?=\d*(\d)(\d)(\d)\1\2\3)1\d{10}$/,
	// 'ABCDABCD': /^(?=\d*(\d)(\d)(\d)(\d)\1\2\3\4)1\d{10}$/,
	'ABCD': /(?:(?:0(?=1)|1(?=2)|2(?=3)|3(?=4)|4(?=5)|5(?=6)|6(?=7)|7(?=8)|8(?=9)){3,}|(?:9(?=8)|8(?=7)|7(?=6)|6(?=5)|5(?=4)|4(?=3)|3(?=2)|2(?=1)|1(?=0)){3,})\d/,
	// 'ABCDEF': /(?:(?:0(?=1)|1(?=2)|2(?=3)|3(?=4)|4(?=5)|5(?=6)|6(?=7)|7(?=8)|8(?=9)){5}|(?:9(?=8)|8(?=7)|7(?=6)|6(?=5)|5(?=4)|4(?=3)|3(?=2)|2(?=1)|1(?=0)){5})\d/,
}

// Initialize database
var numbers = []
let db = new sqlite3.Database('./numbers.sqlite')
db.run('DROP TABLE IF EXISTS `ALL`')
db.run('CREATE TABLE IF NOT EXISTS `ALL` (VALUE INTEGER)')
Object.keys(categoryExp).forEach(type => {
	db.run(`DROP TABLE IF EXISTS ${type}`)
	db.run(`CREATE TABLE IF NOT EXISTS ${type} (VALUE INTEGER)`)
})

function callback(error, response, body) {
	if (!error && response.statusCode === 200) {
		// Numbers incoming, get rid of duplicate numbers
		let newNums = eval(body).diff(numbers)
		numbers = [...numbers, ...newNums]
		console.info(new Date(), `Retrieved ${newNums.length} numbers, total => ${numbers.length}`)
		// Save numbers to database for browsing
		save('ALL', newNums)
		// Save matched numbers to database
		Object.keys(categoryExp).forEach(type => {
			save(type, newNums.filter(num => categoryExp[type].test(num)))
		})
	} else {
		console.error(error, response.statusCode)
	}
}

function jsonp_queryMoreNums(data) {
	// console.log(data.uuid)
	var numArray = []
	for (var i = 0; i < data.numArray.length; i += 12) {
		numArray.push(data.numArray[i])
	}
	return numArray;
}

function save(table, numArray) {
	if (!numArray || numArray.length <= 0) return;
	db.serialize(function() {
		db.run('BEGIN TRANSACTION')
		for (var i = 0; i < numArray.length; i++) {
			db.run(`INSERT INTO \'${table}\' VALUES (?)`, numArray[i])
		}
		db.run('COMMIT')
	})
}

// Get data periodicly
helpers.instantInterval(() => {
	request.get(options, callback)
}, 1 * 1000)
