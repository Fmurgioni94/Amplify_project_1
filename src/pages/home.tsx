
import { useState } from "react";
import Title from "../components/title.tsx";
import WelcomeMessage from "../components/welcomeMessage.tsx";
import TextInput from "../components/input_bar.tsx";
import Button from "../components/button.tsx";

function Home() {
    const [text, setText] = useState("");

    const handleButtonClick = () => {
        console.log("Input Text:", text);
      };
    
  return (
    <div>
      <Title text="Goal Breaking Component" size="lg" />
      <Title text="A powerful tool that will help you achieve your goals" size="md" />
      <Title text="build on Amplify" size="sm" />
      <WelcomeMessage />
      <TextInput value={text} onChange={setText} />
      <Button label="Send request" onClick={handleButtonClick}/>
    </div>
  );
}

export default Home;
