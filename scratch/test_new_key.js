
const apiKey = "AIzaSyD7H0z8Bjs0-TUwmain1Nys9ngk2P9dBYE";

async function testText() {
  const models = ["gemini-1.5-flash", "gemini-pro", "gemini-2.0-flash"];
  for (const m of models) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "Bonjour, qui es-tu ?" }] }]
        })
      });
      const data = await res.json();
      console.log(`[${m}] Status: ${res.status}`);
      if (data.error) {
        console.log(`[${m}] Error: ${data.error.message}`);
      } else {
        console.log(`[${m}] Success!`);
        console.log(data.candidates?.[0]?.content?.parts?.[0]?.text);
      }
    } catch (e) {
      console.log(`[${m}] Failed: ${e.message}`);
    }
  }
}

testText();
