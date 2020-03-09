import config from "./config";
const QuickBase  = require('quickbase');

export const quickbaseInstance = new QuickBase({
  realm: config.QUICKBASE.REALM,
  userToken: config.QUICKBASE.USER_TOKEN
})

export default { quickbaseInstance }
