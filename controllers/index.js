require("dotenv").config();
const { DB } = require('../db')
const { Router } = require("express");

const loadAggValues = require('./blog/loadAgg')
const searchBlogs  = require('./blog/searchBlogs')
const filter = require('./blog/filters')

const app = () => {
	let api = Router();

	api.get('/:page_content_limit/:page', async (req, res) => {
		const { page_content_limit, page } = req.params;

		await DB.blog.tx(async t => {
			const batch = []
			
			// LOAD AGGREGATE VALUES
			batch.push(loadAggValues.main({ connection: t, req, res, page }))

			//LOAD search reasults
			batch.push(searchBlogs.main({ connection: t, req, res, page_content_limit, page }))

			//LOAD filter reasults
			batch.push(filter.main({ connection: t, req, res }))

			return t.batch(batch)
				.catch(err => console.log(err))

		})
		.then(async results => res.status(200).json(results) )
		.catch(err => res.status(500).json(err))
	})
	return api;
};

module.exports = app;