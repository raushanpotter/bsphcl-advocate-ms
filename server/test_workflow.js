const assert = require('assert');

const API = 'http://localhost:5000/api';

async function request(endpoint, options = {}) {
  const url = `${API}${endpoint}`;
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const res = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

async function runTests() {
  console.log('=== STARTING BSPHCL WORKFLOW TEST SUITE ===\n');
  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`[PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`[FAIL] ${name}:`, err.message);
      failed++;
    }
  }

  let adminToken, hrToken, legalToken, gmToken, accountsToken;
  let testAdvocateId;
  let testBillId;

  // Test 1: Admin logs in successfully
  await test('1. Admin logs in successfully', async () => {
    const res = await request('/auth/login', {
      method: 'POST',
      body: { username: 'admin', password: 'Admin@123456' }
    });
    assert.strictEqual(res.data.success, true);
    assert.ok(res.data.token);
    assert.strictEqual(res.data.user.role, 'ADMIN');
    adminToken = res.data.token;
  });

  // Test 2: Admin authenticates department roles
  await test('2. Admin authenticates department roles (HR, Legal, GM, Accounts)', async () => {
    const hrRes = await request('/auth/login', { method: 'POST', body: { username: 'hr_officer', password: 'Hr@123456' } });
    hrToken = hrRes.data.token;
    assert.strictEqual(hrRes.data.user.role, 'HR');

    const legalRes = await request('/auth/login', { method: 'POST', body: { username: 'legal_head', password: 'Legal@123456' } });
    legalToken = legalRes.data.token;
    assert.strictEqual(legalRes.data.user.role, 'LEGAL');

    const gmRes = await request('/auth/login', { method: 'POST', body: { username: 'gm_approval', password: 'Gm@123456' } });
    gmToken = gmRes.data.token;
    assert.strictEqual(gmRes.data.user.role, 'GM');

    const accRes = await request('/auth/login', { method: 'POST', body: { username: 'accounts_officer', password: 'Accounts@123456' } });
    accountsToken = accRes.data.token;
    assert.strictEqual(accRes.data.user.role, 'ACCOUNTS');
  });

  // Test 3: HR adds an advocate
  await test('3. HR adds a new advocate', async () => {
    const uniqueEnrollment = `BR/TEST/${Date.now().toString().slice(-5)}`;
    const res = await request('/advocates', {
      method: 'POST',
      headers: { Authorization: `Bearer ${hrToken}` },
      body: {
        name: 'Adv. Test Kumar',
        enrollmentNumber: uniqueEnrollment,
        mobile: '9876500000',
        email: 'test.advocate@bsphcl.test',
        address: 'High Court Road, Patna',
        specialization: 'Civil & Electricity Matters'
      }
    });
    assert.strictEqual(res.data.success, true);
    assert.ok(res.data.data._id);
    assert.ok(res.data.data.advocateId);
    testAdvocateId = res.data.data._id;
  });

  // Test 4: HR registers a bill
  await test('4. HR registers a bill in system', async () => {
    const res = await request('/bills', {
      method: 'POST',
      headers: { Authorization: `Bearer ${hrToken}` },
      body: {
        advocate: testAdvocateId,
        originalBillNumber: `INV-${Date.now().toString().slice(-4)}`,
        billDate: '2026-11-01',
        submissionDate: '2026-11-20',
        claimedAmount: 50000,
        courtCaseNumber: 'CWJC No. 8945/2024',
        courtName: 'Patna High Court',
        caseDescription: 'Tariff dispute between distribution licensee and industrial consumer',
        department: 'SBPDCL Legal Cell',
        remarks: 'Certified court attendance slip attached'
      }
    });
    assert.strictEqual(res.data.success, true);
    assert.ok(res.data.data._id);
    assert.ok(res.data.data.billId.startsWith('BSPHCL/ABM/'));
    assert.strictEqual(res.data.data.status, 'DRAFT');
    assert.strictEqual(res.data.data.claimedAmount, 50000);
    testBillId = res.data.data._id;
  });

  // Test 5: HR submits it to Legal
  await test('5. HR submits bill to Legal Department', async () => {
    const res = await request(`/hr/bills/${testBillId}/submit`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${hrToken}` }
    });
    assert.strictEqual(res.data.success, true);

    const billRes = await request(`/bills/${testBillId}`, {
      headers: { Authorization: `Bearer ${hrToken}` }
    });
    assert.strictEqual(billRes.data.data.bill.status, 'HR_SUBMITTED');
    assert.strictEqual(billRes.data.data.bill.currentStage, 'LEGAL');
  });

  // Test 6: Legal verifies it
  await test('6. Legal verifies bill and forwards to GM', async () => {
    const res = await request(`/legal/bills/${testBillId}/verify`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${legalToken}` },
      body: {
        legalRemarks: 'Verified case orders and attendance. Rates are verified as per BSPHCL fee schedule.'
      }
    });
    assert.strictEqual(res.data.success, true);

    const billRes = await request(`/bills/${testBillId}`, {
      headers: { Authorization: `Bearer ${legalToken}` }
    });
    assert.strictEqual(billRes.data.data.bill.status, 'LEGAL_VERIFIED');
    assert.strictEqual(billRes.data.data.bill.currentStage, 'GM');
  });

  // Test 7: GM approves it with a sanction amount (₹45,000)
  await test('7. GM approves bill with sanction amount (₹45,000)', async () => {
    const res = await request(`/gm/bills/${testBillId}/approve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${gmToken}` },
      body: {
        approvedAmount: 45000,
        sanctionLetterNumber: 'BSPHCL/SANCTION/2026/042',
        sanctionLetterDate: '2026-11-22',
        remarks: 'Sanctioned ₹45,000 after standard scrutiny deduction.'
      }
    });
    assert.strictEqual(res.data.success, true);

    const billRes = await request(`/bills/${testBillId}`, {
      headers: { Authorization: `Bearer ${gmToken}` }
    });
    assert.strictEqual(billRes.data.data.bill.status, 'APPROVED');
    assert.strictEqual(billRes.data.data.bill.currentStage, 'ACCOUNTS');
    assert.strictEqual(billRes.data.data.bill.approvedAmount, 45000);
    assert.strictEqual(billRes.data.data.bill.claimedAmount, 50000);
  });

  // Test 8: Accounts records a partial payment (₹20,000)
  await test('8. Accounts records a partial payment (₹20,000)', async () => {
    const res = await request(`/accounts/bills/${testBillId}/payments`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accountsToken}` },
      body: {
        amount: 20000,
        paymentDate: '2026-11-22',
        paymentMode: 'NEFT',
        transactionReference: 'NEFT982347101',
        remarks: 'First installment payment released'
      }
    });
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.billStatus, 'PARTIALLY_PAID');
    assert.strictEqual(res.data.totalPaid, 20000);
    assert.strictEqual(res.data.outstanding, 25000);
  });

  // Test 9: Accounts records the remaining payment (₹25,000)
  await test('9. Accounts records the remaining payment (₹25,000)', async () => {
    const res = await request(`/accounts/bills/${testBillId}/payments`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accountsToken}` },
      body: {
        amount: 25000,
        paymentDate: '2026-11-22',
        paymentMode: 'RTGS',
        transactionReference: 'RTGS771239004',
        remarks: 'Final settlement payment released'
      }
    });
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.billStatus, 'PAID');
    assert.strictEqual(res.data.totalPaid, 45000);
    assert.strictEqual(res.data.outstanding, 0);
  });

  // Test 10: Bill status changes to PAID and stage to COMPLETED
  await test('10. Bill status confirmed as PAID and stage COMPLETED', async () => {
    const billRes = await request(`/bills/${testBillId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(billRes.data.data.bill.status, 'PAID');
    assert.strictEqual(billRes.data.data.bill.currentStage, 'COMPLETED');
    assert.strictEqual(billRes.data.data.payments.length, 2);
  });

  // Test 11: Bill history shows all actions
  await test('11. Bill history audit trail captures all workflow transitions', async () => {
    const res = await request(`/bills/${testBillId}/history`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(res.data.success, true);
    const actions = res.data.data.map(h => h.action);
    console.log('    History actions logged:', actions);
    assert.ok(actions.includes('Bill Registered'));
    assert.ok(actions.includes('Submitted to Legal'));
    assert.ok(actions.includes('Verified by Legal'));
    assert.ok(actions.includes('Approved by GM'));
    assert.ok(actions.includes('Payment Recorded'));
  });

  // Test 12: Unauthorized roles cannot access restricted APIs
  await test('12. Unauthorized roles blocked from restricted endpoints (403 Forbidden)', async () => {
    const hrPayRes = await request(`/accounts/bills/${testBillId}/payments`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${hrToken}` },
      body: { amount: 100 }
    });
    assert.strictEqual(hrPayRes.status, 403, 'HR should receive 403 when trying to record payments');

    const legalApproveRes = await request(`/gm/bills/${testBillId}/approve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${legalToken}` },
      body: { approvedAmount: 1000 }
    });
    assert.strictEqual(legalApproveRes.status, 403, 'Legal should receive 403 when trying to approve bills');
  });

  // Test 13: Returned and Rejected bills workflow
  await test('13. Returned to HR and Rejected bills behave correctly', async () => {
    const billRes = await request('/bills', {
      method: 'POST',
      headers: { Authorization: `Bearer ${hrToken}` },
      body: {
        advocate: testAdvocateId,
        originalBillNumber: 'TEST-RET-01',
        billDate: '2026-11-10',
        submissionDate: '2026-11-21',
        claimedAmount: 25000,
        courtCaseNumber: 'CWJC 9999/2024',
        courtName: 'High Court',
        department: 'BSPHCL Holding Legal Cell'
      }
    });
    const returnBillId = billRes.data.data._id;

    await request(`/hr/bills/${returnBillId}/submit`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${hrToken}` }
    });

    const retRes = await request(`/legal/bills/${returnBillId}/return`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${legalToken}` },
      body: { returnRemarks: 'Original court Vakalatnama copy is missing. Please attach.' }
    });
    assert.strictEqual(retRes.data.success, true);

    let checkBill = await request(`/bills/${returnBillId}`, {
      headers: { Authorization: `Bearer ${hrToken}` }
    });
    assert.strictEqual(checkBill.data.data.bill.status, 'RETURNED_TO_HR');
    assert.strictEqual(checkBill.data.data.bill.currentStage, 'HR');

    await request(`/hr/bills/${returnBillId}/resubmit`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${hrToken}` },
      body: { remarks: 'Vakalatnama attached now.' }
    });

    checkBill = await request(`/bills/${returnBillId}`, {
      headers: { Authorization: `Bearer ${hrToken}` }
    });
    assert.strictEqual(checkBill.data.data.bill.status, 'HR_SUBMITTED');

    const rejRes = await request(`/legal/bills/${returnBillId}/reject`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${legalToken}` },
      body: { rejectionReason: 'Case not entrusted to advocate by BSPHCL competent authority.' }
    });
    assert.strictEqual(rejRes.data.success, true);

    checkBill = await request(`/bills/${returnBillId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(checkBill.data.data.bill.status, 'REJECTED');
    assert.strictEqual(checkBill.data.data.bill.currentStage, 'REJECTED');
    assert.strictEqual(checkBill.data.data.bill.rejectionReason, 'Case not entrusted to advocate by BSPHCL competent authority.');
  });

  // Test 14: Overpayments are blocked
  await test('14. Overpayments exceeding approved amount are blocked (400 Bad Request)', async () => {
    const bRes = await request('/bills', {
      method: 'POST',
      headers: { Authorization: `Bearer ${hrToken}` },
      body: {
        advocate: testAdvocateId,
        originalBillNumber: 'TEST-OVERPAY-01',
        billDate: '2026-11-12',
        submissionDate: '2026-11-22',
        claimedAmount: 10000,
        courtCaseNumber: 'CWJC 777/2024',
        courtName: 'High Court',
        department: 'SBPDCL'
      }
    });
    const opBillId = bRes.data.data._id;

    await request(`/hr/bills/${opBillId}/submit`, { method: 'POST', headers: { Authorization: `Bearer ${hrToken}` } });
    await request(`/legal/bills/${opBillId}/verify`, { method: 'POST', headers: { Authorization: `Bearer ${legalToken}` }, body: { legalRemarks: 'OK' } });
    await request(`/gm/bills/${opBillId}/approve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${gmToken}` },
      body: {
        approvedAmount: 10000,
        sanctionLetterNumber: 'SANCTION-TEST-OVERPAY',
        sanctionLetterDate: '2026-11-22'
      }
    });

    const overpayRes = await request(`/accounts/bills/${opBillId}/payments`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accountsToken}` },
      body: {
        amount: 15000,
        paymentDate: '2026-11-22',
        paymentMode: 'NEFT'
      }
    });
    assert.strictEqual(overpayRes.status, 400);
    assert.ok(overpayRes.data.message.includes('exceeds'));
  });

  console.log(`\n=== TEST RESULTS: ${passed} PASSED, ${failed} FAILED ===\n`);
  if (failed > 0) process.exit(1);
}

runTests();
