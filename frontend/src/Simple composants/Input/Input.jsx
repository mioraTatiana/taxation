
import React from 'react';
import './Input.css';

const CustomInput = ({
  type,
  label,
  value,
  onChange,
  name,
  placeholder,
  readOnly,
  erreur,
  required = false
}) => {
  return (
    <div className="InputDiv">
      <label htmlFor={name} className="labelInput">
        {label}
        {required && <span className="asterisqueRouge"> *</span>}
      </label>

      <input
        id={name}
        type={type}
        value={value}
        onChange={onChange}
        name={name}
        placeholder={placeholder}
        className="inputCom"
        readOnly={readOnly}
        required={required}
      />

      {erreur && <p className="champSuggestionsErreur">{erreur}</p>}
    </div>
  );
};

export default CustomInput;
