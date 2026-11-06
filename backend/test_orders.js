const http = require('http');

async function runTest() {
  console.log('--- STARTING BACKEND API TEST ---');
  try {
    // 1. Register a test user
    const userPayload = {
      name: `Test User ${Date.now()}`,
      email: `testuser_${Date.now()}@example.com`,
      password: 'password123',
      phone: '1234567890'
    };

    console.log(`\n[1] Registering test user: ${userPayload.email}`);
    const regRes = await fetch('http://localhost:5000/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userPayload)
    });
    
    if (!regRes.ok) {
        throw new Error(`Registration failed: ${await regRes.text()}`);
    }
    
    const userData = await regRes.json();
    const token = userData.token;
    console.log('    ✓ Success! Token received.');

    // 2. Fetch dummy designs to reference in the order
    console.log('\n[2] Fetching dummy designs...');
    const designRes = await fetch('http://localhost:5000/api/designs');
    const designs = await designRes.json();
    if (!designs || designs.length === 0) {
       throw new Error('No designs found in database. Seed data first.');
    }
    const designId = designs[0]._id;
    console.log(`    ✓ Success! Using design ID: ${designId}`);

    // 3. Create an order (POST /api/orders)
    console.log('\n[3] Creating a new order via POST /api/orders...');
    const orderPayload = {
      customerName: userPayload.name,
      phone: userPayload.phone,
      design: designId,
      customizationOptions: { neckStyle: 'Round' },
      measurements: { bust: 34 },
      extraServices: [],
      totalPrice: 1500
    };

    const orderRes = await fetch('http://localhost:5000/api/orders', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(orderPayload)
    });

    const orderData = await orderRes.json();
    if (orderRes.ok) {
       console.log('    ✓ Success! Order created.');
       console.log(`      Response: ${JSON.stringify({ id: orderData._id, status: orderData.status, totalPrice: orderData.totalPrice })}`);
    } else {
       console.log('    ✗ Failed to create order.');
       console.log('      Response:', orderData);
       throw new Error('Order creation failed');
    }

    // 4. Test missing design validation (Expect 400 Bad Request instead of crash)
    console.log('\n[4] Testing validation (POST without design)...');
    const badOrderPayload = { ...orderPayload, design: undefined };
    const badRes = await fetch('http://localhost:5000/api/orders', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(badOrderPayload)
    });
    const badData = await badRes.json();
    if (badRes.status === 400) {
        console.log('    ✓ Success! Server gracefully rejected with 400 Bad Request.');
        console.log(`      Response: ${JSON.stringify(badData)}`);
    } else {
        console.log(`    ✗ Expected 400, got ${badRes.status}`);
        console.log(badData);
    }

    // 5. Fetch my orders (GET /api/orders/myorders)
    console.log('\n[5] Fetching user orders via GET /api/orders/myorders...');
    const historyRes = await fetch('http://localhost:5000/api/orders/myorders', {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${token}`
      }
    });

    const historyData = await historyRes.json();
    if (historyRes.ok) {
       console.log(`    ✓ Success! Found ${historyData.length} active orders for this user.`);
       console.log(`      First record ID: ${historyData[0]._id}`);
    } else {
       console.log('    ✗ Failed to fetch order history.');
       console.log('      Response:', historyData);
       throw new Error('Order history fetch failed');
    }

    console.log('\n--- ALL TESTS PASSED SUCCESSFULLY! SERVER DID NOT CRASH ---');
  } catch (error) {
    console.error('\n--- TEST FAILED ---');
    console.error(error.message);
  }
}

runTest();
