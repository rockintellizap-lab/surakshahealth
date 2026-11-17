"use client";

export default function QRView() {
  return (
    <section id="qrpage" className="qrp">
      <section>
        <div className="msg" role="status">
          ✓ Approved by SurakshaHealth admin on <span id="apdt"></span>. Your
          Emergency QR is ready.
        </div>
        <div className="hcard" id="hcard">
          <div className="hc-top">
            <div>
              <b>Emergency Health Card</b>
              <span>SurakshaHealth India · ABDM aligned</span>
            </div>
            <em>VERIFIED</em>
          </div>
          <div className="hc-body">
            <div>
              <div className="hc-name" id="hcName">Citizen Name</div>
              <div className="hc-id" id="hcId">ABHA not linked</div>
              <dl className="hc-g">
                <div>
                  <dt>Blood group</dt>
                  <dd className="red" id="hcBg">—</dd>
                </div>
                <div>
                  <dt>Date of birth</dt>
                  <dd id="hcDob">—</dd>
                </div>
                <div>
                  <dt>Allergies</dt>
                  <dd id="hcAl">None reported</dd>
                </div>
                <div>
                  <dt>Emergency contact</dt>
                  <dd id="hcEc">—</dd>
                </div>
              </dl>
            </div>
            <div className="hc-qr">
              <div id="qrbox"></div>
              <span id="qrid">ID: —</span>
            </div>
          </div>
          <div className="hc-foot">
            Scan in an emergency · Access needs DOB + ID verification and is logged
          </div>
        </div>
      </section>
      <aside className="card">
        <div className="sh">
          <h2>Your Emergency QR</h2>
        </div>
        <div className="sb">
          <p className="sub" style={{ marginTop: "16px" }}>
            The QR holds only a secure reference, never your medical data. Doctors
            see your details only after verification.
          </p>
          <div className="acts col">
            <button type="button" className="btn" id="qDl">
              ⬇ Download QR (PNG)
            </button>
            <button type="button" className="btn ghost" id="qPr">
              🖨 Print health card
            </button>
            <button type="button" className="btn ghost" id="qCp">
              🔗 Copy secure link
            </button>
            <button type="button" className="btn ghost" id="qRg">
              ↻ Regenerate QR
            </button>
          </div>
          <div className="msg" id="qmsg" hidden role="status"></div>
          <h3>Where to keep it</h3>
          <ul className="tips">
            <li>Helmet sticker or bike key tag</li>
            <li>Printed card in your wallet</li>
            <li>Phone lock-screen image</li>
          </ul>
          <div className="acts">
            <button type="button" className="link" id="qBack">
              Back to profile
            </button>
            <button type="button" className="link" data-out>
              Sign out
            </button>
          </div>
        </div>
      </aside>
    </section>
  );
}