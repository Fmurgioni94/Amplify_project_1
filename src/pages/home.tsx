import { useState } from "react";
import Title from "../components/title.tsx";
import WelcomeMessage from "../components/welcomeMessage.tsx";
import TextInput from "../components/input_bar.tsx";
import Button from "../components/button.tsx";
import MessageFromTheCat from "../components/message_from_the_cat.tsx";
import { useAuthenticator } from '@aws-amplify/ui-react';
import axios from 'axios';

function Home() {
    const [text, setText] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [catMessage, setCatMessage] = useState("");
    const { signOut } = useAuthenticator();

    const handleButtonClick = async() => {
      if (!text.trim()) return; 
      setIsLoading(true);
      console.log("Input Text:", text);
      const options = {
        method: 'POST',
        url :  'https://i1duln7306.execute-api.eu-west-2.amazonaws.com/prod/cat/message',
        headers: {'Content-Type': 'application/json'},
        data: {text: text}
      };
        
      try {
        // Make the request to the API Gateway
        const response = await axios.request(options); // Adjust as needed for your API
        console.log('Response from the cat:', response.data);
        setCatMessage(response.data.message);
        setText("");
  
      // Optionally, do something with the response, e.g., update state
      } catch (error) {
        console.error('Error sending request:', error);
      } finally {
        setIsLoading(false);
      }

    };
  
    
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation bar */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <Title text="Goal Breaking Component" size="lg" />
          
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-8">
          <WelcomeMessage />
          
          <div className="flex flex-col space-y-16">
            <TextInput value={text} onChange={setText} />
            <div className="flex justify-center">
              <Button
                label={isLoading ? "Sending..." : "Send request"}
                onClick={handleButtonClick}
                disabled={isLoading || !text.trim()}
              />
            </div>

            {/* Cat Message Display */}
            <MessageFromTheCat message={catMessage} />
            <Button label="Sign out" onClick={signOut} />
          </div>
        </div>
      </main>
    </div>
  );
}

export default Home;
