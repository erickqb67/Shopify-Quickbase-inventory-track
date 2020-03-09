const { qbService } = require('./qbService');


const orderPaidControl = async (ctx) => {
  const { payload: { line_items } } = ctx.state.webhook;
  for (let item of line_items) {
    const { sku, quantity } = item;
    const { rid, stock } = await qbService.getQuickbaseProductBySku(sku);
    console.log('========= PAID ==========')
    console.log('stock', stock)
    console.log('update quantity', quantity)
    qbService.updateQuickbaseQty({
      rid, stock: parseInt(stock), updateQty: 0 - parseInt(quantity)
    })
  }
}

module.exports = {
  orderPaidControl
}