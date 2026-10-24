import { useState } from "react";
import "./PasswordField.css";

function PasswordField({
  id,
  label,
  name,
  value,
  onChange,
  placeholder,
  autoComplete = "current-password",
  className = "",
  required = true,
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={className}>
      {label && <label htmlFor={id}>{label}</label>}
      <div className="password-input-wrap">
        <input
          id={id}
          className="password-input"
          type={visible ? "text" : "password"}
          name={name}
          placeholder={placeholder}
          autoComplete={autoComplete}
          value={value}
          onChange={onChange}
          required={required}
          minLength={6}
          maxLength={128}
        />
        <button
          className="password-visibility-toggle"
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
        >
          {visible ? "Hide" : "Show"}
        </button>
      </div>
    </div>
  );
}

export default PasswordField;
