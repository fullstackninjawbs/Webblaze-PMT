

async function test() {
  try {
    // 1. Login
    const loginRes = await fetch('http://localhost:5000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@webblaze.com', password: 'password123' })
    });
    const loginData = await loginRes.json();
    console.log('Login:', loginData);

    const token = loginData.data.accessToken;

    // 2. Get Clients
    const clientsRes = await fetch('http://localhost:5000/api/v1/clients', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const clientsData = await clientsRes.json();
    console.log('Clients:', clientsData);
    
    if (!clientsData.data || clientsData.data.length === 0) {
      console.log('No clients found');
      return;
    }

    const clientId = clientsData.data[0]._id;

    // 3. Create Project
    const projectRes = await fetch('http://localhost:5000/api/v1/projects', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({
        name: 'Test Project',
        client: clientId,
        description: 'Test',
        totalBudget: 1000
      })
    });
    const projectData = await projectRes.json();
    console.log('Create Project response:', projectRes.status, projectData);

  } catch (err) {
    console.error(err);
  }
}

test();
