// src/routes/meetings.js
let MEETINGS = [
  {
    id: "1",
    time: "2025-07-10T14:00:00",
    with: "John Doe",
    company: "Corp Corp",
    notes: "",
  },
  {
    id: "2",
    time: "2025-11-07T16:30:00",
    with: "Jane Smith",
    company: "Acme Inc",
    notes: "",
  },
];

export async function loader() {
  return MEETINGS;
}

export async function action({ request }) {
  const form = await request.formData();
  const idParam = form.get("id");
  const time = form.get("time");
  const withWho = form.get("with");
  const company = form.get("company");
  const notesUpdate = form.get("notesUpdate");

  // ─── Update notes on an existing meeting ───
  if (idParam && notesUpdate != null) {
    let m = MEETINGS.find((x) => x.id === idParam);
    if (!m) {
      m = MEETINGS.find(
        (x) =>
          x.with.toLowerCase() === idParam.toLowerCase() ||
          x.company.toLowerCase() === idParam.toLowerCase()
      );
    }
    if (m) {
      m.notes = m.notes ? m.notes + "\n" + notesUpdate : notesUpdate;
      // ✅ Return reply for UI streaming
      return { reply: `📝 Added notes to meeting ${m.with}.` };
    }
    return { reply: "Could not find that meeting." };
  }

  // ─── Create a new meeting ───
  if (!time || !withWho) {
    return { reply: "Missing time or with." };
  }
  MEETINGS.push({
    id: crypto.randomUUID(),
    time,
    with: withWho,
    company: company || "",
    notes: "",
  });
  return {
    reply: `📅 Saved meeting with ${withWho}${
      company ? ` from ${company}` : ""
    }`,
  };
}
