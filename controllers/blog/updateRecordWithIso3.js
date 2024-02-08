require('dotenv').config();
const { DB } = include("/db");

// Helper function to update records in DB1
async function updateRecords(country, iso3, hasLab, lat, lng) {
  try {
    const updateQuery = `
      UPDATE articles
      SET iso3 = $1, has_lab = $2, lat = $4, lng = $5
      WHERE country = $3;
    `;
    await DB.blog.none(updateQuery, [iso3, hasLab, country, lat, lng]);
  } catch (error) {
    console.error(`Error updating records for ${country} in Blog DB:`, error);
  }
}

// Main function to update records for all distinct countries in DB1
async function updateRecordsForDistinctCountries() {
  try {
    const distinctCountriesQuery = `
      SELECT DISTINCT country
      FROM articles;
    `;
    const countries = await DB.blog.any(distinctCountriesQuery);
    
    for (const country of countries) {

      const countryNameQuery = `
        SELECT iso3
        FROM country_names
        WHERE $1 LIKE CONCAT('%', name, '%');
      `;
      const iso3Result = await DB.general.any(countryNameQuery, [country.country]).catch(()=> ({ iso3 : null }));

      const hasLabQuery = `
        SELECT has_lab, lat, lng
        FROM countries
        WHERE iso3 = $1;
      `;
      const hasLabResult = await DB.general.one(hasLabQuery, [iso3Result?.[0]?.iso3]).catch(()=> ({ has_lab : false }) );
      
      await updateRecords(country.country, iso3Result?.[0]?.iso3, hasLabResult.has_lab, hasLabResult.lat, hasLabResult.lng);
    }
    
    console.log('All records updated successfully.');
  } catch (error) {
    console.error('Error updating records:', error);
  } 
}

// Call the main function to start the process
// updateRecordsForDistinctCountries();
module.exports = updateRecordsForDistinctCountries;
