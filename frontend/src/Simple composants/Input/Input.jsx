import React from 'react';
import './Input.css';

const CustomInput = ({
  type,
  label,
  value,
  onChange,
  name,
  placeholder,
  readOnly
}) => {

  return (
    <div className="InputDiv">

      <label htmlFor={name} className="labelInput">
        {label}
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
      />

    </div>
  );
};

export default CustomInput;