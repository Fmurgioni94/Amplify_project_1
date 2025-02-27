// import React from "react";

type TextInputProps = {
  placeholder?: string; // Placeholder text
  value: string; // Controlled value
  onChange: (value: string) => void; // Change handler
};

function TextInput({ placeholder = "Type here to send a request...", value, onChange }: TextInputProps) {
  return (
    <div className="flex flex-col gap-2">
      <input
        type="text"
        className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export default TextInput;
