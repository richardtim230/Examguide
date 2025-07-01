import React, { useState, useEffect } from "react";
import axios from "axios";

export default function UserFormFiller({ formId }) {
  const [form, setForm] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    axios.get(`/api/forms/${formId}`).then(res => setForm(res.data));
  }, [formId]);

  if (!form) return <div>Loading...</div>;

  function handleChange(fieldId, value) {
    setAnswers(a => ({ ...a, [fieldId]: value }));
  }
  async function handleSubmit(e) {
    e.preventDefault();
    // Prepare answers as array of {fieldId, value}
    const response = form.fields.map((f, idx) => ({
      fieldId: f._id || idx, // fallback to idx if no _id (for new forms)
      value: answers[f._id || idx] || ""
    }));
    await axios.post(`/api/forms/${form._id}/responses`, { answers: response });
    setSubmitted(true);
  }

  return submitted ? (
    <div>Thank you! Your response has been recorded.</div>
  ) : (
    <form onSubmit={handleSubmit}>
      <h2>{form.title}</h2>
      <p>{form.description}</p>
      {form.fields.map((f, idx) => (
        <div key={f._id || idx} style={{ margin: 8 }}>
          <label>
            {f.label} {f.required && <span style={{ color: "red" }}>*</span>}
            {f.type === "text" && (
              <input value={answers[f._id || idx] || ""} onChange={e => handleChange(f._id || idx, e.target.value)} required={f.required} />
            )}
            {f.type === "textarea" && (
              <textarea value={answers[f._id || idx] || ""} onChange={e => handleChange(f._id || idx, e.target.value)} required={f.required} />
            )}
            {f.type === "select" && (
              <select value={answers[f._id || idx] || ""} onChange={e => handleChange(f._id || idx, e.target.value)} required={f.required}>
                <option value="">--Select--</option>
                {(f.options || []).map((opt, oidx) => <option key={oidx} value={opt}>{opt}</option>)}
              </select>
            )}
            {f.type === "radio" && (f.options || []).map((opt, oidx) => (
              <label key={oidx}><input type="radio" name={`field${idx}`} value={opt} checked={answers[f._id || idx] === opt} onChange={e => handleChange(f._id || idx, opt)} required={f.required} />{opt}</label>
            ))}
            {f.type === "checkbox" && (f.options || []).map((opt, oidx) => (
              <label key={oidx}><input type="checkbox" value={opt} checked={Array.isArray(answers[f._id || idx]) && answers[f._id || idx].includes(opt)} onChange={e => {
                const checked = Array.isArray(answers[f._id || idx]) ? [...answers[f._id || idx]] : [];
                if (e.target.checked) checked.push(opt); else checked.splice(checked.indexOf(opt), 1);
                handleChange(f._id || idx, checked);
              }} />{opt}</label>
            ))}
            {(f.type === "date" || f.type === "number" || f.type === "email") && (
              <input type={f.type} value={answers[f._id || idx] || ""} onChange={e => handleChange(f._id || idx, e.target.value)} required={f.required} />
            )}
          </label>
        </div>
      ))}
      <button type="submit">Submit</button>
    </form>
  );
}
