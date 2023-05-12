require('dotenv').config();

const pool =  require('./db');
const { checkUrlQuery, saveQuery, getAllBlogs } = require('./query');
const extractAndSaveData = require('./saveToDb');



const fetchALlBlogs = async () => {
  // fetch all blogs
  const res = await pool.query(getAllBlogs());

  // Loop through each URL and perform a search
  for (let k = 0; k < res.rowCount; k++) {
    
    let dbUrl = res.rows[k]['url'];
    let id = res.rows[k]['id'];

    await extractAndSaveData(dbUrl, id);
  }


}

fetchALlBlogs()

// module.exports = fetchALlBlogs;