type TitleProps = {
    text: string;
    size?: "sm" | "md" | "lg"; // Dimensioni personalizzabili
  };
  
  function Title({ text, size = "md" }: TitleProps) {
    // const textSize = size === "sm" ? "text-base" : size === "md" ? "text-25xl" : "text-50xl";

    const sizeClasses = {
        sm: "text-base",
        md: "text-3xl",
        lg: "text-6xl"
      };

    const textSize = sizeClasses[size];
  
    return <h1 className={`${textSize} font-bold`}>{text}</h1>;
  }
  
  export default Title;
  