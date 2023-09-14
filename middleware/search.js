let findAND = /\sAND\s/dgi
let findOR = /\sOR\s|\s?\,\s?/dgi
let findPhrase = /(?<=(^|\s))\"[\w\d\*\s\']+\"(?=(\s|$))/dgi
const fNest = /[\(\)\"\w\d\*\']+(\sor)?\s\(+[\"\w\d\*\s\'\(]+\)+/dgi

function prepStr (_str = '') {
	const max = ([..._str.matchAll(findPhrase)]?.length ?? 0) - 1

	function findPhrases (_i = 0) {
		let [ start, end ] = [..._str.matchAll(findPhrase)][_i].indices[0]
		_str = `${_str.slice(0, start)}${_str.slice(start, end).replace(/\s/g, '__')}${_str.slice(end)}`
		if (_i < max) findPhrases(_i + 1)
	}
	if (max > -1) findPhrases()
	return _str.replace(/\sAND\s/gi, ' ').replace(/\s+/, ' ').replace(/\"/g, '')
}

function completeStr (_str) {
	const max = (_str.match(findOR)?.length ?? 0) - 1

	function helper (_i = 0) {
		let [ start, end ] = [..._str.matchAll(findOR)][_i].indices[0]
		let addParentheses = false
		// LOOK BEHIND FOR 'OR' OR '('
		const behind = _str.slice(0, start).split(/\s/)
		if (!/\bor\b/i.test(behind[behind.length - 2])) {
			if (behind[behind.length - 1].charAt(0) !== '('
				&& behind[behind.length - 1].charAt(behind[behind.length - 1].length - 1) !== ')'
			) {
				const insertidx = _str.indexOf(behind[behind.length - 1])
				_str = `${_str.slice(0, insertidx)}(${_str.slice(insertidx)}`
				end ++ // THIS IS BECAUSE WE ADD ONE CHARACTER TO THE ORIGINAL STRING
				addParentheses = true
			}
		}
		// LOOK FORWARD FOR 'OR' OR '('
		const forward = _str.slice(end).split(/\s/)
		if (addParentheses === true) {
			if (!/\bor\b/i.test(forward[1])) {
				if (forward[0].charAt(0) !== '('
					&& forward[0].charAt(forward[0].length - 1) !== ')'
				) {
					const insertidx = end + forward[0].length
					_str = `${_str.slice(0, insertidx)})${_str.slice(insertidx)}`
				} else {
					const insertidx = [..._str.matchAll(/\)/dg)].find(d => d.index >= end + forward[0].length).index

					const parenthesesgroup = _str.slice(end, insertidx + 1).split(/\s/)
					if (!parenthesesgroup.find(d => /\bor\b/i.test(d))) {
						_str = `${_str.slice(0, end)}${parenthesesgroup.join(' ').replace(/[\(\)]/g, '')})${_str.slice(end + parenthesesgroup.join(' ').length)}`
					} else {
						_str = `${_str.slice(0, insertidx)})${_str.slice(insertidx)}`
					}
				}
			} else {
				let prev = false
				let next = false
				let idx = 1
				while (idx < forward.length - 1) {
					prev = /\bor\b/i.test(forward[idx])
					next = /\bor\b/i.test(forward[idx + 1]) || forward[idx + 1].charAt(forward[idx + 1].length - 1) === ')' //&& /\bor\b/i.test(forward[idx + 2])
					if (!prev && !next) break
					else idx ++
				}
				let allORs = false
				forward.slice(0, idx + 1).forEach((d, i) => {
					if (Math.abs(i % 2) == 1) allORs = /\bor\b/i.test(d)
				})


				if (idx === forward.length - 1) {
					_str = `${_str.slice(0, end)}${forward.slice(0, idx + 1).join(' ').replace(/[\(\)]/g, '')})`
				} else {
					if (allORs) {
						_str = `${_str.slice(0, end)}${forward.slice(0, idx + 1).join(' ').replace(/[\(\)]/g, '')})${_str.slice(end + forward.slice(0, idx + 1).join(' ').length)}`
					} else {
					 	if (forward[0].charAt(0) === '(' && forward[idx].charAt(forward[idx].length - 1) === ')') {
							_str = `${_str.slice(0, end)}${forward.slice(0, idx + 1).join(' ').replace(/[\(\)]/g, '')})${_str.slice(end + forward.slice(0, idx + 1).join(' ').length)}`
						} else {
							const insertidx = end + forward.slice(0, idx + 1).join(' ').length
							_str = `${_str.slice(0, insertidx)})${_str.slice(insertidx)}`
						}
					}
				}
			}
		}
		if (_i < max) helper(_i + 1)
	}
	if (max > -1) helper()
	return _str
}

function findNests (_str) {
	function helper (_substr) {
		const nests = _substr.match(fNest)
	 	return nests.reverse().map(d => {

			let outer = d.slice(0, d.indexOf('(')).trim()
			let inner = d.slice(d.indexOf('(') + 1, d.length - 1).trim()


			if (fNest.test(inner)) {
				const innernests = helper(inner)
				innernests.reverse().forEach(c => {
					const s = d.indexOf(c.source)
					const e = s + c.source.length
					const replacement = `${d.slice(0, s)}${c.target}${d.slice(e)}`
					inner = replacement.slice(replacement.indexOf('(') + 1, replacement.length - 1).trim()
				})
			}

			let str = ''
			if (/\bOR\b/gi.test(inner)) { // JOIN OR STATEMENT
				if (!/\bOR\b/gi.test(outer)) {
					str = inner.split(/\bOR\b/gi).map(c => `${outer} ${c.trim()}`.trim()).join(' OR ').trim()
				} else {
					str = `${outer} ${inner}`.trim()
				}
			}

			return { source: d, target: str }
		})
	}

	if (fNest.test(_str)) {
		const newsubstrs = helper(_str)
		newsubstrs.reverse().forEach(c => {
			const s = _str.indexOf(c.source)
			const e = s + c.source.length

			if (/OR\s?$/i.test(_str.slice(0, s))) { // DO NOT ADD PARENTHESES
				_str = `${_str.slice(0, s)}${c.target}${_str.slice(e)}`
			} else _str = `${_str.slice(0, s)}(${c.target})${_str.slice(e)}`
		})
	}

	// FINISH BY COMPLETING PARENTHESES SCHEME FOR ALL INDIVIDUAL TERMS
	const uniqueterms = [..._str.matchAll(/\b[\w\d\*\']+\b\*?/gi)]
	uniqueterms.reverse().forEach(d => {
		// CHECK IF TERM IS PRECEEDED BY THE SAME NUMBER OF OPENING AND CLOSING PARENTHESES
		// IF YES, THEN IT IS IN A GROUP
		// OTHERWISE PUT IT IN ITS OWN GROUP
		const behind = _str.slice(0, d.index)
		const openParentheses = behind.match(/\(/g)?.length || 0
		const closeParentheses = behind.match(/\)/g)?.length || 0
		if (openParentheses === closeParentheses) _str = `${_str.slice(0, d.index)}(${d[0]})${_str.slice(d.index + d[0].length)}`
	})

	const words = _str.match(/(?<=\()[\w\d\*\s\']+(?=\))/gi);
	if (words !== null) {
		_str = words.map(d => {
			return `(${d.split(/\bor\b/gi).map(c => `(${c.trim()})`).join(' ')})`
		}).join(' ');
	} else {
		_str = '()';
	}

	return _str
}

function jsonify (_str) {
	_str = JSON.parse(`[${_str.replace(/\s?\bor\b/gi, '').replace(/\(/g, '[').replace(/\)/g, ']').replace(/\b(?!\*)/g, '"').replace(/\b\*/g, '*"').replace(/\s+/g, ',')}]`)
	return _str
}

function cartesian (_arr) {
	// https://stackoverflow.com/questions/15298912/javascript-generating-combinations-from-n-arrays-with-m-elements
	const r = []
	const max = _arr.length - 1

	function helper (arr, i) {
		for (let j = 0; j < _arr[i].length; j++) {
			const a = arr.slice(0) // clone arr
			a.push(_arr[i][j])
			if (i === max) r.push(a.flat().join(' '))
			else helper(a, i + 1)
		}
	}
	helper([], 0)
	return r
}

function resetQuotes (_arr) {
	return _arr.map(d => {
		return d.split(/\s/g).map(c => {
			if (/\_\_/g.test(c)) return `"${c.replace(/\_\_/g, ' ')}"`
			else return c
		})//.join(' ')
	})
}

exports.sqlregex = (_data, _language) => { // DO SOMETHING HERE FOR RTL LANGUAGES
	let m = '\\m' // WORD BOUNDARIES
	let M = '\\M'
	if (_language === 'AR') {
		m = '(^|[^\u0621-\u064A])'
		M = '($|[^\u0621-\u064A])'
	}

	const terms = resetQuotes(cartesian(jsonify(findNests(completeStr(prepStr(_data))))))

	const query = terms.map(d => {
		return `^${d.map(c => {
			if (c.charAt(0) !== '-') { // POSITIVE LOOKAHEAD
				// WE NEED TO REMOVE ANY QUOTE MARKS
				c = c.replace(/\"+/g, '')
				if (c.charAt(c.length - 1) === '*') return `(?=.*${m}${c.slice(0, -1)})`
				else if (c.charAt(0) === '#') return `(?=.*(^|[^\\w#])${c}($|[^\\w#]))`
				else return `(?=.*${m}${c}${M})`
			}
			else { // NEGATIVE LOOKAHEAD
				c = c.replace(/\"+/g, '')
				if (c.charAt(c.length - 1) === '*') return `(?!.*${m}${c.slice(1, -1)})`
				else if (c.charAt(0) === '#') return `(?!.*(^|[^\\w#])${c}($|[^\\w#]))`
				else return `(?!.*${m}${c.substr(1)}${M})`
			}
		}).join('')}.*$`
	})
	return `(${query.join('|')})`
}

