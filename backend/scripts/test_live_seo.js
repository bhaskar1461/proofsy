const https = require('https');

https.get('https://proofsy.tech/', (res) => {
  let body = '';
  res.on('data', c => body += c);
  res.on('end', () => {
    const match = body.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    if (match) {
      console.log('JSON-LD Schema Successfully Extracted & Validated:');
      const schema = JSON.parse(match[1]);
      console.log('Graph Nodes:', schema['@graph'].map(node => `${node['@type']} (${node.name || node['@id']})`));
    } else {
      console.log('No JSON-LD schema found');
    }
  });
});
