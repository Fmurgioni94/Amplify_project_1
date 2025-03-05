type WelcomeMessageProps = {
    message?: string; // Customizable message
    color?: string; // Text color
    emoji?: string; // Optional emoji
  };
  
  function WelcomeMessage({
    message = "Welcome to my website!", // Default message
    color = "text-blue-500", // Default color
    emoji = "👋😎",
  }: WelcomeMessageProps) {
    return <p className={`text-xl font-semibold ${color}`}>{emoji} {message}</p>;
  }
  
  export default WelcomeMessage;
  