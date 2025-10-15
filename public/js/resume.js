const GEMINI_API_KEY = "AIzaSyDUsDd8QkI1Jn-5U9L8tNqt0QZfQDLVGmo";
// Handle file uploads
document.getElementById('fileInput').addEventListener('change', async e=>{
  const file = e.target.files[0];
  if (!file) return;
  const ext = file.name.split('.').pop().toLowerCase();

  if (ext === 'txt') {
    const reader = new FileReader();
    reader.onload = ev => document.getElementById('resumeText').value = ev.target.result;
    reader.readAsText(file);
  }
  else if (ext === 'pdf') {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let text = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map(s => s.str).join(" ") + "\n";
    }
    document.getElementById('resumeText').value = text.trim();
  }
  else if (ext === 'docx') {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    document.getElementById('resumeText').value = result.value.trim();
  }
});

// Handle analyze button
document.getElementById('analyzeBtn').addEventListener('click', async ()=>{
  const resume = document.getElementById('resumeText').value.trim();
  if (!resume) return alert("Please enter or upload resume text");

  const prompt = `
You are an ATS-style resume evaluator.
Evaluate the resume against *real-world* job requirements, not just the text itself.
Be strict when scoring. If the resume is missing important details, reduce scores significantly.

Scoring criteria:
- Improvement Score: grammar, formatting, missing sections, unclear info.
- ATS Score: keyword matching for common job postings, structure, clarity, readability.
- Grade: overall impression (A–F, can use + or -).

Different resumes should get different scores based on content.

Return a JSON object exactly like this:
{
  "skills": ["..."],
  "strengths": ["..."],
  "weaknesses": ["..."],
  "improvement_score": number from 0-100,
  "ats_score": number from 0-100,
  "grade": "A" | "B" | "C" | "D" | "E" | "F" (can have + or -),
  "suggested_job_roles": ["..."]
}

Resume:
"""${resume}"""
`;

  document.getElementById('results').innerHTML = `<div class="card p-4 show"><b>Analyzing...</b></div>`;

  try {
    const resp = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + GEMINI_API_KEY,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      }
    );
    const data = await resp.json();
    let text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

    // Remove markdown fences if present
    text = text.replace(/```json|```/gi, "").trim();

    let parsed;
    try { parsed = JSON.parse(text); } catch { parsed = null; }

    if (!parsed) {
      document.getElementById('results').innerHTML = `<div class="card p-4 show bg-danger text-white">Error parsing AI output:<br>${text}</div>`;
      return;
    }

    renderResults(parsed);
  } catch (err) {
    document.getElementById('results').innerHTML = `<div class="card p-4 show bg-danger text-white">Error: ${err.message}</div>`;
  }
});

// Render results
function renderResults(r) {
  let html = `
  <div class="card p-4">
    <h4>Skills</h4>
    <ul>${r.skills.map(s=>`<li>${s}</li>`).join('')}</ul>
  </div>

  <div class="card p-4">
    <h4>Strengths</h4>
    <ul>${r.strengths.map(s=>`<li>${s}</li>`).join('')}</ul>
  </div>

  <div class="card p-4">
    <h4>Weaknesses</h4>
    <ul>${r.weaknesses.map(s=>`<li>${s}</li>`).join('')}</ul>
  </div>

  <div class="card p-4">
    <h4>Improvement Score</h4>
    <div class="progress"><div class="progress-bar bg-success" role="progressbar" style="width:${r.improvement_score}%">${r.improvement_score}%</div></div>
    <h4 class="mt-3">ATS Score</h4>
    <div class="progress"><div class="progress-bar bg-info" role="progressbar" style="width:${r.ats_score}%">${r.ats_score}%</div></div>
    <h4 class="mt-3">Grade</h4>
    <span class="badge ${gradeColor(r.grade)} fs-5">${r.grade}</span>
  </div>

  <div class="card p-4">
    <h4>Suggested Job Roles</h4>
    ${r.suggested_job_roles.map(s=>`<span class="badge bg-warning text-dark m-1">${s}</span>`).join('')}
  </div>
  `;

  document.getElementById('results').innerHTML = html;
  setTimeout(()=> {
    document.querySelectorAll('#results .card').forEach(c=>c.classList.add('show'));
  }, 100);
}

// Grade color helper
function gradeColor(g) {
  const base = g[0].toUpperCase();
  if (base === "A") return "bg-success";
  if (base === "B") return "bg-primary";
  if (base === "C") return "bg-info";
  if (base === "D") return "bg-warning text-dark";
  return "bg-danger";
}