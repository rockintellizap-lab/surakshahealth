"use client";

export default function StatusView() {
  return (
    <section id="status" className="single">
      <section className="card">
        <div className="sh">
          <h2>Application status</h2>
        </div>
        <div className="sb">
          <div className="stline">
            <div>
              <small>Application ID</small>
              <b id="appid">—</b>
            </div>
            <div>
              <small>Submitted on</small>
              <b id="subdt">—</b>
            </div>
            <span className="pill wait">Pending admin approval</span>
          </div>
          <ol className="tl">
            <li className="done">
              <i>✓</i>
              <div>
                <b>Profile submitted</b>
                <span>Your emergency profile has been saved.</span>
              </div>
            </li>
            <li className="cur">
              <i>2</i>
              <div>
                <b>Admin verification</b>
                <span>
                  An administrator verifies your details and ID. This usually
                  takes 1–2 working days.
                </span>
              </div>
            </li>
            <li>
              <i>3</i>
              <div>
                <b>Emergency QR issued</b>
                <span>
                  Once approved, you can generate, download and print your
                  Emergency QR.
                </span>
              </div>
            </li>
          </ol>
          <div className="acts">
            <button type="button" className="btn" id="demoAppr">
              Simulate admin approval (prototype)
            </button>
            <button type="button" className="btn ghost" id="editProf">
              Edit profile
            </button>
            <button type="button" className="link" data-out>
              Sign out
            </button>
          </div>
        </div>
      </section>
    </section>
  );
}