require('dotenv').config();

let isProd = ['production', 'local-production'].includes(process.env.NODE_ENV);

const { 
	DB_USER, 
	DB_HOST,
	DB_NAME,
	DB_PASS,
	DB_PORT,
	production,
  
	L_DB_USER,
	L_DB_HOST,
	L_DB_NAME,
	L_DB_PASS,
  } = process.env;

exports.connection = {
	database: isProd ? DB_NAME : L_DB_NAME,
	port: DB_PORT,
	host: isProd ? DB_HOST : L_DB_HOST,
	user: isProd ? DB_USER : L_DB_USER,
	password: isProd ? DB_PASS : L_DB_PASS,
	ssl: isProd
}