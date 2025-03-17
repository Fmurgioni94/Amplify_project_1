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
          console.log('Raw message received:', event.data);
          try {
            const data = JSON.parse(event.data);
            console.log('Parsed WebSocket message:', data);

            // If this is the initial "processing" message, keep loading
            if (data.status === "processing" && data.message === "Task started!") {
              console.log('Task started, waiting for results...');
              return;
            }

            // Handle the completion message
            if (data.status === "complete" && data.result) {
              const result = data.result;
              if (!result?.text) {
                console.log('No result text in response');
                setIsLoading(false);
                return;
              }

              try {
                // First, parse the text field which contains the JSON string
                const parsedText = JSON.parse(result.text);
                console.log('Parsed result text:', parsedText);

                // Validate the structure before processing
                if (parsedText && parsedText.tasks && Array.isArray(parsedText.tasks)) {
                  const taskData: TasksData = {};
                  
                  parsedText.tasks.forEach((task: any) => {
                    // Validate required fields exist before processing
                    if (task && typeof task.id !== 'undefined') {
                      const taskId = task.id.toString();
                      taskData[taskId] = {
                        name_of_the_task: task.name_of_the_task || 'Unnamed Task',
                        id: task.id,
                        dependencies: Array.isArray(task.dependencies) ? task.dependencies : [],
                        estimated_duration: task.estimated_duration || 0
                      };
                    } else {
                      console.warn('Skipping invalid task:', task);
                    }
                  });

                  setRoadmapData(taskData);
                  setCatMessage(result.text);
                } else {
                  console.error('Invalid tasks data structure:', parsedText);
                }
              } catch (error) {
                console.error('Error processing result data:', error);
              } finally {
                setIsLoading(false);
              }
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
            setIsLoading(false);
          }
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
