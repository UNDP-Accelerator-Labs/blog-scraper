require('dotenv').config();

const DB = require('../db/index').DB
const { getAllDocument } = require('./query');
const extractAndSaveData = require('./saveToDb');

const updateDbRecord = async (params) => {
  const { startIndex, delimeter, } = params || {};

  const res = await DB.blog.any(getAllDocument).catch((err)=>  [])

  //THIS IS A LONG LOOP, HENCE SEVER USUSALLY RUN OUT OF MEMORY
  //SET START INDEX & delimeter TO LIMIT THE RANGE OF A SINGLE RUN
  //SETTING SMALL delimeter SHOULD AVOID SERVER CRASHING AFTER RUNNING FOR A LONG TIME
  const start= startIndex ?? 0;
  const end = delimeter ?? res.length
  // Loop through each URL and perform a search
  for (let k = start; k < end; k++) {
    //Log needed for debugging purposes
    console.log('Updating content ', k, ' of ', end, " records.")

    let dbUrl = res[k]['url'];
    let id = res[k]['id'];

    if(dbUrl && id) await extractAndSaveData(dbUrl, id);
  }

//Log needed for debugging purposes
  console.log('Successfully updated all blogs')
}

module.exports = updateDbRecord;