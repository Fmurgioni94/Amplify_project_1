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
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
            <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center border-b border-gray-200 bg-white shadow-sm">
                <Title text="Goal Breaking Component" size="lg" />
            </div>

            <main className="max-w-5xl mx-auto px-6 py-12">
                <div className="bg-white rounded-xl shadow-lg p-8 space-y-10">
                    <WelcomeMessage 
                        message="Enter your goal and I'll help you break it down into manageable tasks!"
                        color="text-gray-700"
                    />
                    
                    <div className="flex flex-col space-y-16">
                        <div className="flex flex-col items-center gap-8 p-6 bg-gray-50 rounded-xl border border-gray-100">
                            <div className="w-full max-w-2xl flex gap-4 items-start">
                                <div className="flex-grow">
                                    <TextInput value={text} onChange={setText} />
                                </div>
                                <div className="flex flex-col items-center gap-4">
                                    <Button
                                        label={isLoading ? "Processing..." : "Break down my goal"}
                                        onClick={handleButtonClick}
                                        disabled={isLoading || !text.trim() || !socket || socket.readyState !== WebSocket.OPEN}
                                    />
                                    {isLoading && (
                                        <div className="w-80">
                                            <LoadingBar progress={loadingProgress} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {roadmapData && (
                            <div className="border border-gray-200 rounded-xl p-6 bg-gray-50 mt-16 mb-12">
                                <DynamicRoadmap tasksData={roadmapData} />
                            </div>
                        )}
                        
                        <div className="flex justify-center">
                            <Button label="Sign out" onClick={signOut} />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default Home;
