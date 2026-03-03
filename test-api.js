
import fetch from 'node-fetch';

async function testApi() {
    console.log('Testing /api/analyze...');
    const start = Date.now();

    try {
        const response = await fetch('http://localhost:3003/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt: 'Test prompt',
                schema: {
                    type: 'OBJECT',
                    properties: {
                        result: { type: 'STRING' }
                    }
                }
            })
        });

        const duration = Date.now() - start;
        console.log(`Status: ${response.status}`);
        console.log(`Duration: ${duration}ms`);

        if (response.ok) {
            const data = await response.json();
            console.log('Body:', JSON.stringify(data, null, 2));
        } else {
            console.log('Error Body:', await response.text());
        }

    } catch (error) {
        console.error('Fetch Failed:', error);
    }
}

testApi();
