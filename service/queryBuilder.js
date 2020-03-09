const low = require('lowdb')
const envConfig = require("./shared/config");
const fileSync = require('lowdb/adapters/FileSync')
const { DB_NAME } = require('./shared/constant')
const adapter = new fileSync(DB_NAME);
const dbQuickbase = low(adapter);
var _ = require('lodash');
const request = require('request');
const xml2js = require('xml2js');
const moment = require('moment')


const config = {
  url: dbQuickbase.get('env').get('quickbaseUrl').value(),
  token: envConfig.QUICKBASE.APP_TOKEN,
  userToken: envConfig.QUICKBASE.USER_TOKEN,
  username: dbQuickbase.get('env').get('quickbaseUsername').value(),
  password: dbQuickbase.get('env').get('quickbasePassword').value(),
  ticket: {
    name: "ticket_name",
    expire: "ticket_expired"
  },
  url_get_ticket: dbQuickbase.get('env').get('quickbaseUrlTicket').value(),
  guidance: {
    login: dbQuickbase.get('env').get('quickBaseGuidanceLogin').value(),
    password: dbQuickbase.get('env').get('quickBaseGuidancePassword').value(),
  }
};

const createQuickbaseTicket = (force) => {

  let quickbase = dbQuickbase.get('setting').get('quickbase');
  let ticket = quickbase.get('ticket').value();
  let expire = quickbase.get('expire').value();

  if (_.isEmpty(ticket) || moment(expire) < moment() || force) {
    let url = buildUrlGetTicket();

    let parser = new xml2js.Parser();

    request.post(url, function (error, response, body) {

      parser.parseString(body, function (err, result) {
        ticket = '';
        if (result) {
          ticket = result['qdbapi']['ticket'].toString();
          expire = moment().add(3, 'hour');
        }
        quickbase.assign({ ticket, expire }).write();
      });
    });
  }
  return ticket;
}



const buildUrl = function (query, baseUrl = null, ticket = null, token = null) {
  if (!baseUrl) {
    baseUrl = config.url;
  }
  if (!ticket) {
    ticket = createQuickbaseTicket()
  }
  if (!token) {
    token = config.token;
  }
  return `${baseUrl}?a=API_DoQuery&includeRids=1&clist=a&keepData=1&usertoken=${config.userToken}&apptoken=${token}&udata=mydata&${query}`;
};

const buildUrlGetTicket = function () {
  return `${config.url_get_ticket}?a=API_Authenticate&username=${config.username}&password=${config.password}&hours=12`
};
const buildUrlGetGuidanceTicket = function () {
  // logger.info(``)
  return `${config.url_get_ticket}?a=API_Authenticate&username=${config.guidance.username}&password=${config.guidance.password}&hours=12`
};

const buildUrlEditRecord = function () {
  return `${config.url}`;
};

const buildUrlQueryCount = function (query) {
  // let ticket  = dbQuickbase.get('setting').get('quickbase').get('ticket').value();
  return `${config.url}?a=API_DoQueryCount&includeRids=1&clist=a&keepData=1&usertoken=${config.userToken}&apptoken=${config.token}&udata=mydata&${query}`;
};

const buildQuery = function (queries) {
  let arr = queries.map(function (item) {
    return `{${item}}`
  });
  return _.join(arr, 'AND');
};




module.exports = {
  buildUrl, buildUrlGetTicket, buildUrlGetGuidanceTicket, buildUrlEditRecord, buildUrlQueryCount, buildQuery
}