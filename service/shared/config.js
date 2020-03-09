// Imports
const low = require('lowdb');
const fileSync = require('lowdb/adapters/FileSync');
const { DB_NAME } = require('../shared/constant');
const  dotenv = require('dotenv') ;

// Load .env
dotenv.config();

const adapter = new fileSync(DB_NAME);
module.exports =  {
  QUICKBASE: {
    REALM: 'dmitryshats',
    DBID:'bqbk59eqm',
    APP_TOKEN:'cqxhus9dn3hg7fb6umnat9nqygv',
    USER_TOKEN:'b5cnjs_mtv6_by3v2rdcw6ni7mdj4sutab2mzpwd',
  },
  SHOPIFY: {
    API_VERSION: '/admin/api/2019-10',
    APP: process.env.SHOPIFY_APP,
    API_KEY: process.env.SHOPIFY_API_KEY,
    API_SECRET: process.env.SHOPIFY_API_SECRET,
    GRAPHQL_URL: `https://${process.env.SHOPIFY_APP}/api/2019-10/graphql.json`
  },
  db:low(adapter)
};
