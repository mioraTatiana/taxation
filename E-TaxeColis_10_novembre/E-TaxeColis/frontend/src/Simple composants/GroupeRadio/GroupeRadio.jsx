import React from "react";
import "./GroupeRadio.css";

// Groupe de boutons radio : options = [{ value, label }]
function GroupeRadio({ label, name, options, value, onChange, requis }) {
  return (
    <div className="GroupeRadio">
      <span className="GroupeRadioLabel">
        {label}
        {requis && <span className="GroupeRadioRequis"> *</span>}
      </span>

      <div className="GroupeRadioOptions">
        {options.map((option) => (
          <label key={option.value} className="GroupeRadioOption">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
            />
            {option.label}
          </label>
        ))}
      </div>
    </div>
  );
}

export default GroupeRadio;
