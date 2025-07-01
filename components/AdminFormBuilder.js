import React, { useState } from "react";
import axios from "axios";

const fieldTypes = [
  { value: "text", label: "Short Text" },
  { value: "textarea", label: "Paragraph" },
  { value: "select", label: "Dropdown" },
  { value: "radio", label: "Multiple Choice" },
  { value: "checkbox", label: "Checkboxes" },
  { value: "date", label: "Date" },
  { value: "number", label: "Number" },
  { value: "email", label: "Email" }
];

export default function AdminFormBuilder({ initialForm, onSave }) {
  const [title, setTitle] = useState(initialForm?.title || "");
  const [description, setDescription] = useState(initialForm?.description || "");
  const [fields, setFields] = useState(initialForm?.fields || []);

  function addField() {
    setFields([...fields, { label: "", type: "text", required: false, options: [] }]);
  }
  function updateField(idx, key, value) {
    setFields(fields.map((f, i) => i === idx ? { ...f, [key]: value } : f));
  }
  function updateOption(idx, oidx, value) {
    setFields(fields.map((f, i) => i === idx ? { ...f, options: f.options.map((opt, j) => j === oidx ? value : opt) } : f));
  }
  function addOption(idx) {
    setFields(fields.map((f, i) => i === idx ? { ...f, options: [...(f.options||[]), ""] } : f));
  }
  function removeField(idx) {
    setFields(fields.filter((_, i) => i !== idx));
  }
  async function saveForm() {
    const payload = { title, description, fields };
    if (initialForm && initialForm._id) {
      await axios.put(`/api/forms/${initialForm._id}`, payload);
    } else {
      await axios.post("/api/forms", payload);
    }
    if (onSave) onSave();
  }

  return (
    <div>
      <h2>{initialForm ? "Edit Form" : "New Form"}</h2>
      <div>
        <label>Title <input value={title} onChange={e => setTitle(e.target.value)} /></label>
      </div>
      <div>
        <label>Description <input value={description} onChange={e => setDescription(e.target.value)} /></label>
      </div>
      <h4>Fields</h4>
      {fields.map((f, idx) => (
        <div key={idx} style={{ border: "1px solid #ccc", margin: 4, padding: 4 }}>
          <input
            placeholder="Question label"
            value={f.label}
            onChange={e => updateField(idx, "label", e.target.value)}
            style={{ width: "60%" }}
          />
          <select value={f.type} onChange={e => updateField(idx, "type", e.target.value)}>
            {fieldTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <label>
            <input type="checkbox" checked={f.required} onChange={e => updateField(idx, "required", e.target.checked)} />
            Required
          </label>
          <button onClick={() => removeField(idx)}>Delete</button>
          {(f.type === "select" || f.type === "radio" || f.type === "checkbox") && (
            <div>
              <span>Options:</span>
              {(f.options || []).map((opt, oidx) => (
                <input
                  key={oidx}
                  value={opt}
                  placeholder={`Option ${oidx + 1}`}
                  onChange={e => updateOption(idx, oidx, e.target.value)}
                  style={{ margin: "0 2px" }}
                />
              ))}
              <button type="button" onClick={() => addOption(idx)}>Add Option</button>
            </div>
          )}
        </div>
      ))}
      <button type="button" onClick={addField}>Add Field</button>
      <br />
      <button type="button" onClick={saveForm}>{initialForm ? "Save Changes" : "Create Form"}</button>
    </div>
  );
}
