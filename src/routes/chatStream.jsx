// src/routes/chatStream.js
export async function loader({ request }) {
  const url = new URL(request.url);
  const prompt = url.searchParams.get("prompt") || "";

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4.1-nano",
      temperature: 0.7,
      stream: true,
      messages: [
        { role: "system", content: "Your name is Donna. Be helpful." },
        { role: "user", content: prompt },
      ],
    }),
  });

  const reader = res.body.getReader();
  const stream = new ReadableStream({
    start(controller) {
      function push() {
        reader.read().then(({ done, value }) => {
          if (done) {
            controller.close();
            return;
          }
          const chunk = new TextDecoder().decode(value);
          controller.enqueue(new TextEncoder().encode(`data: ${chunk}\n\n`));
          push();
        });
      }
      push();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
