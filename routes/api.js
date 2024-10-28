'use strict';
const StockModel = require('../db.js').Stock;
const axios = require('axios');

module.exports = function (app) {
  app.route('/api/stock-prices').get(async function (req, res) {
    const { stock, like } = req.query;

    try {
      // Handle multiple stock case
      if (Array.isArray(stock)) {
        const stockDataPromises = stock.map(async (stockSymbol) => {
          const response = await axios.get(`https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${stockSymbol}/quote`);
          const { symbol, latestPrice } = response.data;
          let foundStock = await StockModel.findOne({ symbol }).exec();
          if (!foundStock) {
            foundStock = new StockModel({ symbol, likes: like ? [req.ip] : [] });
            await foundStock.save();
          } else {
            if (like && !foundStock.likes.includes(req.ip)) {
              foundStock.likes.push(req.ip);
              await foundStock.save();
            }
          }
          return {
            stock: symbol,
            price: latestPrice,
            likes: foundStock.likes.length,
          };
        });

        const stockData = await Promise.all(stockDataPromises);

        const relLikes = stockData.map(stock => stock.likes);
        const result = stockData.map((data, index) => ({
          ...data,
          rel_likes: relLikes[index] - (relLikes[index === 0 ? 1 : 0] || 0),
        }));

        return res.json({ stockData: result });
      }

      // Handle single stock case
      const response = await axios.get(`https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${stock}/quote`);
      const { symbol, latestPrice } = response.data;

      if (!symbol) {
        return res.json({ stockData: { likes: like ? 1 : 0 } });
      }

      let oneStockData = await StockModel.findOne({ symbol }).exec();
      if (!oneStockData) {
        oneStockData = new StockModel({ symbol, likes: like ? [req.ip] : [] });
        await oneStockData.save();
      } else {
        if (like && !oneStockData.likes.includes(req.ip)) {
          oneStockData.likes.push(req.ip);
          await oneStockData.save();
        }
      }

      return res.json({
        stockData: {
          stock: symbol,
          price: latestPrice,
          likes: oneStockData.likes.length,
        },
      });
    } catch (error) {
      console.error('Error fetching stock data:', error);
      return res.status(500).json({ error: 'Unable to fetch stock price' });
    }
  });
};
