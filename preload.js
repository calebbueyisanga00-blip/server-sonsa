const { contextBridge } = require('electron');
let os, crypto;

try {
  os = require('os');
} catch (e) {
  console.warn('preload: os module not available', e && e.message);
  os = null;
}

try {
  crypto = require('crypto');
} catch (e) {
  console.warn('preload: crypto module not available', e && e.message);
  crypto = null;
}

function getDeviceInfo() {
  if (!os) {
    console.warn('⚠️ preload: os module unavailable - using fallback');
    const platform = (typeof process !== 'undefined' && process.platform) || 'unknown';
    return {
      deviceId: null,
      hostname: null,
      ipAddress: 'unknown',
      macAddress: 'unknown',
      platform,
      type: 'unknown',
      arch: (typeof process !== 'undefined' && process.arch) || 'unknown',
      _error: 'os module unavailable'
    };
  }

  try {
    const interfaces = os.networkInterfaces();
    console.log('📡 Network interfaces available:', Object.keys(interfaces));
    
    const devices = [];

    Object.entries(interfaces).forEach(([name, addrs]) => {
      if (!addrs) return;
      addrs.forEach((addr) => {
        // Skip internal/loopback interfaces
        if (addr.internal) {
          console.log(`  ↸ Skipping internal interface: ${name} (${addr.address})`);
          return;
        }
        // Accept both IPv4 and IPv6
        if (addr.family !== 'IPv4' && addr.family !== 'IPv6') {
          console.log(`  ↸ Skipping non-IP interface: ${name} (family=${addr.family})`);
          return;
        }
        console.log(`  ✓ Found ${addr.family} on ${name}: IP=${addr.address}, MAC=${addr.mac}`);
        devices.push({
          interface: name,
          ipAddress: addr.address,
          macAddress: addr.mac,
          family: addr.family,
          cidr: addr.cidr
        });
      });
    });

    if (devices.length === 0) {
      console.warn('⚠️ No network devices found! Using fallback.');
      return {
        deviceId: null,
        hostname: os.hostname(),
        ipAddress: 'unknown',
        macAddress: 'unknown',
        platform: os.platform(),
        type: os.type(),
        arch: os.arch(),
        _error: 'no network interfaces found'
      };
    }

    // Prefer IPv4, fallback to IPv6
    const primary = devices.find(d => d.family === 'IPv4') || devices[0];
    
    console.log(`✅ Primary device: ${primary.interface} - IP=${primary.ipAddress}, MAC=${primary.macAddress}`);

    const deviceId = crypto
      ? crypto.createHash('sha256').update(`${os.hostname()}-${primary.macAddress}`).digest('hex')
      : null;

    return {
      deviceId,
      hostname: os.hostname(),
      ipAddress: primary.ipAddress,
      macAddress: primary.macAddress,
      platform: os.platform(),
      type: os.type(),
      arch: os.arch()
    };
  } catch (error) {
    console.error('❌ Error in getDeviceInfo:', error);
    return {
      deviceId: null,
      hostname: os ? os.hostname() : 'unknown',
      ipAddress: 'unknown',
      macAddress: 'unknown',
      platform: os ? os.platform() : 'unknown',
      type: 'unknown',
      arch: 'unknown',
      _error: error.message
    };
  }
}

async function reportDevice(adminUrl, eventType = 'heartbeat', details = {}) {
  console.log(`📤 Reporting device to ${adminUrl}/device/report`);
  const deviceInfo = {
    ...getDeviceInfo(),
    eventType,
    details
  };
  console.log('📦 Device info:', deviceInfo);
  
  if (!deviceInfo) {
    return { success: false, error: 'Device information not available', deviceInfo };
  }
  
  try {
    const res = await fetch(`${adminUrl}/device/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(deviceInfo)
    });
    const result = await res.json();
    console.log('✅ Report sent successfully:', result);
    return result;
  } catch (error) {
    console.error('❌ Report failed:', error.message);
    return { success: false, error: error.message };
  }
}

contextBridge.exposeInMainWorld('deviceApi', {
  getDeviceInfo,
  reportDevice
});
