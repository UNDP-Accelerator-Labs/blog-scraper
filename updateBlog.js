require('dotenv').config();

const DB = require('./db/index').DB
const { getAllBlogsWithNull } = require('./query');
const extractAndSaveData = require('./saveToDb');

const updateNullBlogs = async () => {
  // fetch all blogs
  const res = await DB.blog.any(getAllBlogsWithNull()).catch((err)=>  null)

  // Loop through each URL and perform a search
  for (let k = 0; k < row.length; k++) {
    console.log('Updating content ', k+1 , ' of ', res.length)
    let dbUrl = res[k]['url'];
    let id = res[k]['id'];

    await extractAndSaveData(dbUrl, id);
  }

  console.log('Successfully updated all blogs')
}

// updateNullBlogs()

module.exports = updateNullBlogs;