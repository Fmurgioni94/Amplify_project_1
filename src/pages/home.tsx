import { useState, useEffect } from "react";
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
    const [socket, setSocket] = useState<WebSocket | null>(null);
    // const [requestId, setRequestId] = useState<string | null>(null);

    // Initialize WebSocket connection
    useEffect(() => {
        const ws = new WebSocket("wss://1e2wwsnu5d.execute-api.eu-west-2.amazonaws.com/production/");
        
        ws.onopen = () => {
            console.log('WebSocket Connected');
            setSocket(ws);
        };

        ws.onerror = (error) => {
            console.error('WebSocket Error:', error);
        };

        ws.onclose = () => {
            console.log('WebSocket Disconnected');
            setSocket(null);
        };

        ws.onmessage = (event) => {
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
                        let parsedData = typeof result.text === 'string' ? JSON.parse(result.text) : result.text;
                        console.log('Parsed result data:', parsedData);
                        
                        const taskData: TasksData = {};
                        if (parsedData.tasks && Array.isArray(parsedData.tasks)) {
                            parsedData.tasks.forEach((task: Task) => {
                                taskData[task.id.toString()] = {
                                    name_of_the_task: task.name_of_the_task,
                                    id: task.id,
                                    dependencies: task.dependencies || [],
                                    estimated_duration: task.estimated_duration
                                };
                            });
                        }

                        setCatMessage(result.text);
                        setRoadmapData(taskData);
                        setIsLoading(false);
                    } catch (error) {
                        console.error('Error processing result data:', error);
                        setIsLoading(false);
                    }
                }
            } catch (error) {
                console.error('Error parsing WebSocket message:', error);
                setIsLoading(false);
            }
        };

        return () => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
        };
    }, []);

    const handleButtonClick = async () => {
        if (!text.trim() || !socket) {
            console.log('Cannot send: text empty or socket not connected');
            return;
        }

        // Clear previous state and start loading
        setIsLoading(true);
        setRoadmapData(null);
        setCatMessage("");

        const message = {
            "action": "startTask",
            "body": text
        };

        // Send the message
        try {
            console.log('Sending message:', message);
            socket.send(JSON.stringify(message));
            setText("");
        } catch (error) {
            console.error('Error sending message:', error);
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
                                    label={isLoading ? "Processing..." : "Send request"}
                                    onClick={handleButtonClick}
                                    disabled={isLoading || !text.trim() || !socket}
                                />
                            </div>
                        </div>

                        {/* Connection status */}
                        <div className="text-sm text-gray-500">
                            WebSocket: {socket ? "Connected" : "Disconnected"}
                            {isLoading && " (Loading...)"}
                        </div>

                        {/* Loading spinner */}
                        {isLoading && (
                            <div className="flex flex-col items-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                                <p className="text-gray-600 mt-2">Generating your roadmap...</p>
                            </div>
                        )}

                        {/* Content */}
                        {!isLoading && catMessage && <MessageFromTheCat message={catMessage} />}
                        {!isLoading && roadmapData && <DynamicRoadmap tasksData={roadmapData} />}
                        
                        <Button label="Sign out" onClick={signOut} />
                    </div>
                </div>
            </main>
        </div>
    );
}

export default Home;
