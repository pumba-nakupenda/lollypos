
const test = async () => {
    try {
        const res = await fetch('http://127.0.0.1:3005/ai/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question: 'Analyse mes performances' })
        });
        const data = await res.json();
        console.log(JSON.stringify(data, null, 2));
    } catch (e) {
        console.error('Test failed:', e.message);
    }
};
test();
