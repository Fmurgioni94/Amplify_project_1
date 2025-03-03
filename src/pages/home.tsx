
import { useState } from "react";
import Title from "../components/title.tsx";
import WelcomeMessage from "../components/welcomeMessage.tsx";
import TextInput from "../components/input_bar.tsx";
import Button from "../components/button.tsx";
import { useAuthenticator } from '@aws-amplify/ui-react';
import axios from 'axios';

function Home() {
    const [text, setText] = useState("");
    

    const handleButtonClick = async() => {
        console.log("Input Text:", text);
        const options = {
          method: 'POST',
          url: 'http://cdkcat-chesh-c2hapxe5isia-1442475508.eu-west-2.elb.amazonaws.com/message',
          headers: {'Content-Type': 'application/json'},
          data: {text: text}
        };
        
        try {
          // Make the request to the API Gateway
          const response = await axios.request(options); // Adjust as needed for your API
          console.log('Response from the cat:', response.data);
    
          // Optionally, do something with the response, e.g., update state
        } catch (error) {
          console.error('Error sending request:', error);
        }

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
