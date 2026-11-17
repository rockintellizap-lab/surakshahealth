export default function Footer() {
  return (
    <footer>
      <div className="ft">
        <div>
          <b>SurakshaHealth India</b>
          <p>
            National Emergency Health Locker &amp; Trauma Access Portal. A GovTech
            prototype aligned with UX4G 3.0 and ABDM.
          </p>
        </div>
        <div>
          <b>Quick links</b>
          <a href="#signin">Citizen login</a>
          <a href="#signup">Register</a>
          <a href="#forgot">Account recovery</a>
        </div>
        <div>
          <b>Policies</b>
          <a href="#signin">Privacy policy</a>
          <a href="#signin">Accessibility statement</a>
          <a href="#signin">Help &amp; support</a>
        </div>
      </div>
      <div className="fb">
        © SurakshaHealth India · Prototype only. Not an official Government of India service.
      </div>
    </footer>
  );
}