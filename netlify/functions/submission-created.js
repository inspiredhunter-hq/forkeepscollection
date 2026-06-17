const NOTION_VERSION = "2022-06-28";

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body || "{}");
    const data = (body.payload && body.payload.data) || {};

    const name = data.name || "Unknown";
    const email = data.email || "";
    const message = data.message || "";

    let raw = data.interest_type;
    let interests = [];
    if (Array.isArray(raw)) {
      interests = raw;
    } else if (typeof raw === "string" && raw.length) {
      interests = raw.split(",").map((s) => s.trim());
    }

    const wantsWebsite = interests.includes("site") || interests.includes("both");
    const wantsBook = interests.includes("book") || interests.includes("both");
    const wantsPlanningAhead = interests.includes("planning_ahead");

    const res = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + process.env.NOTION_TOKEN,
        "Notion-Version": NOTION_VERSION,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        parent: { database_id: process.env.NOTION_DATABASE_ID },
        properties: {
          Name: { title: [{ text: { content: name } }] },
          Email: { email: email || null },
          "Memorial website": { checkbox: wantsWebsite },
          "Legacy book": { checkbox: wantsBook },
          "Planning ahead": { checkbox: wantsPlanningAhead },
          Message: { rich_text: message ? [{ text: { content: message } }] : [] },
          Submitted: { date: { start: new Date().toISOString() } },
          Status: { select: { name: "New" } },
        },
      }),
    });

    if (!res.ok) {
      console.error("Notion API error", res.status, await res.text());
    }
  } catch (err) {
    console.error("submission-created error:", err);
  }

  return { statusCode: 200, body: "" };
};
