type ButtonProps = {
    label: string; // Button text
    onClick: () => void; // Function to execute when clicked
  };
  
  function Button({ label, onClick }: ButtonProps) {
    return (
      <button
        className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
        onClick={onClick}
      >
        {label}
      </button>
    );
  }
  
  export default Button;
  