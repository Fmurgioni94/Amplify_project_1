import { useState, useEffect, useCallback, useRef } from "react";
import Title from "../components/title.tsx";
import WelcomeMessage from "../components/welcomeMessage.tsx";
import TextInput from "../components/input_bar.tsx";
import Button from "../components/button.tsx";
import MessageFromTheCat from "../components/message_from_the_cat.tsx";
import DynamicRoadmap from "../components/roadmap.tsx";

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
    const [isConnected, setIsConnected] = useState(false);
    const socketRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<number>();
    const isMountedRef = useRef(false);

    const setupWebSocket = useCallback(() => {
        // Don't setup if not mounted
        if (!isMountedRef.current) return null;

        // Clear any existing connection
        if (socketRef.current) {
            socketRef.current.close();
            socketRef.current = null;
        }

        // Clear any pending reconnection
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }

        try {
            const ws = new WebSocket("wss://1e2wwsnu5d.execute-api.eu-west-2.amazonaws.com/production/");

            ws.onopen = () => {
                if (isMountedRef.current) {
                    console.log('WebSocket Connected');
                    setIsConnected(true);
                }
            };

            ws.onclose = () => {
                if (isMountedRef.current) {
                    console.log('WebSocket Disconnected');
                    setIsConnected(false);
                    socketRef.current = null;

                    // Only attempt reconnection if the component is still mounted
                    reconnectTimeoutRef.current = window.setTimeout(() => {
                        if (isMountedRef.current) {
                            console.log('Attempting to reconnect...');
                            setupWebSocket();
                        }
                    }, 3000);
                }
            };

            ws.onerror = (error) => {
                if (isMountedRef.current) {
                    console.log('WebSocket Error:', error);
                }
            };

            socketRef.current = ws;
            return ws;
        } catch (error) {
            if (isMountedRef.current) {
                console.error('Error creating WebSocket:', error);
            }
            return null;
        }
    }, []);

    useEffect(() => {
        isMountedRef.current = true;
        
        // Small delay to avoid the initial strict mode unmount/remount cycle
        const initTimeout = setTimeout(() => {
            if (isMountedRef.current) {
                setupWebSocket();
            }
        }, 100);

        return () => {
            isMountedRef.current = false;
            clearTimeout(initTimeout);
            
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (socketRef.current) {
                socketRef.current.close();
                socketRef.current = null;
            }
        };
    }, [setupWebSocket]);

    const handleButtonClick = async() => {
        if (!text.trim() || !socketRef.current || !isConnected || isLoading) return;
        setIsLoading(true);
        console.log("Input Text:", text);

        const message = {
            "action": "startTask",
            "body": text
        };
        
        try {
            socketRef.current.onmessage = (event) => {
                console.log('Raw message received:', event.data);
                try {
                    const data = JSON.parse(event.data);
                    console.log('Parsed WebSocket message:', data);

                    if (data.status === "processing" && data.message === "Task started!") {
                        console.log('Task started, waiting for results...');
                        return;
                    }

                    if (data.status === "complete" && data.result) {
                        const result = data.result;
                        if (!result?.text) {
                            console.log('No result text in response');
                            setIsLoading(false);
                            return;
                        }

                        try {
                            const parsedText = JSON.parse(result.text);
                            console.log('Parsed result text:', parsedText);

                            if (parsedText && parsedText.tasks && Array.isArray(parsedText.tasks)) {
                                const taskData: TasksData = {};
                                
                                parsedText.tasks.forEach((task: any) => {
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
                            setText("");
                        }
                    }
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                    setIsLoading(false);
                }
            };

            socketRef.current.send(JSON.stringify(message));
        } catch (error) {
            console.error('Error sending request:', error);
            setIsLoading(false);
        }
    };
    
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
                <Title text="Goal Breaking Component" size="lg" />
            </div>

            <main className="flex-1 max-w-4xl mx-auto px-4 py-8 w-full mb-20">
                <div>
                    <WelcomeMessage />
                </div>
                <div className="bg-white rounded-xl shadow-sm p-6 space-y-8">                    
                    <div className="space-y-8">
                        {/* <MessageFromTheCat message={catMessage} /> */}
                        {roadmapData && <DynamicRoadmap tasksData={roadmapData} />}
                    </div>
                </div>
            </main>

            {/* Fixed bottom input bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
                <div className="max-w-4xl mx-auto p-4 flex items-center gap-4">
                    <div className="flex-1">
                        <TextInput 
                            value={text} 
                            onChange={setText}
                            placeholder="Enter your goal here..."
                        />
                    </div>
                    <Button
                        label={!isConnected ? "Connecting..." : isLoading ? "Processing..." : "Send request"}
                        onClick={handleButtonClick}
                        disabled={!isConnected || isLoading || !text.trim()}
                    />
                </div>
            </div>
        </div>
    );
}

export default Home;
