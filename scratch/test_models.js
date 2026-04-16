
const apiKey = "AIzaSyDfxVXMfaSvJiHvBfPFr6HJhlYn7TTckE0";

async function testModels() {
  const models = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-1.0-pro"];
  const versions = ["v1", "v1beta"];

  for (const v of versions) {
    for (const m of models) {
      const url = `https://generativelanguage.googleapis.com/${v}/models/${m}:generateContent?key=${apiKey}`;
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: "Hello" }] }]
          })
        });
        const data = await res.json();
        console.log(`[${v}][${m}] Status: ${res.status}`);
        if (data.error) {
          console.log(`[${v}][${m}] Error: ${data.error.message}`);
        } else {
          console.log(`[${v}][${m}] Success!`);
          return;
        }
      } catch (e) {
        console.log(`[${v}][${m}] Failed: ${e.message}`);
      }
    }
  }
}

testModels();
