"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useView } from "@/context/ViewContext";
import { getProfile, saveProfile } from "@/lib/profileService";
import type { EmergencyProfileFormData } from "@/lib/profile";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;

export default function ProfileView() {
  const { user, logout } = useAuth();
  const { setView } = useView();
  const [profile, setProfile] = useState<EmergencyProfileFormData>({
    bloodGroup: "",
    dateOfBirth: "",
    allergies: "",
    emergencyContact: "",
    abhaId: "",
    aadhaarLast4: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ text: "", hidden: true, error: false });
  const [medications, setMedications] = useState<Array<{id: string, name: string, dosage: string, frequency: string}>>([]);
  const [conditions, setConditions] = useState<Array<{id: string, name: string, details: string}>>([]);
  const [documents, setDocuments] = useState<Array<{id: string, name: string, type: string, url: string}>>([]);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getProfile(user.uid);
      if (data) {
        setProfile({
          bloodGroup: data.bloodGroup,
          dateOfBirth: data.dateOfBirth,
          allergies: data.allergies,
          emergencyContact: data.emergencyContact,
          abhaId: data.abhaId || "",
          aadhaarLast4: data.aadhaarLast4 || "",
        });
      }
    } catch (err) {
      console.error("Failed to load profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setSaving(true);
    setMsg({ text: "", hidden: true, error: false });
    try {
      await saveProfile(user.uid, profile);
      setMsg({ text: "Profile saved successfully!", hidden: false, error: false });
    } catch (err) {
      setMsg({ text: "Failed to save profile. Please try again.", hidden: false, error: true });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setView("auth");
  };

  const addMedication = () => {
    setMedications([...medications, { id: Date.now().toString(), name: "", dosage: "", frequency: "" }]);
  };

  const removeMedication = (id: string) => {
    setMedications(medications.filter(m => m.id !== id));
  };

  const addCondition = () => {
    setConditions([...conditions, { id: Date.now().toString(), name: "", details: "" }]);
  };

  const removeCondition = (id: string) => {
    setConditions(conditions.filter(c => c.id !== id));
  };

  const addDocument = () => {
    setDocuments([...documents, { id: Date.now().toString(), name: "", type: "", url: "" }]);
  };

  const removeDocument = (id: string) => {
    setDocuments(documents.filter(d => d.id !== id));
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
        <nav id="snav" aria-label="Profile sections"></nav>
      </div>
      <form id="pform" noValidate onSubmit={handleSubmit}>
        <h1 id="ptitle" style={{ margin: "0 0 4px", fontSize: "28px" }}>
          Create emergency profile
        </h1>
        <div className="msg" role="status">
          ✓ Signed in successfully. Complete your emergency profile below.
        </div>
        <p className="sub" style={{ marginTop: "14px" }}>
          Fields marked <span className="req">*</span> are required. Verified ER
          staff can see this information in a life-threatening emergency.
        </p>

        <div className="grid">
          <div>
            <label htmlFor="pf-bloodGroup">
              Blood Group <span className="req">*</span>
            </label>
            <select
              id="pf-bloodGroup"
              value={profile.bloodGroup}
              onChange={(e) => setProfile({ ...profile, bloodGroup: e.target.value })}
              required
              disabled={saving}
            >
              <option value="">Select blood group</option>
              {BLOOD_GROUPS.map((bg) => (
                <option key={bg} value={bg}>{bg}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="pf-dob">
              Date of Birth <span className="req">*</span>
            </label>
            <input
              id="pf-dob"
              type="date"
              value={profile.dateOfBirth}
              onChange={(e) => setProfile({ ...profile, dateOfBirth: e.target.value })}
              required
              max={new Date().toISOString().split("T")[0]}
              disabled={saving}
            />
          </div>

          <div className="wide">
            <label htmlFor="pf-allergies">
              Allergies <span className="req">*</span>
            </label>
            <textarea
              id="pf-allergies"
              value={profile.allergies}
              onChange={(e) => setProfile({ ...profile, allergies: e.target.value })}
              placeholder="e.g., Penicillin, Peanuts, Latex — or 'None known'"
              rows={3}
              required
              disabled={saving}
            />
          </div>

          <div className="wide">
            <label htmlFor="pf-emergencyContact">
              Emergency Contact <span className="req">*</span>
            </label>
            <input
              id="pf-emergencyContact"
              type="tel"
              value={profile.emergencyContact}
              onChange={(e) => setProfile({ ...profile, emergencyContact: e.target.value })}
              placeholder="Name — Phone — Relationship"
              required
              disabled={saving}
            />
          </div>

          <div>
            <label htmlFor="pf-abha">
              ABHA ID <small>(optional, 14 digits)</small>
            </label>
            <input
              id="pf-abha"
              type="text"
              value={profile.abhaId}
              onChange={(e) => setProfile({ ...profile, abhaId: e.target.value })}
              placeholder="91-8840-2219-4401"
              maxLength={17}
              disabled={saving}
            />
          </div>

          <div>
            <label htmlFor="pf-aadhaar">
              Aadhaar (last 4 digits) <small>(optional)</small>
            </label>
            <input
              id="pf-aadhaar"
              type="text"
              value={profile.aadhaarLast4}
              onChange={(e) => setProfile({ ...profile, aadhaarLast4: e.target.value })}
              placeholder="1234"
              maxLength={4}
              disabled={saving}
            />
          </div>
        </div>

        <div id="secs">
          <div className="sec">
            <div className="rh">
              <h3>Medications</h3>
              <button type="button" className="add" onClick={addMedication} disabled={saving}>
                + Add medication
              </button>
            </div>
            {medications.map((med, idx) => (
              <div key={med.id} className="item">
                <div className="grid" style={{ marginTop: "12px" }}>
                  <div>
                    <label>Medication name <span className="req">*</span></label>
                    <input
                      value={med.name}
                      onChange={(e) => setMedications(medications.map(m => m.id === med.id ? { ...m, name: e.target.value } : m))}
                      placeholder="e.g., Metoprolol"
                      disabled={saving}
                    />
                  </div>
                  <div>
                    <label>Dosage</label>
                    <input
                      value={med.dosage}
                      onChange={(e) => setMedications(medications.map(m => m.id === med.id ? { ...m, dosage: e.target.value } : m))}
                      placeholder="e.g., 50 mg"
                      disabled={saving}
                    />
                  </div>
                  <div>
                    <label>Frequency</label>
                    <input
                      value={med.frequency}
                      onChange={(e) => setMedications(medications.map(m => m.id === med.id ? { ...m, frequency: e.target.value } : m))}
                      placeholder="e.g., Once daily"
                      disabled={saving}
                    />
                  </div>
                </div>
                <button type="button" className="link" onClick={() => removeMedication(med.id)} disabled={saving} style={{ marginTop: "8px" }}>
                  Remove
                </button>
              </div>
            ))}
            {medications.length === 0 && (
              <p className="sub" style={{ marginTop: "12px" }}>No medications added yet.</p>
            )}
          </div>

          <div className="sec">
            <div className="rh">
              <h3>Medical Conditions</h3>
              <button type="button" className="add" onClick={addCondition} disabled={saving}>
                + Add condition
              </button>
            </div>
            {conditions.map((cond) => (
              <div key={cond.id} className="item">
                <div className="grid" style={{ marginTop: "12px" }}>
                  <div className="wide">
                    <label>Condition name <span className="req">*</span></label>
                    <input
                      value={cond.name}
                      onChange={(e) => setConditions(conditions.map(c => c.id === cond.id ? { ...c, name: e.target.value } : c))}
                      placeholder="e.g., Hypertension, Type 2 Diabetes"
                      disabled={saving}
                    />
                  </div>
                  <div className="wide">
                    <label>Details</label>
                    <textarea
                      value={cond.details}
                      onChange={(e) => setConditions(conditions.map(c => c.id === cond.id ? { ...c, details: e.target.value } : c))}
                      placeholder="Diagnosis date, severity, treating doctor, etc."
                      rows={2}
                      disabled={saving}
                    />
                  </div>
                </div>
                <button type="button" className="link" onClick={() => removeCondition(cond.id)} disabled={saving} style={{ marginTop: "8px" }}>
                  Remove
                </button>
              </div>
            ))}
            {conditions.length === 0 && (
              <p className="sub" style={{ marginTop: "12px" }}>No conditions added yet.</p>
            )}
          </div>

          <div className="sec">
            <div className="rh">
              <h3>Documents</h3>
              <button type="button" className="add" onClick={addDocument} disabled={saving}>
                + Add document
              </button>
            </div>
            {documents.map((doc) => (
              <div key={doc.id} className="item">
                <div className="grid" style={{ marginTop: "12px" }}>
                  <div>
                    <label>Document name <span className="req">*</span></label>
                    <input
                      value={doc.name}
                      onChange={(e) => setDocuments(documents.map(d => d.id === doc.id ? { ...d, name: e.target.value } : d))}
                      placeholder="e.g., ECG Report, Discharge Summary"
                      disabled={saving}
                    />
                  </div>
                  <div>
                    <label>Type</label>
                    <select
                      value={doc.type}
                      onChange={(e) => setDocuments(documents.map(d => d.id === doc.id ? { ...d, type: e.target.value } : d))}
                      disabled={saving}
                    >
                      <option value="">Select type</option>
                      <option value="lab">Lab Report</option>
                      <option value="imaging">Imaging</option>
                      <option value="prescription">Prescription</option>
                      <option value="discharge">Discharge Summary</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="wide">
                    <label>URL / Reference</label>
                    <input
                      value={doc.url}
                      onChange={(e) => setDocuments(documents.map(d => d.id === doc.id ? { ...d, url: e.target.value } : d))}
                      placeholder="Link to document or file reference"
                      disabled={saving}
                    />
                  </div>
                </div>
                <button type="button" className="link" onClick={() => removeDocument(doc.id)} disabled={saving} style={{ marginTop: "8px" }}>
                  Remove
                </button>
              </div>
            ))}
            {documents.length === 0 && (
              <p className="sub" style={{ marginTop: "12px" }}>No documents added yet.</p>
            )}
          </div>
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