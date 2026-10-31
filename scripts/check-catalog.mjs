import https from 'https';

https.get('https://sitesophiya.vercel.app/api/catalog?t=' + Date.now(), (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('STATUS:', res.statusCode);
    try {
      const json = JSON.parse(body);
      console.log('COUNT:', json ? json.length : 0);
      console.log('ITEMS:', JSON.stringify(json, null, 2));
    } catch (e) {
      console.log('RAW BODY:', body);
    }
  });
}).on('error', (err) => {
  console.error('ERROR:', err);
});
