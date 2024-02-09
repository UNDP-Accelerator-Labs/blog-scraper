const { searchBlogQuery } = require('./query')
const { DB } = include('db/')
const { sqlregex } = include('middleware/search')

exports.main = async kwargs => {
	const conn = kwargs.connection ? kwargs.connection : DB.conn
	const { req, page, page_content_limit } = kwargs || {}

	let { search, country, type } = req.query || {}
    const searchText = search ||  '';
	const [ formated_search, terms ] = sqlregex(searchText);

	return conn.task(t => {
		return t.any(searchBlogQuery(searchText, page, country, type, page_content_limit)).then(async (results) => {
			const data = await results.map(p=> ({
				...p,
				date: convertToDate(p),
				matched_texts: extractMatchedTexts(p, terms)
			}))

			return {
				searchResults : data,
				page,
				total_pages : data[0]?.total_pages || 0,
				totalRecords : data[0]?.total_records || 0
			}
			
		}).catch(err => {
			console.log(err);
			// NOTE recovering from any query parse errors
			return {
				searchResults : []
			}
		})
		
	})
}

const extractMatchedTexts = (searchResults, searchWords) => {
    const textToSearch = `${searchResults.title} ${searchResults.content}`;
  
    if (searchWords.length === 0) {
		const startWordIndex = textToSearch.substring(0, 100).split(/\s+/).length;
		const endWordIndex = startWordIndex + 50;
		const words = textToSearch.split(/\s+/).slice(startWordIndex, endWordIndex);
		return words.join(' ');
	}	
  
    const matchedTexts = [];
  
    for (const searchWord of searchWords) {
      const regex = new RegExp(`\\b${searchWord}\\b`, 'gi');
      const match = regex.exec(textToSearch);
  
      if (match) {
        const startWordIndex = textToSearch.substring(0, match.index).split(/\s+/).length - 26;
        const endWordIndex = startWordIndex + 50;
        const words = textToSearch.split(/\s+/).slice(startWordIndex, endWordIndex);
        const matchedText = words.join(' ');
        matchedTexts.push(matchedText);
		if(matchedTexts.length) return matchedTexts.join('')
      }
    }
  
    if (matchedTexts.length === 0) {
      const startWordIndex = textToSearch.split(/\s+/).length - 26;
      const endWordIndex = startWordIndex + 50;
      const words = textToSearch.split(/\s+/).slice(startWordIndex, endWordIndex);
      return words.join(' ');
    }
  
};

  
function convertToDate(data) {
    if (data.parsed_date instanceof Date && !isNaN(data?.parsed_date)) {
        return new Date(data.parsed_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    }
    
    if (data.posted_date instanceof Date && !isNaN(data?.posted_date)) {
        return new Date(data.posted_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    }

    if (data.posted_date_str) {
        return data.posted_date_str
    }
    
    return null;
}
