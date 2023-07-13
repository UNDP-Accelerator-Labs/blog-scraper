require('dotenv').config();

const DB = require('./db/index').DB
const { getAllBlogsWithNull } = require('./query');
const extractAndSaveData = require('./saveToDb');

const updateNullBlogs = async () => {
  const res = await DB.blog.any(getAllBlogsWithNull()).catch((err)=>  [])

  // Loop through each URL and perform a search
  for (let k = 0; k < res.length; k++) {
    //Log needed for debugging purposes
    console.log('Updating content ', k+1 , ' of ', res.length, " records.")

    let dbUrl = res[k]['url'];
    let id = res[k]['id'];

    await extractAndSaveData(dbUrl, id);
  }

//Log needed for debugging purposes
  console.log('Successfully updated all blogs')
}

module.exports = updateNullBlogs;