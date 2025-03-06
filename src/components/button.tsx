type ButtonProps = {
    label: string; // Button text
    onClick: () => void; // Function to execute when clicked
    disabled?: boolean; // Disable the button
  };
  
  function Button({ label, onClick, disabled = false }: ButtonProps) {
    return (
      <button
        className={`px-4 py-2 rounded-lg transition line-border ${
          disabled 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-blue-500 hover:bg-blue-600 text-white'
        }`}
        onClick={onClick}
        disabled={disabled}
      >
        {label}
      </button>
    );
  }
  
  export default Button;
  