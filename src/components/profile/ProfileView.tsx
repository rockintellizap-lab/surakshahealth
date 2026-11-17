"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useView } from "@/context/ViewContext";
import { getProfile, saveProfile } from "@/lib/profileService";
import { uploadReportFile } from "@/lib/storage";
import type { EmergencyProfileFormData } from "@/lib/profile";

const BG = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Unknown"];
const GENDERS = ["Male", "Female", "Other", "Prefer not to say"];
const LANGS = ["English", "हिन्दी", "ਪੰਜਾਬੀ", "Other"];
const RELATIONS = ["Self", "Spouse", "Parent", "Child", "Sibling", "Friend", "Other"];
const SEVERITY = ["Mild", "Moderate", "Severe", "Life-threatening"];
const REPORT_TYPES = ["Lab Report", "Imaging", "Prescription", "Discharge Summary", "Other"];

interface Section {
  id: string;
  title: string;
  fields?: Field[];
  groups?: Group[];
  photo?: boolean;
  note?: string;
  rep?: RepeaterConfig;
  vac?: boolean;
}

interface Field {
  id: string;
  label: string;
  type: "text" | "email" | "tel" | "date" | "select" | "textarea" | "number" | "file";
  required?: boolean;
  options?: string[];
  maxWords?: number;
  accept?: string;
}

interface Group {
  title: string;
  fields: Field[];
  required?: boolean;
}

interface RepeaterConfig {
  key: string;
  label: string;
  max: number;
  fields: Field[];
}

const SECTIONS: Section[] = [
  {
    id: "A",
    title: "A. Personal information",
    photo: true,
    fields: [
      { id: "fn", label: "First name", type: "text", required: true },
      { id: "mn", label: "Middle name", type: "text" },
      { id: "ln", label: "Last name", type: "text", required: true },
      { id: "gender", label: "Gender", type: "select", required: true, options: GENDERS },
      { id: "dob", label: "Date of birth", type: "date", required: true },
      { id: "bg", label: "Blood group", type: "select", required: true, options: BG },
      { id: "wt", label: "Weight (kg)", type: "number" },
      { id: "lang", label: "Preferred language", type: "select", options: LANGS },
      { id: "email", label: "Primary email", type: "email", required: true },
      { id: "mob", label: "Mobile number", type: "tel", required: true },
      { id: "abha", label: "ABHA ID", type: "text" },
      { id: "aadhaar", label: "Aadhaar number", type: "text" },
      { id: "addr", label: "Complete address", type: "textarea" },
    ],
  },
  {
    id: "B",
    title: "B. Emergency contacts",
    groups: [
      { title: "Primary emergency contact", fields: contactFields("pc", true) },
      { title: "Secondary emergency contact", fields: contactFields("sc", false) },
    ],
  },
  {
    id: "C",
    title: "C. Medical history",
    fields: [
      { id: "ill", label: "Previous illnesses (if any)", type: "textarea" },
      { id: "chronic", label: "Chronic diseases (if any)", type: "textarea" },
      { id: "ltt", label: "Long-term treatments (if any)", type: "textarea" },
      { id: "inf", label: "Previous infections (if any)", type: "textarea" },
    ],
  },
  {
    id: "D",
    title: "D. Allergies",
    note: "Add every allergy you know of.",
    rep: {
      key: "alg",
      label: "Allergy",
      max: 10,
      fields: [
        { id: "name", label: "Allergy name / type", type: "text" },
        { id: "react", label: "Reaction (rash, swelling, breathing difficulty etc.)", type: "text" },
        { id: "sev", label: "Severity", type: "select", options: SEVERITY },
        { id: "tx", label: "Treatment / precautions", type: "textarea" },
        { id: "note", label: "Additional notes", type: "textarea" },
      ],
    },
  },
  {
    id: "E",
    title: "E. Medication history",
    note: "Add up to 5 medicines and what each is for.",
    rep: {
      key: "med",
      label: "Medicine",
      max: 5,
      fields: [
        { id: "name", label: "Medicine name", type: "text" },
        { id: "purpose", label: "Purpose", type: "text" },
      ],
    },
  },
  {
    id: "F",
    title: "F. Vaccinations & immunization",
    vac: true,
  },
  {
    id: "G",
    title: "G. Medical reports",
    note: "Add up to 10 reports (PDF, JPG or PNG, up to 5 MB each).",
    rep: {
      key: "rpt",
      label: "Report",
      max: 10,
      fields: [
        { id: "name", label: "Report name", type: "text" },
        { id: "file", label: "File upload", type: "file", accept: ".pdf,.jpg,.jpeg,.png" },
      ],
    },
  },
];

function contactFields(prefix: string, required: boolean): Field[] {
  return [
    { id: `${prefix}_name`, label: "Contact full name", type: "text", required },
    { id: `${prefix}_rel`, label: "Relationship", type: "select", required, options: RELATIONS },
    { id: `${prefix}_mob`, label: "Mobile number", type: "tel", required },
    { id: `${prefix}_alt`, label: "Alternate number", type: "tel" },
    { id: `${prefix}_email`, label: "Email", type: "email" },
    { id: `${prefix}_addr`, label: "Contact's address", type: "textarea" },
  ];
}

function words(s: string): number {
  s = s.trim();
  return s ? s.split(/\s+/).length : 0;
}

export default function ProfileView() {
  const { user, logout } = useAuth();
  const { setView } = useView();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ text: "", hidden: true, error: false });
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [repeaters, setRepeaters] = useState<Record<string, any[]>>({
    alg: [],
    med: [],
    rpt: [],
  });
  const [vacWords, setVacWords] = useState(0);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const fileInputsRef = useRef<Record<string, HTMLInputElement | null>>({});
  const uidCounter = useRef(0);

  const loadProfile = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getProfile(user.uid);
      if (data) {
        setFormData(data);
        if (data.allergies) {
          try {
            const parsed = JSON.parse(data.allergies);
            if (Array.isArray(parsed)) setRepeaters(prev => ({ ...prev, alg: parsed }));
          } catch {}
        }
        if (data.medications) {
          try {
            const parsed = JSON.parse(data.medications);
            if (Array.isArray(parsed)) setRepeaters(prev => ({ ...prev, med: parsed }));
          } catch {}
        }
        if (data.reports) {
          try {
            const parsed = JSON.parse(data.reports);
            console.log("Raw reports from Firestore:", parsed);
            if (Array.isArray(parsed)) {
              // Normalize old data: ensure file_name exists for display
              const normalized = parsed.map((r: any) => {
                let fileName = r.file_name || r.name || "Report";
                // If file is a Firebase Storage URL, extract filename from URL
                if (r.file && typeof r.file === "string" && r.file.includes("firebasestorage.googleapis.com") && !r.file_name) {
                  try {
                    const urlParts = r.file.split("/");
                    const lastPart = urlParts[urlParts.length - 1];
                    const decoded = decodeURIComponent(lastPart);
                    const namePart = decoded.split("_").slice(1).join("_");
                    if (namePart) fileName = namePart;
                  } catch {}
                }
                return {
                  ...r,
                  file_name: fileName,
                };
              });
              console.log("Normalized reports:", normalized);
              setRepeaters(prev => ({ ...prev, rpt: normalized }));
            }
          } catch (e) {
            console.error("Failed to parse reports:", e);
          }
        }
        if (data.vaccinations) {
          setVacWords(words(data.vaccinations));
        }
        if (data.photo) {
          setPhotoPreview(data.photo);
        }
      }
    } catch (err) {
      console.error("Failed to load profile:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user, loadProfile]);

  const handleChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setFieldErrors(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleRepeaterChange = (repKey: string, index: number, fieldId: string, value: any) => {
    setRepeaters(prev => {
      const arr = [...prev[repKey]];
      const newRow = { ...arr[index], [fieldId]: value };
      // If clearing file input, also clear stored file (base64/URL) and file_name
      if (value === "" && fieldId === "file") {
        newRow.file = "";
        newRow.file_name = "";
        newRow.type = "";
        newRow.size = 0;
      }
      arr[index] = newRow;
      return { ...prev, [repKey]: arr };
    });
    setFieldErrors(prev => {
      const next = { ...prev };
      delete next[`${repKey}_${index}_${fieldId}`];
      return next;
    });
  };

  const addRepeaterRow = (repKey: string) => {
    const config = SECTIONS.find(s => s.rep?.key === repKey)?.rep;
    if (!config) return;
    setRepeaters(prev => {
      const arr = [...prev[repKey]];
      if (arr.length >= config.max) return prev;
      const newRow: Record<string, any> = {};
      config.fields.forEach(f => { newRow[f.id] = ""; });
      newRow.__uid = ++uidCounter.current;
      return { ...prev, [repKey]: [...arr, newRow] };
    });
  };

  const removeRepeaterRow = (repKey: string, uid: number) => {
    setRepeaters(prev => ({
      ...prev,
      [repKey]: prev[repKey].filter((row: any) => row.__uid !== uid),
    }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 2 * 1024 * 1024) {
      setMsg({ text: "Choose a JPG or PNG image under 2 MB.", hidden: false, error: true });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleVacChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    handleChange("vaccinations", value);
    setVacWords(words(value));
  };

  const validate = (): Record<string, string> => {
    const errors: Record<string, string> = {};
    const MOB = /^(\+?91)?[6-9]\d{9}$/;

    const requiredA = ["fn", "ln", "gender", "dob", "bg", "email", "mob"];
    requiredA.forEach(id => {
      if (!formData[id]?.trim()) errors[id] = "Required";
    });
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(formData.email)) {
      errors.email = "Invalid email format";
    }
    if (formData.mob && !MOB.test(formData.mob.replace(/[\s-]/g, ""))) {
      errors.mob = "Invalid mobile number";
    }
    if (formData.abha && formData.abha.replace(/\D/g, "").length !== 14) {
      errors.abha = "ABHA ID must have 14 digits";
    }
    if (formData.aadhaar && formData.aadhaar.replace(/\D/g, "").length !== 12) {
      errors.aadhaar = "Aadhaar must have 12 digits";
    }
    if (formData.wt && (formData.wt < 1 || formData.wt > 500)) {
      errors.wt = "Weight must be between 1 and 500 kg";
    }
    if (formData.dob && new Date(formData.dob) > new Date()) {
      errors.dob = "Date of birth cannot be in the future";
    }

    ["pc", "sc"].forEach(prefix => {
      const isPrimary = prefix === "pc";
      const name = formData[`${prefix}_name`];
      const mob = formData[`${prefix}_mob`];
      const rel = formData[`${prefix}_rel`];
      if (isPrimary || name || mob) {
        if (!name?.trim()) errors[`${prefix}_name`] = "Required";
        if (!mob || !MOB.test(mob.replace(/[\s-]/g, ""))) errors[`${prefix}_mob`] = "Invalid mobile number";
        if (!rel) errors[`${prefix}_rel`] = "Required";
      }
    });

    if (vacWords > 200) errors.vaccinations = "Vaccinations limit is 200 words";

    Object.entries(repeaters).forEach(([key, rows]) => {
      const config = SECTIONS.find(s => s.rep?.key === key)?.rep;
      if (!config) return;
      rows.forEach((row: any, i: number) => {
        const touched = Object.values(row).some(v => v && v !== "");
        if (touched) {
          config.fields.forEach(f => {
            if (f.required && !row[f.id]?.trim()) {
              errors[`${key}_${i}_${f.id}`] = "Required";
            }
            if (f.type === "file" && row[f.id] instanceof File) {
              const file = row[f.id];
              if (!/\.(pdf|jpe?g|png)$/i.test(file.name)) {
                errors[`${key}_${i}_${f.id}`] = "Use PDF, JPG or PNG";
              }
              if (file.size > 5 * 1024 * 1024) {
                errors[`${key}_${i}_${f.id}`] = "File must be under 5 MB";
              }
            }
          });
        }
      });
    });

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setMsg({ text: `Fix ${Object.keys(errors).length} field${Object.keys(errors).length > 1 ? "s" : ""} marked in red.`, hidden: false, error: true });
      return;
    }
    setFieldErrors({});

    setSaving(true);
    setMsg({ text: "", hidden: true, error: false });

    try {
      // Upload report files to Firebase Storage first
      const uploadedReports: any[] = [];
      for (const row of repeaters.rpt) {
        console.log("Processing report row:", row);
        if (row.file instanceof File) {
          const uploaded = await uploadReportFile(user!.uid, row.file);
          uploadedReports.push({
            name: row.name || uploaded.name,
            file: uploaded.url,
            file_name: uploaded.name,
            size: uploaded.size,
            type: uploaded.type,
          });
        } else if (row.file && typeof row.file === "string" && row.file.startsWith("http")) {
          // Already uploaded (from previous save)
          uploadedReports.push({
            name: row.name || row.file_name,
            file: row.file,
            file_name: row.file_name,
            size: row.size,
            type: row.type,
          });
        }
      }
      console.log("Uploaded reports to save:", uploadedReports);

      const saveData: EmergencyProfileFormData & Record<string, any> = {
        bloodGroup: formData.bg || "",
        dateOfBirth: formData.dob || "",
        allergies: JSON.stringify(repeaters.alg),
        emergencyContact: `${formData.pc_name || ""} - ${formData.pc_mob || ""}`,
        abhaId: formData.abha || "",
        aadhaarLast4: formData.aadhaar?.slice(-4) || "",
        ...formData,
        medications: JSON.stringify(repeaters.med),
        reports: JSON.stringify(uploadedReports),
        vaccinations: formData.vaccinations || "",
        photo: photoPreview || "",
      };

      await saveProfile(user!.uid, saveData);
      setMsg({ text: "Profile saved successfully! Redirecting to application status...", hidden: false, error: false });
      // Redirect to status page after short delay
      setTimeout(() => {
        setView("status");
      }, 1500);
    } catch (err) {
      console.error("Save profile error:", err);
      setMsg({ text: `Failed to save profile: ${err instanceof Error ? err.message : "Unknown error"}`, hidden: false, error: true });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setView("auth");
  };

  if (loading) {
    return (
      <section id="profile" className="pf">
        <div className="side">
          <div className="who">
            <small>Signed in as</small>
            <b>{user?.email}</b>
          </div>
        </div>
        <div style={{ padding: "40px", textAlign: "center" }}>
          Loading profile...
        </div>
      </section>
    );
  }

  return (
    <section id="profile" className="pf">
      <div className="side">
        <div className="who">
          <small>Signed in as</small>
          <b>{user?.email}</b>
          <button type="button" className="link" onClick={handleLogout}>
            Sign out
          </button>
        </div>
        <nav id="snav" aria-label="Profile sections">
          {SECTIONS.map(s => (
            <button key={s.id} type="button" data-s={s.id} onClick={() => {
              const el = document.getElementById(`sec-${s.id}`);
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}>
              {s.title}
            </button>
          ))}
        </nav>
      </div>
      <form id="pform" noValidate onSubmit={handleSubmit}>
        <h1 id="ptitle" style={{ margin: "0 0 4px", fontSize: "28px" }}>
          {formData.fn || formData.ln ? "Edit emergency profile" : "Create emergency profile"}
        </h1>
        <div className="msg" role="status">
          ✓ Signed in successfully. Complete your emergency profile below.
        </div>
        <p className="sub" style={{ marginTop: "14px" }}>
          Fields marked <span className="req">*</span> are required. Verified ER
          staff can see this information in a life-threatening emergency.
        </p>

        <div id="secs">
          {SECTIONS.map(section => (
            <section key={section.id} className="card sec" id={`sec-${section.id}`}>
              <div className="sh"><h2>{section.title}</h2></div>
              <div className="sb">
                {section.note && <p className="sub" style={{ marginTop: "16px" }}>{section.note}</p>}

                {section.photo && (
                  <div className="photo">
                    <div className="ph" id="phv">
                      {photoPreview ? <img alt="Profile photo preview" src={photoPreview} /> : "👤"}
                    </div>
                    <div>
                      <label htmlFor="f_photo" style={{ marginTop: 0 }}>Profile photo</label>
                      <input type="file" id="f_photo" accept="image/*" onChange={handlePhotoChange} ref={el => { fileInputsRef.current.photo = el; }} />
                      <div className="hint">JPG or PNG, up to 2 MB</div>
                      <div className="err" data-e="f_photo"></div>
                    </div>
                  </div>
                )}

                {section.fields && (
                  <div className="grid">
                    {section.fields.map(field => {
                      const error = fieldErrors[field.id];
                      const fieldId = `f_${field.id}`;
                      return (
                        <div key={field.id} className={`fld${field.type === "textarea" ? " wide" : ""}`}>
                          <label htmlFor={fieldId}>
                            {field.label} {field.required && <span className="req">*</span>}
                          </label>
                          {field.type === "select" && (
                            <select
                              id={fieldId}
                              value={formData[field.id] || ""}
                              onChange={e => handleChange(field.id, e.target.value)}
                              required={field.required}
                              disabled={saving}
                              aria-invalid={!!error}
                            >
                              <option value="">Select</option>
                              {field.options?.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          )}
                          {field.type === "textarea" && (
                            <textarea
                              id={fieldId}
                              value={formData[field.id] || ""}
                              onChange={e => handleChange(field.id, e.target.value)}
                              rows={3}
                              required={field.required}
                              disabled={saving}
                              placeholder={field.id === "vac" ? "Vaccine names (one per line, up to 200 words)" : ""}
                              aria-invalid={!!error}
                            />
                          )}
                          {field.type !== "select" && field.type !== "textarea" && field.type !== "file" && (
                            <input
                              type={field.type}
                              id={fieldId}
                              value={formData[field.id] || ""}
                              onChange={e => handleChange(field.id, e.target.value)}
                              required={field.required}
                              disabled={saving}
                              max={field.type === "date" ? new Date().toISOString().split("T")[0] : field.type === "number" ? "500" : undefined}
                              min={field.type === "number" ? "1" : undefined}
                              step={field.type === "number" ? "0.1" : undefined}
                              accept={field.accept}
                              aria-invalid={!!error}
                            />
                          )}
                          {field.type === "file" && (
                            <input
                              type="file"
                              id={fieldId}
                              accept={field.accept}
                              onChange={e => {
                                const file = e.target.files?.[0];
                                if (file) handleChange(field.id, file);
                              }}
                              disabled={saving}
                              aria-invalid={!!error}
                            />
                          )}
                          <div className="err" data-e={fieldId}>{error}</div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {section.groups && section.groups.map((group, gi) => (
                  <div key={gi}>
                    <h3>{group.title}</h3>
                    <div className="grid">
                      {group.fields.map(field => {
                        const error = fieldErrors[field.id];
                        const fieldId = `f_${field.id}`;
                        return (
                          <div key={field.id} className={`fld${field.type === "textarea" ? " wide" : ""}`}>
                            <label htmlFor={fieldId}>
                              {field.label} {field.required && <span className="req">*</span>}
                            </label>
                            {field.type === "select" && (
                              <select
                                id={fieldId}
                                value={formData[field.id] || ""}
                                onChange={e => handleChange(field.id, e.target.value)}
                                required={field.required}
                                disabled={saving}
                                aria-invalid={!!error}
                              >
                                <option value="">Select</option>
                                {field.options?.map(opt => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                            )}
                            {field.type !== "select" && (
                              <input
                                type={field.type}
                                id={fieldId}
                                value={formData[field.id] || ""}
                                onChange={e => handleChange(field.id, e.target.value)}
                                required={field.required}
                                disabled={saving}
                                aria-invalid={!!error}
                              />
                            )}
                            <div className="err" data-e={fieldId}>{error}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {section.vac && (
                  <div>
                    <div className="grid">
                      <div className="fld wide">
                        <label htmlFor="f_vac">Vaccine names (one per line, up to 200 words)</label>
                        <textarea
                          id="f_vac"
                          value={formData.vaccinations || ""}
                          onChange={handleVacChange}
                          rows={6}
                          disabled={saving}
                          aria-invalid={!!fieldErrors.vaccinations}
                        />
                        <div className="err" data-e="f_vac">{fieldErrors.vaccinations}</div>
                      </div>
                    </div>
                    <div className="hint" id="wc" style={{ color: vacWords > 200 ? "var(--danger)" : "" }}>
                      {vacWords} / 200 words
                    </div>
                  </div>
                )}

                {section.rep && (() => {
                  const rep = section.rep;
                  return (
                    <div>
                      <div data-rep={rep.key} className="repeater">
                        {repeaters[rep.key].map((row: any, idx: number) => (
                          <div key={row.__uid || idx} className="item">
                            <div className="rh">
                              <b>{rep.label} <span className="num">{idx + 1}</span></b>
                              <button type="button" className="link rm" onClick={() => removeRepeaterRow(rep.key, row.__uid || idx)} disabled={saving}>
                                Remove
                              </button>
                            </div>
                            <div className="grid">
                              {rep.fields.map(field => {
                                const error = fieldErrors[`${rep.key}_${idx}_${field.id}`];
                                const fieldId = `f_${rep.key}_${row.__uid || idx}_${field.id}`;
                                return (
                                  <div key={field.id} className={`fld${field.type === "textarea" ? " wide" : ""}`}>
                                    <label htmlFor={fieldId}>
                                      {field.label} {field.required && <span className="req">*</span>}
                                    </label>
                                    {field.type === "select" && (
                                      <select
                                        id={fieldId}
                                        value={row[field.id] || ""}
                                        onChange={e => handleRepeaterChange(rep.key, idx, field.id, e.target.value)}
                                        required={field.required}
                                        disabled={saving}
                                        aria-invalid={!!error}
                                      >
                                        <option value="">Select</option>
                                        {field.options?.map(opt => (
                                          <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                      </select>
                                    )}
                                    {field.type === "textarea" && (
                                      <textarea
                                        id={fieldId}
                                        value={row[field.id] || ""}
                                        onChange={e => handleRepeaterChange(rep.key, idx, field.id, e.target.value)}
                                        rows={3}
                                        required={field.required}
                                        disabled={saving}
                                        aria-invalid={!!error}
                                      />
                                    )}
                                    {field.type !== "select" && field.type !== "textarea" && field.type !== "file" && (
                                      <input
                                        type={field.type}
                                        id={fieldId}
                                        value={row[field.id] || ""}
                                        onChange={e => handleRepeaterChange(rep.key, idx, field.id, e.target.value)}
                                        required={field.required}
                                        disabled={saving}
                                        aria-invalid={!!error}
                                      />
                                    )}
                                    {field.type === "file" && (() => {
                                        const fileUrl = row.file && typeof row.file === "string" ? row.file : "";
                                        const hasFile = row[field.id] instanceof File || fileUrl;
                                        const isImage = fileUrl.startsWith("data:image/") || (fileUrl.startsWith("http") && (row.type?.startsWith("image/") || row.file_name?.match(/\.(jpg|jpeg|png)$/i)));
                                        const isPdf = fileUrl.startsWith("data:application/pdf") || (fileUrl.startsWith("http") && row.type === "application/pdf");
                                        
                                        // Create blob URL for base64 PDFs to avoid browser restrictions
                                        const getPdfBlobUrl = (url: string) => {
                                          if (url.startsWith("data:application/pdf;base64,")) {
                                            const base64 = url.split(",")[1];
                                            const byteChars = atob(base64);
                                            const byteNumbers = new Array(byteChars.length);
                                            for (let i = 0; i < byteChars.length; i++) {
                                              byteNumbers[i] = byteChars.charCodeAt(i);
                                            }
                                            const byteArray = new Uint8Array(byteNumbers);
                                            const blob = new Blob([byteArray], { type: "application/pdf" });
                                            return URL.createObjectURL(blob);
                                          }
                                          return url;
                                        };
                                        
                                        if (hasFile && !saving) {
                                          // Show preview with remove option
                                          return (
                                            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                              <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                                                <span style={{ fontSize: "13px", color: "var(--muted)" }}>
                                                  Current: {row[field.id] instanceof File
                                                    ? row[field.id].name
                                                    : row.file_name || row.name}
                                                </span>
                                                <button type="button" className="link rm" style={{ padding: "4px 12px", fontSize: "12px" }} onClick={() => handleRepeaterChange(rep.key, idx, field.id, "")}>
                                                  🗑 Remove
                                                </button>
                                              </div>
                                              {isImage && fileUrl && (
                                                <img src={fileUrl} alt="Report preview" style={{ maxWidth: "200px", maxHeight: "150px", border: "1px solid var(--line)", borderRadius: "4px" }} />
                                              )}
                                              {isPdf && fileUrl && (
                                                <a href={getPdfBlobUrl(fileUrl)} target="_blank" rel="noopener noreferrer" style={{ fontSize: "13px", color: "var(--primary)", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                                  📄 Open PDF
                                                </a>
                                              )}
                                            </div>
                                          );
                                        }
                                        
                                        // Show file input
                                        return (
                                          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                            <input
                                              type="file"
                                              id={fieldId}
                                              accept={field.accept}
                                              onChange={e => {
                                                const file = e.target.files?.[0];
                                                if (file) handleRepeaterChange(rep.key, idx, field.id, file);
                                              }}
                                              disabled={saving}
                                              aria-invalid={!!error}
                                            />
                                            {hasFile && saving && (
                                              <span style={{ fontSize: "13px", color: "var(--muted)" }}>
                                                Current: {row[field.id] instanceof File
                                                  ? row[field.id].name
                                                  : row.file_name || row.name}
                                              </span>
                                            )}
                                          </div>
                                        );
                                      })()}
                                    <div className="err" data-e={fieldId}>{error}</div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                      <button type="button" className="add" data-add={rep.key} onClick={() => addRepeaterRow(rep.key)} disabled={saving || (repeaters[rep.key]?.length || 0) >= rep.max}>
                        + Add {rep.label.toLowerCase()}
                      </button>
                      <span className="cnt" id={`c_${rep.key}`}>
                        {repeaters[rep.key]?.length || 0} of {rep.max}
                      </span>
                    </div>
                  );
                })()}
              </div>
            </section>
          ))}
        </div>

        <div className="bar">
          <button className="btn" id="sv" type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save profile"}
          </button>
          <span id="pmsg" role="status"></span>
        </div>

        <div className="msg" hidden={msg.hidden} role="status" style={{ borderLeftColor: msg.error ? "var(--danger)" : "var(--green)" }}>
          {msg.text}
        </div>
      </form>
    </section>
  );
}