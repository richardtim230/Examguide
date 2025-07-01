import React, { useEffect, useState } from "react";
import axios from "axios";

export default function AdminFormResponses({ formId }) {
  const [form, setForm] = useState(null);
  const [responses, setResponses] = useState([]);

  useEffect(() => {
    axios.get(`/api/forms/${formId}`).then(res => setForm(res.data));
    axios.get(`/api/forms/${formId}/responses`).then(res => setResponses(res.data));
  }, [formId]);

  if (!form) return <div>Loading form...</div>;
  if (!responses) return <div>Loading responses...</div>;

  return (
    <div>
      <h3>Responses for: {form.title}</h3>
      <table border="1">
        <thead>
          <tr>
            {form.fields.map(field => (
              <th key={field._id || field.label}>{field.label}</th>
            ))}
            <th>Submitted by</th>
            <th>Submitted at</th>
          </tr>
        </thead>
        <tbody>
          {responses.map((resp, ridx) => (
            <tr key={resp._id}>
              {form.fields.map((field, fidx) => {
                const ansObj = resp.answers.find(a => String(a.fieldId) === String(field._id) || a.fieldId === fidx);
                return <td key={field._id || fidx}>{Array.isArray(ansObj?.value) ? ansObj.value.join(", ") : ansObj?.value || ""}</td>;
              })}
              <td>{resp.submittedBy?.username || "Anonymous"}</td>
              <td>{new Date(resp.createdAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
