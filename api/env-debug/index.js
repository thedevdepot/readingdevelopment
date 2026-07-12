const crypto = require('crypto');

module.exports = async function (context, req) {
  const value = process.env.COSMOSDB_CONNECTION_STRING || '';
  const hasValue = value.length > 0;
  const hash = hasValue ? crypto.createHash('sha256').update(value).digest('hex') : null;

  context.res = {
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    },
    body: {
      present: hasValue,
      length: value.length,
      hash,
      hasAccountEndpoint: /AccountEndpoint=/i.test(value),
      hasAccountKey: /AccountKey=/i.test(value)
    }
  };
};