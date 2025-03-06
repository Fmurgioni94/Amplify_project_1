// import React from "react";

type TextInputProps = {
  placeholder?: string; // Placeholder text
  value: string; // Controlled value
  onChange: (value: string) => void; // Change handler
};

function TextInput({ placeholder = "Type here..", value, onChange }: TextInputProps) {
  return (
    <div className="flex flex-col mb-16">
      <input
        type="text"
        className="input-field border-radius-s height-100"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export default TextInput;
