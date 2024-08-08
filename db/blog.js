require('dotenv').config();

let isProd = ['production', 'local-production'].includes(process.env.NODE_ENV);

const { 
	DB_USER, 
	DB_HOST,
	DB_NAME,
	DB_PASS,
	DB_PORT,
  } = process.env;

exports.connection = {
	database: DB_NAME,
	port: DB_PORT,
	host: DB_HOST,
	user: DB_USER,
	password: DB_PASS,
	ssl: isProd
}