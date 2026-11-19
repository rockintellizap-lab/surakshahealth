export default function Footer({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <footer>
      <div className="ft">
        <div>
          <b>SurakshaHealth India</b>
<p>
            National Emergency Health Locker & Trauma Access Portal. A CSR initiative by NIPER aligned with UX4G 3.0 and ABDM.
          </p>
        </div>
        {!isLoggedIn && (
          <div>
            <b>Quick links</b>
            <a href="#signin">Citizen login</a>
            <a href="#signup">Register</a>
            <a href="#forgot">Account recovery</a>
          </div>
        )}
        <div>
          <b>Policies</b>
          <a href="#signin">Privacy policy</a>
          <a href="#signin">Accessibility statement</a>
          <a href="#signin">Help & support</a>
        </div>
      </div>
      <div className="fb">
        © SurakshaHealth India. CSR initiative by NIPER.
      </div>
    </footer>
  );
}