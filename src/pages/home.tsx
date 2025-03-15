import { useState, useEffect } from "react";
import Title from "../components/title.tsx";
import WelcomeMessage from "../components/welcomeMessage.tsx";
import TextInput from "../components/input_bar.tsx";
import Button from "../components/button.tsx";
import MessageFromTheCat from "../components/message_from_the_cat.tsx";
import DynamicRoadmap from "../components/roadmap.tsx";
import LoadingBar from "../components/LoadingBar.tsx";
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
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [catMessage, setCatMessage] = useState("");
    const [roadmapData, setRoadmapData] = useState<TasksData | null>(null);
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const { signOut } = useAuthenticator();

    // Helper function to calculate the next progress value
    const calculateNextProgress = (current: number): number => {
        if (current < 30) {
            return current + 2;
        } else if (current < 60) {
            return current + 1;
        } else if (current < 80) {
            return current + 0.5;
        } else if (current < 90) {
            return current + 0.1;
        }
        return current;
    };

    useEffect(() => {
        // Create WebSocket connection
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

        // Cleanup on unmount
        return () => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
        };
    }, []); // Empty dependency array means this runs once on mount

    const handleButtonClick = async() => {
        if (!text.trim() || !socket || socket.readyState !== WebSocket.OPEN) return;
        setIsLoading(true);
        setLoadingProgress(0);
        console.log("Input Text:", text);

        const message = {
            "action": "startTask",
            "body": text
        };
        
        try {
            const progressInterval = setInterval(() => {
                setLoadingProgress(prev => {
                    const next = calculateNextProgress(prev);
                    // Stop at 89% and wait for the actual response
                    return next < 89 ? next : 89;
                });
            }, 200); // Slower interval

            socket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                console.log('Message from server:', event.data);
                
                if (data.status === "processing") {
                    // When we get a processing message, bump the progress a bit
                    setLoadingProgress(prev => {
                        const remaining = 89 - prev;
                        return prev + (remaining * 0.1); // Move 10% closer to 89%
                    });
                    return;
                }

                // Handle the final result
                const result: any = data.result;
                const message: string | undefined = result?.text;
                
                if (message) {
                    try {
                        const parsedData = JSON.parse(message);
                        if (typeof parsedData === 'object') {
                            setRoadmapData(parsedData);
                            clearInterval(progressInterval);
                            
                            // Smooth transition to 100%
                            setLoadingProgress(90);
                            setTimeout(() => setLoadingProgress(95), 100);
                            setTimeout(() => setLoadingProgress(100), 200);
                            setTimeout(() => {
                                setIsLoading(false);
                                setLoadingProgress(0);
                            }, 500);
                        }
                    } catch (e) {
                        console.log('Message is not in JSON format');
                    }
                }

                setCatMessage(message ?? "");
            };

            socket.send(JSON.stringify(message));
            setText("");
  
        } catch (error) {
            console.error('Error sending request:', error);
            setIsLoading(false);
            setLoadingProgress(0);
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
                            <div className="flex flex-col items-center gap-4">
                                <Button
                                    label={isLoading ? "Processing..." : "Send request"}
                                    onClick={handleButtonClick}
                                    disabled={isLoading || !text.trim() || !socket || socket.readyState !== WebSocket.OPEN}
                                />
                                {isLoading && (
                                    <div className="w-64">
                                        <LoadingBar progress={loadingProgress} />
                                    </div>
                                )}
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
