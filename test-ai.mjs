
const test = async () => {
    try {
        const res = await fetch('https://lollypos-backend.onrender.com/ai/analyze', {
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
