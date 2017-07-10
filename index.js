'use strict';

const knex = require('knex')({
  dialect: 'mysql',
  connection: process.env.CLEARDB_DATABASE_URL || {
    host: process.env('DB_HOST') || '127.0.0.1',
    user: process.env('DB_USER') || 'root',
    password: process.env('DB_PASS') || 'asdf',
    database: process.env('DB_NAME') || 'vancity-housing'
  }
})

const facebookCredentials = {
  token: process.env('FB_TOKEN') || 'EAATb3SIbTagBAJEGPq9R2Kf8fBjZBfvgP3iNjouZBd3NONS49CFVKsfn7Eid6eEiuIb3ZA1JE9GVsFHOW5dQoHZBUxoSv3QrZCwKggcJYOmT51IbZB3r9sclheLm3VJiN7Nm11ZC3YLRDLz4EKYTjYKRPIGJUR9or3KQDehyibBYFiMEZCAxrJ1K',
  secret: process.env('FB_SECRET') || 'ROFLMAO'
};

const express = require('express');
const messenger = require('facebook-messenger-bot');
const Elements = messenger.Elements;
const app = express();
const bot = new messenger.Bot(facebookCredentials.token, facebookCredentials.secret);
const craigslist = require('node-craigslist');
const craigsClient = new craigslist.Client({
  baseHost: 'craigslist.ca',
  city: 'vancouver'
});

function listingDoesFitMinMax(price, min, max) {
  return price >= min && price <= max;
}

function listingPriceToFloat(priceStr) {
  let price = parseFloat(priceStr.slice(1, priceStr.length));
  if (isNaN(price)) {
    console.log('LISTING PRICE WAS NaN: ', priceStr);
    return -1;
  }
  return price;
}

const listingPayload = (listing) => ({
  text: `${listing.title} @ ${listing.location}`,
  buttons: [
    {
      text: `${listing.price}`,
      url: `${listing.url}`
    }
  ]
});

// start the craigslist crawler
setInterval(function() {
  craigsClient.list({ category: 'apa' })
    .then(async (listings) => {
      var listingIdsAsObj = listings.map((listing) => { return { listingId: listing.pid }; });
      var listingIds = listings.map((listing) => listing.pid);
      let unsavedListings = await knex('listings').whereIn('listingId', listingIds).then((col) => {
        if (col.length > 0) {
          return listingIds.filter((listingId) => !(col.includes(listingId))).map((listing) => { return { listingId: listing }; });
        }
        return col;
      });
      if (unsavedListings.length > 0) {
        await knex('listings').insert(unsavedListings);
      } else {
        await knex('listings').insert(listingIdsAsObj);
      }
      knex.select().from('users').whereNot('active', false).then((users) => {
        users.forEach(async (user) => {
          var seenListings = user.seen_listings.split(',');
          let out = null;
          let newListings = listings.filter((listing) => {
            let listingPrice = listingPriceToFloat(listing.price);
            return seenListings.includes(listing) === false && listingDoesFitMinMax(listingPrice, user.minValue, user.maxValue);
          }).sort((a, b) => {
            let aPrice = listingPriceToFloat(a.price);
            let bPrice = listingPriceToFloat(b.price);
            return a - b;
          });
          let newListingsAsAry = newListings.map(listing => listingPriceToFloat(listing.price)).sort((a, b) => {
            let aPrice = listingPriceToFloat(a);
            let bPrice = listingPriceToFloat(b);
            return a - b;
          });
          let updatedListings = seenListings.concat(newListings.map(listing => listingPriceToFloat(listing.price)));
          if (updatedListings.toString() !== seenListings.toString()) {
            await knex('users').where('id', user.id).update('seen_listings', newListingsAsAry.toString());
          }
          out = new Elements();
          out.add({ text: `Hey! I found you some new listings in-between ${user.minValue} and ${user.maxValue}.` });
          await bot.send(user.facebookId, out);
          out = new Elements();
          if (newListings.length > 10) {
            let listingCounter = 0;
            let currentOut = null;
            newListings.forEach((listing) => {
              if (listingCounter % 10 === 0 && listingCounter !== 0) {
                currentOut = out;
                bot.send(user.facebookId, currentOut);
                out = new Elements();
              }
              out.add(listingPayload(listing));
              listingCounter ++;
            })
          } else {
            newListings.forEach((listing) => {
              out.add(listingPayload(listing));
            })
          }
          if (out.length > 0) {
            await bot.send(user.facebookId, out);
          }
        });
      });
    })
    .catch((err) => console.error(err));
}, 300000) // 5 MINUTES

function addUserIfNotExists(id) {
  return knex.select().from('users').where('facebookId', id).then((collection) => {
    if (collection.length === 0) {
      return knex('users').insert({ facebookId: id, created_at: knex.fn.now(), updated_at: knex.fn.now() }).then((updatedCollection) => {
        return knex.select().from('users').where('id', updatedCollection[0])
      });
    }
    return collection[0];
  });
}

function updateUserMinMax(id, min, max) {
  return knex('users').where('facebookId', id).update({
    minValue: min,
    maxValue: max,
    active: true,
    updated_at: knex.fn.now()
  });
}

bot.on('message', async message => {
  const { text, sender } = message
  const fbUser = await bot.fetchUser(sender.id, 'first_name,last_name', true);
  const priceRange = /(\d) and (\d)/i
  const stopCmd = /stop|fuck off/ig
  addUserIfNotExists(sender.id).then( async (user) => {
    let out = null;
    if (stopCmd.test(text)) {
      out = new Elements();
      out.add({ text: 'Okay, you will receive no more updates regarding apartments in Vancouver. :)' });
      knex('users').where('id', user.id).update('active', false).then(async () => await bot.send(user.facebookId, out));
    } else if (priceRange.test(text)) {
      let textAry = text.split(' and ')
      let minValue = parseFloat(textAry[0])
      let maxValue = parseFloat(textAry[1])
      if (minValue < 0) {
        out = new Elements();
        out.add({ text: 'Housin\' ain\'t cheap. yo.' });
        await bot.send(user.facebookId, out);
        return;
      }
      if (maxValue > 6000.00) {
        out = new Elements();
        out.add({ text: 'You should probably see a real-estate agent... That price is too high.'})
        await bot.send(user.facebookId, out);
        return;
      }
      if (minValue > maxValue) {
        updateUserMinMax(user.facebookId, maxValue, minValue).then(async () => {
          out = new Elements();
          out.add({ text: `Fantastic ${fbUser.first_name}! I will let you know about apartments/housing in Vancouver between $${minValue} and $${maxValue}` })
          await bot.send(user.facebookId, out);
        });
      } else {
        updateUserMinMax(user.facebookId, minValue, maxValue).then(async () => {
          out = new Elements();
          out.add({ text: `Fantastic ${fbUser.first_name}! I will let you know about apartments/housing in Vancouver between $${minValue} and $${maxValue}` })
          await bot.send(user.facebookId, out);
        });
      }
    } else {
      out = new Elements();
      out.add({ text: 'You can start getting alerts about housing in Vancouver by typing your minimum price range, and maximum priceRange. Type "stop" to stop being updated on new listings.' });
      await bot.send(user.facebookId, out);
    }
  });
});

bot.on('postback', async (event, message, data) => {
  const { sender } = message;
  let out = null;
  if (data.action === 'GET_STARTED') {
    out = new Elements();
    out.add({ text: "Hey! I'm your ex-premier of pasta, Shristy Smark! I want to help you find housing in Vancouver, BC. To start, please enter a price range ex: \"650 and 1300\"." });
    await bot.send(sender.id, out);
  }
})

app.use('/facebook', bot.router());
app.listen(3000, () => {
  console.log('Listening on 3000')
  knex.schema.createTableIfNotExists('users', (table) => {
    table.increments('id');
    table.string('facebookId');
    table.integer('minValue');
    table.integer('maxValue');
    table.boolean('active', true);
    table.text('seen_listings', '');
    table.timestamps(true, true);
  }).then((table) => console.log('created users table'));
  knex.schema.createTableIfNotExists('listings', (table) => {
    table.increments('id');
    table.string('listingId');
    table.timestamps(true, true);
  }).then((table) => console.log('created listings table'));
});