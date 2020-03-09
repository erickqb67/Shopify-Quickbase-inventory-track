const _ = require('lodash');
const xml2js = require('xml2js');
const request = require('request');
const { buildUrl, buildQuery, buildUrlEditRecord } = require('./queryBuilder')
const { db } = require('./shared/config')

const qbService = {

  getQuickbaseProductBySku: (sku) => {
    let parser = new xml2js.Parser();
    let filterBySku = _.isNull(sku) ? "" : sku;
    let queries = [
      "'7'.XCT.'NULL'",
      "'43'.EX.'true'"
    ];
    if (!_.isEmpty(filterBySku)) {
      queries.push(`'7'.CT.'${filterBySku}'`);
    }

    let query = buildQuery(queries);

    let url = buildUrl(`query=${query}`, null);
    return new Promise((resolve, reject) => {
      request(url, function (error, response, body) {
        parser.parseString(body, function (err, result) {
          let xmlRecords = result['qdbapi']['record'];
          if (!_.isEmpty(xmlRecords)) {
            resolve({
              rid: xmlRecords[0]['$'].rid,
              stock: xmlRecords[0]['stock'][0] || 0
            })
          } else {
            reject(err)
          }
        });
      });
    })
  },

  updateQuickbaseQty: ({ rid, stock, updateQty, lastSync = new Date() }) => {
    console.log('located ticket', db.get('setting').get('quickbase').get('ticket').value())
    let url = buildUrlEditRecord();
    var xmlData = '<qdbapi>\n' +
      '  <udata>mydata</udata>\n' +
      '  <ticket>' + `${db.get('setting').get('quickbase').get('ticket').value()}` + '</ticket>\n' +
      '  <apptoken>' + `${db.get('env').get('quickbaseAppToken').value()}` + '</apptoken>\n' +
      '  <rid>' + rid + '</rid>\n' +
      '  <field name="ShopifyProductLastSync">' + lastSync + '</field>\n';
    xmlData += ' <field name="Stock">' + ( stock + updateQty) + '</field>\n'
    xmlData += '</qdbapi>';

    request.post({
      url: url, body: xmlData,
      headers: {
        'Content-Type': 'application/xml',
        'QUICKBASE-ACTION': 'API_EditRecord'
      }
    },
      function (error, response) {
        // console.log(response)
        if (!error && response.statusCode == 200) {
          console.log(`SUCCESS UPDATE TO QUICKBASE ${rid}`)
        } else {
          console.error(`ERROR WHEN UPDATE TO QUICKBASE  ${error}`)
        }
      }
    );
  }




}


module.exports = { qbService }