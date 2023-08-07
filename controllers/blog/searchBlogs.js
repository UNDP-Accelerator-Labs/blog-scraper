const { searchBlogQuery } = require('./query')
const { DB } = require('../../db')

exports.main = async kwargs => {
	const conn = kwargs.connection ? kwargs.connection : DB.conn
	const { req, page, page_content_limit } = kwargs || {}

	let { search, country, type } = req.query || {}
    const searchText = search ||  '';

	return conn.task(t => {
		return t.any(searchBlogQuery(searchText, page, country, type, page_content_limit)).then(async (results) => {
			return {
				searchResults : results,
				page,
				total_pages : results[0]?.total_pages || 0,
				totalRecords : results[0]?.total_records || 0
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