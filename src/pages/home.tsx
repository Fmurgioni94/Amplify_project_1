
import { useState } from "react";
import Title from "../components/title.tsx";
import WelcomeMessage from "../components/welcomeMessage.tsx";
import TextInput from "../components/input_bar.tsx";
import Button from "../components/button.tsx";
import { useAuthenticator } from '@aws-amplify/ui-react';

function Home() {
    const [text, setText] = useState("");

    const handleButtonClick = () => {
        console.log("Input Text:", text);
      };
    const { signOut } = useAuthenticator();
    
  return (
    <div>
      
      <Title text="Goal Breaking Component" size="lg" />
      <WelcomeMessage />
      <TextInput value={text} onChange={setText} />
      <Button label="Send request" onClick={handleButtonClick}/>
      <button onClick={signOut}>Sign out</button>
    </div>
  );
}

export default Home;
