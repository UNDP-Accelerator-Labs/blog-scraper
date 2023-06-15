const fs = require('fs')
const express = require('express')
const extractBlogUrl = require('./extract-url');

const cron = require('node-cron');
const updateRecordsForDistinctCountries = require('./updateRecordWithIso3')
const updateNullBlogs = require('./updateBlog')
const updateMissingUrl = require('./updateMissingCountries')

const app = express()
const port = 3000

//EXPOSE THE SCRAPER VIA API
app.get('/version', (req, res) => {
  fs.readFile('version.txt', (err, data) => {
    if (err) {
      res.send('no version available');
    } else {
      res.send(data);
    }
  })
})

app.get('/initialize', (req, res) => {
  extractBlogUrl()

  res.send('The blog extract as started!')
})

app.get('/update-iso3-codes', (req,res) =>{
  updateRecordsForDistinctCountries()
  res.send('ISO3 code update of all records started!')
})

app.get(('/update-null-blogs', (req,res)=>{
  updateNullBlogs()
  res.send('Updates to blogs with null records started!')
}))

app.get(('/update-missing-countries', (req,res)=>{
  updateMissingUrl()
  res.send('Updates to blogs with missing countries started!')
}))

app.use((req, res, next) => {
  res.status(404).send(
      "<h1>Page not found on the server</h1>")
})

app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).send('Something broke!')
})

//RUN A CRON JOB 12AM EVERY SUNDAY TO EXECUTE THE SCRAPPER
cron.schedule('0 12 * * 0', () => {
  // Execute web extract function using child_process
  extractBlogUrl()
});

app.listen(port, () => {
  console.log(`app listening on port ${port}`)
})
