const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Advocate = require('../models/Advocate');

async function seedAll(quiet = false) {
  const log = (...args) => { if (!quiet) console.log(...args); };

  // 1. Seed Admin
  const adminUser = (process.env.ADMIN_USERNAME || 'admin').toLowerCase();
  let admin = await User.findOne({ username: adminUser });
  if (!admin) {
    admin = await User.create({
      name: process.env.ADMIN_NAME || 'System Administrator',
      username: adminUser,
      password: process.env.ADMIN_PASSWORD || 'Admin@123456',
      role: 'ADMIN',
      department: 'Central Administration',
      email: 'admin@bsphcl.bih.nic.in',
      isActive: true
    });
    log('✓ Admin account created:', adminUser);
  } else {
    log('Admin account already exists:', adminUser);
  }

  // 2. Seed Default Department Users for immediate testing
  const demoUsers = [
    {
      name: 'Ramesh Sharma (HR)',
      username: 'hr_officer',
      password: 'Hr@123456',
      role: 'HR',
      department: 'Human Resources & Establishment',
      email: 'hr@bsphcl.bih.nic.in',
      phone: '9835011111'
    },
    {
      name: 'Vikramaditya Singh (Legal)',
      username: 'legal_head',
      password: 'Legal@123456',
      role: 'LEGAL',
      department: 'BSPHCL Holding Legal Cell',
      email: 'legal@bsphcl.bih.nic.in',
      phone: '9835022222'
    },
    {
      name: 'Anil Kumar Jha (GM)',
      username: 'gm_approval',
      password: 'Gm@123456',
      role: 'GM',
      department: 'General Management',
      email: 'gm@bsphcl.bih.nic.in',
      phone: '9835033333'
    },
    {
      name: 'Sunil Verma (Accounts)',
      username: 'accounts_officer',
      password: 'Accounts@123456',
      role: 'ACCOUNTS',
      department: 'Accounts & Finance Department',
      email: 'accounts@bsphcl.bih.nic.in',
      phone: '9835044444'
    },
    {
      name: 'Accounts Section (Disbursement)',
      username: 'accounts_dept',
      password: 'Accounts@123456',
      role: 'ACCOUNTS',
      department: 'Accounts & Finance Department',
      email: 'accounts.dept@bsphcl.bih.nic.in',
      phone: '9835044445'
    }
  ];

  for (const u of demoUsers) {
    const exists = await User.findOne({ username: u.username.toLowerCase() });
    if (!exists) {
      await User.create(u);
      log(`✓ Seeded ${u.role} user: ${u.username}`);
    }
  }

  // 3. Permanently remove legacy demo advocates from the database
  const legacyDemoNames = [
    'Adv. Arvind Kumar Sinha',
    'Adv. Priya Ranjan Prasad',
    'Adv. Sunita Kumari',
    'Arvind Kumar Sinha',
    'Priya Ranjan Prasad',
    'Sunita Kumari'
  ];
  const legacyDemoEnrollments = ['BR/1024/2012', 'BR/2155/2015', 'BR/3410/2018'];
  await Advocate.deleteMany({
    $or: [
      { name: { $in: legacyDemoNames } },
      { enrollmentNumber: { $in: legacyDemoEnrollments } }
    ]
  });

  // 4. Ensure official empanelled advocates exist
  const officialAdvocates = [
    {
      name: 'Ms. Saumya Poddar',
      enrollmentNumber: 'BR/128/2026',
      mobile: '',
      email: '',
      address: '',
      specialization: 'High Court & Commercial Law',
      isActive: true,
      createdBy: admin._id
    },
    {
      name: 'Mr. Vishal Saurabh',
      enrollmentNumber: '30/2006',
      mobile: '9709379933',
      email: 'saurabhv31@gmail.com',
      address: 'Bahadurpur Housing Colony, Near T.V Tower, Patna-800026',
      specialization: 'Civil & Electricity Matters',
      isActive: true,
      createdBy: admin._id
    },
    {
      name: 'Shreyashi Raj',
      enrollmentNumber: 'BR/1912/2023',
      mobile: '7058147964',
      email: 'shreyashi.raj485@gmail.com',
      address: 'Harding Road, Kranti Marg, Patna-800001',
      specialization: 'Legal Advisory & Corporate Litigations',
      isActive: true,
      createdBy: admin._id
    },
    {
      name: 'Miss. Aishwarya Shankar',
      enrollmentNumber: 'BR 1723/2023',
      mobile: '7667544674',
      email: 'aishwarya1409@gmail.com',
      address: 'Shankar Bhawan, Dwarka Nath Lane, Salimpur Ahra, Kadamkuan Patna-800003',
      specialization: 'Constitutional & Regulatory Law',
      isActive: true,
      createdBy: admin._id
    },
    {
      name: 'Mr. Arijeet Shukla',
      enrollmentNumber: 'D/26/2020',
      mobile: '9886789419',
      email: 'arijeet.shukla@gmail.com',
      address: '',
      specialization: 'Arbitration & Contract Dispute',
      isActive: true,
      createdBy: admin._id
    },
    {
      name: 'Mr. Kumar Saurav',
      enrollmentNumber: 'D/2902/2019',
      mobile: '9572362255',
      email: 'saurav.15@hotmail.com',
      address: 'Manu Apartments, Mayur Vihar Phase I, New Delhi-110091',
      specialization: 'Appellate & Tribunal Representation',
      isActive: true,
      createdBy: admin._id
    }
  ];

  for (const advData of officialAdvocates) {
    const cleanEnroll = advData.enrollmentNumber.trim().toUpperCase();
    const existing = await Advocate.findOne({
      $or: [
        { enrollmentNumber: cleanEnroll },
        { enrollmentNumber: advData.enrollmentNumber }
      ]
    });

    if (!existing) {
      await Advocate.create(advData);
      log(`✓ Seeded advocate: ${advData.name} (${advData.enrollmentNumber})`);
    } else {
      let changed = false;
      if (!existing.mobile && advData.mobile) { existing.mobile = advData.mobile; changed = true; }
      if (!existing.email && advData.email) { existing.email = advData.email; changed = true; }
      if (!existing.address && advData.address) { existing.address = advData.address; changed = true; }
      if (changed) {
        await existing.save();
        log(`✓ Updated details for advocate: ${existing.name}`);
      }
    }
  }

  // 5. Restore any user-created advocates persisted across server restarts
  try {
    const { getStoredAdvocates, saveStoredAdvocate } = require('../utils/advocateStore');
    // Ensure the 6 official advocates are also in local persistent store
    officialAdvocates.forEach(a => saveStoredAdvocate(a));

    const customAdvocates = getStoredAdvocates();
    for (const cAdv of customAdvocates) {
      const cleanEnroll = (cAdv.enrollmentNumber || '').trim().toUpperCase();
      const existing = await Advocate.findOne({
        $or: [
          { enrollmentNumber: cleanEnroll },
          { enrollmentNumber: cAdv.enrollmentNumber }
        ]
      });
      if (!existing) {
        await Advocate.create({
          name: cAdv.name,
          enrollmentNumber: cleanEnroll,
          mobile: cAdv.mobile || '',
          email: cAdv.email || '',
          address: cAdv.address || '',
          specialization: cAdv.specialization || 'Empanelled Advocate',
          isActive: cAdv.isActive !== undefined ? cAdv.isActive : true,
          createdBy: admin._id
        });
        log(`✓ Restored persistent custom advocate: ${cAdv.name} (${cleanEnroll})`);
      }
    }
  } catch (storeErr) {
    console.warn('Persistent store sync warning:', storeErr.message);
  }

  // 6. Restore any persistent bills and payments across server restarts
  try {
    const { restoreStoredBills } = require('../utils/billStore');
    await restoreStoredBills(admin);
  } catch (billStoreErr) {
    console.warn('Persistent bills sync warning:', billStoreErr.message);
  }

  return { admin };
}

// Standalone execution
if (require.main === module) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
      console.log('Connected to MongoDB for seeding');
      await seedAll(false);
      console.log('Seed completed successfully!');
      await mongoose.disconnect();
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seed connection error:', err.message);
      process.exit(1);
    });
}

module.exports = { seedAll };
