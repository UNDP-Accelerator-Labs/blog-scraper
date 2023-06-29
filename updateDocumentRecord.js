require('dotenv').config();

const pool =  require('./db');
const { getAllDocument, updateDocumentRecord } = require('./query');
const axios = require('axios');

const DB = require('./db/index').DB

const { NLP_API_URL, API_TOKEN } = process.env;

const updateDocument = async () => {
  // fetch all document records
  const res = await DB.blog.any(getAllDocument);

  // Loop through each document and update country name
  for (let k = 0; k < res.length; k++) {
    let loc = await getDocumentCountryName(res[k]['content']);
    let lang = await getDocumentLanguage(res[k]['content']);

    //check has_lab record from the genral database
    const hasLabQuery = `
        SELECT has_lab
        FROM countries
        WHERE iso3 = $1;
      `;
    const hasLabResult = await DB.general.one(hasLabQuery, [loc?.iso3]).catch(()=> ({ has_lab : false }) );

    try{
      await DB.blog.none(updateDocumentRecord, [ 
        res[k]['id'], 
        loc?.country , 
        lang, 
        loc?.lat, 
        loc?.lng, 
        loc?.iso3, 
        hasLabResult?.has_lab
      ]);
      console.log('updating document record') 
    }
    catch(err){
      console.log("Error occurred while updating document record", err )
    };
  }

  console.log('Successfully updated all document record')

}



const getDocumentCountryName = async (content) => {
    return  axios.post(`${NLP_API_URL}/locations`, {
        token: API_TOKEN,
        input: content
      })
      .then( ({data }) => {
        let location = data['entites'][0]['location'] 
        return {
          lat: location?.lat || 0,
          lng: location?.lng || 0,
          country: location?.formatted || '',
          iso3: location?.country || null
        }
      })
      .catch( (error) => {
        console.log(error);
        return null
      });
}

const getDocumentLanguage = async (content) => {
  return  axios.post(`${NLP_API_URL}/language`, {
      token: API_TOKEN,
      input: content
    })
    .then( ({data }) => {
      return data?.languages[0]['lang'] || 'en'
    })
    .catch( (error) => {
      console.log(error);
      return null
    });
}

// updateDocument()
module.exports = updateDocument;