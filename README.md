# UNDP Website Scraper

This is an Azure function application written in Node.js that scrapes the UNDP website for published articles related to predefined keywords. The application utilizes two Postgres databases: one to save extracted articles and another to check the ISO3 code of countries and whether there is a UNDP Accelerator lab in each country.

## Prerequisites

Before setting up the code locally, ensure you have the following prerequisites installed:

- Node.js: Make sure you have Node.js installed. You can check your version by running `node --version`.
- Azure Functions extension v1.10.4 or above for Visual Studio Code.
- Azurite: Install Azurite globally using `npm install -g azurite`. You will need it locally for Azure blob/storage simulation. Refer to [this URL](https://www.npmjs.com/package/azurite) for more information.

## Setup

To set up the application locally, follow these steps:

1. Clone the repository: `git clone https://github.com/UNDP-Accelerator-Labs/blog-scraper.git`
2. Install dependencies: Run `npm install` or `yarn install` in the project root directory.
3. Start Azurite: Run the following command to start Azurite with desired paths and logging:
    ```shell
    azurite -s -l c:\azurite -d c:\azurite\debug.log
    ```
4. Create `.env` file: Create a `.env` file in the project root directory and add the following environment variables:
    ```dotenv
    DB_USER=''
    DB_HOST=''
    DB_NAME=''
    DB_PASS=''
    DB_PORT='5432'
    production=false

    L_DB_USER='postgres'
    L_DB_HOST='localhost'
    L_DB_NAME=''
    L_DB_PASS=''

    LOGIN_DB_NAME=''
    LOGIN_DB_PORT='5432'
    LOGIN_DB_HOST='localhost'
    LOGIN_DB_USERNAME='postgres'
    LOGIN_DB_PASSWORD=''

    NODE_ENV='local'
    ```
5. Start the application: Run `npm start` to start the application.
6. Update blog records: To update the blog records, run `npm run updateRecords`.
7. Update ISO3 codes: To update the ISO3 codes of records, run `npm run updateIso3Record`.
8. Extract articles for missing URLs: To extract articles of countries that do not have records in the Blog DB, run `npm run updateMissingUrls`.
9. Update search keywords or taxonomy: Edit the `searchTerm.js` file to update the search keywords or taxonomy.

## License

This project is licensed under the [MIT License](LICENSE).
