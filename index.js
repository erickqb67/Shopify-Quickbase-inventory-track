require('isomorphic-fetch');
const functions = require("firebase-functions")
const next = require('next');
const  dotenv = require('dotenv') ;
const Koa = require('koa');
const { default: createShopifyAuth } = require('@shopify/koa-shopify-auth');
const { verifyRequest } = require('@shopify/koa-shopify-auth');
const session = require('koa-session');
const { default: graphQLProxy } = require('@shopify/koa-shopify-graphql-proxy');
const { ApiVersion } = require('@shopify/koa-shopify-graphql-proxy');
const Router = require('koa-router');
const { receiveWebhook, registerWebhook } = require('@shopify/koa-shopify-webhooks');
const { orderPaidControl } = require('./service/orderPaid.control')
const port = parseInt(process.env.PORT, 10) || 3000;
var dev = process.env.NODE_ENV !== 'production'
var app = next({
  dev
})
const handle = app.getRequestHandler();
const {
  SHOPIFY_API_SECRET_KEY,
  SHOPIFY_API_KEY,
  HOST,
} = process.env

 app.prepare().then(() => {
  const server = new Koa();
  const router = new Router();
  server.use(session({ sameSite: 'none', secure: true }, server));
  server.keys = [SHOPIFY_API_SECRET_KEY];

  server.use(
    createShopifyAuth({
      apiKey: SHOPIFY_API_KEY,
      secret: SHOPIFY_API_SECRET_KEY,
      scopes: ['read_orders', 'write_orders', 'read_products', 'write_products', 'write_inventory', 'read_inventory', 'read_locations'],
      async afterAuth(ctx) {
        const { shop, accessToken } = ctx.session;
        console.log('located access token', accessToken)
        ctx.cookies.set("shopOrigin", shop, {
          httpOnly: false,
          secure: true,
          sameSite: 'none'
        });

        const regOrderPaid = await registerWebhook({
          address: `${HOST}/webhooks/orders/paid`,
          topic: 'ORDERS_PAID',
          accessToken,
          shop,
          apiVersion: ApiVersion.October19
        });
        if (regOrderPaid.success) {
          console.log('Successfully registered order paid webhook!');
        } else {
          console.log('Failed to register webhook', JSON.stringify(regOrderPaid.result, null, 4));
        }

        const regRefund = await registerWebhook({
          address: `${HOST}/webhooks/refunds/create`,
          topic: 'REFUNDS_CREATE',
          accessToken,
          shop,
          apiVersion: ApiVersion.October19
        });

        if (regRefund.success) {
          console.log('Successfully registered Refund webhook!');
        } else {
          console.log('Failed to register webhook', JSON.stringify(regRefund.result, null, 4));
        }
      }
    })
  );

  const webhook = receiveWebhook({ secret: SHOPIFY_API_SECRET_KEY });

  router.post('/webhooks/orders/paid', webhook, orderPaidControl);

  server.use(graphQLProxy({ version: ApiVersion.April19 }));

  router.get('*', verifyRequest(), async (ctx) => {
    await handle(ctx.req, ctx.res);
    ctx.respond = false;
    ctx.res.statusCode = 200;
  });

  server.use(router.allowedMethods());
  server.use(router.routes());

  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});

