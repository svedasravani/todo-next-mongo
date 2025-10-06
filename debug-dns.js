// scripts/debug-dns.js
// Usage: node scripts/debug-dns.js <cluster-host>
// Example: node scripts/debug-dns.js to-do-list.wfmsvxi.mongodb.net

const dns = require('dns').promises;
const net = require('net');

const argv = process.argv;
if (!argv[2]) {
  console.error('Usage: node scripts/debug-dns.js <cluster-host>');
  console.error('Example: node scripts/debug-dns.js to-do-list.wfmsvxi.mongodb.net');
  process.exit(1);
}

const clusterHost = argv[2];

async function tryConnect(host, port, timeout = 5000) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let done = false;

    const onResult = (success, info) => {
      if (done) return;
      done = true;
      try { socket.destroy(); } catch (e) {}
      resolve({ success, info });
    };

    socket.setTimeout(timeout);
    socket.once('error', (err) => onResult(false, `ERROR: ${err.message}`));
    socket.once('timeout', () => onResult(false, `TIMEOUT after ${timeout}ms`));
    socket.connect(port, host, () => onResult(true, `connected to ${host}:${port}`));
  });
}

(async () => {
  console.log(`\n🧭 Debugging DNS & TCP for MongoDB Atlas cluster host: ${clusterHost}\n`);

  try {
    console.log(`1) SRV lookup: _mongodb._tcp.${clusterHost}`);
    const srvRecords = await dns.resolveSrv(`_mongodb._tcp.${clusterHost}`);
    if (!srvRecords || srvRecords.length === 0) {
      console.log('   → No SRV records found.');
    } else {
      console.log(`   → Found ${srvRecords.length} SRV record(s):`);
      srvRecords.forEach((r, i) => {
        console.log(`     [${i}] target=${r.name}, port=${r.port}, priority=${r.priority}, weight=${r.weight}`);
      });
    }

    // For each SRV record, resolve and try to connect
    for (const r of srvRecords) {
      console.log(`\n2) Resolve A/AAAA for: ${r.name}`);
      try {
        const addrs = await dns.lookup(r.name, { all: true });
        addrs.forEach((a, idx) => {
          console.log(`   → [${idx}] ${a.family === 6 ? 'IPv6' : 'IPv4'}: ${a.address}`);
        });

        // Try TCP connect to each address
        for (const a of addrs) {
          const hostToTest = a.address;
          const portToTest = r.port || 27017;
          process.stdout.write(`   → Testing TCP ${hostToTest}:${portToTest} ... `);
          const res = await tryConnect(hostToTest, portToTest, 5000);
          if (res.success) console.log(`OK — ${res.info}`);
          else console.log(`FAIL — ${res.info}`);
        }
      } catch (err) {
        console.log(`   → DNS lookup failed for ${r.name}: ${err.message}`);
      }
    }

    // Also try a direct lookup of the cluster host itself
    console.log(`\n3) Direct lookup for cluster host: ${clusterHost}`);
    try {
      const hostAddrs = await dns.lookup(clusterHost, { all: true });
      hostAddrs.forEach((a, idx) => {
        console.log(`   → [${idx}] ${a.family === 6 ? 'IPv6' : 'IPv4'}: ${a.address}`);
      });

      // Test TCP to each
      for (const a of hostAddrs) {
        const hostToTest = a.address;
        const portToTest = 27017;
        process.stdout.write(`   → Testing TCP ${hostToTest}:${portToTest} ... `);
        const res = await tryConnect(hostToTest, portToTest, 5000);
        if (res.success) console.log(`OK — ${res.info}`);
        else console.log(`FAIL — ${res.info}`);
      }
    } catch (err) {
      console.log(`   → Direct lookup failed: ${err.message}`);
    }

    console.log('\n✅ Debug complete. Interpret results:\n' +
      '- If SRV lookup fails → DNS/SRV problem (wrong cluster name or DNS resolution issue).\n' +
      '- If SRV returns targets but DNS lookup of targets fails → DNS resolution issue.\n' +
      '- If DNS works but TCP tests fail → network/firewall/proxy blocking (or port blocked).\n' +
      '- If TCP succeeds but your Node driver still fails → TLS/auth issue to investigate next.\n');
  } catch (err) {
    console.error('Fatal error during debug:', err);
  }
})();
