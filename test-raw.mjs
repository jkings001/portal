import net from 'net';

const HOST = 'turntable.proxy.rlwy.net';
const PORT = 48844;

console.log(`Connecting to ${HOST}:${PORT}...`);

const socket = net.createConnection({ host: HOST, port: PORT });
socket.setTimeout(15000);

let connected = false;
let dataReceived = false;

socket.on('connect', () => {
  connected = true;
  console.log('TCP Connected! Waiting for MySQL greeting (up to 15s)...');
});

socket.on('data', (data) => {
  dataReceived = true;
  console.log('Data received! Length:', data.length);
  console.log('Hex (first 100):', data.slice(0, 100).toString('hex'));
  
  // MySQL greeting starts with packet length (3 bytes) + sequence (1 byte) + protocol version (1 byte = 0x0a for MySQL 4.1+)
  if (data[4] === 0x0a || data[4] === 0x0b) {
    console.log('MySQL greeting detected! Protocol version:', data[4]);
    // Extract server version string (null-terminated after byte 5)
    let versionEnd = 5;
    while (versionEnd < data.length && data[versionEnd] !== 0) versionEnd++;
    console.log('Server version:', data.slice(5, versionEnd).toString('ascii'));
  } else {
    console.log('First bytes:', data.slice(0, 20).toString('ascii').replace(/[^\x20-\x7E]/g, '.'));
  }
  socket.destroy();
});

socket.on('timeout', () => {
  console.log('Timeout! Connected:', connected, 'Data received:', dataReceived);
  console.log('The server is not sending MySQL greeting - possible firewall or proxy issue');
  socket.destroy();
});

socket.on('error', (err) => {
  console.log('Error:', err.message, err.code);
});

socket.on('close', () => {
  console.log('Connection closed');
  process.exit(0);
});
