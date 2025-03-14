import { useState } from "react";
import Title from "../components/title.tsx";
import WelcomeMessage from "../components/welcomeMessage.tsx";
import TextInput from "../components/input_bar.tsx";
import Button from "../components/button.tsx";
import MessageFromTheCat from "../components/message_from_the_cat.tsx";
import DynamicRoadmap from "../components/roadmap.tsx";
import { useAuthenticator } from '@aws-amplify/ui-react';

// Define the Task interface
interface Task {
  name_of_the_task: string;
  id: number;
  dependencies: number[];
  estimated_duration: number;
}

interface TasksData {
  [key: string]: Task;
}

function Home() {
    const [text, setText] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [catMessage, setCatMessage] = useState("");
    const [roadmapData, setRoadmapData] = useState<TasksData | null>(null);
    const { signOut } = useAuthenticator();

    let socket: WebSocket | null = null;
    socket = new WebSocket("wss://1e2wwsnu5d.execute-api.eu-west-2.amazonaws.com/production/");

    const handleButtonClick = async() => {
      if (!text.trim()) return; 
      setIsLoading(true);
      console.log("Input Text:", text);

      const message = {
        "action" : "startTask",
        "body" : text
      }
        
      try {
        socket.send(JSON.stringify(message))
        socket.onmessage = (event) => {
          const data = JSON.parse(event.data);
          console.log('Message from server:', event.data);
          const result: any = data.result;
          const message: string | undefined = result?.text;
          
          // Try to parse the message as JSON if it exists
          if (message) {
            try {
              const parsedData = JSON.parse(message);
              if (typeof parsedData === 'object') {
                setRoadmapData(parsedData);
              }
            } catch (e) {
              console.log('Message is not in JSON format');
            }
          }

          setCatMessage(message ?? "");
        };
        setText("");
  
      } catch (error) {
        console.error('Error sending request:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
                <Title text="Goal Breaking Component" size="lg" />
            </div>

            <main className="max-w-4xl mx-auto px-4 py-8">
                <div className="bg-white rounded-xl shadow-sm p-6 space-y-8">
                    <WelcomeMessage />
                    
                    <div className="flex flex-col space-y-16">
                        <div className="container">
                            <TextInput value={text} onChange={setText} />
                            <div className="flex justify-center">
                                <Button
                                    label={isLoading ? "Sending..." : "Send request"}
                                    onClick={handleButtonClick}
                                    disabled={isLoading || !text.trim()}
                                />
                            </div>
                        </div>

                        <MessageFromTheCat message={catMessage} />
                        
                        {roadmapData && <DynamicRoadmap tasksData={roadmapData} />}
                        
                        <Button label="Sign out" onClick={signOut} />
                    </div>
                </div>
            </main>
        </div>
    );
}

export default Home;
