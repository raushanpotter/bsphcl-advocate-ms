const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../data');
const storePath = path.join(dataDir, 'custom_advocates.json');

function ensureDir() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

function getStoredAdvocates() {
  try {
    ensureDir();
    if (!fs.existsSync(storePath)) return [];
    const content = fs.readFileSync(storePath, 'utf8');
    return JSON.parse(content || '[]');
  } catch (err) {
    return [];
  }
}

function saveStoredAdvocate(adv) {
  try {
    ensureDir();
    const list = getStoredAdvocates();
    const cleanEnroll = (adv.enrollmentNumber || '').trim().toUpperCase();
    const filtered = list.filter(a => (a.enrollmentNumber || '').trim().toUpperCase() !== cleanEnroll);
    filtered.push({
      name: adv.name,
      enrollmentNumber: cleanEnroll,
      mobile: adv.mobile || '',
      email: adv.email || '',
      address: adv.address || '',
      specialization: adv.specialization || 'Empanelled Advocate',
      isActive: adv.isActive !== undefined ? adv.isActive : true
    });
    fs.writeFileSync(storePath, JSON.stringify(filtered, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to persist advocate to storage:', err.message);
  }
}

function removeStoredAdvocate(enrollmentNumber) {
  try {
    ensureDir();
    const list = getStoredAdvocates();
    const cleanEnroll = (enrollmentNumber || '').trim().toUpperCase();
    const filtered = list.filter(a => (a.enrollmentNumber || '').trim().toUpperCase() !== cleanEnroll);
    fs.writeFileSync(storePath, JSON.stringify(filtered, null, 2), 'utf8');
  } catch (err) {}
}

module.exports = { getStoredAdvocates, saveStoredAdvocate, removeStoredAdvocate };
