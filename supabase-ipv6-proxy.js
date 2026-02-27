const net = require('net');

const LOCAL_PORT = 25432;
const REMOTE_HOST = '2a05:d018:135e:168d:204:6ed4:8b68:bf26';
const REMOTE_PORT = 5432;

net.createServer(function (fromMessage) {
	const toMessage = net.createConnection({
		host: REMOTE_HOST,
		port: REMOTE_PORT,
		family: 6 // Force IPv6
	});

	fromMessage.pipe(toMessage);
	toMessage.pipe(fromMessage);

	toMessage.on('error', (err) => console.error('Supabase connection error:', err.message));
	fromMessage.on('error', (err) => console.error('Client connection error:', err.message));

}).listen(LOCAL_PORT, '0.0.0.0');

console.log(`TCP IPv4-to-IPv6 Proxy running: 0.0.0.0:${LOCAL_PORT} -> [${REMOTE_HOST}]:${REMOTE_PORT}`);
