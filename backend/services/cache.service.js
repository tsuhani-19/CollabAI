// filepath: /c:/Users/LENOVO/my-node-project/chatapp/backend/services/cache.service.js
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 86400 }); // TTL of 24 hours

cache.on('set', (key, value) => {
    console.log(`Cache set: ${key}`);
});

cache.on('del', (key) => {
    console.log(`Cache deleted: ${key}`);
});

export default cache;