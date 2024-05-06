require('dotenv').config();

let isProd = ['production', 'local-production'].includes(process.env.NODE_ENV);

const { 
	CE_DB_USER, 
	CE_DB_HOST,
	CE_DB_NAME,
	CE_DB_PASS,
	DB_PORT,
  } = process.env;

exports.connection = {
	database: CE_DB_NAME,
	port: DB_PORT,
	host: CE_DB_HOST,
	user: CE_DB_USER,
	password: CE_DB_PASS,
	ssl: isProd
}