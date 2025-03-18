// import React from "react";

type TextInputProps = {
  placeholder?: string; // Placeholder text
  value: string; // Controlled value
  onChange: (value: string) => void; // Change handler
};

function TextInput({ placeholder = "Type here..", value, onChange }: TextInputProps) {
  return (
    <input
      type="text"
      className="w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export default TextInput;
