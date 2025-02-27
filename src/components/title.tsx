type TitleProps = {
    text: string;
    size?: "sm" | "md" | "lg"; // Dimensioni personalizzabili
  };
  
  function Title({ text, size = "md" }: TitleProps) {
    const textSize = size === "sm" ? "text-lg" : size === "md" ? "text-2xl" : "text-4xl";
  
    return <h1 className={`${textSize} font-bold`}>{text}</h1>;
  }
  
  export default Title;
  