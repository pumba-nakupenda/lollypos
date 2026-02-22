
const test = async () => {
    console.log('Testing LIVE Render Backend...');
    try {
        const res = await fetch('https://lollypos-backend.onrender.com/ai/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question: 'Analyse mes performances' })
        });
        if (!res.ok) {
            console.log('Status:', res.status);
            const text = await res.text();
            console.log('Response:', text);
            return;
        }
        const data = await res.json();
        console.log('Success:', JSON.stringify(data, null, 2));
    } catch (e) {
        console.error('Test failed:', e.message);
    }
};
test();
