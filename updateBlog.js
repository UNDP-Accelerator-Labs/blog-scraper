require('dotenv').config();

const pool =  require('./db');
const { checkUrlQuery, getAllBlogsWithNull, getAllBlogs } = require('./query');
const extractAndSaveData = require('./saveToDb');



const fetchALlBlogs = async () => {
  // await pool.connect();
  // fetch all blogs
  const res = await pool.query(getAllBlogsWithNull());

  // Loop through each URL and perform a search
  for (let k = 0; k < res.rowCount; k++) {
    console.log('Updating content ', k+1 , ' of ', res.rowCount)
    let dbUrl = res.rows[k]['url'];
    let id = res.rows[k]['id'];

    await extractAndSaveData(dbUrl, id);
  }

  console.log('Successfully updated all blogs')
}

fetchALlBlogs()

// module.exports = fetchALlBlogs;