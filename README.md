# UNDP Website Scraper

This is an application written in Node.js that scrapes the UNDP website for published articles related to predefined keywords. The application utilizes two Postgres databases: one to save extracted articles and another to check the ISO3 code of countries and whether there is a UNDP Accelerator lab in each country. The application can be deployed/ run as an Azure function or web app expose via API. The blog scrapper runs every Sunday, 12AM.

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

    NLP_API_URL = ""
    API_TOKEN = ''
    APP_SECRET=''
    ```
5. Start the application: Run `npm start` to start the application.
6. Update blog records: To update the blog with null records, you can access the endpoint via `/update-null-blogs`.
7. Update ISO3 codes: To update the ISO3 codes of records, you can access the endpoint via `/update-iso3-codes`.
8. Extract articles for missing URLs: To extract articles of countries that do not have records in the Blog DB, you can access the endpoint via `/update-missing-countries`.
9. Update search keywords or taxonomy: Edit the `searchTerm.js` file to update the search keywords or taxonomy.
10. You can also intiate the blog scrapper via an endpoint `/initialize`.
11. Get deployed current version using the endpoint `/version`
12. Update all records with type document using the endpoint `/update-document-records`

## Create docker image locally

Run
```
make -s build
```
to build the docker image.
Use `make -s git-check` to verify that the current working copy is clean and
that no unwanted (or uncommit) files will be included in the image.

## Push docker image

Make sure to log in to azure via `make azlogin`.

Run
```
make -s build
make -s dockerpush
```
to build the image and push it to azure. Make sure to update the image in the
Deployment Center. This is only if you need to test non major version changes.
For proper deployment use the deploy functionality as described below.

## Deploying new version

Make sure to be on the master branch with a clean working copy.

Run
```
make -s deploy
```
