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
        className="w-full px-10 py-4 text-gray-700 bg-white border border-gray-300 
                 rounded-lg shadow-sm transition-all duration-200
                 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400
                 hover:border-gray-400
                 placeholder-gray-400"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export default TextInput;
